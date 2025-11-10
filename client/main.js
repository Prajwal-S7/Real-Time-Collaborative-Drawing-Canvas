(function(){
    const socket = WS.connect();
    const canvasEl = document.getElementById('canvas');
    const resizeCanvas = ()=> {
      canvasEl.style.width = window.innerWidth - 260 + 'px';
      canvasEl.style.height = window.innerHeight + 'px';
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    const app = new CanvasApp(canvasEl, document.getElementById('cursors'), socket);
  
    document.getElementById('tool').addEventListener('change', e=> app.tool = e.target.value);
    document.getElementById('color').addEventListener('change', e=> app.color = e.target.value);
    document.getElementById('width').addEventListener('input', e=> app.size = parseInt(e.target.value,10));
    document.getElementById('undo').addEventListener('click', ()=> socket.emit('undo'));
    document.getElementById('redo').addEventListener('click', ()=> socket.emit('redo'));
    document.getElementById('clear').addEventListener('click', ()=> socket.emit('clear'));
  })();
  