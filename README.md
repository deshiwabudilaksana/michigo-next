# Serverless Ticketing API

This is a serverless version of the ticketing API built with Next.js, designed for deployment on Vercel.

## Features

- User registration and authentication
- Event management (create, read, update, delete)
- Ticket booking system
- Role-based access control (attendee, organizer, admin)

## Getting Started

### Prerequisites

- Node.js 16+ 
- MongoDB database

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## API Endpoints

- `GET /api/health` - Health check
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (requires authentication)
- `PATCH /api/users/[userId]/roles` - Update user roles (admin only)
- `GET /api/events` - Get all events
- `POST /api/events` - Create a new event (organizer only)
- `GET /api/events/[id]` - Get event by ID
- `PUT /api/events/[id]` - Update event (organizer only)
- `DELETE /api/events/[id]` - Delete event (organizer only)
- `PATCH /api/events/[id]/publish` - Publish event (organizer only)
- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create a new ticket
- `GET /api/tickets/[id]` - Get ticket by ID
- `PUT /api/tickets/[id]` - Update ticket
- `DELETE /api/tickets/[id]` - Delete ticket

## Deployment

This project is designed for deployment on Vercel:

1. Push your code to a Git repository
2. Import the project into Vercel
3. Add the required environment variables in the Vercel dashboard
4. Deploy!

## Environment Variables for Vercel

When deploying to Vercel, make sure to set the following environment variables:

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `JWT_EXPIRES_IN` - Token expiration (e.g., "7d", "24h")
- `NODE_ENV` - Set to "production"

You can also use Vercel CLI to set these:

```bash
vercel env add MONGODB_URI
vercel env add JWT_SECRET 
vercel env add JWT_EXPIRES_IN
```

## Technologies Used

- Next.js 14+ (with API Routes)
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- Vercel for deployment