import db from "../database.js";

export function getDBSongList() {
  const stmt = db.prepare("SELECT * FROM song_list");
  return stmt.all();
}

export function getDBSongById(id) {
  const stmt = db.prepare("SELECT * FROM song_list WHERE id = ?");
  return stmt.get(id);
}

export function getDBOrderSongList() {
  const stmt = db.prepare("SELECT * FROM order_song");
  return stmt.all();
}

export function getDBOrderSongById(id) {
  const stmt = db.prepare("SELECT * FROM order_song WHERE id = ?");
  return stmt.get(id);
}

export function createDBSong(title, artist) {
  const stmt = db.prepare(
    "INSERT INTO song_list (song_title, singer) VALUES (?, ?)"
  );
  const result = stmt.run(title, artist);
  return getDBSongById(result.lastInsertRowid);
}

export function createDBOrderSong(title) {
  const stmt = db.prepare("INSERT INTO order_song (title) VALUES (?)");
  const result = stmt.run(title);
  return getDBOrderSongById(result.lastInsertRowid);
}

export function updateDBSong(id, title, artist) {
  let query = "UPDATE song_list SET";
  const params = [];

  if (title !== "") {
    query += " song_title = ?,";
    params.push(title);
  }
  if (artist !== "") {
    query += " singer = ?,";
    params.push(artist);
  }

  if (params.length > 0) {
    query = query.slice(0, -1);
    query += " WHERE id = ?";
    params.push(id);

    const stmt = db.prepare(query);
    const result = stmt.run(...params);
    return result.changes;
  } else {
    return 0;
  }
}

export function deleteDBSong(id) {
  const stmt = db.prepare("DELETE FROM song_list WHERE id = ?");
  const result = stmt.run(id);
  return result.changes;
}

export function deleteDBAllSongs() {
  const stmt = db.prepare("DELETE FROM song_list");
  const result = stmt.run();
  return result.changes;
}

export function deleteDBOrderSong(id) {
  const stmt = db.prepare("DELETE FROM order_song WHERE id = ?");
  const result = stmt.run(id);
  return result.changes;
}

export function deleteDBOrderAllSongs() {
  const stmt = db.prepare("DELETE FROM order_song");
  const result = stmt.run();
  return result.changes;
}

export function updateDBNowPlaying(id, nowPlayingValue = 1) {
  try {
    if (nowPlayingValue !== 0) {
      const checkStmt = db.prepare(
        "SELECT COUNT(*) AS count FROM song_list WHERE now_playing = 1"
      );
      const checkResult = checkStmt.get();

      if (checkResult.count > 0) {
        const resetStmt = db.prepare(
          "UPDATE song_list SET now_playing = 0 WHERE now_playing = 1"
        );
        resetStmt.run();
      }
    }

    const updateStmt = db.prepare(
      "UPDATE song_list SET now_playing = ? WHERE id = ?"
    );
    const updateResult = updateStmt.run(nowPlayingValue, id);

    return updateResult.changes;
  } catch (error) {
    throw new Error("Failed to update now playing status: " + error.message);
  }
}
