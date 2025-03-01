# Next.js Auth0 Role-Based Authentication Demo

This demo project showcases role-based authentication and authorization using Next.js 15 (App Router) and Auth0. It demonstrates how to implement protected routes, admin-only pages, and secured API endpoints.

## Features

- 🔐 Auth0 Authentication
- 👥 Role-Based Access Control (RBAC)
- 🚀 Next.js 15 App Router
- 🔒 Protected API Routes
- 🎨 Styled with Tailwind CSS

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

## Level Up Your Dev Career 🚀

🔥 Want to earn $120k+/year as a developer? Our 1000+ students already are! Transform your career with the most comprehensive full-stack development program available!

[Join Zero to Full Stack Hero 2.0 today!](https://www.papareact.com/course)

### Why Join Zero to Full Stack Hero 2.0?

- 🎓 **Complete Full-Stack Curriculum**

  - Next.js 15, React, TypeScript, Tailwind CSS
  - Backend development with Node.js
  - Database management
  - Authentication & Authorization (like this demo!)
  - AI & SaaS modules
  - Lifetime access
  - Weekly coaching calls
  - Complete project source code
  - Exclusive Discord community
  - So much more!

- 👨‍🏫 **Live Coaching & Support**

  - Weekly live sessions with Sonny Sangha
  - Real-time problem solving
  - Code reviews
  - Career guidance
  - Interview preparation

- 💪 **Real-World Experience**

  - 50+ practical projects
  - 100+ coding challenges
  - Industry-standard practices
  - Portfolio building

- 🤝 **Active Developer Community**
  - 24/7 support in Discord
  - Networking opportunities
  - Code reviews
  - Accountability partners
  - Job opportunities

### Success Stories

- Developers landing $120k+ positions at PayPal
- Students securing remote work opportunities worldwide
- Career changers breaking into tech
- Freelancers starting successful businesses

[Join Zero to Full Stack Hero 2.0 Today!](https://www.papareact.com/course)

> "The best investment in my development career" - Frank Ramos, Harvard Graduate & Senior Developer

_This project is part of the Zero to Full Stack Hero 2.0 curriculum, showcasing advanced authentication patterns with Next.js and Auth0._
