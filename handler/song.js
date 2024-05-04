import pool from "../database.js";

export async function getSongList() {
  const [rows] = await pool.query("SELECT * FROM song_list");
  return rows;
}

export async function getSongById(id) {
  const [rows] = await pool.query("SELECT * FROM song_list WHERE id = ?", [id]);
  return rows[0];
}

export async function createSong(title, artist) {
  const [result] = await pool.query(
    "INSERT INTO song_list (title, artist) VALUES (?, ?)",
    [title, artist]
  );
  const id = result.insertId;
  return getSongById(id);
}

export async function updateSong(id, title, artist) {
  let query = "UPDATE song_list SET";
  const params = [];
  if (title !== "") {
    query += " title = ?,";
    params.push(title);
  }
  if (artist !== "") {
    query += " artist = ?,";
    params.push(artist);
  }
  // Remove the trailing comma if there are valid updates
  if (params.length > 0) {
    query = query.slice(0, -1);
    query += " WHERE id = ?";
    params.push(id);

    const [result] = await pool.query(query, params);
    return result.affectedRows;
  } else {
    // No valid updates, return 0 to indicate no changes made
    return 0;
  }
}

export async function deleteSong(id) {
  const [result] = await pool.query("DELETE FROM song_list WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function deleteAllSongs() {
  const [result] = await pool.query("DELETE FROM song_list");
  return result.affectedRows;
}
