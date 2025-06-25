import { getAICoaches } from '@/lib/database';
import CoachDetailClient from './CoachDetailClient';

// This is a server component that handles static generation
export async function generateStaticParams() {
  try {
    // Fetch all coaches from the database
    const coaches = await getAICoaches();
    
    // Generate static params for each coach
    const params = coaches.map(coach => ({
      id: coach.id
    }));
    
    // Also add name-based slugs for SEO-friendly URLs
    const slugParams = coaches.map(coach => ({
      id: coach.name.toLowerCase().replace(/\s+/g, '-')
    }));
    
    // Combine both ID and slug-based params
    return [...params, ...slugParams];
  } catch (error) {
    console.error('Error generating static params:', error);
    
    // Fallback to some common coach identifiers if database fetch fails
    return [
      { id: 'natalie-sejean' },
      { id: 'fatten' },
      { id: 'sprint-ai' },
      { id: 'pivot-ai' },
      { id: 'confidence-ai' },
      { id: 'balance-ai' },
    ];
  }
}

// Server component that renders the client component
export default function CoachDetailPage() {
  return <CoachDetailClient />;
}