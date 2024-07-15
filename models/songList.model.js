import pool from "../database.js";

export async function getDBSongList() {
  const [rows] = await pool.query("SELECT * FROM song_list");
  return rows;
}

export async function getDBSongById(id) {
  const [rows] = await pool.query("SELECT * FROM song_list WHERE id = ?", [id]);
  return rows[0];
}

export async function getDBOrderSongList() {
  const [rows] = await pool.query("SELECT * FROM order_song");
  return rows;
}

export async function getDBOrderSongById(id) {
  const [rows] = await pool.query("SELECT * FROM order_song WHERE id = ?", [
    id,
  ]);
  return rows[0];
}

export async function createDBSong(title, artist) {
  const [result] = await pool.query(
    "INSERT INTO song_list (title, artist) VALUES (?, ?)",
    [title, artist]
  );
  const id = result.insertId;
  return getDBSongById(id);
}

export async function createDBOrderSong(title) {
  const [result] = await pool.query(
    "INSERT INTO order_song (title) VALUES (?)",
    [title]
  );
  const id = result.insertId;
  return getDBOrderSongById(id);
}

export async function updateDBSong(id, title, artist) {
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

export async function deleteDBSong(id) {
  const [result] = await pool.query("DELETE FROM song_list WHERE id = ?", [id]);
  return result.affectedRows;
}

export async function deleteDBAllSongs() {
  const [result] = await pool.query("DELETE FROM song_list");
  return result.affectedRows;
}

export async function deleteDBOrderSong(id) {
  const [result] = await pool.query("DELETE FROM order_song WHERE id = ?", [
    id,
  ]);
  return result.affectedRows;
}

export async function deleteDBOrderAllSongs() {
  const [result] = await pool.query("DELETE FROM order_song");
  return result.affectedRows;
}

export async function updateDBNowPlaying(id, nowPlayingValue = 1) {
  try {
    if (nowPlayingValue !== 0) {
      // Check if any record has now_playing as 1, if yes, update it to 0
      const checkQuery =
        "SELECT COUNT(*) AS count FROM song_list WHERE now_playing = 1";
      const checkResult = await pool.query(checkQuery);
      if (checkResult[0].count > 0) {
        await pool.query(
          "UPDATE song_list SET now_playing = 0 WHERE now_playing = 1"
        );
      }
    }

    // Update the specified ID's now_playing
    const updateQuery = "UPDATE song_list SET now_playing = ? WHERE id = ?";
    const updateResult = await pool.query(updateQuery, [nowPlayingValue, id]);

    return updateResult.affectedRows;
  } catch (error) {
    throw new Error("Failed to update now playing status: " + error.message);
  }
}
