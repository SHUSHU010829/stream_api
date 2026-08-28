import supabase from "../database.js";

export async function getDBAllMsg() {
  const { data, error } = await supabase.from("message_board").select("*");
  if (error) throw error;
  return data;
}

export async function createDBMsg(content) {
  const { error } = await supabase
    .from("message_board")
    .insert({ message: content });
  if (error) throw error;
  return getDBAllMsg();
}
