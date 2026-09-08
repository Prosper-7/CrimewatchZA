import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Header from './components/Header';
import IncidentMap from './components/IncidentMap';
import IncidentFeed from './components/IncidentFeed';
import ReportForm from './components/ReportForm';
import { useIncidents } from './hooks/useIncidents';
import { AuthProvider, useAuth } from './context/AuthContext';
import RequireModerator from './components/RequireModerator';
import PhoneAuth from './components/PhoneAuth';
import ModerationDashboard from './pages/ModerationDashboard';
import ArticleList from './pages/ArticleList';
import ArticleEditor from './pages/ArticleEditor';
import AlertSettings from './pages/AlertSettings';

function MapConsole() {
  const { incidents, loading, error, freshIds, reportIncident } = useIncidents();
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header liveCount={incidents.length} onReportClick={() => setShowForm(true)} />

      {error && (
        <div style={{ padding: '8px 24px', background: 'var(--alert-red-dim)', color: '#fff', fontSize: 13 }}>
          Couldn't load incidents: {error}. Check your Supabase connection in .env.
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <IncidentMap incidents={incidents} freshIds={freshIds} />
        </div>
        <div style={{ width: 340, flexShrink: 0 }}>
          <IncidentFeed incidents={incidents} freshIds={freshIds} />
        </div>
      </div>

      {loading && (
        <div className="mono" style={{ position: 'absolute', bottom: 16, left: 24, fontSize: 12, color: 'var(--text-dim)' }}>
          Loading incidents…
        </div>
      )}

      {showForm && <ReportForm onClose={() => setShowForm(false)} onSubmit={reportIncident} />}
    </div>
  );
}

function SignInPage() {
  const auth = useAuth() as { session: unknown } | null;
  const session = auth?.session;
  if (session) {
    return <p style={{ padding: 24 }}>You're signed in. <Link to="/">Back to the map</Link></p>;
  }
  return (
    <div style={{ maxWidth: 360, margin: '80px auto', padding: 24 }}>
      <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Sign in</h1>
      <PhoneAuth onSignedIn={() => window.location.assign('/')} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MapConsole />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/articles" element={<ArticleList />} />
          <Route path="/alerts" element={<AlertSettings />} />
          <Route
            path="/moderation"
            element={
              <RequireModerator>
                <ModerationDashboard />
              </RequireModerator>
            }
          />
          <Route
            path="/articles/new"
            element={
              <RequireModerator>
                <ArticleEditor />
              </RequireModerator>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
