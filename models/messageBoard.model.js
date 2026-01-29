import db from "../database.js";

export function getDBAllMsg() {
  const stmt = db.prepare("SELECT * FROM message_board");
  return stmt.all();
}

export function createDBMsg(content) {
  const stmt = db.prepare("INSERT INTO message_board (message) VALUES (?)");
  const result = stmt.run(content);
  return getDBAllMsg();
}
