import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import logoAnyon from "@/assets/logo-anyon.png";
import { useAuthStore } from "@/stores/authStore";
import { LoginPage } from "@/components/LoginPage";
import { SignupPage } from "@/components/SignupPage";
import { VerifyEmailPage } from "@/components/VerifyEmailPage";
import { ForgotPasswordPage } from "@/components/ForgotPasswordPage";
import { ResetPasswordPage } from "@/components/ResetPasswordPage";
import { api as _api } from "@/lib/api";
import { initializeWebMode } from "@/lib/apiAdapter";
import { OutputCacheProvider } from "@/lib/outputCache";
import { TabProvider } from "@/contexts/TabContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { CustomTitlebar } from "@/components/CustomTitlebar";
import { AppLayout } from "@/components/AppLayout";
import { NFOCredits } from "@/components/NFOCredits";
import { Toast, ToastContainer } from "@/components/ui/toast";
import { UpdateNotification } from "@/components/UpdateNotification";
import { AnalyticsConsentModal, hasAnalyticsConsent } from "@/components/AnalyticsConsentModal";
import { OnboardingModal, hasCompletedOnboarding } from "@/components/help/OnboardingModal";
import { useAppLifecycle } from "@/hooks";

/**
 * AppContent component - Contains the main app logic with 3-panel layout
 */
function AppContent() {
  const [showNFO, setShowNFO] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Initialize analytics lifecycle tracking
  useAppLifecycle();

  // Initialize web mode compatibility on mount
  useEffect(() => {
    initializeWebMode();
  }, []);

  // Listen for info/about click from sidebar
  useEffect(() => {
    const handleShowNFO = () => {
      setShowNFO(true);
    };

    window.addEventListener('show-nfo', handleShowNFO);
    return () => {
      window.removeEventListener('show-nfo', handleShowNFO);
    };
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Custom Titlebar - simplified, just traffic lights */}
      <CustomTitlebar />

      {/* Main Content - 3 Panel Layout (Sidebar | Chat | Preview) */}
      <div className="flex-1 overflow-hidden">
        <AppLayout />
      </div>

      {/* NFO Credits Modal */}
      {showNFO && <NFOCredits onClose={() => setShowNFO(false)} />}

      {/* Toast Container */}
      <ToastContainer>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}
      </ToastContainer>
    </div>
  );
}

/**
 * Main App component - Wraps the app with providers and auth gate
 */
function App() {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    let cancelled = false;

    const verifyAuth = async () => {
      try {
        const result = await checkAuth();
        if (!cancelled) {
          console.log('Auth check result:', result);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Auth check failed:', error);
        }
      } finally {
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    verifyAuth();

    return () => {
      cancelled = true;
    };
  }, [checkAuth]);

  // Check analytics consent and onboarding after authentication
  useEffect(() => {
    if (isAuthenticated && !isChecking) {
      // Show consent modal first if user hasn't consented yet
      if (!hasAnalyticsConsent()) {
        setShowConsentModal(true);
      } else if (!hasCompletedOnboarding()) {
        // If already consented, check if onboarding is needed
        setShowOnboardingModal(true);
      }
    }
  }, [isAuthenticated, isChecking]);

  // Handle consent modal accept - then show onboarding if needed
  const handleConsentAccept = () => {
    setShowConsentModal(false);
    if (!hasCompletedOnboarding()) {
      setShowOnboardingModal(true);
    }
  };

  // Show loading while checking auth
  if (isChecking) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <img src={logoAnyon} alt="Anyon Logo" className="w-16 h-16 logo-invert" />
        </div>
      </div>
    );
  }

  // Show auth pages if not authenticated
  if (!isAuthenticated) {
    return (
      <HashRouter>
        <ThemeProvider>
          <div className="h-screen overflow-hidden">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </ThemeProvider>
      </HashRouter>
    );
  }

  // Show main app with new 3-panel layout
  return (
    <HashRouter>
      <ThemeProvider>
        <OutputCacheProvider>
          <TabProvider>
            <AppContent />
            <UpdateNotification />
            <AnalyticsConsentModal
              open={showConsentModal}
              onAccept={handleConsentAccept}
            />
            <OnboardingModal
              open={showOnboardingModal}
              onComplete={() => setShowOnboardingModal(false)}
            />
          </TabProvider>
        </OutputCacheProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
