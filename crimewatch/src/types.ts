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
  media_urls: string[] | null;
}

export interface NewIncidentInput {
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  latitude: number;
  longitude: number;
  address?: string;
  media_urls?: string[];
}

export const MAX_MEDIA_FILES = 4;
export const MAX_MEDIA_FILE_SIZE_MB = 15;
export const ACCEPTED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
