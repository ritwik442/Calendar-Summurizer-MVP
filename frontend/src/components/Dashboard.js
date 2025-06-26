// src/components/Dashboard.js
import { useEffect, useState } from 'react';
import axios from 'axios';
import { supabase } from '../lib/supabaseClient';
import useSession from '../hooks/useSession';
import { API_BASE } from '../lib/apiBase';

export default function Dashboard() {
  /* ---------- state ---------- */
  const session = useSession();            // undefined → loading, null → signed-out
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------- helpers ---------- */
  const bearer =
    session?.access_token
      ? { headers: { Authorization: `Bearer ${session.access_token}` } }
      : null;

  /* ---------- API calls ---------- */
  const fetchEvents = async (withSummaries = false) => {
    if (!session) return;                  // guard while signed-out
    setLoading(true);
    try {
const { data } = await axios.get(
  `${API_BASE}/api/events?withSummaries=${withSummaries}`,
  bearer
);
setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error ?? 'Failed to fetch events');
    } finally {
      setLoading(false);
    }
  };

  const connectGoogle = async () => {
    if (!session) return;
    try {
     const { data } = await axios.get(
  `${API_BASE}/api/google/auth-url`,
   bearer
);
      window.location.href = data.url;     // redirect to Google consent
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error ?? 'Unable to get Google auth URL');
    }
  };

  /* ---------- lifecycle ---------- */
  useEffect(() => {
    if (session) fetchEvents(false);       // initial load after sign-in
    // eslint-disable-next-line
  }, [session]);

  /* ---------- early loading state ---------- */
  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading…
      </div>
    );
  }

return (
  <div className="min-h-screen bg-gray-50 p-6">
    {/* …header and buttons stay the same … */}

    {loading && <p>Loading…</p>}

    {/* 1️⃣ no loading, events is an array, but empty */}
    {!loading && Array.isArray(events) && events.length === 0 && (
      <p>No events to display.</p>
    )}

    {/* 2️⃣ events is an array with items → safe to .map() */}
    {!loading && Array.isArray(events) && events.length > 0 && (
      <ul className="space-y-4">
        {events.map((ev) => (
          <li
            key={ev.google_event_id ?? ev.id}
            className="p-4 bg-white shadow rounded border"
          >
            <h2 className="font-semibold">{ev.title}</h2>
            <p className="text-sm text-gray-500">
              {new Date(ev.start_time).toLocaleString()}
            </p>

            {ev.summary ? (
              <p className="mt-2">{ev.summary}</p>
            ) : (
              <p className="mt-2 italic text-gray-400">
                Summary not generated.
              </p>
            )}
          </li>
        ))}
      </ul>
    )}
  </div>
);
}
