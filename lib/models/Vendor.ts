import mongoose, { Document } from 'mongoose';

export interface IVendor extends Document {
  vendorId: string;
  name: string;
  description?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  address?: string;
  businessLicense?: string;
  taxId?: string;
  profileImage?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
  businessHours?: {
    monday?: { open: string; close: string; closed: boolean };
    tuesday?: { open: string; close: string; closed: boolean };
    wednesday?: { open: string; close: string; closed: boolean };
    thursday?: { open: string; close: string; closed: boolean };
    friday?: { open: string; close: string; closed: boolean };
    saturday?: { open: string; close: string; closed: boolean };
    sunday?: { open: string; close: string; closed: boolean };
  };
  categories?: string[];
  paymentMethods?: string[];
  businessType?: string;
  isActive: boolean;
  userId: mongoose.Types.ObjectId; // Link to the User who manages this vendor
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new mongoose.Schema<IVendor>({
  vendorId: {
    type: String,
    required: true,
    unique: true,
    default: () => `vendor_${new mongoose.Types.ObjectId().toString()}`,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  contactEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  contactPhone: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/i, 'Website URL must be a valid HTTP/HTTPS URL'],
  },
  address: {
    type: String,
    trim: true,
  },
  businessLicense: {
    type: String,
    trim: true,
  },
  taxId: {
    type: String,
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  profileImage: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/i, 'Profile image URL must be a valid HTTP/HTTPS URL'],
  },
  socialMedia: {
    facebook: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/i, 'Facebook URL must be a valid HTTP/HTTPS URL'],
    },
    instagram: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/i, 'Instagram URL must be a valid HTTP/HTTPS URL'],
    },
    twitter: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/i, 'Twitter URL must be a valid HTTP/HTTPS URL'],
    },
    linkedin: {
      type: String,
      trim: true,
      match: [/^https?:\/\/.+/i, 'LinkedIn URL must be a valid HTTP/HTTPS URL'],
    },
  },
  businessHours: {
    type: Object,  // Using a generic object for now to avoid complex nested schema issues
  },
  categories: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  paymentMethods: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  businessType: {
    type: String,
    trim: true,
    lowercase: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

export const Vendor = mongoose.model<IVendor>('Vendor', vendorSchema);