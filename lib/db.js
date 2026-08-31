/**
 * @typedef {import('@supabase/supabase-js').SupabaseClient} SupabaseClient
 *
 * @typedef {Object} ReadingInput
 * @property {string} userId
 * @property {1 | 2 | 3 | 4} mode
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

/**
 * @param {SupabaseClient} supabase
 * @param {{ limit?: number, userId?: string }} [options]
 */
export async function listReports(supabase, options = {}) {
  const { limit = 20, userId } = options;
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  let query = supabase
    .from('deep_reports')
    .select(`
      id,
      user_id,
      content,
      created_at,
      reading_id,
      share_token,
      is_public,
      readings!deep_reports_reading_id_fkey ( mode, spread_key, cards )
    `);
  if (userId) query = query.eq('user_id', userId);

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  rethrow(error, 'list reports');
  return data || [];
}

/**
 * @param {SupabaseClient} supabase
 * @param {{ id: string, userId: string }} input
 */
export async function getReport(supabase, input) {
  const { data, error } = await supabase
    .from('deep_reports')
    .select(`
      id,
      user_id,
      content,
      created_at,
      reading_id,
      share_token,
      is_public,
      readings!deep_reports_reading_id_fkey ( mode, spread_key, question, cards )
    `)
    .eq('id', input.id)
    .eq('user_id', input.userId)
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
    .select('id, content, created_at, reading_id, share_token, is_public')
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

/** @param {SupabaseClient} supabase @param {string} userId */
export async function getProfile(supabase, userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, plan, display_name, created_at')
    .eq('id', userId)
    .maybeSingle();

  rethrow(error, 'get profile');
  return data;
}

/** @param {SupabaseClient} supabase @param {number} [limit=50] */
export async function listLinkedUsers(supabase, limit = 50) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const { data, error } = await supabase
    .from('educator_user_links')
    .select(`
      user_id,
      status,
      created_at,
      user:profiles!educator_user_links_user_id_fkey ( id, display_name )
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  rethrow(error, 'list linked users');
  return data || [];
}

/**
 * @param {SupabaseClient} supabase
 * @param {string[]} userIds
 * @param {number} [limit=100]
 */
export async function listLinkedReports(supabase, userIds, limit = 100) {
  if (!Array.isArray(userIds) || userIds.length === 0) return [];
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
  const { data, error } = await supabase
    .from('deep_reports')
    .select(`
      id,
      user_id,
      content,
      created_at,
      reading_id,
      readings!deep_reports_reading_id_fkey ( mode, spread_key, cards )
    `)
    .in('user_id', userIds)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  rethrow(error, 'list linked reports');
  return data || [];
}

/** @param {SupabaseClient} supabase @param {number} [limit=100] */
export async function listEducatorDeliveries(supabase, limit = 100) {
  const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 100);
  const { data, error } = await supabase
    .from('educator_report_deliveries')
    .select(`
      id,
      client_id,
      report_id,
      recipient_name,
      recipient_email,
      status,
      emailed_at,
      created_at,
      report:deep_reports!educator_report_deliveries_report_id_fkey (
        id,
        created_at,
        reading_id,
        readings!deep_reports_reading_id_fkey ( mode, spread_key, cards )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(safeLimit);

  rethrow(error, 'list educator deliveries');
  return data || [];
}

/**
 * @param {SupabaseClient} supabase
 * @param {{ deliveryId: string, educatorId: string }} input
 */
export async function getEducatorDelivery(supabase, input) {
  const { data, error } = await supabase
    .from('educator_report_deliveries')
    .select(`
      id,
      educator_id,
      client_id,
      report_id,
      recipient_name,
      recipient_email,
      status,
      emailed_at,
      created_at,
      report:deep_reports!educator_report_deliveries_report_id_fkey (
        id,
        content,
        created_at,
        share_token,
        is_public,
        reading_id,
        readings!deep_reports_reading_id_fkey ( mode, spread_key, question, cards )
      )
    `)
    .eq('id', input.deliveryId)
    .eq('educator_id', input.educatorId)
    .maybeSingle();

  rethrow(error, 'get educator delivery');
  return data;
}
