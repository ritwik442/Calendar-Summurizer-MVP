import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import axios from 'axios';
import useSession from '../hooks/useSession';

export default function Dashboard() {
const session = useSession();         // value comes from hook
const bearer  = { headers: { Authorization: `Bearer ${session?.access_token}` } };
  

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('http://localhost:4000/api/events', bearer);
      setEvents(data);
    } catch (err) {
      if (err.response?.data?.error === 'Google account not linked') {
        alert('Please connect Google Calendar first.');
      } else console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const connectGoogle = async () => {
    // Step 1: ask backend for Google consent URL
    const { data } = await axios.get(
      'http://localhost:4000/api/google/auth-url',
      bearer
    );
    window.location.href = data.url; // full page redirect → Google consent
  };

  useEffect(() => {
    fetchEvents(); // attempt on mount; empty list means maybe not linked yet
    // eslint-disable-next-line
  }, []);

  /* UI unchanged from earlier except added buttons */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Calendar Summaries</h1>
        <div className="space-x-3">
          <button
            onClick={connectGoogle}
            className="px-3 py-1 bg-green-600 text-white rounded"
          >
            Connect Google
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-3 py-1 bg-red-500 text-white rounded"
          >
            Sign out
          </button>
        </div>
      </header>

      <button
        onClick={fetchEvents}
        className="mb-6 px-3 py-1 bg-blue-500 text-white rounded"
      >
        Refresh Events
      </button>

      {loading ? (
        <p>Loading…</p>
      ) : events.length === 0 ? (
        <p>No events yet.</p>
      ) : (
        <ul className="space-y-4">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="p-4 bg-white shadow rounded border border-gray-200"
            >
              <h2 className="font-semibold">{ev.title}</h2>
              <p className="text-sm text-gray-500">
                {new Date(ev.start).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
