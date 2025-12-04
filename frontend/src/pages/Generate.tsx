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
      </div>

      {/* Story Content */}
      <div className="space-y-12">
        {/* Section 1: The Idea */}
        <section className="bg-burgundy-dark/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-cream/10 shadow-xl">
          <h2 className="text-3xl font-semibold text-cream mb-6">
            The Beginning
          </h2>
          <div className="space-y-4 text-cream/80 text-lg leading-relaxed">
            <p>
            I created this two step fitness app to help people discover the reward and accessibility in fitness. 
            By combining human support, dynamic exercise planning, and music as an enhancer, the platform is built to make fitness more enjoyable 
            — and ultimately, more sustainable.
            </p>
            <p>
            I have known too many who've discovered powerfully rewarding exercise regimes which they could have known earlier. 
            Similarly, I've encountered really keen exercisers who dropped off through life's invariably competing demands. 
            I'm passionate about creating tools to fix these problems. Here is my story…
            </p>
          </div>
        </section>

        {/* Section 2: My Story */}
        <section className="bg-burgundy-dark/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-cream/10 shadow-xl">
          <h2 className="text-3xl font-semibold text-cream mb-6">
            The Vision
          </h2>
          <div className="space-y-4 text-cream/80 text-lg leading-relaxed">
            <p>
            When I was in school, I used to feel incredibly nervous on physical education (PE) days. Everyone in my class was really sporty — but I just wasn't. It wasn't something I could laugh off either. It was excruciatingly embarrassing for me, and I dreaded those days. Because sports were the only fitness channel offered in school, I gave up on all forms of exercise as soon as I left at 18.
            </p>
            <p>
            Cut to age 19, when I had a rude awakening — I realised my fitness was starting to dwindle. I decided to do the unthinkable and join an institution I felt I had no business being in: I signed up for the college gym and tried a cardio class.
            </p>
            <p>
            Over the weeks that followed, I fell in love with the fitness formats the gym had to offer. That brave step I took at 19 changed my life and laid the path for a lifelong love affair with exercise. I only wish I had discovered alternative methods earlier.
            </p>
            <p>
            It's for that reason I want to help others experience the transformative effects of exercise and movement — and discover that there's more than one way to fall in love with fitness.
            </p>
          </div>
        </section>

        {/* Section 3: The Technology */}
        <section className="bg-burgundy-dark/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-cream/10 shadow-xl">
          <h2 className="text-3xl font-semibold text-cream mb-6">
            Automation meets Pilates structure
          </h2>
          <div className="space-y-4 text-cream/80 text-lg leading-relaxed">
            <p>
              I built Bassline on the basis that Joseph Pilates' classical Pilates methods were highly rules based and, though detailed, lent themselves extremely well to automation.
              When I was challenged on what real problem this platform could solve, I started thinking more broadly.
              What if, instead of just a Pilates class generator, we created a shared platform where people could document and track the fitness routines that work uniquely for them?
              The idea itself wasn't new: give people access to a network of instructors who share their expertise, mindset, and approach - so anyone can shape a routine that
              suits their goals and preferences.
              But when I spoke with the fitness instructors and coaches I've admired throughout my time, a theme kept coming up: the psychology of fitness is
              treated with very different levels of care and quality.
              That insight, coupled with my own experience, pushed me toward what Bassline could really offer - a network of shared philosophies and mantras
              that help people stay consistent, confident, and connected not to where or when they exercise, buy why.
            </p>
          </div>
        </section>

        {/* Section 4: The Future */}
        <section className="bg-gradient-to-br from-burgundy/60 to-burgundy-dark/60 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-cream/20 shadow-xl">
          <h2 className="text-3xl font-semibold text-cream mb-6">
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
