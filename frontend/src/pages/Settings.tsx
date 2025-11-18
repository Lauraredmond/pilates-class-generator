import { Card, CardBody, CardTitle } from '../components/ui/Card';

export function Settings() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-cream mb-6">Settings</h1>
      <Card>
        <CardBody>
          <CardTitle>Coming in Session 8!</CardTitle>
          <p className="text-cream/70 mt-4">
            Configure AI strictness, music preferences, research sources, and more.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
