export type IncidentCategory =
  | 'hijacking'
  | 'burglary'
  | 'theft'
  | 'assault'
  | 'robbery'
  | 'vandalism'
  | 'suspicious_activity'
  | 'other';

export type IncidentSeverity = 'low' | 'medium' | 'high';

export type IncidentStatus = 'reported' | 'verified' | 'resolved' | 'false_report';

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  address: string | null;
  reporter_id: string | null;
  created_at: string;
}

export interface NewIncidentInput {
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  address?: string;
}
