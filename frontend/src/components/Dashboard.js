// src/components/Dashboard.js
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export default function Dashboard() {
  const [events, setEvents] = useState([]);     // will hold summaries later
  const [loading, setLoading] = useState(true);

  // Placeholder fetch: read any rows already in the `events` table
  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_time', { ascending: true })
        .limit(10);

      if (error) console.error(error.message);
      else setEvents(data);

      setLoading(false);
    };

    fetchEvents();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Calendar Summaries</h1>
        <button
          onClick={handleSignOut}
          className="px-3 py-1 bg-red-500 text-white rounded"
        >
          Sign out
        </button>
      </header>

      {loading ? (
        <p>Loading events…</p>
      ) : events.length === 0 ? (
        <p className="text-gray-600">
          No events yet. Step 3 will pull your Google Calendar data here.
        </p>
      ) : (
        <ul className="space-y-4">
          {events.map(ev => (
            <li
              key={ev.id}
              className="p-4 bg-white shadow rounded border border-gray-200"
            >
              <h2 className="font-semibold">{ev.title}</h2>
              <p className="text-sm text-gray-500">
                {new Date(ev.start_time).toLocaleString()} –{' '}
                {new Date(ev.end_time).toLocaleTimeString()}
              </p>
              {ev.summary && <p className="mt-2">{ev.summary}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
