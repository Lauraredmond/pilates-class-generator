import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Home } from './pages/Home';
import { Classes } from './pages/Classes';
import { FounderStory } from './pages/FounderStory';
import { ClassBuilder } from './pages/ClassBuilder';
import { Analytics } from './pages/Analytics';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';
import { BetaFeedback } from './pages/BetaFeedback';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { ResetPasswordConfirm } from './pages/ResetPasswordConfirm';
import { EmailConfirm } from './pages/EmailConfirm';
import { MedicalDisclaimer } from './components/MedicalDisclaimer';
// Legal policy pages (public access)
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { BetaAgreement } from './pages/BetaAgreement';
import { SecurityDisclosure } from './pages/SecurityDisclosure';
import { DataDuringBeta } from './pages/DataDuringBeta';
import { HealthSafety } from './pages/HealthSafety';
// PWA version management
import { checkAppVersion, logPWAStatus } from './utils/pwaVersion';

function App() {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(false);
  const [disclaimerRejected, setDisclaimerRejected] = useState<boolean>(false);

  // PWA Version Check: Bust cache on app updates (iOS "Add to Home Screen" fix)
  useEffect(() => {
    // Check if app version changed → clear localStorage & reload
    // This fixes the intermittent bug where modal doesn't appear on PWA
    checkAppVersion();

    // Log PWA status for debugging
    logPWAStatus();
  }, []);

  // Check localStorage for previous disclaimer acceptance
  useEffect(() => {
    const accepted = localStorage.getItem('medical_disclaimer_accepted');
    const acceptedDate = localStorage.getItem('medical_disclaimer_accepted_date');

    if (accepted === 'true' && acceptedDate) {
      // Check if acceptance is still valid (within 30 days)
      const daysSinceAcceptance = (Date.now() - parseInt(acceptedDate)) / (1000 * 60 * 60 * 24);

      if (daysSinceAcceptance < 30) {
        setDisclaimerAccepted(true);
      } else {
        // Expired - clear and require re-acceptance
        localStorage.removeItem('medical_disclaimer_accepted');
        localStorage.removeItem('medical_disclaimer_accepted_date');
      }
    }
  }, []);

  const handleDisclaimerAccept = () => {
    // Store disclaimer acceptance
    localStorage.setItem('medical_disclaimer_accepted', 'true');
    localStorage.setItem('medical_disclaimer_accepted_date', Date.now().toString());

    // TODO: Also send to backend API to update users.medical_disclaimer_accepted
    // await api.post('/api/users/accept-disclaimer');

    setDisclaimerAccepted(true);
  };

  const handleDisclaimerReject = () => {
    setDisclaimerRejected(true);

    // Clear any previous acceptance
    localStorage.removeItem('medical_disclaimer_accepted');
    localStorage.removeItem('medical_disclaimer_accepted_date');
  };

  // If disclaimer rejected (user is pregnant, in early postnatal period, or declined terms), show exclusion screen
  if (disclaimerRejected) {
    return (
      <div className="min-h-screen bg-burgundy flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-burgundy mb-4">Thank You</h1>
          <p className="text-charcoal mb-4 text-left">
            Based on your response, we recommend <strong>consulting with your GP or healthcare provider</strong> before practising Pilates during pregnancy or early postnatal recovery.
          </p>
          <p className="text-charcoal mb-6 text-left">
            Your safety and wellbeing are our top priority. A qualified healthcare professional can provide personalised guidance on the safest way to practise Pilates during this important time.
          </p>
          <p className="text-sm text-gray-600 mb-4 text-left">
            If your circumstances have changed, please refresh the page to update your information.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-burgundy text-cream px-6 py-3 rounded hover:bg-burgundy/90 w-full"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // If disclaimer not accepted yet, show disclaimer screen
  if (!disclaimerAccepted) {
    return (
      <MedicalDisclaimer
        onAccept={handleDisclaimerAccept}
        onReject={handleDisclaimerReject}
      />
    );
  }

  // Disclaimer accepted - show normal app
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes (no layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password-confirm" element={<ResetPasswordConfirm />} />
        <Route path="/auth/confirm" element={<EmailConfirm />} />

        {/* Legal policy pages (public access) */}
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/beta-agreement" element={<BetaAgreement />} />
        <Route path="/security" element={<SecurityDisclosure />} />
        <Route path="/data-during-beta" element={<DataDuringBeta />} />
        <Route path="/safety" element={<HealthSafety />} />

        {/* Protected routes (with layout) */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/classes" element={
          <ProtectedRoute>
            <Layout>
              <Classes />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/founder-story" element={
          <ProtectedRoute>
            <Layout>
              <FounderStory />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/class-builder" element={
          <ProtectedRoute>
            <Layout>
              <ClassBuilder />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/analytics" element={
          <ProtectedRoute>
            <Layout>
              <Analytics />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/beta-feedback" element={
          <ProtectedRoute>
            <Layout>
              <BetaFeedback />
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
