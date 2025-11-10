// websocket.js
const WS = (function(){
    let socket = null;
    function connect(roomId = 'default'){
      socket = io({autoConnect:false});
      socket.on('connect', ()=> socket.emit('join', {room: roomId}));
      socket.connect();
      return socket;
    }
    return { connect };
  })();
  