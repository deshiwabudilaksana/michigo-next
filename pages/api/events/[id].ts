import type { NextApiRequest, NextApiResponse } from 'next';
import EventController from '../../../lib/controllers/EventController';
import dbConnect from '../../../lib/config/database';
import { authenticateUser, AuthenticatedRequest } from '../../../lib/middleware/auth';
import { ApiError, handleApiError } from '../../../lib/utils/errorHandler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Connect to database
  await dbConnect();

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // No authentication required for getting a single event
        (req as any).params = { id };  // Override params to match original structure
        const result = await EventController.getEventById(req as any, res as any);
        return res.status(200).json(result);

      case 'PUT':
        // Authenticate user for update
        const authResult = authenticateUser(req, res);
        if (authResult instanceof Error) {
          return res.status(401).json({ error: authResult.message });
        }

        const authenticatedReq = req as AuthenticatedRequest & NextApiRequest;
        (authenticatedReq as any).params = { id };  // Override params to match original structure

        const updateResult = await EventController.updateEvent(authenticatedReq, res as any);
        return res.status(200).json(updateResult);

      case 'DELETE':
        // Authenticate user for delete
        const authDeleteResult = authenticateUser(req, res);
        if (authDeleteResult instanceof Error) {
          return res.status(401).json({ error: authDeleteResult.message });
        }

        const authDeleteReq = req as AuthenticatedRequest & NextApiRequest;
        (authDeleteReq as any).params = { id };  // Override params to match original structure

        const deleteResult = await EventController.deleteEvent(authDeleteReq, res as any);
        return res.status(200).json(deleteResult);

      case 'PATCH':
        // Authenticate user for publish
        const authPatchResult = authenticateUser(req, res);
        if (authPatchResult instanceof Error) {
          return res.status(401).json({ error: authPatchResult.message });
        }

        const authPatchReq = req as AuthenticatedRequest & NextApiRequest;
        (authPatchReq as any).params = { id };  // Override params to match original structure

        const patchResult = await EventController.publishEvent(authPatchReq, res as any);
        return res.status(200).json(patchResult);

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE', 'PATCH']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Event detail API error:', error);
    const errorResponse = handleApiError(error as Error);
    return res.status(errorResponse.error.includes('Validation Error') ? 400 : (error as ApiError).statusCode || 500).json(errorResponse);
  }
}