import React from 'react';
import {Button, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';
import io from 'socket.io-client';
import Messenger from './components/Messenger';
class App extends React.Component {
  state = {
    canAnswer: false,
    messages: [],
    isConnected: false,
  };

  initRTCconnection = () => {
    const configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};
    this.peer = new RTCPeerConnection(configuration);
    this.peer.onicecandidate = this.onIceCandidate;
    this.peer.oniceconnectionstatechange = this.onIceConnectionsStateChange;
    this.dataChannel = this.peer.createDataChannel('channel');
    this.dataChannel.onopen = this.onDataChannelOpened;
    this.dataChannel.onmessage = this.onReceiveMessage;
  };

  initSocketConnection = () => {
    this.socket = io.connect('http://localhost:3002');
    this.socket.on('sdpData', this.onReceiveSDP);
    this.socket.on('candidate', this.onReceiveCandidate);
  };

  onReceiveCandidate = candidate => {
    this.peer.addIceCandidate(new RTCIceCandidate(candidate));
  };

  onReceiveSDP = async sdp => {
    await this.peer.setRemoteDescription(new RTCSessionDescription(sdp));
    if (sdp.type === 'offer') this.setState({canAnswer: true});
  };

  componentDidMount() {
    this.initRTCconnection();
    this.initSocketConnection();
  }

  onReceiveMessage = msg => {
    const message = {
      msg: msg.data,
      received: true,
    };
    console.log('message:', message);
    const messages = [...this.state.messages, message];
    this.setState({messages});
  };

  onIceConnectionsStateChange = e => {
    if (this.peer.iceConnectionState == 'disconnected') {
      this.disconnect();
    }
  };

  componentWillUnmount() {
    this.socket.close();
    this.peer.close();
  }

  onDataChannelOpened = () => {
    this.setState({isConnected: true});
  };

  onIceCandidate = e => {
    if (e.candidate) {
      this.sendCandidate(e.candidate);
    }
  };

  createOffer = async () => {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    this.sendSdpData(offer);
  };

  createAnswer = async () => {
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    this.sendSdpData(answer);
  };

  sendSdpData = sdp => {
    this.socket.emit('sdpData', sdp);
  };

  sendCandidate = candidate => {
    this.socket.emit('candidate', candidate);
  };

  sendMessage = message => {
    const msg = {msg: message};
    const messages = [...this.state.messages, msg];
    this.setState({messages});
    this.dataChannel.send(message);
  };

  disconnect = () => {
    this.peer.close();
    this.initRTCconnection();
    this.setState({isConnected: false, messages: [], canAnswer: false});
  };

  render() {
    const offerDisabled = this.state.isConnected;
    const answerDisabled = this.state.isConnected || !this.state.canAnswer;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>WebRTC Demo</Text>
        <View style={styles.rowActions}>
          <TouchableOpacity
            disabled={offerDisabled}
            style={offerDisabled ? styles.buttonDisabled : styles.button}
            onPress={this.createOffer}>
            <Text
              style={
                offerDisabled ? styles.buttonTextDisabled : styles.buttonText
              }>
              Offer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={answerDisabled}
            style={answerDisabled ? styles.buttonDisabled : styles.button}>
            <Text
              style={
                answerDisabled ? styles.buttonTextDisabled : styles.buttonText
              }
              onPress={this.createAnswer}>
              Answer
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.rowActions}>
          <Button
            onPress={this.disconnect}
            disabled={!this.state.isConnected}
            title="Disconnect"
            color="red"
          />
          <View style={{flex: 0.49}}></View>
        </View>
        <Messenger
          isConnected={this.state.isConnected}
          messages={this.state.messages}
          sendMessage={this.sendMessage}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {flex: 1, paddingTop: 60, paddingBottom: 30, padding: 10},
  title: {fontSize: 16, marginBottom: 10},
  button: {
    backgroundColor: 'orange',
    flex: 0.49,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonText: {
    textAlign: 'center',
    color: 'rgb(40,40,40)',
  },
  buttonDisabled: {
    backgroundColor: 'rgb(220,220,220)',
    flex: 0.49,
    paddingVertical: 6,
    borderRadius: 4,
  },
  buttonTextDisabled: {
    textAlign: 'center',
    color: 'rgb(120,120,120)',
  },
  rowActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  disconnectButton: {
    color: 'red',
  },
});

export default App;
