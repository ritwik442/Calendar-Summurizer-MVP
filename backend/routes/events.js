const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');
const { getValidTokens } = require('../services/googleTokenService');
const supabase = require('../services/supabaseClient');

// Middleware: extract Supabase user ID from Authorization header
function extractUserId(req, res, next) {
  const supaJwt = req.header('Authorization')?.replace('Bearer ', '');
  if (!supaJwt) return res.status(401).json({ error: 'No Supabase JWT' });
  const payload = jwt.decode(supaJwt);
  req.user_id = payload?.sub;
  if (!req.user_id) return res.status(400).json({ error: 'Bad JWT' });
  next();
}

router.get('/', extractUserId, async (req, res) => {
  const user_id = req.user_id;
  const oauthClient = await getValidTokens(user_id);
  if (!oauthClient)
    return res.status(400).json({ error: 'Google account not linked' });

  // Fetch next 10 events
  const calendar = google.calendar({ version: 'v3', auth: oauthClient });
  const { data } = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });

  // Upsert each event into Supabase
  const upserts = data.items.map((ev) =>
    supabase.from('events').upsert(
      {
        user_id,
        google_event_id: ev.id,
        title: ev.summary ?? '(no title)',
        description: ev.description ?? '',
        start_time: ev.start?.dateTime ?? ev.start?.date,
        end_time: ev.end?.dateTime ?? ev.end?.date,
      },
      { onConflict: 'google_event_id' }
    )
  );
  await Promise.all(upserts);

  // Return cleaned payload to frontend
  res.json(
    data.items.map((ev) => ({
      id: ev.id,
      title: ev.summary,
      description: ev.description,
      start: ev.start.dateTime ?? ev.start.date,
      end: ev.end.dateTime ?? ev.end.date,
    }))
  );
});

module.exports = router;
