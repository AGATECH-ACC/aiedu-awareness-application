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
      readings!deep_reports_reading_id_fkey ( mode, spread_key, cards )
    `)
    .eq('id', id)
    .maybeSingle();

  rethrow(error, 'get report');
  return data;
}

/** @param {SupabaseClient} supabase @param {string} id */
export async function deleteReport(supabase, id) {
  const { data, error } = await supabase
    .from('deep_reports')
    .delete()
    .eq('id', id)
    .select('id')
    .maybeSingle();

  rethrow(error, 'delete report');
  return data;
}
