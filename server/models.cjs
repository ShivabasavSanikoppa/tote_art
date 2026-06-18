const mongoose = require('mongoose');

// User Schema
const UserSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  joinedDate: {
    type: String,
    required: true
  }
}, { timestamps: true });

// Artwork Schema
const ArtworkSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  artist: {
    type: String,
    default: 'Tote Gallery'
  },
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  image: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  howItsMade: {
    type: String,
    default: ''
  },
  featured: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Order Item Sub-schema (matching items list)
const OrderItemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  artist: { type: String },
  category: { type: String },
  price: { type: Number, required: true },
  image: { type: String },
  quantity: { type: Number, default: 1 }
}, { _id: false });

// Order Schema
const OrderSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    default: ''
  },
  shippingAddress: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  items: [OrderItemSchema],
  total: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Awaiting Payment', 'Placed', 'Shipped', 'Delivered'],
    default: 'Awaiting Payment'
  },
  hiddenByUser: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Artwork = mongoose.model('Artwork', ArtworkSchema);
const Order = mongoose.model('Order', OrderSchema);

// Settings Schema
const SettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: String,
    required: true
  }
}, { timestamps: true });

const Settings = mongoose.model('Settings', SettingsSchema);

// Cancelled Order Schema
const CancelledOrderSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  originalOrderId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  customerEmail: {
    type: String,
    required: true
  },
  customerPhone: {
    type: String,
    default: ''
  },
  shippingAddress: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  items: [OrderItemSchema],
  total: {
    type: Number,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  cancelledDate: {
    type: String,
    required: true
  },
  originalStatus: {
    type: String,
    required: true
  },
  paymentDone: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const CancelledOrder = mongoose.model('CancelledOrder', CancelledOrderSchema);

// Favorites Schema
const FavoritesSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  artworkIds: {
    type: [String],
    default: []
  }
}, { timestamps: true });

const Favorites = mongoose.model('Favorites', FavoritesSchema);

module.exports = {
  User,
  Artwork,
  Order,
  Settings,
  CancelledOrder,
  Favorites
};
