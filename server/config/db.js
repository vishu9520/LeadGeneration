import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let isMongoConnected = false;
const dataDir = path.join(__dirname, '..', 'data');
const dataFilePath = path.join(dataDir, 'leads.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Fallback Document Store
class FallbackStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.leads = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.leads = JSON.parse(raw);
      } else {
        this.leads = [];
        this.save();
      }
    } catch (err) {
      console.warn('Could not read fallback storage, initializing empty store:', err.message);
      this.leads = [];
    }
  }

  save() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.leads, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving fallback data:', err);
    }
  }

  async find(query = {}) {
    this.load();
    let results = [...this.leads];
    if (query.status) {
      results = results.filter(l => l.status === query.status);
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async findById(id) {
    this.load();
    return this.leads.find(l => l._id === id || l.id === id) || null;
  }

  async create(items) {
    this.load();
    const array = Array.isArray(items) ? items : [items];
    const created = array.map(item => ({
      _id: 'doc_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      status: 'Not Contacted',
      createdAt: new Date().toISOString(),
      ...item
    }));
    this.leads.unshift(...created);
    this.save();
    return Array.isArray(items) ? created : created[0];
  }

  async findByIdAndUpdate(id, updates, options = {}) {
    this.load();
    const index = this.leads.findIndex(l => l._id === id || l.id === id);
    if (index === -1) return null;
    this.leads[index] = { ...this.leads[index], ...updates };
    this.save();
    return this.leads[index];
  }

  async findByIdAndDelete(id) {
    this.load();
    const index = this.leads.findIndex(l => l._id === id || l.id === id);
    if (index === -1) return null;
    const removed = this.leads.splice(index, 1)[0];
    this.save();
    return removed;
  }

  async deleteMany(filter = {}) {
    this.load();
    const count = this.leads.length;
    this.leads = [];
    this.save();
    return { deletedCount: count };
  }
}

export const fallbackStore = new FallbackStore(dataFilePath);

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/outbound_leads';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500,
    });
    isMongoConnected = true;
    console.log(`[MongoDB] Successfully connected: ${conn.connection.host}`);
  } catch (error) {
    isMongoConnected = false;
    console.log(`[MongoDB Notice] Local/Remote MongoDB not reachable (${error.message}).`);
    console.log(`[MongoDB Fallback] Seamlessly activated JSON persistent document store at ${dataFilePath}`);
  }
};

export const getDbStatus = () => ({
  mode: isMongoConnected ? 'MongoDB (Mongoose)' : 'Embedded JSON Document Store',
  isMongoConnected
});
