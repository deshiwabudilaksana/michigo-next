import type { NextApiRequest, NextApiResponse } from 'next';
import VendorController from '@/lib/controllers/VendorController';
import dbConnect from '@/lib/config/database';
import { authenticateUser, AuthenticatedRequest } from '@/lib/middleware/auth';
import { ApiError, handleApiError } from '@/lib/utils/errorHandler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Connect to database
  await dbConnect();

  const { userId } = req.query;

  if (typeof userId !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Authentication required to get vendors by user
        const getAuthResult = authenticateUser(req, res);
        if (getAuthResult instanceof Error) {
          return res.status(401).json({ error: getAuthResult.message });
        }

        const getReq = req as AuthenticatedRequest & NextApiRequest;
        (getReq as any).params = { userId };  // Override params to match original structure

        const result = await VendorController.getVendorsByUser(getReq, res as any);
        return res.status(200).json(result);

      default:
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Get vendors by user API error:', error);
    const errorResponse = handleApiError(error as Error);
    return res.status(errorResponse.error.includes('Validation Error') ? 400 : (error as ApiError).statusCode || 500).json(errorResponse);
  }
}