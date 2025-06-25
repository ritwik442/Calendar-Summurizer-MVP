const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');                  // to decode Supabase JWT
const { getOAuthClient } = require('../services/googleClient');
const { upsertTokens } = require('../services/googleTokenService');

//
// 1.  GET /api/google/auth-url  → returns Google consent URL
//
router.get('/auth-url', (req, res) => {
  const supaJwt = req.header('Authorization')?.replace('Bearer ', '');
  if (!supaJwt) return res.status(401).json({ error: 'No Supabase JWT' });

  // decode WITHOUT verifying (we only need the user id)
  const payload = jwt.decode(supaJwt);
  const user_id = payload?.sub;
  if (!user_id) return res.status(400).json({ error: 'Bad JWT' });

  const oauth2Client = getOAuthClient();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    prompt: 'consent',
    state: user_id,                           // we’ll get it back in callback
  });

  res.json({ url });
});

//
// 2.  GET /api/google/callback?code=...&state=...
//     Google redirects here; we exchange code for tokens → save → redirect front-end
//
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;          // state === user_id
  if (!code || !state) return res.status(400).send('Missing code or state');

  const oauth2Client = getOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);
  await upsertTokens({ user_id: state, tokens });

  // Redirect back to the app (you can pass a query flag)
  return res.redirect('http://localhost:3000/?googleConnected=true');
});

module.exports = router;
