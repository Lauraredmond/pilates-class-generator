import { Card, CardBody, CardTitle } from '../components/ui/Card';

export function Generate() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-cream mb-6">Create New Class</h1>
      <Card>
        <CardBody>
          <CardTitle>Drag & Drop Class Builder - Coming in Session 5!</CardTitle>
          <p className="text-cream/70 mt-4 mb-4">
            This will be the main class builder with drag-and-drop functionality. You'll be able to:
          </p>
          <ul className="list-disc list-inside text-cream/70 space-y-2">
            <li>Browse all 34 classical Pilates movements</li>
            <li>Drag movements to build your sequence</li>
            <li>Generate sequences with AI agents</li>
            <li>Add music and meditation</li>
            <li>Get web-researched cues via MCP</li>
            <li>Save and share your classes</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
