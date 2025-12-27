import { NextApiRequest, NextApiResponse } from 'next';
import { AuthenticatedRequest } from '../middleware/auth';

/**
 * Adapts a Next.js API request to work with controllers that expect Express.js-like parameters
 */
export const adaptNextRequest = (
  req: NextApiRequest,
  additionalParams: Record<string, any> = {}
): AuthenticatedRequest => {
  // Create a request object that combines Next.js req with additional parameters
  const adaptedReq = {
    ...req,
    // Add params from additionalParams or query
    params: additionalParams,
    // Ensure we have userId and user if they exist in the original request
    userId: (req as any).userId,
    user: (req as any).user,
    // Add body and query if not already present
    body: req.body,
    query: req.query,
    // Add headers
    headers: req.headers,
  } as AuthenticatedRequest;

  return adaptedReq;
};

/**
 * Handles the response from controllers and sends it via Next.js response
 */
export const handleControllerResponse = (
  res: NextApiResponse,
  controllerResult: any,
  successStatusCode: number = 200
) => {
  if (controllerResult && typeof controllerResult === 'object' && controllerResult.message) {
    // If the result has a message, it might be an error response
    if (controllerResult.error) {
      const statusCode = controllerResult.statusCode || 400;
      return res.status(statusCode).json(controllerResult);
    }
  }

  // For successful responses
  return res.status(successStatusCode).json(controllerResult);
};