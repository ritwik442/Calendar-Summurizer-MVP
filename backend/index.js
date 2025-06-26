require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN,     // production Vercel domain
  'http://localhost:3000',         // local React dev server
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g., Postman) or whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,             // allow cookies / auth headers
  })
);
app.use(express.json());

app.use('/api/google', require('./routes/googleAuth'));
app.use('/api/events', require('./routes/events'));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend running on ${PORT}`));
