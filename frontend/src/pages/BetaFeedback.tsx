import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function BetaFeedback() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
    country: 'Ireland',
    feedbackType: 'general',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(
        `${API_BASE_URL}/api/feedback/submit`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setSubmitSuccess(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: user?.full_name || '',
          email: user?.email || '',
          country: 'Ireland',
          feedbackType: 'general',
          subject: '',
          message: ''
        });
        setSubmitSuccess(false);
      }, 3000);
    } catch (error: any) {
      setSubmitError(error.response?.data?.detail || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <MessageSquare className="w-16 h-16 text-burgundy" />
        </div>
        <h1 className="text-4xl font-bold text-cream mb-3">Beta Tester Feedback & Queries</h1>
        <p className="text-cream/70 text-lg">
          Help us improve Bassline Pilates by sharing your experience, suggestions, or reporting issues
        </p>
      </div>

      {/* Success Message */}
      {submitSuccess && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-6 mb-6 animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
            <div>
              <p className="text-green-400 font-semibold text-lg">Thank you for your feedback!</p>
              <p className="text-cream/70 text-sm mt-1">
                We've received your message and will respond within 24-48 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {submitError && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <p className="text-red-400">{submitError}</p>
          </div>
        </div>
      )}

      {/* Feedback Form */}
      <div className="bg-charcoal rounded-lg border-2 border-cream/10 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-cream mb-2">
              Full Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-burgundy/20 border border-cream/20 rounded text-cream placeholder-cream/40 focus:outline-none focus:ring-2 focus:ring-burgundy"
              placeholder="Your full name"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-cream mb-2">
              Email Address *
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-burgundy/20 border border-cream/20 rounded text-cream placeholder-cream/40 focus:outline-none focus:ring-2 focus:ring-burgundy"
              placeholder="your.email@example.com"
            />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-medium text-cream mb-2">
              Country
            </label>
            <select
              id="country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="w-full px-4 py-3 bg-burgundy/20 border border-cream/20 rounded text-cream focus:outline-none focus:ring-2 focus:ring-burgundy"
            >
              <option value="Ireland">Ireland</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="United States">United States</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="New Zealand">New Zealand</option>
              <option value="Germany">Germany</option>
              <option value="France">France</option>
              <option value="Spain">Spain</option>
              <option value="Italy">Italy</option>
              <option value="Netherlands">Netherlands</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Feedback Type */}
          <div>
            <label htmlFor="feedbackType" className="block text-sm font-medium text-cream mb-2">
              Feedback Type *
            </label>
            <select
              id="feedbackType"
              required
              value={formData.feedbackType}
              onChange={(e) => setFormData({ ...formData, feedbackType: e.target.value })}
              className="w-full px-4 py-3 bg-burgundy/20 border border-cream/20 rounded text-cream focus:outline-none focus:ring-2 focus:ring-burgundy"
            >
              <option value="general">General Feedback</option>
              <option value="bug">Bug Report</option>
              <option value="feature">Feature Request</option>
              <option value="usability">Usability Issue</option>
              <option value="performance">Performance Issue</option>
              <option value="question">Question / Query</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-cream mb-2">
              Subject *
            </label>
            <input
              id="subject"
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full px-4 py-3 bg-burgundy/20 border border-cream/20 rounded text-cream placeholder-cream/40 focus:outline-none focus:ring-2 focus:ring-burgundy"
              placeholder="Brief summary of your feedback"
            />
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-cream mb-2">
              Message *
            </label>
            <textarea
              id="message"
              required
              rows={8}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-4 py-3 bg-burgundy/20 border border-cream/20 rounded text-cream placeholder-cream/40 focus:outline-none focus:ring-2 focus:ring-burgundy resize-y"
              placeholder="Please provide as much detail as possible. For bug reports, include steps to reproduce the issue."
            />
            <p className="text-xs text-cream/60 mt-2">
              For bug reports: Please describe what you were doing, what you expected to happen, and what actually happened.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              disabled={isSubmitting}
              className="flex-1 bg-cream/10 hover:bg-cream/20 text-cream px-6 py-3 rounded-lg font-semibold transition-smooth disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.name || !formData.email || !formData.subject || !formData.message}
              className="flex-1 bg-burgundy hover:bg-burgundy/90 text-cream px-6 py-3 rounded-lg font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Additional Info */}
      <div className="mt-8 bg-burgundy/10 border border-burgundy/30 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-cream mb-3">What happens next?</h2>
        <ul className="space-y-2 text-cream/70 text-sm">
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-burgundy flex-shrink-0 mt-0.5" />
            <span>We'll review your submission shortly, thank you very much for taking the time to help enhance our platform.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-burgundy flex-shrink-0 mt-0.5" />
            <span>For bug reports and questions, we'll follow up directly via email</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="w-5 h-5 text-burgundy flex-shrink-0 mt-0.5" />
            <span>Feature requests are tracked and prioritised for future releases</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
