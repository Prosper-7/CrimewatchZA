import { useState } from 'react';
import Header from './components/Header';
import IncidentMap from './components/IncidentMap';
import IncidentFeed from './components/IncidentFeed';
import ReportForm from './components/ReportForm';
import { useIncidents } from './hooks/useIncidents';

export default function App() {
  const { incidents, loading, error, freshIds, reportIncident } = useIncidents();
  const [showForm, setShowForm] = useState(false);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header liveCount={incidents.length} onReportClick={() => setShowForm(true)} />

      {error && (
        <div
          style={{
            padding: '8px 24px',
            background: 'var(--alert-red-dim)',
            color: '#fff',
            fontSize: 13,
          }}
        >
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
        <div
          className="mono"
          style={{
            position: 'absolute',
            bottom: 16,
            left: 24,
            fontSize: 12,
            color: 'var(--text-dim)',
          }}
        >
          Loading incidents…
        </div>
      )}

      {showForm && (
        <ReportForm onClose={() => setShowForm(false)} onSubmit={reportIncident} />
      )}
    </div>
  );
}
