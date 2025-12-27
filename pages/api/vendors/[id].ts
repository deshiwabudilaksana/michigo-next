import type { NextApiRequest, NextApiResponse } from 'next';
import VendorController from '@/lib/controllers/VendorController';
import dbConnect from '@/lib/config/database';
import { authenticateUser, AuthenticatedRequest } from '@/lib/middleware/auth';
import { ApiError, handleApiError } from '@/lib/utils/errorHandler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Connect to database
  await dbConnect();

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Vendor ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        // Authentication required to get a single vendor
        const getAuthResult = authenticateUser(req, res);
        if (getAuthResult instanceof Error) {
          return res.status(401).json({ error: getAuthResult.message });
        }

        const getReq = req as AuthenticatedRequest & NextApiRequest;
        (getReq as any).params = { id };  // Override params to match original structure

        const result = await VendorController.getVendorById(getReq, res as any);
        return res.status(200).json(result);

      case 'PUT':
        // Authenticate user for update
        const authResult = authenticateUser(req, res);
        if (authResult instanceof Error) {
          return res.status(401).json({ error: authResult.message });
        }

        const authenticatedReq = req as AuthenticatedRequest & NextApiRequest;
        (authenticatedReq as any).params = { id };  // Override params to match original structure

        const updateResult = await VendorController.updateVendor(authenticatedReq, res as any);
        return res.status(200).json(updateResult);

      case 'DELETE':
        // Authenticate user for delete
        const authDeleteResult = authenticateUser(req, res);
        if (authDeleteResult instanceof Error) {
          return res.status(401).json({ error: authDeleteResult.message });
        }

        const authDeleteReq = req as AuthenticatedRequest & NextApiRequest;
        (authDeleteReq as any).params = { id };  // Override params to match original structure

        const deleteResult = await VendorController.deleteVendor(authDeleteReq, res as any);
        return res.status(200).json(deleteResult);

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Vendor detail API error:', error);
    const errorResponse = handleApiError(error as Error);
    return res.status(errorResponse.error.includes('Validation Error') ? 400 : (error as ApiError).statusCode || 500).json(errorResponse);
  }
}