import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { Incident, NewIncidentInput } from '../types';

export function useIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Tracks incident ids that just arrived, so the UI can flash/pulse them
  const [freshIds, setFreshIds] = useState<Set<string>>(new Set());
  const freshTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const markFresh = (id: string) => {
    setFreshIds((prev) => new Set(prev).add(id));
    const existing = freshTimers.current.get(id);
    if (existing) clearTimeout(existing);
    const timer = setTimeout(() => {
      setFreshIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      freshTimers.current.delete(id);
    }, 8000);
    freshTimers.current.set(id, timer);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

      if (cancelled) return;
      if (fetchError) {
        setError(fetchError.message);
      } else {
        setIncidents(data as Incident[]);
      }
      setLoading(false);
    }

    loadInitial();

    // Real-time: any insert/update/delete on the incidents table pushes here instantly
    const channel = supabase
      .channel('incidents-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'incidents' },
        (payload) => {
          const incident = payload.new as Incident;
          setIncidents((prev) => [incident, ...prev]);
          markFresh(incident.id);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'incidents' },
        (payload) => {
          const incident = payload.new as Incident;
          setIncidents((prev) =>
            prev.map((i) => (i.id === incident.id ? incident : i))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'incidents' },
        (payload) => {
          const oldIncident = payload.old as Incident;
          setIncidents((prev) => prev.filter((i) => i.id !== oldIncident.id));
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      freshTimers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  async function reportIncident(input: NewIncidentInput) {
    const { data: userData } = await supabase.auth.getUser();
    const { error: insertError } = await supabase.from('incidents').insert({
      ...input,
      status: 'reported',
      reporter_id: userData.user?.id ?? null,
    });
    if (insertError) throw insertError;
  }

  return { incidents, loading, error, freshIds, reportIncident };
}
