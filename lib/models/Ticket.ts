import mongoose, { Document } from 'mongoose';
import { TICKET_STATUS, TICKET_TYPES, TicketStatus, TicketType } from '../constants';

export interface ITicket extends Document {
  ticketId: string;
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  ticketType: TicketType;
  price: number;
  status: TicketStatus; // Use string type with validation through enum
  bookingDate: Date;
  seatNumber?: string;
  qrCode: string;
  createdAt: Date;
  updatedAt: Date;
}

const ticketSchema = new mongoose.Schema<ITicket>({
  ticketId: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString(), // Use ObjectId string as default
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ticketType: {
    type: String,
    required: true,
    enum: Object.values(TICKET_TYPES),
    default: TICKET_TYPES.GENERAL,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(TICKET_STATUS),
    default: TICKET_STATUS.RESERVED,
  },
  bookingDate: {
    type: Date,
    required: true,
  },
  seatNumber: {
    type: String,
    trim: true,
  },
  qrCode: {
    type: String,
    required: true,
    unique: true,
  },
}, {
  timestamps: true,
});

export const Ticket = mongoose.model<ITicket>('Ticket', ticketSchema);