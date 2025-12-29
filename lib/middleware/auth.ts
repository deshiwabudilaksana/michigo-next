import type { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import dbConnect from "../config/database";
import config from "../config/config";
import { ApiError } from "../utils/errorHandler";

// Extend NextApiRequest to include authentication properties
export interface AuthenticatedRequest extends NextApiRequest {
  userId?: string;
  user?: any; // In practice, you'd use your User type here
  params?: {
    [key: string]: string | string[];
  };
}

// Middleware to authenticate any user - returns error if authentication fails, returns undefined if success
export const authenticateUser = async (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Error | void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new ApiError("Access denied. No token provided.", 401);
    }

    // Expect format: "Bearer <token>"
    const tokenParts = authHeader.split(" ");
    if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer") {
      throw new ApiError("Invalid authorization header format", 401);
    }

    const token = tokenParts[1];

    if (!config.jwt.secret) {
      throw new ApiError("JWT secret is not configured", 500);
    }

    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };

    // Connect to DB before querying
    await dbConnect();
    const user = await User.findById(decoded.userId).select("-password");

    if (!user) {
      throw new ApiError("User not found", 404);
    }

    // Assign user info to the request object
    (req as AuthenticatedRequest).userId = decoded.userId;
    (req as AuthenticatedRequest).user = user;

    return undefined; // Success - no error
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return new ApiError("Invalid or expired token", 401);
    } else if (error instanceof ApiError) {
      return error;
    } else {
      return new ApiError((error as Error).message, 500);
    }
  }
};

// Middleware to check if user has a specific role - returns error if check fails, returns undefined if success
export const requireRole = (roles: string[]) => {
  return async (
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<Error | void> => {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      if (!authenticatedReq.user) {
        throw new ApiError("Authentication required", 401);
      }

      const hasRequiredRole = roles.some((role) =>
        authenticatedReq.user.hasRole(role)
      );

      if (!hasRequiredRole) {
        throw new ApiError("Insufficient permissions", 403);
      }

      return undefined; // Success - no error
    } catch (error) {
      if (error instanceof ApiError) {
        return error;
      } else {
        return new ApiError((error as Error).message, 500);
      }
    }
  };
};

// Middleware to check if user has 'organizer' role
export const requireOrganizer = (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Error | void> => {
  return requireRole(["organizer", "admin"])(req, res);
};

// Middleware to check if user has 'admin' role
export const requireAdmin = (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Error | void> => {
  return requireRole(["admin"])(req, res);
};

// Middleware to check if user has 'attendee' role (default role for most actions)
export const requireAttendee = (
  req: NextApiRequest,
  res: NextApiResponse
): Promise<Error | void> => {
  return requireRole(["attendee", "organizer", "admin"])(req, res);
};
