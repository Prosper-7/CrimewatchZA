import type { Incident } from '../types';

const severityColor: Record<Incident['severity'], string> = {
  high: 'var(--alert-red)',
  medium: 'var(--signal-amber)',
  low: 'var(--safety-teal)',
};

const statusLabel: Record<Incident['status'], string> = {
  reported: 'NEW',
  verified: 'VERIFIED',
  resolved: 'RESOLVED',
  false_report: 'DISMISSED',
};

interface IncidentFeedProps {
  incidents: Incident[];
  freshIds: Set<string>;
}

export default function IncidentFeed({ incidents, freshIds }: IncidentFeedProps) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid var(--line-600)',
        background: 'var(--panel-800)',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--line-600)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          className="mono"
          style={{ fontSize: 12, color: 'var(--text-dim)', letterSpacing: '0.08em' }}
        >
          LIVE LOG
        </span>
        <span
          className="mono"
          style={{ fontSize: 11, color: 'var(--safety-teal)' }}
        >
          ● STREAMING
        </span>
      </div>

      <div style={{ overflowY: 'auto', flex: 1 }}>
        {incidents.length === 0 && (
          <div
            style={{
              padding: 24,
              color: 'var(--text-dim)',
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            No incidents logged yet. Reports submitted nearby will appear here
            the instant they come in.
          </div>
        )}
        {incidents.map((incident) => {
          const isFresh = freshIds.has(incident.id);
          return (
            <div
              key={incident.id}
              style={{
                padding: '10px 16px',
                borderBottom: '1px solid var(--line-600)',
                background: isFresh ? 'var(--panel-700)' : 'transparent',
                transition: 'background 0.6s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 8,
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: severityColor[incident.severity],
                    fontWeight: 500,
                  }}
                >
                  {statusLabel[incident.status]}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  {new Date(incident.created_at).toLocaleTimeString('en-ZA', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div style={{ fontSize: 14, marginTop: 4, fontWeight: 500 }}>
                {incident.title}
              </div>
              <div
                className="mono"
                style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}
              >
                {incident.category.replace('_', ' ')} · {incident.address ?? 'location logged'}
                {incident.media_urls && incident.media_urls.length > 0 && (
                  <span style={{ color: 'var(--signal-amber)' }}>
                    {' '}
                    · {incident.media_urls.length} attachment
                    {incident.media_urls.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
