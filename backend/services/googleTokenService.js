const { getOAuthClient } = require('./googleClient');
const supabase = require('./supabaseClient');

async function upsertTokens({ user_id, tokens }) {
  const { access_token, refresh_token, expiry_date } = tokens;

  return supabase.from('google_tokens').upsert(
    {
      user_id,
      access_token,
      refresh_token,
      expiry: new Date(expiry_date).toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

async function getValidTokens(user_id) {
  // read stored tokens
  const { data, error } = await supabase
    .from('google_tokens')
    .select('*')
    .eq('user_id', user_id)
    .single();

  if (error || !data) return null;

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: new Date(data.expiry).getTime(),
  });

  // refresh if expired
  if (oauth2Client.isTokenExpiring()) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    await upsertTokens({ user_id, tokens: credentials });
    oauth2Client.setCredentials(credentials);
  }

  return oauth2Client;
}

module.exports = { getValidTokens, upsertTokens };
