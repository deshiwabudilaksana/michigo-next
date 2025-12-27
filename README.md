# Serverless Ticketing API

This is a serverless version of the ticketing API built with Next.js, designed for deployment on Vercel.

## Features

- User registration and authentication
- Event management (create, read, update, delete)
- Ticket booking system
- Role-based access control (attendee, organizer, admin)

## Getting Started

### Prerequisites

- Node.js 16+ (recommended: latest LTS version)
- npm or yarn package manager
- MongoDB database (local or cloud instance like MongoDB Atlas)

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ticketing-next
```

2. Install dependencies:
```bash
npm install
```

3. Create the `.env.local` file with your environment variables as shown above

4. Run the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:3000`

### Running Tests

To run the test suite:
```bash
npm test
```

### Building for Production

To build the application for production:
```bash
npm run build
```

After building, you can start the production server:
```bash
npm start
```

## API Endpoints

### Health Check
- `GET /api/health` - Health check

### Users
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (requires authentication)
- `PATCH /api/users/[userId]/roles` - Update user roles (admin only)

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create a new event (organizer only)
- `GET /api/events/[id]` - Get event by ID
- `PUT /api/events/[id]` - Update event (organizer only)
- `DELETE /api/events/[id]` - Delete event (organizer only)
- `PATCH /api/events/[id]/publish` - Publish event (organizer only)

### Tickets
- `GET /api/tickets` - Get all tickets
- `POST /api/tickets` - Create a new ticket
- `GET /api/tickets/[id]` - Get ticket by ID
- `PUT /api/tickets/[id]` - Update ticket
- `DELETE /api/tickets/[id]` - Delete ticket

### Vendors
- `GET /api/vendors` - Get all vendors
- `POST /api/vendors` - Create a new vendor
- `GET /api/vendors/[id]` - Get vendor by ID
- `PUT /api/vendors/[id]` - Update vendor
- `DELETE /api/vendors/[id]` - Delete vendor
- `GET /api/vendors/user/[userId]` - Get vendors by user ID

## Deployment

This project is designed for deployment on Vercel or any platform that supports Next.js serverless functions:

### Vercel Deployment

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [Vercel](https://vercel.com) and sign in
3. Click "New Project" and import your repository
4. Add the required environment variables in the Vercel dashboard:
   - `MONGODB_URI` - Your MongoDB connection string
   - `JWT_SECRET` - Secret key for JWT tokens
   - `JWT_EXPIRES_IN` - Token expiration (e.g., "7d", "24h")
   - `NODE_ENV` - Set to "production"
5. Click "Deploy" and your application will be live

### Alternative Deployment (Docker)

The application can also be containerized with Docker:

1. Create a Dockerfile:
```Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

2. Build and run the container:
```bash
docker build -t ticketing-api .
docker run -p 3000:3000 -e MONGODB_URI=your_uri -e JWT_SECRET=your_secret ticketing-api
```

### Environment Variables

When deploying, make sure to set the following environment variables:

- `MONGODB_URI` - Your MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens (use a strong, random string)
- `JWT_EXPIRES_IN` - Token expiration (e.g., "7d", "24h")
- `NODE_ENV` - Set to "production" for production deployments

## Technologies Used

- Next.js 14+ (with API Routes)
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- Vercel for deployment