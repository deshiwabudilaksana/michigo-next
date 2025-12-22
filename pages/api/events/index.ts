import type { NextApiRequest, NextApiResponse } from 'next';
import EventController from '../../../lib/controllers/EventController';
import dbConnect from '../../../lib/config/database';
import { authenticateUser, requireOrganizer, AuthenticatedRequest } from '../../../lib/middleware/auth';
import { validateEventCreation } from '../../../lib/middleware/validation';
import { ApiError, handleApiError } from '../../../lib/utils/errorHandler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Connect to database
  await dbConnect();

  try {
    switch (req.method) {
      case 'POST':
        // Authenticate user and check if they're an organizer
        const authResult = authenticateUser(req, res);
        if (authResult instanceof Error) {
          return res.status(401).json({ error: authResult.message });
        }

        const reqWithUser = req as AuthenticatedRequest & NextApiRequest;
        (reqWithUser as any).params = req.query; // Add params for compatibility
        const organizerCheck = requireOrganizer(reqWithUser, res);
        if (organizerCheck instanceof Error) {
          return res.status(403).json({ error: organizerCheck.message });
        }

        // Validate event creation data
        const validationError = validateEventCreation(req, res);
        if (validationError) {
          return res.status(400).json({ error: validationError.message || validationError });
        }

        const createResult = await EventController.createEvent(reqWithUser, res as any);
        return res.status(201).json(createResult);

      case 'GET':
        // No authentication required for getting all events
        const getAllResult = await EventController.getAllEvents(req as any, res as any);
        return res.status(200).json(getAllResult);

      default:
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Event API error:', error);
    const errorResponse = handleApiError(error as Error);
    return res.status(errorResponse.error.includes('Validation Error') ? 400 : (error as ApiError).statusCode || 500).json(errorResponse);
  }
}