import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import { supabase } from '../lib/supabaseClient';
import { subscribeToPush, unsubscribeFromPush, pushSupported } from '../lib/push';
import { useAuth } from '../context/AuthContext';

// Fixed by team decision — not user-configurable for now.
const ALERT_RADIUS_METERS = 2000;
const DEFAULT_CENTER: [number, number] = [-26.2041, 28.0473]; // Johannesburg

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function AlertSettings() {
  const auth = useAuth() as { session: { user: { id: string; phone?: string } } | null } | null;
  const session = auth?.session;

  const [watchPoint, setWatchPoint] = useState<[number, number] | null>(null);
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;
    supabase
      .from('profiles')
      .select('watch_lat, watch_lng, alerts_enabled, push_subscription')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        if (data.watch_lat && data.watch_lng) setWatchPoint([data.watch_lat, data.watch_lng]);
        setAlertsEnabled(!!data.alerts_enabled);
        setPushEnabled(!!data.push_subscription);
      });
  }, [session]);

  async function saveWatchArea() {
    if (!session?.user || !watchPoint) return;
    setSaving(true);
    setErrorMsg(null);
    const { error } = await supabase
      .from('profiles')
      .update({ watch_lat: watchPoint[0], watch_lng: watchPoint[1] })
      .eq('id', session.user.id);
    setSaving(false);
    if (error) {
      setErrorMsg(error.message);
    } else {
      setStatusMsg('Watch area saved.');
    }
  }

  async function toggleConsent(next: boolean) {
    if (!session?.user) return;
    setAlertsEnabled(next);
    const { error } = await supabase
      .from('profiles')
      .update({ alerts_enabled: next })
      .eq('id', session.user.id);
    if (error) setErrorMsg(error.message);
  }

  async function enablePush() {
    if (!session?.user) return;
    setErrorMsg(null);
    setSaving(true);
    try {
      const subscription = await subscribeToPush();
      const { error } = await supabase
        .from('profiles')
        .update({ push_subscription: subscription })
        .eq('id', session.user.id);
      if (error) throw error;
      setPushEnabled(true);
      setStatusMsg('Push notifications enabled on this device.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not enable push notifications.');
    } finally {
      setSaving(false);
    }
  }

  async function disablePush() {
    if (!session?.user) return;
    setSaving(true);
    await unsubscribeFromPush();
    const { error } = await supabase
      .from('profiles')
      .update({ push_subscription: null })
      .eq('id', session.user.id);
    setSaving(false);
    if (!error) {
      setPushEnabled(false);
      setStatusMsg('Push notifications turned off on this device.');
    }
  }

  if (!session) {
    return (
      <div style={{ padding: 24, color: 'var(--text-primary)' }}>
        <p>You need to sign in to set up alerts.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: 24, color: 'var(--text-primary)' }}>
      <h1 style={{ fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
        Alert settings
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6 }}>
        Click the map to set the location you want watched. You'll be notified about any
        incident reported within {ALERT_RADIUS_METERS / 1000}km of this point.
      </p>

      <div style={{ height: 320, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--line-600)', marginBottom: 12 }}>
        <MapContainer center={watchPoint ?? DEFAULT_CENTER} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationPicker onPick={(lat, lng) => setWatchPoint([lat, lng])} />
          {watchPoint && (
            <>
              <Marker position={watchPoint} />
              <Circle center={watchPoint} radius={ALERT_RADIUS_METERS} pathOptions={{ color: 'var(--signal-amber)', fillOpacity: 0.08 }} />
            </>
          )}
        </MapContainer>
      </div>

      <button
        onClick={saveWatchArea}
        disabled={!watchPoint || saving}
        style={{ background: 'var(--panel-700)', color: 'var(--text-primary)', border: '1px solid var(--line-600)', borderRadius: 'var(--radius-sm)', padding: '10px 16px', marginBottom: 24 }}
      >
        {saving ? 'Saving…' : 'Save watch area'}
      </button>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, fontSize: 14 }}>
        <input type="checkbox" checked={alertsEnabled} onChange={(e) => toggleConsent(e.target.checked)} />
        Send me alerts for incidents in my watch area (push notification and SMS to the
        phone number on my account). You can turn this off at any time.
      </label>

      {alertsEnabled && (
        <div style={{ background: 'var(--panel-800)', border: '1px solid var(--line-600)', borderRadius: 'var(--radius-md)', padding: 16 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, textTransform: 'uppercase', marginTop: 0 }}>
            Push notifications on this device
          </h2>
          {!pushSupported() ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
              This browser doesn't support push notifications. SMS alerts will still work if
              you're signed in with a phone number.
            </p>
          ) : pushEnabled ? (
            <button onClick={disablePush} disabled={saving} style={{ background: 'transparent', border: '1px solid var(--line-600)', color: 'var(--text-primary)', borderRadius: 'var(--radius-sm)', padding: '8px 14px' }}>
              Turn off push on this device
            </button>
          ) : (
            <button onClick={enablePush} disabled={saving} style={{ background: 'var(--signal-amber)', border: 'none', color: '#1b1200', borderRadius: 'var(--radius-sm)', padding: '8px 14px', fontWeight: 600 }}>
              {saving ? 'Enabling…' : 'Enable push notifications'}
            </button>
          )}
        </div>
      )}

      {statusMsg && <p style={{ color: 'var(--safety-teal)', fontSize: 13, marginTop: 16 }}>{statusMsg}</p>}
      {errorMsg && <p style={{ color: 'var(--alert-red)', fontSize: 13, marginTop: 16 }}>{errorMsg}</p>}
    </div>
  );
}
