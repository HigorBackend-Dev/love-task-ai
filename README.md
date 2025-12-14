# Love Task AI

A modern task management application built with React, TypeScript, and Supabase. Users can create, manage, and track their daily tasks with a clean, intuitive interface.

## Overview

Love Task AI is a full-stack web application that allows users to authenticate, create tasks, and manage their productivity. The application features real-time synchronization with a Supabase backend, responsive design with Tailwind CSS, and a comprehensive component library using shadcn/ui.

## Tech Stack

Frontend:
- React 18 with TypeScript
- Vite for fast development and optimized builds
- React Router for client-side routing
- Tailwind CSS for styling
- shadcn/ui for accessible UI components
- React Hook Form for form management
- Lucide React for icons

Backend:
- Supabase for authentication and database
- PostgreSQL for data storage
- Row Level Security (RLS) for secure data access

Deployment:
- Vercel for hosting

## Project Structure

```
love-task-ai/
├── src/
│   ├── components/           # Reusable React components
│   │   ├── ui/              # shadcn UI components
│   │   ├── Header.tsx       # Navigation header
│   │   ├── TaskForm.tsx     # Task creation form
│   │   ├── TaskList.tsx     # Task display list
│   │   ├── TaskItem.tsx     # Individual task component
│   │   ├── ProtectedRoute.tsx # Authentication guard
│   │   └── ...
│   ├── pages/                # Page-level components
│   │   ├── Landing.tsx      # Landing page
│   │   ├── Auth.tsx         # Authentication page
│   │   ├── Dashboard.tsx    # Main task dashboard
│   │   ├── Settings.tsx     # User settings
│   │   └── Index.tsx        # Index page
│   ├── contexts/             # React Context providers
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── LanguageContext.tsx # Language/i18n state
│   ├── hooks/                # Custom React hooks
│   │   ├── useTasks.ts      # Task management hook
│   │   ├── useProfile.ts    # User profile hook
│   │   └── use-toast.ts     # Toast notifications
│   ├── integrations/         # External service integrations
│   │   └── supabase/        # Supabase client and queries
│   ├── lib/                  # Utility functions
│   │   ├── utils.ts         # General utilities
│   │   └── error-messages.ts # Error handling
│   ├── types/                # TypeScript type definitions
│   │   ├── task.ts          # Task types
│   │   └── onboarding.ts    # Onboarding types
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── supabase/                 # Supabase configuration
│   ├── migrations/          # Database migrations
│   ├── functions/           # Edge functions
│   └── config.toml          # Supabase config
├── public/                   # Static assets
├── vite.config.ts           # Vite configuration
├── tailwind.config.ts       # Tailwind CSS config
├── tsconfig.json            # TypeScript configuration
├── package.json             # Project dependencies
├── vercel.json              # Vercel deployment config
└── README.md                # This file
```

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Supabase account and project
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd love-task-ai
```

2. Install dependencies:
```bash
npm install
# or
bun install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Configure Supabase (if needed):
Navigate to the `supabase/` directory and apply migrations to your Supabase project.

### Development

Start the development server:
```bash
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:8080`

### Building for Production

Build the application:
```bash
npm run build
# or
bun run build
```

Preview the production build:
```bash
npm run preview
```

## Features

Authentication:
- User sign-up and sign-in with email and password
- Secure session management via Supabase
- Password validation with minimum requirements
- Protected routes for authenticated users only
- Automatic logout and session cleanup

Task Management:
- Create new tasks with titles
- Mark tasks as complete or incomplete
- Delete tasks
- View all tasks in a clean list
- Real-time synchronization with database
- Task count statistics

User Profile:
- Display user information (email, full name)
- Update profile settings
- Avatar support
- View account details

UI & UX:
- Responsive design that works on mobile, tablet, and desktop
- Dark mode ready with Tailwind CSS
- Accessible UI components from shadcn/ui
- Toast notifications for user feedback
- Error handling with user-friendly messages

## Routing

The application uses React Router for client-side routing:

- `/` - Landing page (public)
- `/auth` - Authentication page (sign up / sign in)
- `/index` - Index page (public)
- `/dashboard` - Main task dashboard (protected)
- `/settings` - User settings (protected)
- `*` - 404 Not Found page

Protected routes require user authentication. Unauthenticated users are redirected to the authentication page.

## Database Schema

The Supabase database includes tables for:
- Users (via Supabase Auth)
- Profiles (user information and settings)
- Tasks (user tasks and completions)
- Chat Sessions (if chat feature is enabled)

All tables are protected with Row Level Security (RLS) policies to ensure users can only access their own data.

## Authentication Flow

1. User visits the application
2. AuthContext checks for existing session
3. If authenticated, user can access protected routes
4. If not authenticated, user is redirected to Auth page
5. User can sign up with email and password
6. On successful sign up/sign in, session is created
7. User is redirected to dashboard
8. Sign out clears session and redirects to landing page

## Deployment

The application is deployed on Vercel. The `vercel.json` configuration ensures proper routing for single-page application behavior.

To deploy:
1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Connect the repository to Vercel
3. Set environment variables in Vercel project settings
4. Vercel automatically deploys on every push to main branch

### Environment Variables for Production:
Make sure to set these in your Vercel project settings:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build locally

## Error Handling

The application includes comprehensive error handling:
- User-friendly error messages
- Error logging and reporting
- Auth error management
- Form validation errors
- Toast notifications for feedback

## Contributing

To contribute to this project:
1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Create a pull request with a clear description

## License

This project is private and proprietary.

## Support

For issues, questions, or feedback, please contact the development team or create an issue in the repository.
