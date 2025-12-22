import type { NextApiRequest, NextApiResponse } from 'next';
import TicketController from '../../../lib/controllers/TicketController';
import dbConnect from '../../../lib/config/database';
import { authenticateUser, AuthenticatedRequest } from '../../../lib/middleware/auth';
import { ApiError, handleApiError } from '../../../lib/utils/errorHandler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Connect to database
  await dbConnect();

  try {
    switch (req.method) {
      case 'POST':
        // Authenticate user for creating tickets
        const authResult = authenticateUser(req, res);
        if (authResult instanceof Error) {
          return res.status(401).json({ error: authResult.message });
        }

        // Add params to the request to make it compatible with the controller
        const authenticatedReq = req as AuthenticatedRequest & NextApiRequest;
        (authenticatedReq as any).params = req.query;

        const result = await TicketController.createTicket(authenticatedReq, res as any);
        return res.status(201).json(result);

      case 'GET':
        // No authentication required for getting tickets
        // For this route, we need to check if the user is authenticated to determine access
        const allTicketsResult = await TicketController.getAllTickets(req as any, res as any);
        return res.status(200).json(allTicketsResult);

      default:
        res.setHeader('Allow', ['POST', 'GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Ticket API error:', error);
    const errorResponse = handleApiError(error as Error);
    return res.status(errorResponse.error.includes('Validation Error') ? 400 : (error as ApiError).statusCode || 500).json(errorResponse);
  }
}