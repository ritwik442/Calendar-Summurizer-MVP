// src/App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import useSession from './hooks/useSession';

/**
 * A thin wrapper that:
 *  • Shows a loading splash while the auth state is unknown
 *  • Redirects unauthenticated users to /login
 */
function ProtectedRoute({ children }) {
  const session = useSession();      // null → signed out, object → signed in, undefined → loading

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center h-screen text-lg">
        Loading&hellip;
      </div>
    );
  }

  return session ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Protected dashboard (root path) */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Public login page */}
        <Route path="/login" element={<Login />} />

        {/* Catch-all → redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
