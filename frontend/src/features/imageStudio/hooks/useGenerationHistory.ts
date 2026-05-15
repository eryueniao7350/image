import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import {
  fetchGenerationHistory,
  type GenerationHistoryRecord,
  type StudioApiError,
} from "../api";

interface UseGenerationHistoryResult {
  history: GenerationHistoryRecord[];
  loading: boolean;
  error: StudioApiError | null;
  reload: () => Promise<void>;
}

export function useGenerationHistory(): UseGenerationHistoryResult {
  const { user } = useAuth();
  const [history, setHistory] = useState<GenerationHistoryRecord[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<StudioApiError | null>(null);
  const requestIdRef = useRef(0);
  const latestAppliedRequestIdRef = useRef(0);

  const loadHistory = useCallback(async () => {
    if (!user) {
      requestIdRef.current += 1;
      latestAppliedRequestIdRef.current = requestIdRef.current;
      setHistory([]);
      setError(null);
      setLoading(false);
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setLoading(true);

    try {
      const nextHistory = await fetchGenerationHistory();
      if (requestId < latestAppliedRequestIdRef.current) {
        return;
      }

      latestAppliedRequestIdRef.current = requestId;
      setHistory(nextHistory);
      setError(null);
    } catch (loadError) {
      if (requestId < latestAppliedRequestIdRef.current) {
        return;
      }

      setError(loadError as StudioApiError);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  useEffect(() => {
    let active = true;

    const syncHistory = async () => {
      if (!user) {
        if (!active) {
          return;
        }

        requestIdRef.current += 1;
        latestAppliedRequestIdRef.current = requestIdRef.current;
        setHistory([]);
        setError(null);
        setLoading(false);
        return;
      }

      await loadHistory();
    };

    void syncHistory();

    return () => {
      active = false;
    };
  }, [user, loadHistory]);

  return {
    history,
    loading,
    error,
    reload: loadHistory,
  };
}
