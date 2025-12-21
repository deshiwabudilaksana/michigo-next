import type { NextApiRequest, NextApiResponse } from 'next';
import UserController from '../../../lib/controllers/UserController';
import { validateUserRegistration } from '../../../lib/middleware/validation';
import { ApiError, handleApiError } from '../../../lib/utils/errorHandler';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Connect to database
  await import('../../../lib/config/database');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate registration data
    const validationError = validateUserRegistration(req, res);
    if (validationError) {
      return res.status(400).json({ error: validationError.message || validationError });
    }

    const result = await UserController.registerUser(req as any, undefined as any);
    return res.status(201).json(result);
  } catch (error) {
    console.error('User registration error:', error);
    const errorResponse = handleApiError(error as Error);
    return res.status(errorResponse.error.includes('Validation Error') ? 400 : (error as ApiError).statusCode || 500).json(errorResponse);
  }
}