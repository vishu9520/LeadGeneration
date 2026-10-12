import mongoose from 'mongoose';
import { fallbackStore, getDbStatus } from '../config/db.js';

const leadSchema = new mongoose.Schema(
  {
    organizationName: {
      type: String,
      required: true,
      trim: true
    },
    website: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true
    },
    industry: {
      type: String,
      trim: true
    },
    contactEmail: {
      type: String,
      trim: true
    },
    description: {
      type: String
    },
    sourceUrl: {
      type: String
    },
    emailSubject: {
      type: String
    },
    emailBody: {
      type: String
    },
    callToAction: {
      type: String
    },
    status: {
      type: String,
      enum: ['Not Contacted', 'Contacted'],
      default: 'Not Contacted'
    },
    contactedAt: {
      type: Date
    },
    outreachLog: [
      {
        sentAt: { type: Date, default: Date.now },
        recipient: String,
        subject: String,
        deliveryStatus: String
      }
    ],
    campaign: {
      productDescription: String,
      country: String,
      industry: String
    }
  },
  {
    timestamps: true
  }
);

const MongooseLead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

export const Lead = {
  find: async (query = {}) => {
    const status = getDbStatus();
    if (status.isMongoConnected) {
      return await MongooseLead.find(query).sort({ createdAt: -1 });
    }
    return await fallbackStore.find(query);
  },

  findById: async (id) => {
    const status = getDbStatus();
    if (status.isMongoConnected) {
      return await MongooseLead.findById(id);
    }
    return await fallbackStore.findById(id);
  },

  create: async (items) => {
    const status = getDbStatus();
    if (status.isMongoConnected) {
      return await MongooseLead.create(items);
    }
    return await fallbackStore.create(items);
  },

  findByIdAndUpdate: async (id, update, options = {}) => {
    const status = getDbStatus();
    if (status.isMongoConnected) {
      return await MongooseLead.findByIdAndUpdate(id, update, { new: true, ...options });
    }
    return await fallbackStore.findByIdAndUpdate(id, update, options);
  },

  findByIdAndDelete: async (id) => {
    const status = getDbStatus();
    if (status.isMongoConnected) {
      return await MongooseLead.findByIdAndDelete(id);
    }
    return await fallbackStore.findByIdAndDelete(id);
  },

  deleteMany: async (filter = {}) => {
    const status = getDbStatus();
    if (status.isMongoConnected) {
      return await MongooseLead.deleteMany(filter);
    }
    return await fallbackStore.deleteMany(filter);
  }
};

export default Lead;
