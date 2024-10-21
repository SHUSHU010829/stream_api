import pool from "../database.js";

export async function getDBAllMsg() {
  const [rows] = await pool.query("SELECT * FROM message_board");
  return rows;
}

export async function createDBMsg(content) {
  const [result] = await pool.query(
    "INSERT INTO message_board (message) VALUES (?)",
    [content]
  );
  const id = result.insertId;
  return getDBAllMsg(id);
}
