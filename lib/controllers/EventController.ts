import { Request, Response } from "express";
import { NextApiRequest, NextApiResponse } from "next";
import { Event } from "../models/Event";
import { User } from "../models/User";
import { Vendor } from "../models/Vendor";
import { ApiError } from "../utils/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import jwt from "jsonwebtoken";
import config from "../config/config";

// Define types that can handle both Express and Next.js patterns
type AnyRequest = Request | (NextApiRequest & { userId?: string; user?: any; params?: any });
type AnyResponse = Response | NextApiResponse;

interface EventFilters {
  category?: string;
  location?: string;
  date?: string;
  limit?: number;
  page?: number;
}

class EventController {
  // Create a new event
  async createEvent(req: AuthenticatedRequest, res?: AnyResponse | null) {
    try {
      const {
        title,
        description,
        date,
        time,
        location,
        category,
        totalTickets,
        price,
        imageUrl,
        vendorId,
      } = req.body;
      const organizerId = req.userId;

      // Verify organizer exists
      const organizer = await User.findById(organizerId);
      if (!organizer) {
        throw new ApiError("Organizer not found", 404);
      }

      // Check if user has organizer role
      if (!organizer.hasRole("organizer") && !organizer.hasRole("admin")) {
        throw new ApiError(
          "Only organizers and administrators can create events",
          403
        );
      }

      // Validate vendor - vendorId is required
      if (!vendorId) {
        throw new ApiError("Vendor ID is required", 400);
      }

      const vendor = await Vendor.findById(vendorId);
      if (!vendor) {
        throw new ApiError("Vendor not found", 404);
      }

      // Check if the vendor belongs to the current user or if the user is an admin
      if (vendor.userId.toString() !== req.userId && !req.user.hasRole("admin")) {
        throw new ApiError("Access denied. You can only use your own vendors.", 403);
      }

      const event = new Event({
        title,
        description,
        date,
        time,
        location,
        category,
        totalTickets,
        availableTickets: totalTickets,
        price,
        organizerId,
        vendorId: vendor._id,
        imageUrl,
        isPublished: false,
      });

      await event.save();

      const result = {
        message: "Event created successfully",
        event,
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

  // Get all events with optional filters
  async getAllEvents(req: AnyRequest, res?: AnyResponse | null) {
    try {
      const {
        category,
        location,
        date,
        limit = 10,
        page = 1,
      } = req.query as unknown as EventFilters;

      const filter: any = { isPublished: true }; // Only return published events

      if (category) filter.category = category;
      if (location)
        filter.location = { $regex: location as string, $options: "i" };
      if (date) filter.date = { $gte: new Date(date as string) };

      const events = await Event.find(filter)
        .populate("organizerId", "firstName lastName email roles") // Include roles in organizer info
        .populate("vendorId", "name description contactEmail contactPhone website") // Populate vendor details
        .limit(Number(limit))
        .skip(Number(limit) * (Number(page) - 1))
        .sort({ date: 1 });

      const total = await Event.countDocuments(filter);

      const result = {
        events,
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

  // Get a single event by ID
  async getEventById(req: AnyRequest, res?: AnyResponse | null) {
    try {
      const eventId = req.params?.id;
      if (!eventId) {
        throw new ApiError("Event ID is required", 400);
      }

      const event = await Event.findById(eventId)
        .populate("organizerId", "firstName lastName email roles")
        .populate("vendorId", "name description contactEmail contactPhone website"); // Populate vendor details

      if (!event) {
        throw new ApiError("Event not found", 404);
      }

      // If res is provided, send response directly (Express.js pattern)
      if (res) {
        res.status(200).json(event);
        return; // Return undefined when response is sent
      } else {
        // Otherwise return result for Next.js pattern
        return event;
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

  // Update an event (only by organizer or admin)
  async updateEvent(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        title,
        description,
        date,
        time,
        location,
        category,
        totalTickets,
        price,
        imageUrl,
        isPublished,
        vendorId,
      } = req.body;

      const eventId = req.params?.id;
      if (!eventId) {
        throw new ApiError("Event ID is required", 400);
      }

      const event = await Event.findById(eventId);

      if (!event) {
        throw new ApiError("Event not found", 404);
      }

      // Verify the current user is the organizer or an admin
      if (
        event.organizerId.toString() !== req.userId &&
        !req.user.hasRole("admin")
      ) {
        throw new ApiError(
          "Access denied. You are not the organizer of this event.",
          403
        );
      }

      // Validate vendor if vendorId is provided
      let validatedVendorId = undefined;
      if (vendorId !== undefined) { // Allow vendorId to be explicitly set to null
        if (vendorId) {
          const vendor = await Vendor.findById(vendorId);
          if (!vendor) {
            throw new ApiError("Vendor not found", 404);
          }
          // Check if the vendor belongs to the current user or if the user is an admin
          if (vendor.userId.toString() !== req.userId && !req.user.hasRole("admin")) {
            throw new ApiError("Access denied. You can only use your own vendors.", 403);
          }
          validatedVendorId = vendor._id;
        } else {
          validatedVendorId = null; // Explicitly set to null to remove vendor association
        }
      } else {
        validatedVendorId = event.vendorId; // Keep existing vendorId if not provided
      }

      const updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        {
          title,
          description,
          date,
          time,
          location,
          category,
          totalTickets,
          // Only update available tickets if total tickets changed
          ...(totalTickets !== event.totalTickets && {
            availableTickets:
              totalTickets - (event.totalTickets - event.availableTickets),
          }),
          price,
          imageUrl,
          isPublished,
          vendorId: validatedVendorId,
        },
        { new: true }
      )
      .populate("organizerId", "firstName lastName email roles")
      .populate("vendorId", "name description contactEmail contactPhone website"); // Populate vendor details

      return {
        message: "Event updated successfully",
        event: updatedEvent,
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete an event (only by organizer or admin)
  async deleteEvent(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params?.id;
      if (!eventId) {
        throw new ApiError("Event ID is required", 400);
      }

      const event = await Event.findById(eventId);

      if (!event) {
        throw new ApiError("Event not found", 404);
      }

      // Verify the current user is the organizer or an admin
      if (
        event.organizerId.toString() !== req.userId &&
        !req.user.hasRole("admin")
      ) {
        throw new ApiError(
          "Access denied. You are not the organizer of this event.",
          403
        );
      }

      await Event.findByIdAndDelete(eventId);

      return { message: "Event deleted successfully" };
    } catch (error) {
      throw error;
    }
  }

  // Publish an event (only by organizer or admin)
  async publishEvent(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params?.id;
      if (!eventId) {
        throw new ApiError("Event ID is required", 400);
      }

      const event = await Event.findById(eventId);

      if (!event) {
        throw new ApiError("Event not found", 404);
      }

      // Verify the current user is the organizer or an admin
      if (
        event.organizerId.toString() !== req.userId &&
        !req.user.hasRole("admin")
      ) {
        throw new ApiError(
          "Access denied. You are not the organizer of this event.",
          403
        );
      }

      const updatedEvent = await Event.findByIdAndUpdate(
        eventId,
        { isPublished: true },
        { new: true }
      )
      .populate("organizerId", "firstName lastName email roles")
      .populate("vendorId", "name description contactEmail contactPhone website"); // Populate vendor details

      return {
        message: "Event published successfully",
        event: updatedEvent,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default new EventController();
