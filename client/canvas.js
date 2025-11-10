// canvas.js
function CanvasApp(canvas, cursorsContainer, socket){
    this.canvas = canvas;
    this.cursors = cursorsContainer;
    this.socket = socket;
    this.ctx = canvas.getContext('2d');
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this._scaleForHiDPI();
  
    this.tool = 'brush';
    this.color = '#000';
    this.size = 4;
    this.drawing = false;
    this.currentPath = [];
    this.ops = [];
    this.remoteCursors = {};
  
    this._bindEvents();
    this._hookSocket();
  }
  
  CanvasApp.prototype._scaleForHiDPI = function(){
    const ratio = this.devicePixelRatio;
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.floor(w * ratio);
    this.canvas.height = Math.floor(h * ratio);
    this.ctx.setTransform(ratio,0,0,ratio,0,0);
  };
  
  CanvasApp.prototype._bindEvents = function(){
    const el = this.canvas;
    const pos = (e) => {
      const r = el.getBoundingClientRect();
      if (e.touches) e = e.touches[0];
      return {x: e.clientX - r.left, y: e.clientY - r.top};
    };
    const onDown = (e) => {
      e.preventDefault();
      this.drawing = true;
      const p = pos(e);
      this.currentPath = [p];
      this.socket.emit('begin', {p, tool:this.tool, color:this.color, size:this.size});
    };
    const onMove = (e) => {
      const p = pos(e);
      this.socket.emit('cursor', p);
      if (!this.drawing) return;
      this.currentPath.push(p);
      this._drawSegment(this.currentPath, {color:this.color,size:this.size,tool:this.tool});
      if (this.currentPath.length % 4 === 0)
        this.socket.emit('partial', {points:this.currentPath.slice(-4), tool:this.tool, color:this.color, size:this.size});
    };
    const onUp = (e) => {
      if (!this.drawing) return;
      this.drawing = false;
      this.socket.emit('end', {points:this.currentPath, tool:this.tool, color:this.color, size:this.size});
      this.currentPath = [];
    };
    el.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    el.addEventListener('touchstart', onDown, {passive:false});
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('touchend', onUp);
  };
  
  CanvasApp.prototype._drawSegment = function(points, style){
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = style.size;
    ctx.strokeStyle = style.tool === 'eraser' ? 'rgba(255,255,255,1)' : style.color;
    ctx.globalCompositeOperation = style.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i=1;i<points.length-1;i++){
      const midx = (points[i].x + points[i+1].x)/2;
      const midy = (points[i].y + points[i+1].y)/2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, midx, midy);
    }
    const last = points[points.length-1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    ctx.closePath();
  };
  
  CanvasApp.prototype._hookSocket = function(){
    const s = this.socket;
    s.on('init-state', (state)=>{
      this.ops = state.ops || [];
      this.rebuild();
    });
    s.on('op', (op)=>{
      this.ops.push(op);
      this._drawSegment(op.points, op);
    });
    s.on('partial', (data)=>{
      this._drawSegment(data.points, data);
    });
    s.on('undo', ({opId})=>{
      this.ops = this.ops.filter(o => o.id !== opId);
      this.rebuild();
    });
    s.on('clear', ()=>{
      this.ops = [];
      this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    });
    s.on('cursor', (c)=> this._setCursor(c));
  };
  
  CanvasApp.prototype._setCursor = function(c){
    let el = this.remoteCursors[c.userId];
    if (!el){
      el = document.createElement('div');
      el.className = 'cursor';
      el.style.background = c.color || '#000';
      el.textContent = c.name || '';
      this.cursors.appendChild(el);
      this.remoteCursors[c.userId] = el;
    }
    el.style.left = c.x + 'px';
    el.style.top = c.y + 'px';
  };
  
  CanvasApp.prototype.rebuild = function(){
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    for (const op of this.ops){ this._drawSegment(op.points, op); }
  };
  