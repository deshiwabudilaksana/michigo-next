import { Request, Response } from "express";
import { NextApiRequest, NextApiResponse } from "next";
import { Vendor } from "../models/Vendor";
import { User } from "../models/User";
import { ApiError } from "../utils/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";

// Define types that can handle both Express and Next.js patterns
type AnyRequest = Request | (NextApiRequest & { userId?: string; user?: any; params?: any });
type AnyResponse = Response | NextApiResponse;

interface VendorFilters {
  name?: string;
  limit?: number;
  page?: number;
}

class VendorController {
  // Create a new vendor
  async createVendor(req: AuthenticatedRequest, res?: AnyResponse | null): Promise<any> {
    try {
      const {
        name,
        description,
        contactEmail,
        contactPhone,
        website,
        address,
        businessLicense,
        taxId,
        profileImage,
        socialMedia,
        businessHours,
        categories,
        paymentMethods,
        businessType,
      } = req.body;

      // Verify user exists
      const user = await User.findById(req.userId);
      if (!user) {
        throw new ApiError("User not found", 404);
      }

      // Check if user has organizer or admin role
      if (!user.hasRole("organizer") && !user.hasRole("admin")) {
        throw new ApiError(
          "Only organizers and administrators can create vendors",
          403
        );
      }

      // Check if vendor with same name already exists for this user
      const existingVendor = await Vendor.findOne({
        name,
        userId: req.userId,
      });
      if (existingVendor) {
        throw new ApiError("You already have a vendor with this name", 409);
      }

      const vendor = new Vendor({
        name,
        description,
        contactEmail,
        contactPhone,
        website,
        address,
        businessLicense,
        taxId,
        profileImage,
        socialMedia,
        businessHours,
        categories,
        paymentMethods,
        businessType,
        userId: req.userId,
      });

      await vendor.save();

      const result = {
        message: "Vendor created successfully",
        vendor,
      };

      // If res is provided, send response directly (Express.js pattern)
      if (res) {
        res.status(201).json(result);
        return; // Return undefined when response is sent
      } else {
        // Otherwise return result for Next.js pattern
        return result;
      }
    } catch (error) {
      // If res is provided, send error response directly (Express.js pattern)
      if (res) {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: "Internal Server Error" });
        }
        return; // Return undefined when response is sent
      } else {
        // Otherwise throw error for Next.js pattern to handle
        throw error;
      }
    }
  }

  // Get all vendors with optional filters
  async getAllVendors(req: AnyRequest, res?: AnyResponse | null): Promise<any> {
    try {
      const {
        name,
        limit = 10,
        page = 1,
      } = req.query as unknown as VendorFilters;

      const filter: any = {};

      if (name) {
        filter.name = { $regex: name as string, $options: "i" };
      }

      // If user is not admin, only return vendors owned by the current user
      if ((req as AuthenticatedRequest).user && !(req as AuthenticatedRequest).user.hasRole("admin")) {
        filter.userId = (req as AuthenticatedRequest).userId;
      }

      const vendors = await Vendor.find(filter)
        .populate("userId", "firstName lastName email roles")
        .limit(Number(limit))
        .skip(Number(limit) * (Number(page) - 1))
        .sort({ name: 1 });

      const total = await Vendor.countDocuments(filter);

      const result = {
        vendors,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      };

      // If res is provided, send response directly (Express.js pattern)
      if (res) {
        res.status(200).json(result);
        return; // Return undefined when response is sent
      } else {
        // Otherwise return result for Next.js pattern
        return result;
      }
    } catch (error) {
      // If res is provided, send error response directly (Express.js pattern)
      if (res) {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: "Internal Server Error" });
        }
        return; // Return undefined when response is sent
      } else {
        // Otherwise throw error for Next.js pattern to handle
        throw error;
      }
    }
  }

  // Get a single vendor by ID
  async getVendorById(req: AnyRequest, res?: AnyResponse | null): Promise<any> {
    try {
      const vendorId = req.params?.id;
      if (!vendorId) {
        throw new ApiError("Vendor ID is required", 400);
      }

      const vendor = await Vendor.findById(vendorId).populate(
        "userId",
        "firstName lastName email roles"
      );

      if (!vendor) {
        throw new ApiError("Vendor not found", 404);
      }

      // Check if user has permission to view this vendor
      if ((req as AuthenticatedRequest).user &&
          !(req as AuthenticatedRequest).user.hasRole("admin") &&
          vendor.userId.toString() !== (req as AuthenticatedRequest).user._id.toString()) {
        throw new ApiError("Access denied. You can only view your own vendors.", 403);
      }

      // If res is provided, send response directly (Express.js pattern)
      if (res) {
        res.status(200).json(vendor);
        return; // Return undefined when response is sent
      } else {
        // Otherwise return result for Next.js pattern
        return vendor;
      }
    } catch (error) {
      // If res is provided, send error response directly (Express.js pattern)
      if (res) {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: "Internal Server Error" });
        }
        return; // Return undefined when response is sent
      } else {
        // Otherwise throw error for Next.js pattern to handle
        throw error;
      }
    }
  }

  // Update a vendor (only by vendor owner or admin)
  async updateVendor(req: AuthenticatedRequest, res?: AnyResponse | null): Promise<any> {
    try {
      const {
        name,
        description,
        contactEmail,
        contactPhone,
        website,
        address,
        businessLicense,
        taxId,
        profileImage,
        socialMedia,
        businessHours,
        categories,
        paymentMethods,
        businessType,
        isActive,
      } = req.body;

      const vendorId = req.params?.id;
      if (!vendorId) {
        throw new ApiError("Vendor ID is required", 400);
      }

      const vendor = await Vendor.findById(vendorId);

      if (!vendor) {
        throw new ApiError("Vendor not found", 404);
      }

      // Verify the current user is the vendor owner or an admin
      if (
        vendor.userId.toString() !== req.userId &&
        !req.user.hasRole("admin")
      ) {
        throw new ApiError(
          "Access denied. You are not the owner of this vendor.",
          403
        );
      }

      const updatedVendor = await Vendor.findByIdAndUpdate(
        vendorId,
        {
          name,
          description,
          contactEmail,
          contactPhone,
          website,
          address,
          businessLicense,
          taxId,
          profileImage,
          socialMedia,
          businessHours,
          categories,
          paymentMethods,
          businessType,
          isActive,
        },
        { new: true }
      ).populate("userId", "firstName lastName email roles");

      const result = {
        message: "Vendor updated successfully",
        vendor: updatedVendor,
      };

      // If res is provided, send response directly (Express.js pattern)
      if (res) {
        res.status(200).json(result);
        return; // Return undefined when response is sent
      } else {
        // Otherwise return result for Next.js pattern
        return result;
      }
    } catch (error) {
      // If res is provided, send error response directly (Express.js pattern)
      if (res) {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: "Internal Server Error" });
        }
        return; // Return undefined when response is sent
      } else {
        // Otherwise throw error for Next.js pattern to handle
        throw error;
      }
    }
  }

  // Delete a vendor (only by vendor owner or admin)
  async deleteVendor(req: AuthenticatedRequest, res?: AnyResponse | null): Promise<any> {
    try {
      const vendorId = req.params?.id;
      if (!vendorId) {
        throw new ApiError("Vendor ID is required", 400);
      }

      const vendor = await Vendor.findById(vendorId);

      if (!vendor) {
        throw new ApiError("Vendor not found", 404);
      }

      // Verify the current user is the vendor owner or an admin
      if (
        vendor.userId.toString() !== req.userId &&
        !req.user.hasRole("admin")
      ) {
        throw new ApiError(
          "Access denied. You are not the owner of this vendor.",
          403
        );
      }

      await Vendor.findByIdAndDelete(vendorId);

      const result = { message: "Vendor deleted successfully" };

      // If res is provided, send response directly (Express.js pattern)
      if (res) {
        res.status(200).json(result);
        return; // Return undefined when response is sent
      } else {
        // Otherwise return result for Next.js pattern
        return result;
      }
    } catch (error) {
      // If res is provided, send error response directly (Express.js pattern)
      if (res) {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: "Internal Server Error" });
        }
        return; // Return undefined when response is sent
      } else {
        // Otherwise throw error for Next.js pattern to handle
        throw error;
      }
    }
  }

  // Get vendors by user ID
  async getVendorsByUser(req: AnyRequest, res?: AnyResponse | null): Promise<any> {
    try {
      const userId = req.params?.userId;
      if (!userId) {
        throw new ApiError("User ID is required", 400);
      }

      // Check if user is requesting their own vendors or is an admin
      const requestingUser = (req as AuthenticatedRequest).user;
      if (
        requestingUser &&
        userId !== requestingUser._id.toString() &&
        !requestingUser.hasRole("admin")
      ) {
        throw new ApiError(
          "Access denied. You can only view your own vendors.",
          403
        );
      }

      const vendors = await Vendor.find({ userId }).populate(
        "userId",
        "firstName lastName email roles"
      );

      const result = { vendors };

      // If res is provided, send response directly (Express.js pattern)
      if (res) {
        res.status(200).json(result);
        return; // Return undefined when response is sent
      } else {
        // Otherwise return result for Next.js pattern
        return result;
      }
    } catch (error) {
      // If res is provided, send error response directly (Express.js pattern)
      if (res) {
        if (error instanceof ApiError) {
          res.status(error.statusCode).json({ error: error.message });
        } else {
          res.status(500).json({ error: "Internal Server Error" });
        }
        return; // Return undefined when response is sent
      } else {
        // Otherwise throw error for Next.js pattern to handle
        throw error;
      }
    }
  }
}

export default new VendorController();