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
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { ResetPasswordConfirm } from './pages/ResetPasswordConfirm';
import { EmailConfirm } from './pages/EmailConfirm';
import { MedicalDisclaimer } from './components/MedicalDisclaimer';

function App() {
  const [disclaimerAccepted, setDisclaimerAccepted] = useState<boolean>(false);
  const [disclaimerRejected, setDisclaimerRejected] = useState<boolean>(false);

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

  // If disclaimer rejected (user is pregnant or declined terms), show exclusion screen
  if (disclaimerRejected) {
    return (
      <div className="min-h-screen bg-burgundy flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-burgundy mb-4">Access Denied</h1>
          <p className="text-charcoal mb-6">
            You cannot use this application at this time.
          </p>
          <p className="text-sm text-gray-600 mb-4">
            If you believe this is an error or your circumstances have changed, please refresh the page
            to start again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-burgundy text-cream px-6 py-2 rounded hover:bg-burgundy/90"
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
        <Route path="/generate" element={
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
