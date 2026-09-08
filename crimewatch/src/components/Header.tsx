import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  liveCount: number;
  onReportClick: () => void;
}

export default function Header({ liveCount, onReportClick }: HeaderProps) {
  const auth = useAuth() as { session: unknown; signOut: () => Promise<void> } | null;
  const isSignedIn = !!auth?.session;

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 24px',
        borderBottom: '1px solid var(--line-600)',
        background: 'var(--panel-800)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span
          aria-hidden
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--safety-teal)',
            boxShadow: '0 0 8px var(--safety-teal)',
          }}
        />
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: '0.02em',
            margin: 0,
            textTransform: 'uppercase',
          }}
        >
          CrimeWatch <span style={{ color: 'var(--signal-amber)' }}>ZA</span>
        </h1>
        <span className="mono" style={{ color: 'var(--text-dim)', fontSize: 12, marginLeft: 6 }}>
          COMMUNITY INCIDENT CONSOLE
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          {liveCount} active in view
        </span>
        <Link to="/articles" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
          Articles
        </Link>
        {isSignedIn ? (
          <>
            <Link to="/alerts" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
              Alerts
            </Link>
            <button
              onClick={() => auth?.signOut()}
              style={{ background: 'transparent', border: '1px solid var(--line-600)', color: 'var(--text-muted)', borderRadius: 'var(--radius-sm)', padding: '6px 12px', fontSize: 13 }}
            >
              Sign out
            </button>
          </>
        ) : (
          <Link to="/signin" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
            Sign in
          </Link>
        )}
        <button
          onClick={onReportClick}
          style={{
            background: 'var(--alert-red)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 18px',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 15,
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
          }}
        >
          Report incident
        </button>
      </div>
    </header>
  );
}
