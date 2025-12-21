import type { NextApiRequest, NextApiResponse } from 'next';
import UserController from '../../../lib/controllers/UserController';
import { authenticateUser, AuthenticatedRequest } from '../../../lib/middleware/auth';
import { ApiError, handleApiError } from '../../../lib/utils/errorHandler';
import jwt from 'jsonwebtoken';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Connect to database
  await import('../../../lib/config/database');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Authenticate user
    const authResult = authenticateUser(req, res);
    if (authResult instanceof Error) {
      return res.status(401).json({ error: authResult.message });
    }

    // Cast request to AuthenticatedRequest to access user property
    const authenticatedReq = req as AuthenticatedRequest;
    
    const result = await UserController.getUserProfile(authenticatedReq, undefined as any);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('User profile error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Invalid or expired token" });
    } else {
      const errorResponse = handleApiError(error);
      return res.status(errorResponse.error.includes('Validation Error') ? 400 : (error as ApiError).statusCode || 500).json(errorResponse);
    }
  }
}