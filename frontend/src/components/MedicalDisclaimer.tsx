/**
 * Medical Disclaimer Component
 * CRITICAL SAFETY: Hard stop for pregnant and early postnatal users
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
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-2xl w-full my-8 max-h-[90vh] flex flex-col">
        <CardHeader className="border-b border-burgundy/20 flex-shrink-0">
          <div className="flex items-center gap-2 md:gap-3">
            <AlertTriangle className="w-6 h-6 md:w-8 md:h-8 text-red-600" />
            <CardTitle className="text-lg md:text-2xl">Medical Safety Disclaimer</CardTitle>
          </div>
        </CardHeader>

        <CardBody className="p-3 md:p-6 space-y-4 md:space-y-6 overflow-y-auto flex-1">
          {/* Pregnancy Exclusion - FIRST and MANDATORY */}
          <div className="bg-red-50 border-2 border-red-600 rounded-lg p-3 md:p-6">
            <h3 className="text-base md:text-lg font-bold text-red-900 mb-2 md:mb-3 flex items-center gap-2">
              <XCircle className="w-5 h-5 md:w-6 md:h-6" />
              PREGNANCY & POSTNATAL EXCLUSION - MANDATORY
            </h3>

            <p className="text-sm md:text-base text-red-900 font-semibold mb-3 md:mb-4">
              Are you currently pregnant, could you be pregnant, OR have you given birth within the last 12 weeks?
            </p>

            {isPregnant === null && (
              <div className="flex flex-col md:flex-row gap-3 md:gap-4">
                <Button
                  onClick={() => handlePregnancyResponse(true)}
                  className="bg-red-600 hover:bg-red-700 text-white flex-1 text-sm md:text-base py-3"
                >
                  Yes - Pregnant or &lt;12 weeks postnatal
                </Button>
                <Button
                  onClick={() => handlePregnancyResponse(false)}
                  className="bg-green-600 hover:bg-green-700 text-white flex-1 text-sm md:text-base py-3"
                >
                  No - Not pregnant and &gt;12 weeks postnatal
                </Button>
              </div>
            )}

            {isPregnant === true && (
              <div className="bg-white border-2 border-red-700 rounded p-4 mt-4">
                <h4 className="font-bold text-red-900 mb-2">
                  APP ACCESS DENIED
                </h4>
                <p className="text-red-800 mb-3">
                  This application <strong>CANNOT</strong> be used during pregnancy or in the early postnatal period (first 12 weeks after giving birth).
                </p>
                <p className="text-red-800 mb-3">
                  <strong>Pregnancy:</strong> Pilates movements during pregnancy require professional, in-person supervision
                  from a qualified prenatal Pilates instructor who can assess your specific condition
                  and provide appropriate modifications.
                </p>
                <p className="text-red-800 mb-3">
                  <strong>Postnatal (0-12 weeks):</strong> Your body needs time to heal after giving birth. You must wait a minimum of 12 weeks postpartum AND have completed your 12-week postnatal check with your doctor or midwife before using this application. Earlier return to exercise requires specialized postnatal rehabilitation from a women's health physiotherapist.
                </p>
                <p className="text-red-800 font-semibold">
                  Using this app during pregnancy or early postnatal period could result in serious harm, including pelvic floor damage, abdominal separation (diastasis recti), or other complications.
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
                  ✓ Pregnancy and postnatal exclusion confirmed. You may proceed with the disclaimer.
                </p>
              </div>
            )}
          </div>

          {/* Rest of disclaimer - only show if NOT pregnant */}
          {isPregnant === false && (
            <>
              <div className="bg-cream/50 border border-burgundy/30 rounded-lg p-4">
                <h3 className="font-bold text-burgundy mb-3">Medical Disclaimer</h3>
                <div className="text-sm space-y-2 text-charcoal max-h-40 md:max-h-60 overflow-y-auto pr-2">
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
                    <li>You are pregnant, could be pregnant, OR have given birth within the last 12 weeks (ABSOLUTE EXCLUSION)</li>
                    <li>You have any untreated injuries or medical conditions</li>
                    <li>You have not consulted with a physician before beginning exercise</li>
                    <li>You are not a certified Pilates instructor or experienced practitioner</li>
                  </ul>
                  <p className="font-semibold mt-3">
                    By using this application, you acknowledge:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-4">
                    <li>
                      You are NOT pregnant, NOT in early postnatal period (&lt;12 weeks), and will immediately discontinue use if you become pregnant or enter early postnatal period
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
                    I confirm that I am NOT pregnant, NOT in early postnatal period (&lt;12 weeks postpartum), and have completed my 12-week postnatal check if applicable. I accept all risks and liability associated with using this application.
                  </span>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4 pt-4 border-t border-burgundy/20">
                <Button
                  onClick={onReject}
                  variant="secondary"
                  className="flex-1 text-sm md:text-base py-3"
                >
                  Decline - Exit App
                </Button>
                <Button
                  onClick={onAccept}
                  disabled={!hasReadDisclaimer || !acceptsTerms}
                  className="flex-1 bg-burgundy hover:bg-burgundy/90 text-cream disabled:bg-gray-300 disabled:cursor-not-allowed text-sm md:text-base py-3"
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
