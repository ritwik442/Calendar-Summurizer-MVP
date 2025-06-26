require('dotenv').config();   
console.log('[DEBUG FRONTEND]', process.env.FRONTEND_ORIGIN);
const express = require('express');
const cors = require('cors');
const app  = express();

/* ---------- CORS allow-list ---------- */
const allowed = [
  process.env.FRONTEND_ORIGIN,        
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowed.includes(origin)) return cb(null, true);
      cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/google', require('./routes/googleAuth'));
app.use('/api/events', require('./routes/events'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
