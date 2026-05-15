import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  generateImage,
  type GenerationFormValues,
  type GenerationResultRecord,
  type StudioApiError,
} from "../features/imageStudio/api";
import { GenerationForm } from "../features/imageStudio/components/GenerationForm";
import { GenerationResult } from "../features/imageStudio/components/GenerationResult";
import { StudioShell } from "../features/imageStudio/components/StudioShell";
import { UpgradeModal } from "../features/imageStudio/components/UpgradeModal";
import { useProfile } from "../features/imageStudio/hooks/useProfile";

export function StudioPage() {
  const { user, signOut } = useAuth();
  const {
    profile,
    setProfile,
    loading: profileLoading,
    error: profileError,
    reload: reloadProfile,
  } = useProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpgradeOpen, setUpgradeOpen] = useState(false);
  const [result, setResult] = useState<GenerationResultRecord | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isProfileMissing = !profileLoading && !profile && profileError?.code === "PROFILE_NOT_READY";
  const isProfileUnavailable = !profileLoading && !profile && Boolean(profileError) && !isProfileMissing;

  const profileStatus = isProfileMissing ? (
    <div className="image-note">
      <strong>Finishing your studio setup</strong>
      <span>
        Your account is authenticated, but the studio profile record is not ready yet. Reload to
        check again, or sign out and back in if the issue persists.
      </span>
      <div className="image-hero__actions" style={{ marginTop: "8px" }}>
        <button className="image-button image-button--secondary" onClick={() => void reloadProfile()} type="button">
          Reload profile
        </button>
      </div>
    </div>
  ) : isProfileUnavailable ? (
    <div className="image-alert image-alert--error">
      {profileError?.message ?? "We could not load your studio profile right now."}
    </div>
  ) : null;

  const handleSubmit = async (values: GenerationFormValues) => {
    if (isSubmitting || profileLoading) {
      return;
    }

    if (!profile) {
      setErrorMessage(profileError?.message ?? "Unable to load your profile right now.");
      return;
    }

    if ((profile?.credits ?? 0) < 1) {
      setUpgradeOpen(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const nextResult = await generateImage(values);
      setResult(nextResult);
      setProfile((current) =>
        current
          ? {
              ...current,
              credits: nextResult.creditsRemaining,
            }
          : current,
      );
    } catch (submitError) {
      const studioError = submitError as StudioApiError;

      if (studioError.code === "INSUFFICIENT_CREDITS") {
        setUpgradeOpen(true);
      }

      setErrorMessage(studioError.message || "Unable to generate an image right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <StudioShell
        credits={profile?.credits}
        creditsLoading={profileLoading}
        email={profile?.email ?? user?.email ?? null}
        onSignOut={signOut}
        profileStatus={profileStatus}
      >
        {isProfileMissing || isProfileUnavailable ? (
          <>
            <section className="image-panel">
              <div className="image-panel__header">
                <span>Studio access check</span>
                <span>{isProfileMissing ? "Recoverable" : "Needs retry"}</span>
              </div>
              <div className="image-tag-grid">
                <div className="image-tag-card">
                  <strong>{isProfileMissing ? "Profile record pending" : "Profile load failed"}</strong>
                  <p>
                    {isProfileMissing
                      ? "Your sign-in worked, but your studio profile has not shown up yet. This can happen during setup drift or a delayed backfill."
                      : "We could not read the studio profile needed to check credits and personalize the workspace."}
                  </p>
                </div>
                <div className="image-hero__actions" style={{ marginTop: 0 }}>
                  <button
                    className="image-button image-button--primary"
                    onClick={() => void reloadProfile()}
                    type="button"
                  >
                    Reload profile
                  </button>
                  <button
                    className="image-button image-button--secondary"
                    onClick={() => void signOut()}
                    type="button"
                  >
                    Sign out and try again
                  </button>
                </div>
              </div>
            </section>
            <GenerationResult
              errorMessage={null}
              isSubmitting={false}
              result={result}
            />
          </>
        ) : (
          <>
            <GenerationForm isSubmitting={isSubmitting || profileLoading} onSubmit={handleSubmit} />
            <GenerationResult
              errorMessage={errorMessage ?? profileError?.message ?? null}
              isSubmitting={isSubmitting}
              result={result}
            />
          </>
        )}
      </StudioShell>

      <UpgradeModal onClose={() => setUpgradeOpen(false)} open={isUpgradeOpen} />
    </>
  );
}
