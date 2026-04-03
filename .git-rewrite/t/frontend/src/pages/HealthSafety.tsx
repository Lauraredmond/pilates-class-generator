/**
 * Health & Safety Disclaimer Page
 * Important safety information for Pilates practice
 */

import { useNavigate } from 'react-router-dom';

export function HealthSafety() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-burgundy py-12 px-4">
      <div className="max-w-4xl mx-auto bg-cream rounded-lg shadow-xl p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-burgundy hover:underline text-sm mb-4 inline-block">
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-burgundy mb-2">Health & Safety Disclaimer</h1>
          <p className="text-charcoal/70 text-lg">
            Important information before starting your Pilates practice
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-burgundy max-w-none space-y-6 text-charcoal">
          {/* Warning Banner */}
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded">
            <h2 className="text-2xl font-bold text-red-800 mb-3 flex items-center gap-2">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Important Safety Notice
            </h2>
            <p className="text-red-900 text-lg font-medium">
              Please read this entire disclaimer carefully before using Bassline Pilates.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">Exercise is Your Responsibility</h2>
            <div className="space-y-3">
              <p className="text-lg">
                <strong>Bassline Pilates is an exercise‑support tool</strong> intended to supplement—not replace—professional Pilates instruction.
              </p>
              <p>
                This application provides class planning assistance, but it cannot:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Assess your individual fitness level or medical history</li>
                <li>Provide real-time form correction or injury prevention</li>
                <li>Replace the guidance of a certified Pilates instructor</li>
                <li>Diagnose, treat, or prevent any medical condition</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">Consult Your Doctor First</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="font-semibold text-yellow-900 mb-2">
                Always consult a qualified medical professional before beginning any new exercise program, especially if you:
              </p>
              <ul className="list-disc pl-6 text-yellow-900 space-y-1">
                <li>Have any medical conditions or injuries</li>
                <li>Are pregnant, planning to become pregnant, or have given birth within the last 12 weeks</li>
                <li>Have cardiovascular disease, high blood pressure, or diabetes</li>
                <li>Have joint, muscle, or bone problems</li>
                <li>Experience chronic pain or mobility limitations</li>
                <li>Are over 40 and have been inactive</li>
                <li>Take any medications that may affect exercise</li>
                <li>Have any concerns about your ability to exercise safely</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">You Participate at Your Own Risk</h2>
            <p>
              By using Bassline Pilates, you acknowledge and accept that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Exercise involves inherent risks</strong> including, but not limited to, muscle strain, joint injury, cardiovascular stress, and in extreme cases, heart attack or death.
              </li>
              <li>
                <strong>You are solely responsible</strong> for ensuring exercises are appropriate for your fitness level and physical condition.
              </li>
              <li>
                <strong>Bassline Pilates is not liable</strong> for any injuries, damages, or losses sustained while using the application or performing exercises.
              </li>
              <li>
                <strong>This is beta software</strong> and may contain errors, bugs, or inaccuracies in class generation or exercise instructions.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">Stop Immediately If You Experience:</h2>
            <div className="bg-red-50 p-4 rounded border-2 border-red-300">
              <ul className="list-disc pl-6 space-y-1 text-red-900 font-medium">
                <li>Pain or discomfort</li>
                <li>Dizziness or lightheadedness</li>
                <li>Chest pain or pressure</li>
                <li>Shortness of breath</li>
                <li>Nausea</li>
                <li>Unusual fatigue</li>
                <li>Joint instability</li>
                <li>Sharp or shooting pains</li>
              </ul>
              <p className="mt-3 text-red-900">
                <strong>Seek immediate medical attention if symptoms are severe or do not resolve quickly.</strong>
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">Safe Practice Guidelines</h2>
            <div className="bg-burgundy/5 p-4 rounded">
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Warm up properly</strong> before each session</li>
                <li><strong>Work within your limits</strong> – never force a movement</li>
                <li><strong>Focus on form over speed</strong> or intensity</li>
                <li><strong>Stay hydrated</strong> before, during, and after exercise</li>
                <li><strong>Use appropriate equipment</strong> – a quality mat is essential</li>
                <li><strong>Exercise in a safe environment</strong> with adequate space</li>
                <li><strong>Listen to your body</strong> – rest when needed</li>
                <li><strong>Progress gradually</strong> – don't rush into advanced movements</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">CRITICAL WARNING: Pregnancy & Early Postnatal Period</h2>
            <div className="bg-red-50 p-6 rounded border-2 border-red-400">
              <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                This Application is NOT SAFE for Pregnant Individuals After the First Trimester OR for Women in Early Postnatal Period (0-12 weeks)
              </h3>
              <div className="space-y-4 text-red-900">
                <p className="font-bold text-lg">
                  DO NOT use this application if you are pregnant (beyond first trimester), suspect you may be pregnant, OR have given birth within the last 12 weeks without explicit written approval from your obstetrician, midwife, or women's health physiotherapist.
                </p>
                <p>
                  Many Pilates movements and setup positions included in this application can be harmful to pregnant individuals, particularly after the first trimester. These movements may involve:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Supine position (lying flat on your back)</strong> – Can restrict blood flow to the foetus and cause supine hypotensive syndrome, potentially depriving the baby of oxygen</li>
                  <li><strong>Deep abdominal work</strong> – May increase intra-abdominal pressure and strain the abdominal wall, which is already under stress during pregnancy</li>
                  <li><strong>Twisting and rotation movements</strong> – Can strain the abdomen, pelvis, and potentially affect the placenta</li>
                  <li><strong>Prone positions (lying face-down)</strong> – Unsafe for the developing foetus and uncomfortable after the first trimester</li>
                  <li><strong>Intense core exercises</strong> – Risk of diastasis recti (abdominal separation) and pelvic floor dysfunction</li>
                  <li><strong>High-impact or jarring movements</strong> – Can stress loosened joints and ligaments affected by relaxin hormone</li>
                </ul>
                <div className="bg-red-100 p-4 rounded border-2 border-red-300">
                  <p className="font-bold text-lg">
                    REQUIRED: Specialized Prenatal Pilates Instruction
                  </p>
                  <p className="mt-2">
                    If you are pregnant and wish to practice Pilates, you MUST work with a certified prenatal Pilates instructor who can:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Provide trimester-specific modifications</li>
                    <li>Monitor for contraindicated movements</li>
                    <li>Adapt exercises for your changing body</li>
                    <li>Recognize warning signs and symptoms</li>
                  </ul>
                </div>
                <p className="font-bold">
                  Early Postnatal Period (0-12 weeks after giving birth):
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li><strong>DO NOT use this application</strong> until you have waited a minimum of 12 weeks postpartum AND have completed your 12-week postnatal check with your doctor or midwife</li>
                  <li>Your body needs time to heal after giving birth - the pelvic floor, abdominal muscles, and connective tissues require recovery time</li>
                  <li>Earlier return to exercise requires specialized postnatal rehabilitation from a women's health physiotherapist</li>
                  <li>Using this app during the early postnatal period could result in serious harm, including pelvic floor damage, abdominal separation (diastasis recti), or other complications</li>
                </ul>
                <p className="font-bold mt-4">
                  Later Postnatal Period (&gt;12 weeks after giving birth):
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>You <strong>must</strong> have completed your 12-week postnatal check and obtained medical clearance from your healthcare provider before using this application</li>
                  <li>If you had a C-section, additional recovery time may be required</li>
                  <li>Pelvic floor assessment is highly recommended before resuming Pilates to check for any dysfunction</li>
                  <li>Consider working with a certified postnatal Pilates instructor who can provide appropriate modifications</li>
                  <li>Postpartum exercise should be introduced gradually under professional guidance</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">CRITICAL WARNING: Postnatal Abdominal Separation (Diastasis Recti)</h2>
            <div className="bg-red-50 p-6 rounded border-2 border-red-400">
              <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Postnatal Women with Abdominal Separation Should NOT Use This App
              </h3>
              <div className="space-y-4 text-red-900">
                <p className="font-bold text-lg">
                  DO NOT use this application if you are a postnatal woman with abdominal separation (diastasis recti) without explicit written approval from your GP or women's health physiotherapist.
                </p>
                <p>
                  <strong>What is Diastasis Recti?</strong>
                </p>
                <p>
                  Diastasis recti is a separation of the abdominal muscles (rectus abdominis) that commonly occurs during pregnancy. The connective tissue (linea alba) between your abdominal muscles stretches and thins, creating a gap. This condition affects approximately 60% of women during pregnancy and the early postpartum period.
                </p>
                <p>
                  <strong>Why is this app unsafe for those with diastasis recti?</strong>
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Inappropriate core exercises</strong> – Many classical Pilates movements involve deep abdominal work that can worsen abdominal separation if performed incorrectly or before proper healing</li>
                  <li><strong>Risk of further damage</strong> – Exercises that create excessive intra-abdominal pressure can prevent the abdominal muscles from healing and may increase the separation</li>
                  <li><strong>Pelvic floor complications</strong> – Improper exercise can lead to pelvic organ prolapse, urinary incontinence, and pelvic floor dysfunction</li>
                  <li><strong>Chronic pain and instability</strong> – Without proper rehabilitation, you may develop chronic lower back pain, poor posture, and core instability</li>
                  <li><strong>Hernia risk</strong> – Severe or improperly managed diastasis recti can increase the risk of developing an abdominal hernia</li>
                </ul>
                <div className="bg-red-100 p-4 rounded border-2 border-red-300">
                  <p className="font-bold text-lg mb-2">
                    REQUIRED ACTION: Consult Your GP for Advice
                  </p>
                  <p className="mb-3">
                    If you are postnatal and suspect you may have abdominal separation, you MUST:
                  </p>
                  <ul className="list-disc pl-6 space-y-1">
                    <li><strong>Get a professional assessment</strong> from your GP or a women's health physiotherapist to determine the severity of your diastasis recti</li>
                    <li><strong>Do NOT attempt any Pilates exercises</strong> from this application until you have been medically cleared and provided with personalized exercise guidelines</li>
                    <li><strong>Follow a specialized postnatal rehabilitation program</strong> designed specifically for diastasis recti recovery</li>
                    <li><strong>Work with a qualified postnatal Pilates instructor</strong> who understands diastasis recti and can provide appropriate modifications</li>
                    <li><strong>Avoid exercises that increase intra-abdominal pressure</strong> such as crunches, planks, and many traditional core exercises until cleared by a healthcare professional</li>
                  </ul>
                </div>
                <p className="font-bold">
                  Signs you may have diastasis recti:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>A visible bulge or "doming" in your abdomen when engaging your core</li>
                  <li>Lower back pain or pelvic pain</li>
                  <li>Feeling of weakness in your abdominal area</li>
                  <li>A gap you can feel between your abdominal muscles (you can self-check by lying on your back with knees bent and gently pressing along the midline of your abdomen while lifting your head)</li>
                  <li>Poor posture or difficulty standing upright</li>
                  <li>Urinary leakage or pelvic floor issues</li>
                </ul>
                <p className="mt-4">
                  <strong>Remember:</strong> Diastasis recti is a medical condition that requires proper assessment and specialized rehabilitation. This application is not designed for postnatal recovery and cannot provide the individualized guidance you need.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">Modifications & Assistance</h2>
            <p>
              Bassline Pilates provides general class plans. You are responsible for:
            </p>
            <ul className="list-disc pl-6">
              <li>Modifying exercises to suit your ability level</li>
              <li>Skipping movements that cause pain or discomfort</li>
              <li>Seeking professional guidance for proper form and technique</li>
              <li>Understanding exercise contraindications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">Limitation of Liability</h2>
            <div className="bg-charcoal/5 p-4 rounded border border-charcoal/20">
              <p className="text-sm">
                To the maximum extent permitted by law, Bassline Pilates, its founder, employees, and affiliates are not responsible for any injuries, damages, or losses sustained while using this application or performing exercises suggested by it. You voluntarily assume all risks associated with physical exercise.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">Acknowledgment</h2>
            <p>
              By using Bassline Pilates, you acknowledge that you have read, understood, and agree to this Health & Safety Disclaimer.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">Contact</h2>
            <p>
              For questions: <a href="mailto:laura.redm@gmail.com" className="text-burgundy hover:underline">laura.redm@gmail.com</a> or the feedback link on the application settings page.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-charcoal/20">
          <button onClick={() => navigate(-1)} className="text-burgundy hover:underline font-medium">
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
