# API Documentation for Serverless Ticketing API

## Base URL
```
https://your-vercel-project.vercel.app/api/
```

## Common Headers
- Content-Type: application/json

## Authentication
Most endpoints require authentication using JWT tokens in the Authorization header:
```
Authorization: Bearer <token>
```

## API Endpoints

### Health Check
#### GET `/api/health`
- **Description**: Check API health status
- **Authorization**: No
- **Response**:
  ```json
  {
    "status": "OK",
    "timestamp": "2025-12-21T06:50:18.003Z",
    "uptime": 14.776052334,
    "message": "API is running successfully"
  }
  ```

### Users

#### POST `/api/users/register`
- **Description**: Register a new user
- **Authorization**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "firstName": "John",
    "lastName": "Doe",
    "requestOrganizerAccess": false
  }
  ```
- **Validation**:
  - email: required, valid email format
  - password: required, minimum 6 characters
  - firstName: required, minimum 2 characters
  - lastName: required, minimum 2 characters
- **Response**:
  ```json
  {
    "message": "User registered successfully",
    "token": "...",
    "user": {
      "id": "...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["attendee"]
    }
  }
  ```

#### POST `/api/users/login`
- **Description**: Login existing user
- **Authorization**: No
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword"
  }
  ```
- **Validation**:
  - email: required, valid email format
  - password: required
- **Response**:
  ```json
  {
    "message": "Login successful",
    "token": "...",
    "user": {
      "id": "...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["attendee"]
    }
  }
  ```

#### GET `/api/users/profile`
- **Description**: Get current user's profile
- **Authorization**: Yes (JWT token required)
- **Response**:
  ```json
  {
    "id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["attendee"],
    "isVerified": false,
    "createdAt": "2025-12-21T06:50:18.003Z"
  }
  ```

#### PATCH `/api/users/[userId]/roles`
- **Description**: Update user roles (admin only)
- **Authorization**: Yes (admin role required)
- **URL Parameters**: `userId` - ID of user to update
- **Request Body**:
  ```json
  {
    "roles": ["attendee", "organizer"]
  }
  ```
- **Response**:
  ```json
  {
    "message": "User roles updated successfully",
    "user": {
      "id": "...",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "roles": ["attendee", "organizer"]
    }
  }
  ```

### Events

#### GET `/api/events`
- **Description**: Get all events (with optional filters)
- **Authorization**: No
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `category`: Filter by category
  - `location`: Filter by location
  - `dateFrom`: Filter events from a date (format: YYYY-MM-DD)
  - `dateTo`: Filter events to a date (format: YYYY-MM-DD)
- **Response**:
  ```json
  {
    "success": true,
    "count": 1,
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    },
    "data": [
      {
        "id": "...",
        "title": "Event Name",
        "description": "Event description",
        "date": "2025-12-31",
        "time": "19:00",
        "location": "Event Location",
        "category": "Conference",
        "totalTickets": 100,
        "availableTickets": 85,
        "price": 50,
        "organizer": "...",
        "published": true,
        "createdAt": "2025-12-21T06:50:18.003Z"
      }
    ]
  }
  ```

#### POST `/api/events`
- **Description**: Create a new event (organizer/admin only)
- **Authorization**: Yes (organizer or admin role required)
- **Request Body**:
  ```json
  {
    "title": "New Event",
    "description": "Event description",
    "date": "2025-12-31",
    "time": "19:00",
    "location": "Event Location",
    "category": "Conference",
    "totalTickets": 100,
    "price": 50
  }
  ```
- **Validation**:
  - title: required, 3-200 characters
  - description: required, 10-2000 characters
  - date: required, valid date format
  - time: required
  - location: required, minimum 3 characters
  - category: required, minimum 2 characters
  - totalTickets: required, minimum 1
  - price: required, minimum 0
- **Response**:
  ```json
  {
    "message": "Event created successfully",
    "event": {
      "id": "...",
      "title": "New Event",
      "description": "Event description",
      ...
    }
  }
  ```

#### GET `/api/events/[id]`
- **Description**: Get event by ID
- **Authorization**: No
- **URL Parameters**: `id` - Event ID
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "id": "...",
      "title": "Event Name",
      "description": "Event description",
      ...
    }
  }
  ```

#### PUT `/api/events/[id]`
- **Description**: Update event (organizer/admin only)
- **Authorization**: Yes (event organizer or admin role required)
- **URL Parameters**: `id` - Event ID
- **Request Body**: Same as POST
- **Response**: Updated event object

#### DELETE `/api/events/[id]`
- **Description**: Delete event (organizer/admin only)
- **Authorization**: Yes (event organizer or admin role required)
- **URL Parameters**: `id` - Event ID
- **Response**:
  ```json
  {
    "message": "Event deleted successfully"
  }
  ```

#### PATCH `/api/events/[id]/publish`
- **Description**: Publish/unpublish event (organizer/admin only)
- **Authorization**: Yes (event organizer or admin role required)
- **URL Parameters**: `id` - Event ID
- **Request Body**:
  ```json
  {
    "published": true
  }
  ```
- **Response**:
  ```json
  {
    "message": "Event published successfully",
    "event": { ... }
  }
  ```

### Tickets

#### GET `/api/tickets`
- **Description**: Get all tickets (with optional filters)
- **Authorization**: Yes (admin or organizer role required)
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `eventId`: Filter by event ID
  - `userId`: Filter by user ID
  - `status`: Filter by ticket status (active, used, cancelled)
- **Response**:
  ```json
  {
    "success": true,
    "count": 1,
    "pagination": { ... },
    "data": [
      {
        "id": "...",
        "eventId": "...",
        "userId": "...",
        "ticketType": "standard",
        "quantity": 2,
        "status": "active",
        "bookingDate": "2025-12-21T06:50:18.003Z",
        "totalPrice": 100,
        "createdAt": "2025-12-21T06:50:18.003Z"
      }
    ]
  }
  ```

#### POST `/api/tickets`
- **Description**: Create a new ticket booking
- **Authorization**: Yes (attendee, organizer, or admin role required)
- **Request Body**:
  ```json
  {
    "eventId": "...",
    "ticketType": "standard",
    "quantity": 2
  }
  ```
- **Validation**:
  - eventId: required
  - ticketType: required, one of ["standard", "vip", "premium"]
  - quantity: number, 1-10 (default: 1)
- **Response**:
  ```json
  {
    "message": "Ticket booked successfully",
    "ticket": { ... },
    "paymentUrl": "..." // If using payment gateway
  }
  ```

#### GET `/api/tickets/[id]`
- **Description**: Get ticket by ID
- **Authorization**: Yes (ticket owner, event organizer, or admin role required)
- **URL Parameters**: `id` - Ticket ID
- **Response**: Single ticket object

#### PUT `/api/tickets/[id]`
- **Description**: Update ticket (organizer/admin only)
- **Authorization**: Yes (admin role required)
- **URL Parameters**: `id` - Ticket ID
- **Request Body**: Fields to update
- **Response**: Updated ticket object

#### DELETE `/api/tickets/[id]`
- **Description**: Cancel ticket (attendee, organizer, or admin only)
- **Authorization**: Yes (ticket owner, event organizer, or admin role required)
- **URL Parameters**: `id` - Ticket ID
- **Response**:
  ```json
  {
    "message": "Ticket cancelled successfully"
  }
  ```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message",
  "details": "Additional details in development mode"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (authentication required)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 405: Method Not Allowed
- 500: Internal Server Error

## Environment Variables

The application requires the following environment variables:

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration time (e.g., "7d", "24h")
- `NODE_ENV`: Environment mode ("development" or "production")