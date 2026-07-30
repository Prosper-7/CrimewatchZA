import { useState } from 'react';
import type { IncidentCategory, IncidentSeverity, NewIncidentInput } from '../types';

interface ReportFormProps {
  onClose: () => void;
  onSubmit: (input: NewIncidentInput) => Promise<void>;
}

const categories: IncidentCategory[] = [
  'hijacking',
  'burglary',
  'theft',
  'assault',
  'robbery',
  'vandalism',
  'suspicious_activity',
  'other',
];

export default function ReportForm({ onClose, onSubmit }: ReportFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('theft');
  const [severity, setSeverity] = useState<IncidentSeverity>('medium');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function useMyLocation() {
    if (!navigator.geolocation) {
      setErrorMsg('Location services are not available on this device.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setErrorMsg('Could not get your location. Enter the address instead.');
        setLocating(false);
      }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim() || !description.trim()) {
      setErrorMsg('Add a short title and description before submitting.');
      return;
    }
    if (!coords) {
      setErrorMsg('Set a location — use your current location or enter an address.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        latitude: coords.lat,
        longitude: coords.lng,
        address: address.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not submit report.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 14, 23, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        style={{
          background: 'var(--panel-800)',
          border: '1px solid var(--line-600)',
          borderRadius: 'var(--radius-md)',
          padding: 28,
          width: 420,
          maxWidth: '90vw',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            textTransform: 'uppercase',
            fontSize: 22,
            margin: '0 0 4px',
          }}
        >
          Report an incident
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 0, marginBottom: 20 }}>
          This logs the report for your community and nearest SAPS station reference
          — it is not a live emergency dispatch. If this is happening now and you're
          in danger, call 10111 (SAPS) or 10177 (ambulance) first.
        </p>

        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Attempted break-in on Rustenburg Rd"
            style={inputStyle}
          />
        </Field>

        <Field label="What happened">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief, factual description — time noticed, what you saw"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </Field>

        <div style={{ display: 'flex', gap: 12 }}>
          <Field label="Category" grow>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as IncidentCategory)}
              style={inputStyle}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.replace('_', ' ')}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Severity" grow>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
              style={inputStyle}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </Field>
        </div>

        <Field label="Location">
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              style={secondaryButtonStyle}
            >
              {locating ? 'Locating…' : coords ? 'Location set ✓' : 'Use my location'}
            </button>
          </div>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Street / suburb (optional, helps verification)"
            style={inputStyle}
          />
        </Field>

        {errorMsg && (
          <p style={{ color: 'var(--alert-red)', fontSize: 13, marginTop: 4 }}>
            {errorMsg}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button type="button" onClick={onClose} style={secondaryButtonStyle}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{ ...primaryButtonStyle, flex: 1 }}
          >
            {submitting ? 'Submitting…' : 'Submit report'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
  grow,
}: {
  label: string;
  children: React.ReactNode;
  grow?: boolean;
}) {
  return (
    <div style={{ marginBottom: 14, flex: grow ? 1 : undefined }}>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          color: 'var(--text-muted)',
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'var(--ink-900)',
  border: '1px solid var(--line-600)',
  borderRadius: 'var(--radius-sm)',
  padding: '9px 10px',
  color: 'var(--text-primary)',
  fontSize: 14,
  fontFamily: 'var(--font-body)',
};

const primaryButtonStyle: React.CSSProperties = {
  background: 'var(--alert-red)',
  color: '#fff',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 16px',
  fontWeight: 600,
  fontSize: 14,
};

const secondaryButtonStyle: React.CSSProperties = {
  background: 'transparent',
  color: 'var(--text-primary)',
  border: '1px solid var(--line-600)',
  borderRadius: 'var(--radius-sm)',
  padding: '10px 16px',
  fontSize: 14,
};
