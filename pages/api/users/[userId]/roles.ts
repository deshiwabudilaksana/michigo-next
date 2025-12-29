import type { NextApiRequest, NextApiResponse } from "next";
import UserController from "@/lib/controllers/UserController";
import dbConnect from "@/lib/config/database";
import { authenticateUser, AuthenticatedRequest } from "@/lib/middleware/auth";
import { ApiError, handleApiError } from "@/lib/utils/errorHandler";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Connect to database
  await dbConnect();

  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Authenticate user
    const authResult = await authenticateUser(req, res);
    if (authResult instanceof Error) {
      return res.status(401).json({ error: authResult.message });
    }

    // Check if user is admin
    const authenticatedReq = req as AuthenticatedRequest;
    console.log("Authenticated user roles:", authenticatedReq.user?.roles);
    if (
      !authenticatedReq.user?.hasRole ||
      !authenticatedReq.user.hasRole("admin")
    ) {
      throw new ApiError("Access denied. Admin privileges required.", 403);
    }

    const { userId } = req.query;
    if (!userId || typeof userId !== "string") {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Create a request object that matches what the controller expects
    const controllerReq = {
      ...req,
      params: { userId },
      user: authenticatedReq.user,
      userId: authenticatedReq.userId,
    } as any;

    // Call controller without passing response object, since controllers return data
    const result = await UserController.updateUserRoles(
      controllerReq,
      undefined as any
    );
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Update user roles error:", error);
    const errorResponse = handleApiError(error);
    return res
      .status(
        errorResponse.error.includes("Validation Error")
          ? 400
          : (error as ApiError).statusCode || 500
      )
      .json(errorResponse);
  }
}
