// Custom error class for API errors
export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error response interface
export interface ErrorResponse {
  success: boolean;
  error: string;
  details?: any;
}

// Error handler function for Next.js API routes
export const handleApiError = (
  err: Error,
  statusCode: number = 500,
  message: string = 'Internal Server Error'
): { success: boolean; error: string; details?: any } => {
  // If it's an instance of ApiError, use its properties
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Handle specific Mongoose errors using type assertion for known properties
  const error = err as any;
  
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors || {}).map((error: any) => error.message);
    statusCode = 400;
    message = `Validation Error: ${errors.join(', ')}`;
  } else if (error.code === 11000) {
    // Handle duplicate key errors
    const field = Object.keys(error.keyValue || {})[0];
    statusCode = 400;
    message = `Duplicate field value: ${field}`;
  } else if (error.name === 'CastError') {
    // Handle invalid object IDs
    statusCode = 400;
    message = `Invalid ${error.path || 'id'}: ${error.value || 'value'}`;
  }

  const response: { success: boolean; error: string; details?: any } = {
    success: false,
    error: message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.details = error.stack;
  }

  return response;
};