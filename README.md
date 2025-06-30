# Coach Bridge

A comprehensive AI and human coaching platform built with Next.js and Supabase.

## 🚀 Features

- **AI Specialist Coaches**: Voice-powered AI coaching with ElevenLabs integration
- **Digital Chemistry**: Personalized video previews with Tavus AI
- **Human Voice AI**: AI clones of human coaches
- **Live Human Coaching**: Direct sessions with certified coaches
- **Progress Tracking**: Comprehensive analytics and goal tracking
- **Subscription Management**: Multiple pricing tiers with Stripe integration
- **Secure Payments**: Production-ready Stripe integration for subscriptions

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

### 4. Stripe Integration (Optional)

1. Create a Stripe account and get your API keys
2. Add your Stripe keys to the environment variables:
```env
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```
3. Deploy the Stripe Edge Functions to Supabase
4. Configure webhook endpoints in your Stripe dashboard

### 5. Run the Application

```bash
npm install
npm run dev
```

## Database Schema

The application uses the following main tables:
- `profiles` - User profiles and coach information
- `subscriptions` - User subscription plans and credits
- `coaching_sessions` - All coaching session records
- `coaches` - Unified table for both AI and human coaches
- `session_analytics` - Session analytics and insights
- `stripe_customers` - Stripe customer data
- `stripe_subscriptions` - Stripe subscription management

## Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)
- `ELEVENLABS_API_KEY` - Your ElevenLabs API key (server-side only)
- `OPENAI_API_KEY` - Your OpenAI API key (server-side only)
- `STRIPE_SECRET_KEY` - Your Stripe secret key (for payments)
- `STRIPE_WEBHOOK_SECRET` - Your Stripe webhook secret

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Payments**: Stripe
- **AI Integration**: ElevenLabs (voice), OpenAI (goal extraction), Tavus (video)
- **UI Components**: shadcn/ui, Lucide React icons

---

*Built with ❤️ using modern web technologies*

Checkpoint payment successful