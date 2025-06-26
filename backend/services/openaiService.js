// backend/services/openaiService.js
const { OpenAI } = require('openai');

/* -------------------------------------------------------------
   Create a single OpenAI client (throws if key missing)
------------------------------------------------------------- */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,      // <-- dotenv must load first
});

/* -------------------------------------------------------------
   summarizeEvent(event)
   Expects a Google Calendar event object. Returns a 1-2 sentence
   summary as a Promise<string>.
------------------------------------------------------------- */
async function summarizeEvent(event) {
  const prompt = `
Summarize the calendar
event below in 1–2 concise sentences (≤ 40 words).

Title: ${event.summary ?? '(no title)'}
Description: ${event.description ?? '(none)'}
Start: ${event.start?.dateTime ?? event.start?.date}
End: ${event.end?.dateTime ?? event.end?.date}

Summary:`.trim();

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',      // or 'gpt-4o'
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 80,
    temperature: 0.7,
  });

  return completion.choices[0].message.content.trim();
}

/* -------------------------------------------------------------
   CommonJS export
------------------------------------------------------------- */
module.exports = { summarizeEvent };
