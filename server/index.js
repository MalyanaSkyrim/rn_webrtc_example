const path = require('path');
const express = require('express');
const app = express();
const cors = require('cors');
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});
const port = process.env.PORT || 3002;

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

app.use(cors());
io.on('connection', socket => {
  console.log(socket.id);
  socket.on('sdpData', sdp => {
    socket.broadcast.emit('sdpData', sdp);
  });
  socket.on('candidate', candidate => {
    socket.broadcast.emit('candidate', candidate);
  });
});
