# Coach Bridge

A comprehensive AI and human coaching platform built with Next.js and Supabase.

## Setup Instructions

### 1. Supabase Setup

1. Go to [Supabase](https://supabase.com) and create a new project
2. Once your project is created, go to Settings > API
3. Copy your project URL and anon key
4. Update the `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 2. Database Migration

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the entire content from `supabase/migrations/20250619151529_old_meadow.sql`
3. Paste it into the SQL Editor and run it
4. This will create all necessary tables, policies, and sample data

### 3. Authentication Setup

1. In your Supabase dashboard, go to Authentication > Settings
2. Enable email authentication
3. Optionally enable Google OAuth if you want social login

### 4. Run the Application

```bash
npm install
npm run dev
```

## Features

- **AI Specialist Coaches**: Voice-powered AI coaching with ElevenLabs integration
- **Digital Chemistry**: Personalized video previews with Tavus AI
- **Human Voice AI**: AI clones of human coaches
- **Live Human Coaching**: Direct sessions with certified coaches
- **Progress Tracking**: Comprehensive analytics and goal tracking
- **Subscription Management**: Multiple pricing tiers with Stripe integration

## Database Schema

The application uses the following main tables:
- `profiles` - User profiles and coach information
- `subscriptions` - User subscription plans and credits
- `coaching_sessions` - All coaching session records
- `ai_coaches` - Available AI coach configurations
- `human_coaches` - Human coach profiles
- `session_analytics` - Session analytics and insights

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key (server-side only)
- `OPENAI_API_KEY` - Your OpenAI API key (server-side only)