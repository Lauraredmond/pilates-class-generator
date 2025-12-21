/**
 * Health & Safety Modal
 * Shown before user's first class playback
 * Requires acceptance of health and safety disclaimer
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

interface HealthSafetyModalProps {
  onAccept: () => void;
  onDecline: () => void;
}

export function HealthSafetyModal({ onAccept, onDecline }: HealthSafetyModalProps) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-cream rounded-lg shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-burgundy mb-2 text-center">Health & Safety Agreement</h1>
          <p className="text-charcoal/70 text-center">
            Please read and accept before starting your first class
          </p>
        </div>

        {/* Content */}
        <div className="space-y-4 text-charcoal mb-6">
          {/* Warning Banner */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <h2 className="font-semibold text-yellow-900 mb-2 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Important Safety Notice
            </h2>
            <p className="text-sm text-yellow-900">
              Exercise involves inherent risks. By using Bassline Pilates, you acknowledge these risks and agree to exercise at your own discretion.
            </p>
          </div>

          {/* Pregnancy & Early Postnatal Guidance */}
          <div className="bg-amber-50 p-5 rounded border-2 border-amber-400">
            <h3 className="font-semibold text-amber-900 mb-3 text-lg flex items-center gap-2">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Important: Pregnancy & Early Postnatal Guidance
            </h3>
            <div className="space-y-3 text-sm text-amber-900">
              <p>
                This application is designed for general Pilates practice and may not be appropriate during pregnancy or the early postnatal period (first 12 weeks after giving birth).
              </p>
              <p>
                <strong>During pregnancy:</strong> Many Pilates movements require modifications during pregnancy. These movements may involve lying on your back, deep abdominal work, or prone positions that may not be suitable. We recommend seeking guidance from a qualified prenatal Pilates instructor who can provide appropriate modifications for your stage of pregnancy.
              </p>
              <p>
                <strong>Early postnatal (0-12 weeks):</strong> Your body needs time to heal after giving birth. We recommend waiting until at least 12 weeks postpartum and completing your postnatal check with your doctor or midwife before beginning Pilates practice.
              </p>
              <p className="bg-amber-100 p-3 rounded border border-amber-300">
                If you are pregnant or in the early postnatal period, please consult your healthcare provider before using this application. They can advise you on when it's appropriate to begin and whether you need specialized prenatal or postnatal instruction.
              </p>
            </div>
          </div>

          {/* Postnatal Abdominal Separation Guidance */}
          <div className="bg-amber-50 p-5 rounded border-2 border-amber-400">
            <h3 className="font-semibold text-amber-900 mb-3 text-lg flex items-center gap-2">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Important: Postnatal Abdominal Separation (Diastasis Recti)
            </h3>
            <div className="space-y-3 text-sm text-amber-900">
              <p>
                If you have postnatal abdominal separation (diastasis recti), we recommend consulting your GP or a women's health physiotherapist before using this application.
              </p>
              <p>
                Many Pilates movements require strong abdominal wall function, and your healthcare provider can help you determine:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Whether general Pilates practice is appropriate for you at this time</li>
                <li>Which movements to modify or avoid</li>
                <li>When it's safe to progress your practice</li>
                <li>If you would benefit from specialized postnatal rehabilitation first</li>
              </ul>
              <p className="bg-amber-100 p-3 rounded border border-amber-300">
                We recommend consulting your GP or a women's health physiotherapist for proper assessment and personalized postnatal exercise guidance. They can help ensure your Pilates practice supports your recovery.
              </p>
            </div>
          </div>

          {/* Key Points */}
          <div className="bg-burgundy/5 p-4 rounded border border-burgundy/20">
            <h3 className="font-semibold text-burgundy mb-3">You acknowledge that:</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-burgundy flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>You have consulted a doctor if you have any medical conditions, are pregnant, or in early postnatal period</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-burgundy flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>This app is for exercise support only and does not replace professional instruction</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-burgundy flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>You are responsible for exercising within your limits and modifying movements as needed</span>
              </li>
              <li className="flex items-start gap-2">
                <svg className="w-5 h-5 text-burgundy flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Bassline Pilates is not liable for injuries sustained while using the application</span>
              </li>
            </ul>
          </div>

          {/* Listen to Your Body */}
          <div className="bg-amber-50 p-4 rounded border-2 border-amber-300">
            <h3 className="font-semibold text-amber-900 mb-2">Please stop and rest if you experience:</h3>
            <ul className="grid grid-cols-2 gap-2 text-sm text-amber-900">
              <li className="flex items-center gap-1">
                <span className="text-amber-500">•</span> Pain or discomfort
              </li>
              <li className="flex items-center gap-1">
                <span className="text-amber-500">•</span> Dizziness
              </li>
              <li className="flex items-center gap-1">
                <span className="text-amber-500">•</span> Chest pain
              </li>
              <li className="flex items-center gap-1">
                <span className="text-amber-500">•</span> Shortness of breath
              </li>
              <li className="flex items-center gap-1">
                <span className="text-amber-500">•</span> Nausea
              </li>
              <li className="flex items-center gap-1">
                <span className="text-amber-500">•</span> Joint instability
              </li>
            </ul>
          </div>

          {/* Full Policy Link */}
          <p className="text-sm text-center">
            <Link to="/safety" target="_blank" className="text-burgundy hover:underline font-medium">
              Read the complete Health & Safety Disclaimer →
            </Link>
          </p>
        </div>

        {/* Acceptance Checkbox */}
        <label className="flex items-start gap-3 cursor-pointer bg-burgundy/5 p-4 rounded border border-burgundy/20 mb-6">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1 w-6 h-6 text-burgundy focus:ring-burgundy border-charcoal/30 rounded"
          />
          <span className="text-sm text-charcoal">
            <strong>I have read and understand the health and safety information above.</strong> I confirm that I have consulted with a healthcare professional if necessary, and I exercise at my own risk.
          </span>
        </label>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onDecline}
            className="flex-1 bg-charcoal/10 text-charcoal py-3 px-6 rounded font-semibold hover:bg-charcoal/20 transition-smooth"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={!accepted}
            className="flex-1 bg-burgundy text-cream py-3 px-6 rounded font-semibold hover:bg-burgundy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
