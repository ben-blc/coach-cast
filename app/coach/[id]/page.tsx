import CoachDetailClient from './CoachDetailClient';

// This is a server component that handles static generation
export async function generateStaticParams() {
  try {
    // For static export, we'll generate a few common coach IDs
    // In a real app, you'd fetch all coach IDs from your database
    return [
      { id: 'natalie-sejean' },
      { id: 'fatten' },
      { id: 'sprint-ai' },
      { id: 'pivot-ai' },
      { id: 'confidence-ai' },
      { id: 'balance-ai' },
    ];
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}

// Server component that renders the client component
export default function CoachDetailPage() {
  return <CoachDetailClient />;
}