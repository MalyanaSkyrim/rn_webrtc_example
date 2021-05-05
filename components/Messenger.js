import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

class Messenger extends Component {
  state = {
    message: '',
  };

  handleMsgChange = value => {
    this.setState({message: value});
  };

  sendMessage = () => {
    if (this.state.message === '' || !this.props.isConnected) return;
    this.props.sendMessage(this.state.message);
    this.setState({message: ''});
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.messagesWrapper}>
          {this.props.messages.map((item, i) => (
            <View key={item.msg + i} style={styles.messageWrapper}>
              <Text
                style={{
                  color: item.received ? 'rgb(60,60,60)' : 'orange',
                  fontSize: 18,
                  fontWeight: 'bold',
                }}>
                {item.received ? 'stranger : ' : 'me : '}
              </Text>
              <Text style={styles.messageText}>{item.msg}</Text>
            </View>
          ))}
        </View>
        <View style={styles.messageInputWrapper}>
          <TextInput
            placeholder="type a message ..."
            placeholderTextColor="rgb(140,140,140)"
            style={styles.messageInput}
            onChangeText={this.handleMsgChange}
            value={this.state.message}
          />
          <TouchableOpacity style={styles.button} onPress={this.sendMessage}>
            <Text style={styles.buttonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderColor: 'rgb(180,180,180)',
    borderWidth: 1,
    borderRadius: 4,
  },
  messagesWrapper: {
    flex: 1,
    padding: 10,
  },
  messageInputWrapper: {
    flexDirection: 'row',
  },
  messageInput: {
    backgroundColor: 'rgb(220,220,220)',
    color: 'rgb(50,50,50)',
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flex: 1,
  },
  button: {
    backgroundColor: 'orange',
    paddingVertical: 6,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
  },
  messageText: {
    fontSize: 16,
    color: 'rgb(70,70,70)',
  },
  messageWrapper: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageLabel: {
    fontSize: 18,
  },
});

export default Messenger;
