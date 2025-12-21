import { Request, Response } from "express";
import { Event } from "../models/Event";
import { User } from "../models/User";
import { ApiError } from "../utils/errorHandler";
import { AuthenticatedRequest } from "../middleware/auth";
import * as jwt from "jsonwebtoken";
import config from "../config/config";

interface EventFilters {
  category?: string;
  location?: string;
  date?: string;
  limit?: number;
  page?: number;
}

class EventController {
  // Create a new event
  async createEvent(req: AuthenticatedRequest, res: Response) {
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
        imageUrl,
        isPublished: false,
      });

      await event.save();

      return {
        message: "Event created successfully",
        event,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all events with optional filters
  async getAllEvents(req: Request, res: Response) {
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
        .limit(Number(limit))
        .skip(Number(limit) * (Number(page) - 1))
        .sort({ date: 1 });

      const total = await Event.countDocuments(filter);

      return {
        events,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit)),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get a single event by ID
  async getEventById(req: Request, res: Response) {
    try {
      const eventId = req.params?.id;
      if (!eventId) {
        throw new ApiError("Event ID is required", 400);
      }
      
      const event = await Event.findById(eventId).populate(
        "organizerId",
        "firstName lastName email roles"
      );

      if (!event) {
        throw new ApiError("Event not found", 404);
      }

      return event;
    } catch (error) {
      throw error;
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
        },
        { new: true }
      ).populate("organizerId", "firstName lastName email roles");

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
      ).populate("organizerId", "firstName lastName email roles");

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
