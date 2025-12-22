import type { NextApiRequest, NextApiResponse } from 'next';
import UserController from '@/lib/controllers/UserController';
import dbConnect from '@/lib/config/database';
import { validateUserRegistration, validateUserLogin } from '@/lib/middleware/validation';
import { ApiError, handleApiError } from '@/lib/utils/errorHandler';
import { authenticateUser, AuthenticatedRequest } from '@/lib/middleware/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Connect to database
  await dbConnect();

  try {
    switch (req.method) {
      case 'POST':
        if (req.query.register !== undefined) {
          // Handle registration
          const validationError = validateUserRegistration(req, res);
          if (validationError) {
            return res.status(400).json({ error: validationError.message || validationError });
          }

          const result = await UserController.registerUser(req as any, undefined as any);
          return res.status(201).json(result);
        } else if (req.query.login !== undefined) {
          // Handle login
          const validationError = validateUserLogin(req, res);
          if (validationError) {
            return res.status(400).json({ error: validationError.message || validationError });
          }

          const result = await UserController.loginUser(req as any, undefined as any);
          return res.status(200).json(result);
        } else {
          return res.status(400).json({ error: 'Invalid endpoint' });
        }

      case 'GET':
        // Authenticate user for profile route
        const authResult = authenticateUser(req, res);
        if (authResult instanceof Error) {
          return res.status(401).json({ error: authResult.message });
        }

        // Get user profile
        const authenticatedReq = req as AuthenticatedRequest;
        const result = await UserController.getUserProfile(authenticatedReq, undefined as any);
        return res.status(200).json(result);

      case 'PATCH':
        // Authenticate user
        const authResult2 = authenticateUser(req, res);
        if (authResult2 instanceof Error) {
          return res.status(401).json({ error: authResult2.message });
        }

        // Check if user is admin
        const patchAuthenticatedReq = req as AuthenticatedRequest;
        if (!patchAuthenticatedReq.user?.hasRole || !patchAuthenticatedReq.user.hasRole('admin')) {
          throw new ApiError('Access denied. Admin privileges required.', 403);
        }

        // Create a request object that matches what the controller expects
        const controllerReq = {
          ...req,
          params: { userId: req.query.userId as string },
          user: patchAuthenticatedReq.user,
          userId: patchAuthenticatedReq.userId,
        } as any;

        // Update user roles - note: this route is deprecated in favor of the [userId]/roles route
        const updateResult = await UserController.updateUserRoles(controllerReq, undefined as any);
        return res.status(200).json(updateResult);

      default:
        res.setHeader('Allow', ['POST', 'GET', 'PATCH']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('User API error:', error);
    const errorResponse = handleApiError(error as Error);
    return res.status(errorResponse.error.includes('Validation Error') ? 400 : (error as ApiError).statusCode || 500).json(errorResponse);
  }
}

// Add a special endpoint for login since Next.js doesn't support multiple POST handlers
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};