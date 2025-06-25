import CoachDetailClient from './CoachDetailClient';

// This is a server component that renders the client component
// No generateStaticParams - paths are generated dynamically at runtime
export default function CoachDetailPage() {
  return <CoachDetailClient />;
}