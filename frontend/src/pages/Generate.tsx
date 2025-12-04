export function Generate() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Hero Section with Logo */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <img
            src="/assets/bassline-logo-transparent.png"
            alt="Bassline Logo"
            className="h-24 w-auto"
          />
        </div>
        <h1 className="text-5xl font-bold text-cream mb-4 tracking-tight">
          The Founder's Story
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-cream to-transparent mx-auto mb-6"></div>
        <p className="text-xl text-cream/80 italic max-w-3xl mx-auto leading-relaxed">
          "From a personal journey of healing to empowering a global community"
        </p>
      </div>

      {/* Story Content */}
      <div className="space-y-12">
        {/* Section 1: The Beginning */}
        <section className="bg-burgundy-dark/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-cream/10 shadow-xl">
          <h2 className="text-3xl font-semibold text-cream mb-6 flex items-center gap-3">
            <span className="text-4xl">🌅</span>
            The Beginning
          </h2>
          <div className="space-y-4 text-cream/80 text-lg leading-relaxed">
            <p>
              Bassline was born from a deeply personal journey. As a Pilates instructor and wellness advocate,
              I witnessed firsthand how transformative the classical Pilates method could be—not just for physical
              strength, but for mental clarity, emotional balance, and overall wellbeing.
            </p>
            <p>
              But I also saw the challenges: instructors spending countless hours planning classes, students
              struggling to find personalized guidance, and the classical method's rich heritage being diluted
              by modern shortcuts. There had to be a better way.
            </p>
          </div>
        </section>

        {/* Section 2: The Vision */}
        <section className="bg-burgundy-dark/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-cream/10 shadow-xl">
          <h2 className="text-3xl font-semibold text-cream mb-6 flex items-center gap-3">
            <span className="text-4xl">✨</span>
            The Vision
          </h2>
          <div className="space-y-4 text-cream/80 text-lg leading-relaxed">
            <p>
              What if technology could honor tradition while making it accessible? What if AI could understand
              the nuances of Joseph Pilates' 34 classical movements, the importance of spinal progression, and
              the delicate balance of muscle engagement—all while adapting to each individual's unique needs?
            </p>
            <p>
              Bassline emerged from this question. Not as a replacement for human expertise, but as an intelligent
              companion that amplifies it. A tool that handles the complexity while preserving the artistry.
            </p>
          </div>
        </section>

        {/* Section 3: The Technology */}
        <section className="bg-burgundy-dark/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-cream/10 shadow-xl">
          <h2 className="text-3xl font-semibold text-cream mb-6 flex items-center gap-3">
            <span className="text-4xl">🤖</span>
            Intelligence Meets Intention
          </h2>
          <div className="space-y-4 text-cream/80 text-lg leading-relaxed">
            <p>
              We built Bassline on cutting-edge AI reasoning patterns—Jentic's StandardAgent framework with
              advanced ReWOO reasoning. But the technology is never the story. The story is what it enables:
            </p>
            <ul className="space-y-3 ml-6">
              <li className="flex items-start gap-3">
                <span className="text-cream text-xl mt-1">•</span>
                <span>
                  <strong className="text-cream">Personalized Classes in Minutes:</strong> What once took hours
                  of planning now takes seconds, without sacrificing quality or safety.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cream text-xl mt-1">•</span>
                <span>
                  <strong className="text-cream">Honoring Classical Principles:</strong> Every sequence respects
                  spinal progression, muscle balance, and the wisdom of Joseph Pilates' original method.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-cream text-xl mt-1">•</span>
                <span>
                  <strong className="text-cream">Continuous Learning:</strong> The more you use Bassline, the
                  better it understands your preferences, limitations, and goals.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Section 4: The Community */}
        <section className="bg-burgundy-dark/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-cream/10 shadow-xl">
          <h2 className="text-3xl font-semibold text-cream mb-6 flex items-center gap-3">
            <span className="text-4xl">🌍</span>
            Building Together
          </h2>
          <div className="space-y-4 text-cream/80 text-lg leading-relaxed">
            <p>
              Bassline isn't just a platform—it's a movement. A community of instructors, practitioners, and
              wellness enthusiasts who believe in the power of mindful movement. Every class generated, every
              preference shared, every piece of feedback contributes to making the platform better for everyone.
            </p>
            <p>
              We're committed to transparency (EU AI Act compliant), privacy (GDPR compliant), and putting our
              users first. Your data is yours. Your practice is yours. We're just here to support it.
            </p>
          </div>
        </section>

        {/* Section 5: The Future */}
        <section className="bg-gradient-to-br from-burgundy/60 to-burgundy-dark/60 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-cream/20 shadow-xl">
          <h2 className="text-3xl font-semibold text-cream mb-6 flex items-center gap-3">
            <span className="text-4xl">🚀</span>
            What's Next
          </h2>
          <div className="space-y-4 text-cream/80 text-lg leading-relaxed">
            <p>
              This is just the beginning. We're working on nutrition tracking, wellness routines, audio-guided
              classes, and so much more. But we'll never lose sight of what matters: empowering you to move
              with intention, strength, and grace.
            </p>
            <p className="text-xl font-medium text-cream pt-4 border-t border-cream/20">
              Thank you for being part of this journey. Together, we're redefining what's possible in
              movement and wellness.
            </p>
          </div>
          <div className="mt-8 text-center">
            <p className="text-cream/60 italic">
              With gratitude,
            </p>
            <p className="text-2xl font-semibold text-cream mt-2">
              Laura Redmond
            </p>
            <p className="text-cream/60 mt-1">
              Founder, Bassline Pilates
            </p>
          </div>
        </section>
      </div>

      {/* Call to Action */}
      <div className="mt-16 text-center pb-12">
        <div className="inline-block bg-energy-gradient rounded-2xl p-8 shadow-2xl">
          <h3 className="text-2xl font-bold text-cream mb-4">
            Ready to Experience Bassline?
          </h3>
          <p className="text-cream/90 mb-6 max-w-xl">
            Join thousands of practitioners transforming their Pilates practice with intelligent,
            personalized class generation.
          </p>
          <a
            href="/class-builder"
            className="inline-block bg-cream text-burgundy-dark font-bold px-8 py-4 rounded-lg
                     hover:bg-cream/90 transition-all transform hover:scale-105 shadow-lg"
          >
            Generate Your First Class
          </a>
        </div>
      </div>
    </div>
  );
}
