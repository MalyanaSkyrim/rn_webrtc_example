const express = require('express');
const app = express();
const cors = require('cors');
const server = require('http').createServer(app);
const wrtc = require('wrtc');
const port = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

const channels = new Map();
let peerCounts = 0;
app.post('/', async ({body}, res) => {
  const peer = new wrtc.RTCPeerConnection({
    iceServers: [
      {
        urls: 'stun:stun.stunprotocol.org',
      },
    ],
  });

  const desc = new wrtc.RTCSessionDescription(body.sdp);
  await peer.setRemoteDescription(desc);
  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);
  const payload = {
    sdp: peer.localDescription,
  };

  peer.ondatachannel = e => {
    e.channel.onopen = () => {
      console.log('Connection Openned!', body.id);
      peerCounts++;
      channels.set(body.id, {channel: e.channel, name: 'peer' + peerCounts});
    };
    e.channel.onmessage = handleReceiveMessage;
    e.channel.onclose = () => {
      console.log('Connection Closed!', body.id);
      channels.delete(body.id);
    };
  };

  res.json(payload);
});

const handleReceiveMessage = ({data}) => {
  const parsedData = JSON.parse(data);
  const senderName = channels.get(parsedData.id).name;
  const otherPeersIds = [...channels.keys()].filter(id => id !== parsedData.id);
  console.log('otherPeersIds', otherPeersIds);
  otherPeersIds.forEach(peerId => {
    const channel = channels.get(peerId).channel;
    const dataToSend = JSON.stringify({
      sender: senderName,
      message: parsedData.message,
    });
    channel.send(dataToSend);
  });
};

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});
