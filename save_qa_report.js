/**
 * QA Report Saver - Extract and save muscle overlap reports from API responses
 *
 * Usage:
 * 1. Generate a class in the app (with AI mode or default mode)
 * 2. Open browser DevTools (F12)
 * 3. Paste this entire script into the Console tab
 * 4. Press Enter
 * 5. Report will automatically download as .md file
 *
 * How it works:
 * - Intercepts fetch() requests to backend API
 * - Captures sequence generation responses
 * - Extracts qa_report content
 * - Triggers automatic download
 */

(function() {
  console.log('🔍 QA Report Saver activated - waiting for class generation...');

  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch to intercept API responses
  window.fetch = async function(...args) {
    const response = await originalFetch(...args);

    // Clone response so we don't consume the body
    const clonedResponse = response.clone();

    // Check if this is a sequence generation request
    const url = args[0];
    if (typeof url === 'string' &&
        (url.includes('/api/agents/generate-sequence') ||
         url.includes('/api/agents/generate-complete-class'))) {

      try {
        const data = await clonedResponse.json();

        // Check if QA report exists
        if (data?.data?.qa_report || data?.qa_report) {
          const qaReport = data.data?.qa_report || data.qa_report;

          console.log('✅ QA Report detected!');
          console.log(`📊 Timestamp: ${qaReport.timestamp}`);
          console.log(`📝 Content length: ${qaReport.content.length} characters`);

          // Automatically download the report
          const blob = new Blob([qaReport.content], { type: 'text/markdown' });
          const downloadUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = downloadUrl;
          a.download = `muscle_overlap_report_${qaReport.timestamp}.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(downloadUrl);

          console.log('💾 Report downloaded to your Downloads folder!');
          console.log('📁 Filename: muscle_overlap_report_' + qaReport.timestamp + '.md');

          // Also save to local analytics folder if possible
          if (qaReport.file_path) {
            console.log('📂 Also saved to: ' + qaReport.file_path);
          }

          // Show summary
          const lines = qaReport.content.split('\n');
          const summaryStart = lines.findIndex(line => line.includes('## Summary Statistics'));
          if (summaryStart !== -1) {
            console.log('\n--- Summary Statistics ---');
            for (let i = summaryStart + 1; i < Math.min(summaryStart + 10, lines.length); i++) {
              if (lines[i].startsWith('##') || lines[i].startsWith('---')) break;
              console.log(lines[i]);
            }
          }
        }
      } catch (error) {
        // Not JSON or error parsing - ignore
      }
    }

    return response;
  };

  console.log('✨ Ready! Generate a class and the report will auto-download.');
  console.log('💡 To stop monitoring: Refresh the page');
})();
