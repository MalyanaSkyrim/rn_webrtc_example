import React from 'react';
import {Button, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
} from 'react-native-webrtc';
import axios from 'axios';
import uuid from 'react-native-uuid';
import Messenger from './components/Messenger';
class App extends React.Component {
  peerId = uuid.v4();
  api = axios.create({
    baseURL: 'http://localhost:3002',
  });
  state = {
    canAnswer: false,
    messages: [],
    isConnected: false,
  };

  initRTCconnection = () => {
    const configuration = {iceServers: [{url: 'stun:stun.l.google.com:19302'}]};
    this.peer = new RTCPeerConnection(configuration);
    this.peer.oniceconnectionstatechange = this.onIceConnectionsStateChange;
    this.dataChannel = this.peer.createDataChannel('channel');
    this.dataChannel.onopen = this.onDataChannelOpened;
    this.dataChannel.onmessage = this.onReceiveMessage;
  };

  onReceiveSDP = async ({data}) => {
    const {sdp} = data;
    await this.peer.setRemoteDescription(new RTCSessionDescription(sdp));
    if (sdp.type === 'offer') this.setState({canAnswer: true});
  };

  componentDidMount() {
    this.initRTCconnection();
  }

  onReceiveMessage = ({data}) => {
    const message = JSON.parse(data);
    const messages = [...this.state.messages, message];
    this.setState({messages});
  };

  onIceConnectionsStateChange = e => {
    if (this.peer.iceConnectionState == 'disconnected') {
      this.disconnect();
    }
  };

  componentWillUnmount() {
    this.peer.close();
  }

  onDataChannelOpened = () => {
    console.log('Connection Openned!');
    this.setState({isConnected: true});
  };

  createOffer = async () => {
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    const payload = {
      sdp: offer,
      id: this.peerId,
    };
    await this.api.post('/', payload).then(this.onReceiveSDP);
  };

  sendMessage = message => {
    const msg = {message, sender: 'me'};
    const messages = [...this.state.messages, msg];
    this.setState({messages});
    const data = JSON.stringify({
      id: this.peerId,
      message,
    });
    this.dataChannel.send(data);
  };

  disconnect = () => {
    this.peer.close();
    this.initRTCconnection();
    this.setState({isConnected: false, messages: [], canAnswer: false});
  };

  render() {
    const {isConnected} = this.state;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>WebRTC Demo</Text>

        <View style={styles.row}>
          <View
            style={{flexDirection: 'row', flex: 0.49, alignItems: 'center'}}>
            <View
              style={
                isConnected ? styles.circleOnline : styles.circleOffline
              }></View>
            {isConnected ? (
              <Text style={styles.textOnline}>Online</Text>
            ) : (
              <Text style={styles.textOffline}>Offline</Text>
            )}
          </View>
          <View style={{flex: 0.49}}></View>
        </View>
        <View style={styles.row}>
          <TouchableOpacity
            disabled={isConnected}
            style={isConnected ? styles.buttonDisabled : styles.button}
            onPress={this.createOffer}>
            <Text
              style={
                isConnected ? styles.buttonTextDisabled : styles.buttonText
              }>
              Offer
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            disabled={!isConnected}
            style={
              !isConnected ? styles.buttonDisabled : styles.disconnectButton
            }>
            <Text
              style={
                !isConnected
                  ? styles.buttonTextDisabled
                  : styles.disconnectButtonText
              }
              onPress={this.disconnect}>
              Disconnect
            </Text>
          </TouchableOpacity>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  disconnectButton: {
    flex: 0.49,
    paddingVertical: 6,
    backgroundColor: '#ff1919',
    borderRadius: 4,
  },
  disconnectButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  circleOnline: {
    backgroundColor: '#4BB543',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  circleOffline: {
    backgroundColor: '#ff1919',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  textOnline: {color: '#4BB543', fontSize: 16},
  textOffline: {color: '#ff1919', fontSize: 16},
});

export default App;
