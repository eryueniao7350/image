import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./i18n/I18nContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SkillDetailPage } from "./pages/SkillDetailPage";
import { ComparePage } from "./pages/ComparePage";
import { CompareBar } from "./components/CompareBar";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { CategoryPage } from "./pages/CategoryPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { AnalyzerPage } from "./pages/AnalyzerPage";
import { DraftViewerPage } from "./pages/DraftViewerPage";
import { ProtectedRoute } from "./features/imageStudio/components/ProtectedRoute";
import { IMAGE_ROUTE_PATHS } from "./features/imageStudio/constants";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { Home } from "./pages/Home";
import { ImageHomePage } from "./pages/ImageHomePage";
import { LoginPage } from "./pages/LoginPage";
import { PricingPage } from "./pages/PricingPage";
import { StudioPage } from "./pages/StudioPage";

function HistoryPage() {
  return (
    <main className="image-shell image-shell--narrow">
      <section className="image-panel image-panel--stacked">
        <span className="image-eyebrow">History</span>
        <h1 className="image-title">HistoryPage bridge</h1>
        <p className="image-muted">
          The protected history route is mounted and ready for the dedicated page in a later task.
        </p>
        <div className="image-hero__actions">
          <Link className="image-button image-button--primary" to={IMAGE_ROUTE_PATHS.studio}>
            Return to studio bridge
          </Link>
          <Link className="image-button image-button--secondary" to={IMAGE_ROUTE_PATHS.pricing}>
            Review pricing
          </Link>
          <Link className="image-button image-button--secondary" to={IMAGE_ROUTE_PATHS.hub}>
            Open legacy hub
          </Link>
        </div>
      </section>
    </main>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
        <I18nProvider>
          <BrowserRouter>
            <Routes>
              <Route path={IMAGE_ROUTE_PATHS.home} element={<ImageHomePage />} />
              <Route path={IMAGE_ROUTE_PATHS.hub} element={<Home />} />
              <Route path={IMAGE_ROUTE_PATHS.login} element={<LoginPage />} />
              <Route path={IMAGE_ROUTE_PATHS.callback} element={<AuthCallbackPage />} />
              <Route
                path={IMAGE_ROUTE_PATHS.studio}
                element={
                  <ProtectedRoute>
                    <StudioPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path={IMAGE_ROUTE_PATHS.history}
                element={
                  <ProtectedRoute>
                    <HistoryPage />
                  </ProtectedRoute>
                }
              />
              <Route path={IMAGE_ROUTE_PATHS.pricing} element={<PricingPage />} />
              <Route path="/skill/:id" element={<SkillDetailPage />} />
              <Route path="/skill/:id/" element={<SkillDetailPage />} />
              <Route path="/skill/:owner/:repo" element={<SkillDetailPage />} />
              <Route path="/skill/:owner/:repo/" element={<SkillDetailPage />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/category/:slug/" element={<CategoryPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/compare/" element={<ComparePage />} />
              <Route path="/analyzer" element={<AnalyzerPage />} />
              <Route path="/analyzer/" element={<AnalyzerPage />} />
              <Route path="/draft/:slug" element={<DraftViewerPage />} />
              <Route path="/draft/:slug/" element={<DraftViewerPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/verify-email/" element={<VerifyEmailPage />} />
              <Route path="/admin/*" element={<AdminLayout />} />
              <Route path="*" element={<Navigate to={IMAGE_ROUTE_PATHS.hub} replace />} />
            </Routes>
            <CompareBar />
          </BrowserRouter>
        </I18nProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
