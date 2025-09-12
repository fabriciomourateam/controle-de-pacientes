import { useState, useEffect } from 'react';
import { checkinService, type Checkin, type CheckinWithPatient } from '@/lib/checkin-service';

export function useCheckins() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checkinService.getAll();
      setCheckins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar checkins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, []);

  return { checkins, loading, error, refetch: fetchCheckins };
}

export function useCheckinsWithPatient() {
  const [checkins, setCheckins] = useState<CheckinWithPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checkinService.getAllWithPatient();
      setCheckins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar checkins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, []);

  return { checkins, loading, error, refetch: fetchCheckins };
}

export function usePatientCheckins(telefone: string) {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckins = async () => {
    if (!telefone) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await checkinService.getByPhone(telefone);
      setCheckins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar checkins do paciente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, [telefone]);

  return { checkins, loading, error, refetch: fetchCheckins };
}

export function useCurrentMonthCheckins() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checkinService.getCurrentMonth();
      setCheckins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar checkins do mês');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, []);

  return { checkins, loading, error, refetch: fetchCheckins };
}

export function useCheckinStats() {
  const [stats, setStats] = useState<{
    totalCheckins: number;
    checkinsThisMonth: number;
    patientsWithCheckin: number;
    averageScore: number;
  }>({
    totalCheckins: 0,
    checkinsThisMonth: 0,
    patientsWithCheckin: 0,
    averageScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checkinService.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { stats, loading, error, refetch: fetchStats };
}

export function usePatientEvolution(telefone: string, months: number = 12) {
  const [evolution, setEvolution] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvolution = async () => {
    if (!telefone) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await checkinService.getPatientEvolution(telefone, months);
      setEvolution(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar evolução do paciente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvolution();
  }, [telefone, months]);

  return { evolution, loading, error, refetch: fetchEvolution };
}

export function useCheckinsByFillDate(startDate: string, endDate: string) {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckins = async () => {
    if (!startDate || !endDate) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await checkinService.getByFillDate(startDate, endDate);
      setCheckins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar checkins por data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, [startDate, endDate]);

  return { checkins, loading, error, refetch: fetchCheckins };
}

export function useFilledTodayCheckins() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checkinService.getFilledToday();
      setCheckins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar checkins de hoje');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, []);

  return { checkins, loading, error, refetch: fetchCheckins };
}

export function useFilledLastWeekCheckins() {
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCheckins = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await checkinService.getFilledLastWeek();
      setCheckins(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar checkins da semana');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckins();
  }, []);

  return { checkins, loading, error, refetch: fetchCheckins };
}
