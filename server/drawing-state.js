const { v4: uuidv4 } = require('uuid');
function createOp(data, user){
  return Object.assign({ id: uuidv4(), userId: user.id, ts: Date.now() }, data);
}
module.exports = { createOp };
