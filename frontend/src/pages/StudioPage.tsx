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
import { useBillingActions } from "../features/imageStudio/hooks/useBillingActions";
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
  const {
    errorMessage: billingErrorMessage,
    clearError: clearBillingError,
    isCheckingOut,
    isOpeningPortal,
    openCustomerPortal,
    startCheckout,
  } = useBillingActions();

  const isProfileMissing = !profileLoading && !profile && profileError?.code === "PROFILE_NOT_READY";
  const isProfileUnavailable = !profileLoading && !profile && Boolean(profileError) && !isProfileMissing;

  const profileStatus = isProfileMissing ? (
    <div className="image-note">
      <strong>正在完成你的工作台初始化</strong>
      <span>
        你的账号已经完成认证，但工作台资料记录还没准备好。你可以先刷新重试；如果持续异常，再退出后重新登录。
      </span>
      <div className="image-hero__actions" style={{ marginTop: "8px" }}>
        <button className="image-button image-button--secondary" onClick={() => void reloadProfile()} type="button">
          重新加载资料
        </button>
      </div>
    </div>
  ) : isProfileUnavailable ? (
    <div className="image-alert image-alert--error">
      {profileError?.message ?? "当前无法读取你的工作台资料。"}
    </div>
  ) : null;

  const handleSubmit = async (values: GenerationFormValues) => {
    if (isSubmitting || profileLoading) {
      return;
    }

    if (!profile) {
      setErrorMessage(profileError?.message ?? "当前无法读取你的资料。");
      return;
    }

    if ((profile?.credits ?? 0) < 1) {
      clearBillingError();
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
        clearBillingError();
        setUpgradeOpen(true);
      }

      setErrorMessage(studioError.message || "当前无法生成图片。");
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
        billingStatus={billingErrorMessage ? <div className="image-alert image-alert--error">{billingErrorMessage}</div> : null}
        isCheckingOut={isCheckingOut}
        isOpeningPortal={isOpeningPortal}
        onManageSubscription={openCustomerPortal}
        onSignOut={signOut}
        onUpgrade={startCheckout}
        profileStatus={profileStatus}
      >
        {isProfileMissing || isProfileUnavailable ? (
          <>
            <section className="image-panel">
              <div className="image-panel__header">
                <span>工作台访问检查</span>
                <span>{isProfileMissing ? "可恢复" : "需要重试"}</span>
              </div>
              <div className="image-tag-grid">
                <div className="image-tag-card">
                  <strong>{isProfileMissing ? "资料记录尚未就绪" : "资料加载失败"}</strong>
                  <p>
                    {isProfileMissing
                      ? "登录已经成功，但你的工作台资料还没有生成完成。这通常是初始化延迟或补录还没跑完。"
                      : "系统暂时无法读取用于校验积分和个性化工作台的资料记录。"}
                  </p>
                </div>
                <div className="image-hero__actions" style={{ marginTop: 0 }}>
                  <button
                    className="image-button image-button--primary"
                    onClick={() => void reloadProfile()}
                    type="button"
                  >
                    重新加载资料
                  </button>
                  <button
                    className="image-button image-button--secondary"
                    onClick={() => void signOut()}
                    type="button"
                  >
                    退出后重试
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

      <UpgradeModal
        errorMessage={billingErrorMessage}
        isSubmitting={isCheckingOut}
        onClose={() => {
          clearBillingError();
          setUpgradeOpen(false);
        }}
        onUpgrade={startCheckout}
        open={isUpgradeOpen}
      />
    </>
  );
}
