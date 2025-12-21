import mongoose, { Document } from 'mongoose';
import { PAYMENT_STATUS, PAYMENT_METHODS, PaymentStatus, PaymentMethod } from '../constants';

export interface IOrder extends Document {
  orderId: string;
  userId: mongoose.Types.ObjectId;
  tickets: mongoose.Types.ObjectId[];
  totalAmount: number;
  paymentStatus: PaymentStatus; // Use string type with validation through enum
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new mongoose.Schema<IOrder>({
  orderId: {
    type: String,
    required: true,
    unique: true,
    default: () => new mongoose.Types.ObjectId().toString(), // Use ObjectId string as default
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  tickets: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true,
  }],
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: Object.values(PAYMENT_METHODS),
    default: PAYMENT_METHODS.CREDIT_CARD,
  },
  transactionId: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);