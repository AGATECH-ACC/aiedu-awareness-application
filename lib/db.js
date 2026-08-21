/**
 * @typedef {import('@supabase/supabase-js').SupabaseClient} SupabaseClient
 *
 * @typedef {Object} ReadingInput
 * @property {string} userId
 * @property {1 | 3 | 4} mode
 * @property {string} spreadKey
 * @property {string | null} question
 * @property {Array<{ n: number, position_cn: string | null, position_en: string | null }>} cards
 */

function rethrow(error, operation) {
  if (!error) return;
  error.message = `${operation}: ${error.message}`;
  throw error;
}

/** @param {SupabaseClient} supabase @param {ReadingInput} input */
export async function insertReading(supabase, input) {
  const { data, error } = await supabase
    .from('readings')
    .insert({
      user_id: input.userId,
      mode: input.mode,
      spread_key: input.spreadKey,
      question: input.question,
      cards: input.cards,
    })
    .select('id, user_id, mode, spread_key, question, cards, created_at')
    .single();

  rethrow(error, 'insert reading');
  return data;
}

/** @param {SupabaseClient} supabase @param {number} [limit=20] */
export async function listReports(supabase, limit = 20) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const { data, error } = await supabase
    .from('deep_reports')
    .select(`
      id,
      content,
      created_at,
      reading_id,
      share_token,
      is_public,
      readings!deep_reports_reading_id_fkey ( mode, spread_key, cards )
    `)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  rethrow(error, 'list reports');
  return data || [];
}

/** @param {SupabaseClient} supabase @param {string} id */
export async function getReport(supabase, id) {
  const { data, error } = await supabase
    .from('deep_reports')
    .select(`
      id,
      content,
      created_at,
      reading_id,
      share_token,
      is_public,
      readings!deep_reports_reading_id_fkey ( mode, spread_key, cards )
    `)
    .eq('id', id)
    .maybeSingle();

  rethrow(error, 'get report');
  return data;
}

/** @param {SupabaseClient} supabase @param {string} id */
export async function deleteReport(supabase, id, userId) {
  let query = supabase
    .from('deep_reports')
    .delete()
    .eq('id', id);
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query
    .select('id')
    .maybeSingle();

  rethrow(error, 'delete report');
  return data;
}

/**
 * @param {SupabaseClient} supabase
 * @param {{ id: string, userId: string, token: string }} input
 */
export async function shareReport(supabase, input) {
  const { data, error } = await supabase
    .from('deep_reports')
    .update({ is_public: true, share_token: input.token })
    .eq('id', input.id)
    .eq('user_id', input.userId)
    .select('id, is_public, share_token')
    .maybeSingle();

  rethrow(error, 'share report');
  return data;
}

/** @param {SupabaseClient} supabase @param {string} id */
export async function getReading(supabase, id) {
  const { data, error } = await supabase
    .from('readings')
    .select('id, user_id, mode, spread_key, question, cards, created_at')
    .eq('id', id)
    .maybeSingle();

  rethrow(error, 'get reading');
  return data;
}

/** @param {SupabaseClient} supabase @param {{ userId: string, since: string }} input */
export async function countReportsSince(supabase, input) {
  const { count, error } = await supabase
    .from('deep_reports')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', input.userId)
    .gte('created_at', input.since);

  rethrow(error, 'count reports');
  return count || 0;
}

/** @param {SupabaseClient} supabase @param {string} readingId */
export async function getReportByReading(supabase, readingId) {
  const { data, error } = await supabase
    .from('deep_reports')
    .select('id, content, created_at, reading_id')
    .eq('reading_id', readingId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  rethrow(error, 'get report by reading');
  return data;
}

/**
 * @param {SupabaseClient} supabase
 * @param {{ userId: string, readingId: string, model: string, content: string }} input
 */
export async function insertReport(supabase, input) {
  const { data, error } = await supabase
    .from('deep_reports')
    .insert({
      user_id: input.userId,
      reading_id: input.readingId,
      model: input.model,
      content: input.content,
    })
    .select('id, content, created_at, reading_id')
    .single();

  rethrow(error, 'insert report');
  return data;
}
