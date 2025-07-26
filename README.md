# Accreditor - Coaching Practice Management System

This is a [Next.js](https://nextjs.org) project for managing coaching practice activities, CPD tracking, and client sessions.

## Getting Started

### Prerequisites

1. **Supabase Setup**: You'll need a Supabase project with the following tables:
   - `profiles` - User profile information
   - `sessions` - Coaching session records
   - `cpd` - Continuing Professional Development activities
   - `clients` - Client information

2. **Environment Variables**: Create a `.env.local` file in the root directory with:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Database Schema

The application expects the following database structure:

- **sessions table**: `id`, `client_name`, `date`, `duration`, `notes`, `types`, `paymenttype`, `focus_area`, `key_outcomes`, `client_progress`, `coaching_tools`, `icf_competencies`, `additional_notes`, `user_id`
- **cpd table**: `id`, `title`, `activity_date`, `hours`, `cpd_type`, `learning_method`, `provider_organization`, `description`, `key_learnings`, `application_to_practice`, `icf_competencies`, `document_type`, `supporting_document`, `user_id`
- **profiles table**: `id`, `name`, `icf_level`, `user_id`

### Storage Buckets

The application uses the following Supabase storage buckets:

- **certificates**: For storing CPD certificates and supporting documents

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
