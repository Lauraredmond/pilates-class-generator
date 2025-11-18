/**
 * Medical Disclaimer Component
 * CRITICAL SAFETY: Hard stop for pregnant users
 * Must be accepted before ANY app usage
 */

import { useState } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { Card, CardHeader, CardBody, CardTitle } from './ui/Card';
import { Button } from './ui/Button';

interface MedicalDisclaimerProps {
  onAccept: () => void;
  onReject: () => void;
}

export function MedicalDisclaimer({ onAccept, onReject }: MedicalDisclaimerProps) {
  const [isPregnant, setIsPregnant] = useState<boolean | null>(null);
  const [hasReadDisclaimer, setHasReadDisclaimer] = useState(false);
  const [acceptsTerms, setAcceptsTerms] = useState(false);

  const handlePregnancyResponse = (pregnant: boolean) => {
    setIsPregnant(pregnant);

    // If pregnant, immediately reject and show exclusion message
    if (pregnant) {
      setTimeout(() => {
        onReject();
      }, 100);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="border-b border-burgundy/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <CardTitle className="text-2xl">Medical Safety Disclaimer</CardTitle>
          </div>
        </CardHeader>

        <CardBody className="p-6 space-y-6">
          {/* Pregnancy Exclusion - FIRST and MANDATORY */}
          <div className="bg-red-50 border-2 border-red-600 rounded-lg p-6">
            <h3 className="text-lg font-bold text-red-900 mb-3 flex items-center gap-2">
              <XCircle className="w-6 h-6" />
              PREGNANCY EXCLUSION - MANDATORY
            </h3>

            <p className="text-red-900 font-semibold mb-4">
              Are you currently pregnant or could you be pregnant?
            </p>

            {isPregnant === null && (
              <div className="flex gap-4">
                <Button
                  onClick={() => handlePregnancyResponse(true)}
                  className="bg-red-600 hover:bg-red-700 text-white flex-1"
                >
                  Yes, I am pregnant
                </Button>
                <Button
                  onClick={() => handlePregnancyResponse(false)}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1"
                >
                  No, I am not pregnant
                </Button>
              </div>
            )}

            {isPregnant === true && (
              <div className="bg-white border-2 border-red-700 rounded p-4 mt-4">
                <h4 className="font-bold text-red-900 mb-2">
                  APP ACCESS DENIED
                </h4>
                <p className="text-red-800 mb-3">
                  This application <strong>CANNOT</strong> be used during pregnancy.
                </p>
                <p className="text-red-800 mb-3">
                  Pilates movements during pregnancy require professional, in-person supervision
                  from a qualified prenatal Pilates instructor who can assess your specific condition
                  and provide appropriate modifications.
                </p>
                <p className="text-red-800 font-semibold">
                  Using this app during pregnancy could result in serious harm to you or your baby.
                </p>
                <Button
                  onClick={onReject}
                  className="mt-4 w-full bg-red-700 hover:bg-red-800 text-white"
                >
                  I Understand - Exit App
                </Button>
              </div>
            )}

            {isPregnant === false && (
              <div className="bg-green-50 border border-green-600 rounded p-3 mt-4">
                <p className="text-green-900 text-sm">
                  ✓ Pregnancy exclusion confirmed. You may proceed with the disclaimer.
                </p>
              </div>
            )}
          </div>

          {/* Rest of disclaimer - only show if NOT pregnant */}
          {isPregnant === false && (
            <>
              <div className="bg-cream/50 border border-burgundy/30 rounded-lg p-4">
                <h3 className="font-bold text-burgundy mb-3">Medical Disclaimer</h3>
                <div className="text-sm space-y-2 text-charcoal max-h-60 overflow-y-auto pr-2">
                  <p>
                    <strong>IMPORTANT: READ CAREFULLY</strong>
                  </p>
                  <p>
                    This Pilates class planning application is designed for use by certified Pilates
                    instructors and experienced practitioners ONLY. It is not a substitute for
                    professional medical advice, diagnosis, or treatment.
                  </p>
                  <p className="font-semibold text-red-700">
                    DO NOT USE THIS APP IF:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>You are pregnant or could be pregnant (ABSOLUTE EXCLUSION)</li>
                    <li>You have any untreated injuries or medical conditions</li>
                    <li>You have not consulted with a physician before beginning exercise</li>
                    <li>You are not a certified Pilates instructor or experienced practitioner</li>
                  </ul>
                  <p className="font-semibold mt-3">
                    By using this application, you acknowledge:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>
                      You are NOT pregnant and will immediately discontinue use if you become pregnant
                    </li>
                    <li>
                      You have consulted with a physician and have clearance for Pilates exercise
                    </li>
                    <li>
                      You understand that improper execution of Pilates movements can cause injury
                    </li>
                    <li>
                      You are fully responsible for your safety and the safety of any students
                    </li>
                    <li>
                      The app developers assume NO LIABILITY for injuries or medical complications
                    </li>
                  </ul>
                  <p className="mt-3 font-semibold text-red-700">
                    If you experience pain, dizziness, or discomfort during any movement, STOP
                    IMMEDIATELY and consult a medical professional.
                  </p>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasReadDisclaimer}
                    onChange={(e) => setHasReadDisclaimer(e.target.checked)}
                    className="mt-1 w-5 h-5 text-burgundy accent-burgundy"
                  />
                  <span className="text-sm text-cream">
                    I have read and understood the entire medical disclaimer above
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptsTerms}
                    onChange={(e) => setAcceptsTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 text-burgundy accent-burgundy"
                  />
                  <span className="text-sm text-cream font-semibold">
                    I confirm that I am NOT pregnant and accept all risks and liability associated
                    with using this application
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-4 border-t border-burgundy/20">
                <Button
                  onClick={onReject}
                  variant="secondary"
                  className="flex-1"
                >
                  Decline - Exit App
                </Button>
                <Button
                  onClick={onAccept}
                  disabled={!hasReadDisclaimer || !acceptsTerms}
                  className="flex-1 bg-burgundy hover:bg-burgundy/90 text-cream disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Accept - Continue to App
                </Button>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
