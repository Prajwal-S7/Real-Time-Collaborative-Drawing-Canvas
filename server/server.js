const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(express.static(path.join(__dirname, '..', 'client')));

const room = { ops: [], redoStack: [] };

io.on('connection', (socket)=>{
  const user = { id: socket.id, color: randomColor(), name: 'User-' + socket.id.slice(0,4) };
  socket.emit('init-state', { ops: room.ops });

  socket.on('begin', data=> socket.broadcast.emit('partial', {userId:socket.id, points:[data.p], tool:data.tool,color:data.color,size:data.size}));
  socket.on('partial', data=> socket.broadcast.emit('partial', {userId:socket.id, ...data}));
  socket.on('end', data=>{
    const op = {...data, id:uuidv4(), userId:socket.id};
    room.ops.push(op);
    io.emit('op', op);
  });
  socket.on('undo', ()=>{
    const op = room.ops.pop();
    if (op) io.emit('undo', {opId:op.id});
  });
  socket.on('clear', ()=>{
    room.ops = [];
    io.emit('clear');
  });
  socket.on('cursor', c=> io.emit('cursor', {userId:socket.id, x:c.x, y:c.y, color:user.color, name:user.name}));
});

function randomColor(){
  const h = Math.floor(Math.random()*360);
  return `hsl(${h} 70% 40%)`;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=> console.log('listening', PORT));
