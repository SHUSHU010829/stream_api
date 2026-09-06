import supabase from "../database.js";

const REPERTOIRE_WITH_CATEGORIES_SELECT =
  "*, song_repertoire_category(song_category(*))";

function flattenCategories(row) {
  const { song_repertoire_category, ...rest } = row;
  return {
    ...rest,
    categories: (song_repertoire_category ?? []).map((r) => r.song_category),
  };
}

// ---- 分類 ----

export async function getDBCategories() {
  const { data, error } = await supabase
    .from("song_category")
    .select("*")
    .order("dimension", { ascending: true })
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function createDBCategory({ dimension, slug, label, sort_order }) {
  const { data, error } = await supabase
    .from("song_category")
    .insert({ dimension, slug, label, sort_order: sort_order ?? 0 })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateDBCategory(id, updates) {
  const { data, error } = await supabase
    .from("song_category")
    .update(updates)
    .eq("id", id)
    .select();
  if (error) throw error;
  return data.length;
}

export async function deleteDBCategory(id) {
  const { data, error } = await supabase
    .from("song_category")
    .delete()
    .eq("id", id)
    .select();
  if (error) throw error;
  return data.length;
}

export async function getDBCategoriesBySlugs(slugs) {
  if (!slugs || slugs.length === 0) return [];
  const { data, error } = await supabase
    .from("song_category")
    .select("*")
    .in("slug", slugs);
  if (error) throw error;
  return data;
}

// ---- 曲庫 ----

export async function getDBRepertoireList({ includeAll = false } = {}) {
  let query = supabase
    .from("song_repertoire")
    .select(REPERTOIRE_WITH_CATEGORIES_SELECT)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
  if (!includeAll) {
    query = query.eq("status", 1);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data.map(flattenCategories);
}

export async function getDBRepertoireById(id) {
  const { data, error } = await supabase
    .from("song_repertoire")
    .select(REPERTOIRE_WITH_CATEGORIES_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? flattenCategories(data) : null;
}

async function setRepertoireCategories(repertoireId, categoryIds) {
  const { error: deleteError } = await supabase
    .from("song_repertoire_category")
    .delete()
    .eq("repertoire_id", repertoireId);
  if (deleteError) throw deleteError;

  if (!categoryIds || categoryIds.length === 0) return;

  const rows = categoryIds.map((categoryId) => ({
    repertoire_id: repertoireId,
    category_id: categoryId,
  }));
  const { error: insertError } = await supabase
    .from("song_repertoire_category")
    .insert(rows);
  if (insertError) throw insertError;
}

export async function createDBRepertoire({
  song_title,
  singer,
  note,
  category_ids,
}) {
  const { data, error } = await supabase
    .from("song_repertoire")
    .insert({ song_title, singer: singer ?? "", note: note ?? null })
    .select()
    .single();
  if (error) throw error;

  if (category_ids && category_ids.length > 0) {
    await setRepertoireCategories(data.id, category_ids);
  }

  return getDBRepertoireById(data.id);
}

export async function updateDBRepertoire(id, updates) {
  const { category_ids, ...fields } = updates;

  if (Object.keys(fields).length > 0) {
    const { data, error } = await supabase
      .from("song_repertoire")
      .update({ ...fields, update_time: new Date().toISOString() })
      .eq("id", id)
      .select();
    if (error) throw error;
    if (data.length === 0) return 0;
  }

  if (category_ids !== undefined) {
    await setRepertoireCategories(id, category_ids);
  }

  return 1;
}

export async function deleteDBRepertoire(id) {
  // 軟刪除：將 status 設為 0 (下架)
  const { data, error } = await supabase
    .from("song_repertoire")
    .update({ status: 0, update_time: new Date().toISOString() })
    .eq("id", id)
    .select();
  if (error) throw error;
  return data.length;
}

export async function importDBRepertoire(songs) {
  const allSlugs = [
    ...new Set(songs.flatMap((s) => s.category_slugs ?? [])),
  ];
  const categories = await getDBCategoriesBySlugs(allSlugs);
  const idBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  const results = [];
  for (const song of songs) {
    const categoryIds = (song.category_slugs ?? [])
      .map((slug) => idBySlug.get(slug))
      .filter((id) => id !== undefined);
    const created = await createDBRepertoire({
      song_title: song.song_title,
      singer: song.singer,
      category_ids: categoryIds,
    });
    results.push(created);
  }
  return results;
}
