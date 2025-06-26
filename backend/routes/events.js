// backend/routes/events.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { google } = require('googleapis');

const supabase = require('../services/supabaseClient');
const { getValidTokens } = require('../services/googleTokenService');
const { summarizeEvent } = require('../services/openaiService');


/* ---------- middleware: pull user_id from Supabase JWT ---------- */
function extractUserId(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No Supabase JWT' });

  const payload = jwt.decode(token);
  if (!payload?.sub) return res.status(400).json({ error: 'Bad JWT' });

  req.user_id = payload.sub;
  next();
}

/* ---------- GET /api/events ----------
 * query params:
 *   withSummaries=true  → generate GPT summaries if missing
 *   force=true          → regenerate even if summary already exists
 */
router.get('/', extractUserId, async (req, res) => {
  const user_id = req.user_id;
  const withSummaries = req.query.withSummaries === 'true';
  const force = req.query.force === 'true';

  try {
    /* 1️⃣  Ensure we have a fresh Google OAuth client */
    const oauthClient = await getValidTokens(user_id);
    if (!oauthClient)
      return res.status(400).json({ error: 'Google account not linked' });

    /* 2️⃣  Pull next 10 Google Calendar events */
    const calendar = google.calendar({ version: 'v3', auth: oauthClient });
   const lookBackMs = 7 * 24 * 60 * 60 * 1000;   // 7 days
const { data } = await calendar.events.list({
  calendarId: 'primary',
  timeMin: new Date(Date.now() - lookBackMs).toISOString(),
  maxResults: 100,
  singleEvents: true,
  orderBy: 'startTime',
});


    const items = data.items ?? [];

    /* 3️⃣  Upsert basic event data into Supabase */
    await Promise.all(
      items.map((ev) =>
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
      )
    );

    /* 4️⃣  Generate / regenerate GPT summaries */
    if (withSummaries) {
      await Promise.all(
        items.map(async (ev) => {
          if (!force) {
            // skip if summary already exists
            const { data: existing } = await supabase
              .from('events')
              .select('summary')
              .eq('google_event_id', ev.id)
              .single();
            if (existing?.summary) return;
          }

          try {
            const summary = await summarizeEvent(ev);
            await supabase
              .from('events')
              .update({ summary })
              .eq('google_event_id', ev.id);
          } catch (err) {
            console.error('OpenAI summary failed:', err.message);
          }
        })
      );
    }

    /* 5️⃣  Return merged events from DB */
const { data: dbEvents } = await supabase
  .from('events')
  .select('*')
  .eq('user_id', user_id)
  .order('start_time', { ascending: true });  
   
    
    res.json(dbEvents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
