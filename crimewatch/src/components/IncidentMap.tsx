import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import type { Incident } from '../types';

// Default map center: Johannesburg CBD. Swap for the user's actual city/region.
const DEFAULT_CENTER: [number, number] = [-26.2041, 28.0473];

const severityColor: Record<Incident['severity'], string> = {
  high: 'var(--alert-red)',
  medium: 'var(--signal-amber)',
  low: 'var(--safety-teal)',
};

interface IncidentMapProps {
  incidents: Incident[];
  freshIds: Set<string>;
}

export default function IncidentMap({ incidents, freshIds }: IncidentMapProps) {
  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={11}
        style={{ height: '100%', width: '100%', background: 'var(--ink-900)' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {incidents.map((incident) => (
          <CircleMarker
            key={incident.id}
            center={[incident.latitude, incident.longitude]}
            radius={freshIds.has(incident.id) ? 12 : 8}
            pathOptions={{
              color: severityColor[incident.severity],
              fillColor: severityColor[incident.severity],
              fillOpacity: 0.75,
              weight: freshIds.has(incident.id) ? 3 : 1.5,
            }}
          >
            <Popup>
              <div className="mono" style={{ fontSize: 12, minWidth: 180 }}>
                <strong style={{ fontFamily: 'var(--font-body)' }}>
                  {incident.title}
                </strong>
                <br />
                {incident.category.replace('_', ' ')} · {incident.severity} severity
                <br />
                {incident.address ?? `${incident.latitude.toFixed(4)}, ${incident.longitude.toFixed(4)}`}
                <br />
                {new Date(incident.created_at).toLocaleString('en-ZA')}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
