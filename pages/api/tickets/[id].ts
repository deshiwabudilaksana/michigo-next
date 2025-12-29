import type { NextApiRequest, NextApiResponse } from "next";
import TicketController from "@/lib/controllers/TicketController";
import dbConnect from "@/lib/config/database";
import { authenticateUser, AuthenticatedRequest } from "@/lib/middleware/auth";
import { ApiError, handleApiError } from "@/lib/utils/errorHandler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Connect to database
  await dbConnect();

  const { id } = req.query;

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Ticket ID is required" });
  }

  try {
    switch (req.method) {
      case "GET":
        // No authentication required for getting a single ticket initially
        // The controller will check permissions based on the ticket owner, event organizer, or admin
        (req as any).params = { id }; // Override params to match original structure
        const result = await TicketController.getTicketById(
          req as any,
          res as any
        );
        return res.status(200).json(result);

      case "PUT":
        // Authenticate user for update
        const authResult = await authenticateUser(req, res);
        if (authResult instanceof Error) {
          return res.status(401).json({ error: authResult.message });
        }

        const authenticatedReq = req as AuthenticatedRequest & NextApiRequest;
        (authenticatedReq as any).params = { id }; // Override params to match original structure

        const updateResult = await TicketController.updateTicket(
          authenticatedReq,
          res as any
        );
        return res.status(200).json(updateResult);

      case "DELETE":
        // Authenticate user for delete
        const authDeleteResult = await authenticateUser(req, res);
        if (authDeleteResult instanceof Error) {
          return res.status(401).json({ error: authDeleteResult.message });
        }

        const authDeleteReq = req as AuthenticatedRequest & NextApiRequest;
        (authDeleteReq as any).params = { id }; // Override params to match original structure

        const deleteResult = await TicketController.deleteTicket(
          authDeleteReq,
          res as any
        );
        return res.status(200).json(deleteResult);

      default:
        res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
        return res
          .status(405)
          .json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error("Ticket detail API error:", error);
    const errorResponse = handleApiError(error as Error);
    return res
      .status(
        errorResponse.error.includes("Validation Error")
          ? 400
          : (error as ApiError).statusCode || 500
      )
      .json(errorResponse);
  }
}
