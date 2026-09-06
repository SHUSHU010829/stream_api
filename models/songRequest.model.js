import supabase from "../database.js";

export async function getDBPendingRequests() {
  const { data, error } = await supabase
    .from("song_request")
    .select("*")
    .eq("status", "pending")
    .order("create_time", { ascending: true });
  if (error) throw error;
  return data;
}

export async function getDBRequestsByRequester(twitchId) {
  const { data, error } = await supabase
    .from("song_request")
    .select("*")
    .eq("requester_twitch_id", twitchId)
    .order("create_time", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getDBAllRequests({ status } = {}) {
  let query = supabase
    .from("song_request")
    .select("*")
    .order("create_time", { ascending: false });
  if (status) {
    query = query.eq("status", status);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function getDBRequestById(id) {
  const { data, error } = await supabase
    .from("song_request")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getDBPendingRequestByRepertoireId(repertoireId) {
  if (!repertoireId) return null;
  const { data, error } = await supabase
    .from("song_request")
    .select("*")
    .eq("repertoire_id", repertoireId)
    .eq("status", "pending")
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createDBRequest({
  repertoire_id,
  song_title,
  singer,
  requester_twitch_id,
  requester_login,
  requester_display_name,
  source,
}) {
  const { data, error } = await supabase
    .from("song_request")
    .insert({
      repertoire_id: repertoire_id ?? null,
      song_title,
      singer: singer ?? "",
      requester_twitch_id,
      requester_login,
      requester_display_name,
      source: source ?? "web",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDBRequestChatNotified(id, { sent, dropReason }) {
  const { error } = await supabase
    .from("song_request")
    .update({ chat_notified: sent, chat_drop_reason: dropReason })
    .eq("id", id);
  if (error) throw error;
}

export async function approveDBRequest(id, { song_list_id }) {
  const { data, error } = await supabase
    .from("song_request")
    .update({
      status: "approved",
      decided_time: new Date().toISOString(),
      song_list_id,
    })
    .eq("id", id)
    .select();
  if (error) throw error;
  return data.length;
}

export async function rejectDBRequest(id, { reason }) {
  const { data, error } = await supabase
    .from("song_request")
    .update({
      status: "rejected",
      decided_time: new Date().toISOString(),
      reject_reason: reason ?? null,
    })
    .eq("id", id)
    .select();
  if (error) throw error;
  return data.length;
}

export async function deleteDBRequest(id) {
  const { data, error } = await supabase
    .from("song_request")
    .delete()
    .eq("id", id)
    .select();
  if (error) throw error;
  return data.length;
}
