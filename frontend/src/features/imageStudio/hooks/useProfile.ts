import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { fetchMyProfile, type ProfileRecord, type StudioApiError } from "../api";

interface UseProfileResult {
  profile: ProfileRecord | null;
  setProfile: Dispatch<SetStateAction<ProfileRecord | null>>;
  loading: boolean;
  error: StudioApiError | null;
  reload: () => Promise<void>;
}

export function useProfile(): UseProfileResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState<StudioApiError | null>(null);

  const loadProfile = async () => {
    if (!user) {
      setProfile(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nextProfile = await fetchMyProfile();
      setProfile(nextProfile);
      setError(null);
    } catch (loadError) {
      setProfile(null);
      setError(loadError as StudioApiError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const syncProfile = async () => {
      if (!user) {
        if (!active) {
          return;
        }

        setProfile(null);
        setError(null);
        setLoading(false);
        return;
      }

      if (active) {
        setLoading(true);
      }

      try {
        const nextProfile = await fetchMyProfile();
        if (!active) {
          return;
        }

        setProfile(nextProfile);
        setError(null);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setProfile(null);
        setError(loadError as StudioApiError);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void syncProfile();

    return () => {
      active = false;
    };
  }, [user]);

  return {
    profile,
    setProfile,
    loading,
    error,
    reload: loadProfile,
  };
}
