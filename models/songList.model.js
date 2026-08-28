import supabase from "../database.js";

export async function getDBSongList() {
  const { data, error } = await supabase.from("song_list").select("*");
  if (error) throw error;
  return data;
}

export async function getDBActiveSongList() {
  const { data, error } = await supabase
    .from("song_list")
    .select("*")
    .eq("status", 1)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getDBSongHistory() {
  const { data, error } = await supabase
    .from("song_list")
    .select("*")
    .eq("status", 0)
    .order("create_time", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getDBSongById(id) {
  const { data, error } = await supabase
    .from("song_list")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDBOrderSongList() {
  const { data, error } = await supabase.from("order_song").select("*");
  if (error) throw error;
  return data;
}

export async function getDBOrderSongById(id) {
  const { data, error } = await supabase
    .from("order_song")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createDBSong(title, artist) {
  const { data, error } = await supabase
    .from("song_list")
    .insert({ song_title: title, singer: artist })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createDBOrderSong(title) {
  const { data, error } = await supabase
    .from("order_song")
    .insert({ title })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDBSong(id, title, artist) {
  const updates = {};
  if (title !== "") updates.song_title = title;
  if (artist !== "") updates.singer = artist;

  if (Object.keys(updates).length === 0) {
    return 0;
  }

  const { data, error } = await supabase
    .from("song_list")
    .update(updates)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data.length;
}

export async function deleteDBSong(id) {
  // 軟刪除：將 status 設為 0 (archived)
  const { data, error } = await supabase
    .from("song_list")
    .update({ status: 0 })
    .eq("id", id)
    .select();
  if (error) throw error;
  return data.length;
}

export async function deleteDBAllSongs() {
  // 軟刪除：將所有歌曲的 status 設為 0 (archived)
  const { data, error } = await supabase
    .from("song_list")
    .update({ status: 0 })
    .eq("status", 1)
    .select();
  if (error) throw error;
  return data.length;
}

export async function archiveDBAllSongs() {
  // 歸檔所有活動歌曲（與 deleteDBAllSongs 相同）
  return deleteDBAllSongs();
}

export async function hardDeleteDBSong(id) {
  // 真正刪除歌曲
  const { data, error } = await supabase
    .from("song_list")
    .delete()
    .eq("id", id)
    .select();
  if (error) throw error;
  return data.length;
}

export async function hardDeleteDBAllSongs() {
  // 真正刪除所有歌曲
  const { data, error } = await supabase
    .from("song_list")
    .delete()
    .neq("id", 0)
    .select();
  if (error) throw error;
  return data.length;
}

export async function restoreDBSong(id) {
  // 恢復歸檔的歌曲
  const { data, error } = await supabase
    .from("song_list")
    .update({ status: 1 })
    .eq("id", id)
    .select();
  if (error) throw error;
  return data.length;
}

export async function updateDBSongOrder(id, sortOrder) {
  const { data, error } = await supabase
    .from("song_list")
    .update({ sort_order: sortOrder })
    .eq("id", id)
    .select();
  if (error) throw error;
  return data.length;
}

export async function updateDBBatchSongOrder(songs) {
  // 批量更新排序：songs = [{id, sort_order}, ...]
  // supabase-js 沒有原生多列交易，逐筆更新
  for (const item of songs) {
    const { error } = await supabase
      .from("song_list")
      .update({ sort_order: item.sort_order })
      .eq("id", item.id);
    if (error) throw error;
  }
  return songs.length;
}

export async function deleteDBOrderSong(id) {
  const { data, error } = await supabase
    .from("order_song")
    .delete()
    .eq("id", id)
    .select();
  if (error) throw error;
  return data.length;
}

export async function deleteDBOrderAllSongs() {
  const { data, error } = await supabase
    .from("order_song")
    .delete()
    .neq("id", 0)
    .select();
  if (error) throw error;
  return data.length;
}

export async function updateDBNowPlaying(id, nowPlayingValue = 1) {
  try {
    if (nowPlayingValue !== 0) {
      const { data: playing, error: checkError } = await supabase
        .from("song_list")
        .select("id")
        .eq("now_playing", 1);
      if (checkError) throw checkError;

      if (playing.length > 0) {
        const { error: resetError } = await supabase
          .from("song_list")
          .update({ now_playing: 0 })
          .eq("now_playing", 1);
        if (resetError) throw resetError;
      }
    }

    const { data, error } = await supabase
      .from("song_list")
      .update({ now_playing: nowPlayingValue })
      .eq("id", id)
      .select();
    if (error) throw error;
    return data.length;
  } catch (error) {
    throw new Error("Failed to update now playing status: " + error.message);
  }
}
