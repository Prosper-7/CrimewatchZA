import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  ACCEPTED_MEDIA_TYPES,
  MAX_MEDIA_FILES,
  MAX_MEDIA_FILE_SIZE_MB,
} from '../types';
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
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  function handleMediaSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ''; // allow picking the same file again later

    const combined = [...mediaFiles, ...picked];
    if (combined.length > MAX_MEDIA_FILES) {
      setErrorMsg(`You can attach up to ${MAX_MEDIA_FILES} files per report.`);
      return;
    }

    for (const file of picked) {
      if (!ACCEPTED_MEDIA_TYPES.includes(file.type)) {
        setErrorMsg(`${file.name} isn't a supported photo or video format.`);
        return;
      }
      if (file.size > MAX_MEDIA_FILE_SIZE_MB * 1024 * 1024) {
        setErrorMsg(`${file.name} is over the ${MAX_MEDIA_FILE_SIZE_MB}MB limit.`);
        return;
      }
    }

    setErrorMsg(null);
    setMediaFiles(combined);
    setMediaPreviews((prev) => [...prev, ...picked.map((f) => URL.createObjectURL(f))]);
  }

  function removeMedia(index: number) {
    URL.revokeObjectURL(mediaPreviews[index]);
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
    setMediaPreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function uploadMedia(): Promise<string[]> {
    const urls: string[] = [];
    for (let i = 0; i < mediaFiles.length; i++) {
      const file = mediaFiles[i];
      setUploadProgress(`Uploading ${i + 1} of ${mediaFiles.length}…`);
      const ext = file.name.split('.').pop() ?? 'dat';
      const path = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('incident-media')
        .upload(path, file, { contentType: file.type });

      if (uploadError) {
        throw new Error(`Couldn't upload ${file.name}: ${uploadError.message}`);
      }

      const { data } = supabase.storage.from('incident-media').getPublicUrl(path);
      urls.push(data.publicUrl);
    }
    setUploadProgress(null);
    return urls;
  }

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
      const media_urls = mediaFiles.length > 0 ? await uploadMedia() : undefined;
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        category,
        severity,
        latitude: coords.lat,
        longitude: coords.lng,
        address: address.trim() || undefined,
        media_urls,
      });
      mediaPreviews.forEach((url) => URL.revokeObjectURL(url));
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not submit report.');
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
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
        zIndex: 10000,
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

        <Field label={`Photo / video evidence (optional, up to ${MAX_MEDIA_FILES})`}>
          <label
            style={{
              ...secondaryButtonStyle,
              display: 'inline-block',
              marginBottom: mediaPreviews.length > 0 ? 10 : 0,
            }}
          >
            Add files
            <input
              type="file"
              accept={ACCEPTED_MEDIA_TYPES.join(',')}
              multiple
              onChange={handleMediaSelect}
              disabled={mediaFiles.length >= MAX_MEDIA_FILES}
              style={{ display: 'none' }}
            />
          </label>

          {mediaPreviews.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {mediaPreviews.map((src, i) => (
                <div key={src} style={{ position: 'relative', width: 64, height: 64 }}>
                  {mediaFiles[i].type.startsWith('video') ? (
                    <video
                      src={src}
                      style={{
                        width: 64,
                        height: 64,
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--line-600)',
                      }}
                    />
                  ) : (
                    <img
                      src={src}
                      alt=""
                      style={{
                        width: 64,
                        height: 64,
                        objectFit: 'cover',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--line-600)',
                      }}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(i)}
                    aria-label={`Remove ${mediaFiles[i].name}`}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--alert-red)',
                      color: '#fff',
                      border: '2px solid var(--panel-800)',
                      fontSize: 11,
                      lineHeight: 1,
                      padding: 0,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </Field>

        {uploadProgress && (
          <p className="mono" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            {uploadProgress}
          </p>
        )}

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
