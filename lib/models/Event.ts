import mongoose, { Document } from 'mongoose';
import { EVENT_CATEGORIES, EVENT_STATUS, EVENT_TYPES, EventCategory, EventStatus, EventType } from '../constants';

export interface IEvent extends Document {
  eventId: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  category: EventCategory;
  totalTickets: number;
  availableTickets: number;
  price: number;
  organizerId: mongoose.Types.ObjectId;
  imageUrl?: string;
  isPublished: boolean;
  status: EventStatus; // Use status enum
  type?: EventType;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new mongoose.Schema<IEvent>({
  eventId: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString(), // Use ObjectId string as default
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  date: {
    type: Date,
    required: true,
  },
  time: {
    type: String,
    required: true, // Format: HH:mm
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
    enum: Object.values(EVENT_CATEGORIES),
  },
  totalTickets: {
    type: Number,
    required: true,
    min: 0,
  },
  availableTickets: {
    type: Number,
    required: true,
    min: 0,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  imageUrl: {
    type: String,
    trim: true,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    required: true,
    enum: Object.values(EVENT_STATUS),
    default: EVENT_STATUS.DRAFT,
  },
  type: {
    type: String,
    enum: Object.values(EVENT_TYPES),
    default: EVENT_TYPES.IN_PERSON,
  },
}, {
  timestamps: true,
});

export const Event = mongoose.model<IEvent>('Event', eventSchema);