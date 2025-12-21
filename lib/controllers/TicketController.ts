import { Request, Response } from "express";
import { Ticket } from "../models/Ticket";
import { Event } from "../models/Event";
import { Order } from "../models/Order";
import { User } from "../models/User";
import { AuthenticatedRequest } from "../middleware/auth";
import { ApiError } from "../utils/errorHandler";
import midtransClient from "midtrans-client";

class TicketController {
  // Get all tickets for a specific user (user can only view their own tickets unless admin)
  async getUserTickets(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.params?.userId;
      if (!userId) {
        throw new ApiError("User ID is required", 400);
      }

      // Check if the requesting user is trying to access their own tickets or is an admin
      if (req.userId !== userId && !req.user.hasRole("admin")) {
        throw new ApiError(
          "Access denied. You can only view your own tickets.",
          403
        );
      }

      const tickets = await Ticket.find({ userId })
        .populate("eventId", "title date location")
        .sort({ createdAt: -1 });

      return tickets;
    } catch (error) {
      throw error;
    }
  }

  // Get all tickets for a specific event (organizer or admin only)
  async getEventTickets(req: AuthenticatedRequest, res: Response) {
    try {
      const eventId = req.params?.eventId;
      if (!eventId) {
        throw new ApiError("Event ID is required", 400);
      }

      // Find the event to check if the user is the organizer
      const event = await Event.findById(eventId).populate("organizerId");

      if (!event) {
        throw new ApiError("Event not found", 404);
      }

      // Check if the user is the organizer, an admin, or an attendee of this event
      const isOrganizer = event.organizerId.toString() === req.userId;
      const isAdmin = req.user.hasRole("admin");
      const isAttendee =
        (await Ticket.findOne({ eventId, userId: req.userId })) !== null;

      if (!isOrganizer && !isAdmin && !isAttendee) {
        throw new ApiError(
          "Access denied. You must be the organizer, admin, or an attendee of this event.",
          403
        );
      }

      let ticketsQuery;
      if (isOrganizer || isAdmin) {
        // Organizers and admins can see all tickets for the event
        ticketsQuery = Ticket.find({ eventId }).populate(
          "userId",
          "firstName lastName email"
        );
      } else {
        // Attendees can only see their own tickets for the event
        ticketsQuery = Ticket.find({ eventId, userId: req.userId }).populate(
          "userId",
          "firstName lastName email"
        );
      }

      const tickets = await ticketsQuery;

      return tickets;
    } catch (error) {
      throw error;
    }
  }

  // Book a ticket
  async bookTicket(req: AuthenticatedRequest, res: Response) {
    try {
      const { eventId, ticketType, quantity = 1 } = req.body;
      const userId = req.userId; // Get user ID from authenticated request

      // Validate quantity
      if (quantity < 1) {
        throw new ApiError("Quantity must be at least 1", 400);
      }

      if (quantity > 10) {
        throw new ApiError("Maximum quantity per booking is 10", 400);
      }

      // Find the event
      const event = await Event.findById(eventId);
      if (!event) {
        throw new ApiError("Event not found", 404);
      }

      // Check if the event is published
      if (!event.isPublished) {
        throw new ApiError("Cannot book tickets for an unpublished event", 400);
      }

      // Check if there are enough available tickets
      if (event.availableTickets < quantity) {
        throw new ApiError("Not enough tickets available", 400);
      }

      // Calculate total amount
      const totalAmount = event.price * quantity;

      // Create tickets
      const tickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticket = new Ticket({
          eventId,
          userId,
          ticketType,
          price: event.price,
          bookingDate: new Date(),
          qrCode: `TICKET-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}`, // Create a unique QR code
        });

        await ticket.save();
        tickets.push(ticket._id);
      }

      // Update available tickets count
      event.availableTickets -= quantity;
      await event.save();

      // Create order
      const order = new Order({
        userId,
        tickets,
        totalAmount,
        paymentMethod: "credit_card", // This would come from payment gateway in a real app
        paymentStatus: "completed", // Assuming payment is handled separately
      });

      await order.save();

      return {
        message: `${quantity} ticket(s) booked successfully`,
        tickets,
        order: order._id,
      };
    } catch (error) {
      throw error;
    }
  }

  // Cancel a ticket (user can only cancel their own tickets, organizer/admin can cancel any ticket for their event)
  async cancelTicket(req: AuthenticatedRequest, res: Response) {
    try {
      const ticketId = req.params?.id;
      if (!ticketId) {
        throw new ApiError("Ticket ID is required", 400);
      }

      const ticket = await Ticket.findById(ticketId).populate("eventId");
      if (!ticket) {
        throw new ApiError("Ticket not found", 404);
      }

      // Check if the user is the ticket owner, the event organizer, or an admin
      const isTicketOwner = ticket.userId.toString() === req.userId;

      let isEventOrganizer = false;
      if (ticket.eventId) {
        const event = await Event.findById(ticket.eventId);
        if (event) {
          isEventOrganizer = event.organizerId.toString() === req.userId;
        }
      }

      const isAdmin = req.user.hasRole("admin");

      if (!isTicketOwner && !isEventOrganizer && !isAdmin) {
        throw new ApiError(
          "Access denied. You can only cancel your own tickets.",
          403
        );
      }

      if (ticket.status === "cancelled") {
        throw new ApiError("Ticket already cancelled", 400);
      }

      // Update ticket status
      const originalStatus = ticket.status; // Keep track of the original status before cancellation
      ticket.status = "cancelled";
      await ticket.save();

      // Update available tickets for the event (only if the ticket was confirmed/used)
      if (originalStatus !== "reserved") {
        await Event.findByIdAndUpdate(ticket.eventId, {
          $inc: { availableTickets: 1 },
        });
      }

      return {
        message: "Ticket cancelled successfully",
        ticket,
      };
    } catch (error) {
      throw error;
    }
  }

  // Check-in a ticket (only event organizers or admins)
  async checkinTicket(req: AuthenticatedRequest, res: Response) {
    try {
      const ticketId = req.params?.id;
      if (!ticketId) {
        throw new ApiError("Ticket ID is required", 400);
      }

      const ticket = await Ticket.findById(ticketId).populate("eventId");
      if (!ticket) {
        throw new ApiError("Ticket not found", 404);
      }

      // Check if the user is the event organizer or an admin
      let isEventOrganizer = false;
      if (ticket.eventId) {
        const event = await Event.findById(ticket.eventId);
        if (event) {
          isEventOrganizer = event.organizerId.toString() === req.userId;
        }
      }

      const isAdmin = req.user.hasRole("admin");

      if (!isEventOrganizer && !isAdmin) {
        throw new ApiError(
          "Access denied. Only event organizers and admins can check in tickets.",
          403
        );
      }

      // Only allow check-in for confirmed tickets (not already used or cancelled)
      if (ticket.status === "used") {
        throw new ApiError("Ticket already checked in", 400);
      }
      if (ticket.status === "cancelled") {
        throw new ApiError("Cannot check in a cancelled ticket", 400);
      }

      ticket.status = "used";
      await ticket.save();

      return {
        message: "Ticket checked in successfully",
        ticket,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get ticket by QR code (for event check-in systems, accessible by organizers/admins)
  async getTicketByQRCode(req: AuthenticatedRequest, res: Response) {
    try {
      const qrCode = req.params?.qrCode;
      if (!qrCode) {
        throw new ApiError("QR Code is required", 400);
      }

      const ticket = await Ticket.findOne({ qrCode })
        .populate("userId", "firstName lastName email")
        .populate("eventId", "title date time location organizerId");

      if (!ticket) {
        throw new ApiError("Ticket not found", 404);
      }

      // Check if the user is the event organizer or an admin
      let isEventOrganizer = false;
      if (ticket.eventId) {
        // If eventId is populated, it will be an object with organizerId
        // If not populated, it will be an ObjectId string
        if (
          typeof ticket.eventId !== "string" &&
          (ticket.eventId as any).organizerId
        ) {
          isEventOrganizer =
            (ticket.eventId as any).organizerId.toString() === req.userId;
        } else {
          // If not populated, we need to fetch the event to check organizer
          const event = await Event.findById(ticket.eventId).populate(
            "organizerId"
          );
          if (event) {
            isEventOrganizer = event.organizerId.toString() === req.userId;
          }
        }
      }

      const isAdmin = req.user.hasRole("admin");

      if (!isEventOrganizer && !isAdmin) {
        throw new ApiError(
          "Access denied. Only event organizers and admins can scan tickets.",
          403
        );
      }

      return ticket;
    } catch (error) {
      throw error;
    }
  }

  // Get ticket by ID
  async getTicketById(req: AuthenticatedRequest, res: Response) {
    try {
      const ticketId = req.params?.id;
      if (!ticketId) {
        throw new ApiError("Ticket ID is required", 400);
      }

      const ticket = await Ticket.findById(ticketId)
        .populate("userId", "firstName lastName email")
        .populate("eventId", "title date time location");

      if (!ticket) {
        throw new ApiError("Ticket not found", 404);
      }

      // Check if the user is the ticket owner, the event organizer, or an admin
      const isTicketOwner = ticket.userId._id.toString() === req.userId;

      let isEventOrganizer = false;
      if (ticket.eventId) {
        const event = await Event.findById(ticket.eventId._id);
        if (event) {
          isEventOrganizer = event.organizerId.toString() === req.userId;
        }
      }

      const isAdmin = req.user.hasRole("admin");

      if (!isTicketOwner && !isEventOrganizer && !isAdmin) {
        throw new ApiError(
          "Access denied. You can only view your own tickets or tickets for your events.",
          403
        );
      }

      return ticket;
    } catch (error) {
      throw error;
    }
  }

  // Update ticket
  async updateTicket(req: AuthenticatedRequest, res: Response) {
    try {
      const ticketId = req.params?.id;
      if (!ticketId) {
        throw new ApiError("Ticket ID is required", 400);
      }
      
      const updateData = req.body;

      // Don't allow updating sensitive fields
      const { eventId, userId, ...allowedUpdateData } = updateData;

      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        throw new ApiError("Ticket not found", 404);
      }

      // Check if the user is the event organizer, or an admin
      let isEventOrganizer = false;
      if (ticket.eventId) {
        const event = await Event.findById(ticket.eventId);
        if (event) {
          isEventOrganizer = event.organizerId.toString() === req.userId;
        }
      }

      const isAdmin = req.user.hasRole("admin");

      if (!isEventOrganizer && !isAdmin) {
        throw new ApiError(
          "Access denied. Only event organizers and admins can update tickets.",
          403
        );
      }

      // Update ticket with allowed data
      Object.assign(ticket, allowedUpdateData);
      await ticket.save();

      return {
        message: "Ticket updated successfully",
        ticket,
      };
    } catch (error) {
      throw error;
    }
  }

  // Delete ticket
  async deleteTicket(req: AuthenticatedRequest, res: Response) {
    try {
      const ticketId = req.params?.id;
      if (!ticketId) {
        throw new ApiError("Ticket ID is required", 400);
      }

      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        throw new ApiError("Ticket not found", 404);
      }

      // Check if the user is the event organizer, or an admin
      let isEventOrganizer = false;
      if (ticket.eventId) {
        const event = await Event.findById(ticket.eventId);
        if (event) {
          isEventOrganizer = event.organizerId.toString() === req.userId;
        }
      }

      const isAdmin = req.user.hasRole("admin");

      if (!isEventOrganizer && !isAdmin) {
        throw new ApiError(
          "Access denied. Only event organizers and admins can delete tickets.",
          403
        );
      }

      // Update available tickets for the event before deleting
      if (ticket.status !== "cancelled") {
        await Event.findByIdAndUpdate(ticket.eventId, {
          $inc: { availableTickets: 1 },
        });
      }

      await ticket.deleteOne();

      return {
        message: "Ticket deleted successfully",
        ticket,
      };
    } catch (error) {
      throw error;
    }
  }

  // Get all tickets (for admin/organizer)
  async getAllTickets(req: AuthenticatedRequest, res: Response) {
    try {
      // Check if the user is an admin or organizer
      const isAdmin = req.user.hasRole("admin");
      const isOrganizer = req.user.hasRole("organizer");

      if (!isAdmin && !isOrganizer) {
        throw new ApiError(
          "Access denied. Only admins and organizers can view all tickets.",
          403
        );
      }

      const tickets = await Ticket.find()
        .populate("userId", "firstName lastName email")
        .populate("eventId", "title date time location");

      return tickets;
    } catch (error) {
      throw error;
    }
  }

  // Create ticket (for admin/organizer)
  async createTicket(req: AuthenticatedRequest, res: Response) {
    try {
      const { eventId, ticketType, quantity = 1, price } = req.body;

      // Check if the user is an admin or organizer
      const isAdmin = req.user.hasRole("admin");
      const isOrganizer = req.user.hasRole("organizer");

      if (!isAdmin && !isOrganizer) {
        throw new ApiError(
          "Access denied. Only admins and organizers can create tickets.",
          403
        );
      }

      // Find the event to check if the user is the organizer
      const event = await Event.findById(eventId);
      if (!event) {
        throw new ApiError("Event not found", 404);
      }

      if (event.organizerId.toString() !== req.userId && !isAdmin) {
        throw new ApiError(
          "Access denied. You must be the event organizer or an admin.",
          403
        );
      }

      // Validate quantity
      if (quantity < 1) {
        throw new ApiError("Quantity must be at least 1", 400);
      }

      if (quantity > 100) {
        throw new ApiError("Maximum quantity per batch is 100", 400);
      }

      // Check if there are enough available tickets
      if (event.availableTickets < quantity) {
        throw new ApiError("Not enough tickets available", 400);
      }

      // Create tickets
      const tickets = [];
      for (let i = 0; i < quantity; i++) {
        const ticket = new Ticket({
          eventId,
          userId: req.userId, // For created tickets, assign to the organizer
          ticketType,
          price: price || event.price,
          bookingDate: new Date(),
          status: "reserved", // Initially reserved by the organizer
          qrCode: `TICKET-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}`, // Create a unique QR code
        });

        await ticket.save();
        tickets.push(ticket._id);
      }

      // Update available tickets count
      event.availableTickets -= quantity;
      await event.save();

      return {
        message: `${quantity} ticket(s) created successfully`,
        tickets,
      };
    } catch (error) {
      throw error;
    }
  }

  async testPaymentGateway(req: Request, res: Response) {
    try {
      // This is a placeholder for testing payment gateway integration
      // In a real implementation, you would interact with the payment gateway SDK/API here

      const snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY || "",
        clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
      });

      let parameter = {
        transaction_details: {
          order_id: "YOUR-ORDERID-123453",
          gross_amount: 100000,
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: "budi",
          last_name: "pratama",
          email: "budi.pra@example.com",
          phone: "08111222333",
        },
      };

      const paymentResponse = await snap
        .createTransaction(parameter)
        .then((transaction: any) => {
          return transaction;
        });

      return paymentResponse;
    } catch (error) {
      throw error;
    }
  }

  async confirmPayment(req: Request, res: Response) {
    try {
      console.log("Payment confirmation received");
      // This is a placeholder for handling payment notifications from the payment gateway
      // In a real implementation, you would verify the notification and update order status accordingly

      const coreApi = new midtransClient.CoreApi({
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY || "",
        clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
      });

      const snap = new midtransClient.Snap({
        isProduction: false,
        serverKey: process.env.MIDTRANS_SERVER_KEY || "",
        clientKey: process.env.MIDTRANS_CLIENT_KEY || "",
        // order_id: req.params.orderId,
        // gross_amount: 100000,
      });

      snap.createTransaction;

      // Fetch transaction status from Midtrans
      const status = await coreApi.charge({
        order_id: req.params.orderId,
        payment_type: "credit_card",
        transaction_details: {
          credit_card: "4811 1111 1111 1114",
          order_id: req.params.orderId,
          gross_amount: 100000,
        },
        transaction_status: "capture",
      });

      console.log(
        "Payment status:",
        status.transaction_status,
        status.status_code
      );

      // Interpret status
      let isPaid = false;
      if (
        status.transaction_status === "capture" ||
        status.transaction_status === "settlement"
      ) {
        isPaid = true;
      }

      // Respond to the payment gateway
      res.status(200).json({ message: "Notification received" });
      return { isPaid, status };
    } catch (error) {
      throw error;
    }
  }
}

export default new TicketController();
