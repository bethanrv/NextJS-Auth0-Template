# Next.js Auth0 Role-Based Authentication Demo

This demo project showcases role-based authentication and authorization using Next.js 15 (App Router) and Auth0. It demonstrates how to implement protected routes, admin-only pages, and secured API endpoints.

## Features

- 🔐 Auth0 Authentication
- 👥 Role-Based Access Control (RBAC)
- 🚀 Next.js 15 App Router
- 🔒 Protected API Routes
- 🎨 Styled with Tailwind CSS
- Supabase DB

## Demo Pages

- **Public Home Page**: Accessible to all users
- **Protected Page**: Requires authentication
- **Admin Dashboard**: Only accessible to users with admin role
- **API Examples**:
  - Public endpoint (`/api/public`)
  - Protected endpoint (`/api/admin`) - requires admin role

## Setup

1. **Sign up for Auth0**

Visit [Auth0 Signup](https://auth0.com/signup?utm_source=sonny&utm_medium=social) to create an account for FREE!

2. **Clone the repository**

```bash
git clone <repository-url>
cd next-auth0-rbac-demo
```

3. **Install dependencies**

```bash
npm install
```

4. **Configure Auth0**

Create an Auth0 application and API, then set up the following environment variables in `.env.local`:

```env
AUTH0_SECRET='use [openssl rand -hex 32] to generate a 32 bytes value'
AUTH0_BASE_URL='http://localhost:3000'
AUTH0_ISSUER_BASE_URL='https://YOUR_AUTH0_DOMAIN'
AUTH0_CLIENT_ID='YOUR_CLIENT_ID'
AUTH0_CLIENT_SECRET='YOUR_CLIENT_SECRET'
AUTH0_DOMAIN='YOUR_AUTH0_DOMAIN'
```

5. **Set up Auth0 Roles**

In your Auth0 dashboard:

- Create an 'admin' role
- Assign the role to test users
- Configure the API permissions

6. **Run the development server**

```bash
npm run dev
```

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── protected/    # Admin-only endpoints
│   │   └── public/       # Public endpoints
│   ├── page.tsx         # Home page component
│   ├── admin/           # Admin dashboard page
│   │   └── page.tsx     # Admin dashboard component
│   └── logged-in/       # Logged-in user pages
│       └── page.tsx     # Logged-in user component
├── actions/             # Server actions
├── components/          # React components
├── lib/                 # Utility functions
└── middleware.ts        # Auth & CORS middleware
```

## Authentication Flow

1. Users log in via Auth0
2. Auth0 returns user profile and tokens
3. Server validates tokens, generates a access token and checks user roles
4. Access is granted based on user roles

## API Routes

### Public Endpoint

```typescript
GET / api / public;
// Accessible to all users
```

### Protected Admin Endpoint

```typescript
GET / api / protected;
// Requires valid Auth0 token and admin role
```
