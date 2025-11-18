import { Card, CardBody, CardTitle } from '../components/ui/Card';

export function Profile() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-cream mb-6">My Profile</h1>
      <Card>
        <CardBody>
          <CardTitle>Coming in Session 7!</CardTitle>
          <p className="text-cream/70 mt-4">
            Manage your profile, view your teaching stats, and update your preferences.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
