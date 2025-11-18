import { Card, CardBody, CardTitle } from '../components/ui/Card';

export function Classes() {
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-cream mb-6">My Class Library</h1>
      <Card>
        <CardBody>
          <CardTitle>Coming in Session 5!</CardTitle>
          <p className="text-cream/70 mt-4">
            This page will display all your saved class plans. You'll be able to view, edit, and delete classes here.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
