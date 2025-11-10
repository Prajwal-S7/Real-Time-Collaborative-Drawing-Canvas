const rooms = new Map();
function getRoom(id){
  if (!rooms.has(id)){
    rooms.set(id, { id, ops: [], redoStack: [] });
  }
  return rooms.get(id);
}
module.exports = { getRoom };
