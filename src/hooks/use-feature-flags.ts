import useSWR from 'swr';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Erro ao buscar Feature Flags');
  }
  return res.json();
};

/**
 * Hook genérico para buscar todos os Feature Flags do usuário autenticado
 */
export function useFeatureFlags() {
  const { data, error, isLoading, mutate } = useSWR<{
    success: boolean;
    flags: Record<string, boolean>;
  }>('/api/feature-flags', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });

  return {
    flags: data?.flags || {},
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Hook para verificar acesso a uma feature específica
 */
export function useFeatureAccess(featureName: string) {
  const { flags, isLoading } = useFeatureFlags();

  return {
    hasAccess: flags[featureName] === true,
    isLoading,
  };
}

/**
 * Hook específico para Google Calendar
 */
export function useGoogleCalendarAccess() {
  return useFeatureAccess('googleCalendar');
}

