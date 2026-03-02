// Temporary test page to verify navigation bar fix on iPhone
export function NavTest() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-cream mb-6">Navigation Bar Test</h1>

      <div className="bg-cream/10 p-6 rounded-lg mb-4">
        <h2 className="text-xl font-semibold text-cream mb-3">Test Instructions:</h2>
        <ol className="list-decimal list-inside text-cream/90 space-y-2">
          <li>Scroll up and down on this page</li>
          <li>Check if the bottom navigation bar stays anchored</li>
          <li>Try scrolling quickly and slowly</li>
          <li>Check if navigation icons are properly spaced from bottom edge</li>
        </ol>
      </div>

      {/* Add lots of content to enable scrolling */}
      {Array.from({ length: 20 }, (_, i) => (
        <div key={i} className="bg-burgundy/30 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold text-cream mb-2">Test Section {i + 1}</h3>
          <p className="text-cream/80">
            This is test content to create a scrollable page. The navigation bar should remain
            fixed at the bottom of the screen as you scroll. On iOS devices, it should respect
            the safe area inset for the home indicator.
          </p>
        </div>
      ))}
    </div>
  );
}
