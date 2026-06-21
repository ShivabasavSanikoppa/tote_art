const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { OAuth2Client } = require('google-auth-library');

const { User, Artwork, Order, Settings, CancelledOrder, Favorites } = require('./models.cjs');

const app = express();

// Enable trust proxy (required behind reverse proxies like Render, Vercel, Cloudflare)
app.set('trust proxy', 1);

// --- Security headers ---
app.use(helmet());

const PORT = process.env.PORT || 5001;

// Fail fast if critical env vars are missing
if (!process.env.JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error('[FATAL] MONGO_URI environment variable is not set. Refusing to start.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;
const IS_PROD = process.env.NODE_ENV === 'production';

// Google OAuth client
const gClient = process.env.GOOGLE_CLIENT_ID ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID) : null;

// --- Cookie options helper ---
const cookieOptions = () => ({
  httpOnly: true,
  secure: IS_PROD,
  sameSite: IS_PROD ? 'none' : 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000
});

// --- Rate limiters ---
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' })
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' })
});

// --- CORS ---
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowed = [
      'http://localhost:5173',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (IS_PROD) {
      if (allowed.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'), false);
    } else {
      if (allowed.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app') || origin.endsWith('.onrender.com')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Apply general API rate limit
app.use('/api/', apiLimiter);

// Connect to MongoDB
mongoose.connect(MONGO_URI, { family: 4 })
  .then(async () => {
    console.log('[MongoDB] Connected successfully to Cluster0/tote_gallery');
    await seedSettings();
  })
  .catch(err => {
    console.error('[MongoDB] Connection error:', err);
  });

// Seed default settings if they don't exist
const seedSettings = async () => {
  try {
    const whatsappSetting = await Settings.findOne({ key: 'whatsappNumber' });
    if (!whatsappSetting) {
      console.log('[Seeding] WhatsApp setting not found. Seeding default number: 9019832399...');
      const defaultSetting = new Settings({
        key: 'whatsappNumber',
        value: '9019832399'
      });
      await defaultSetting.save();
    }
  } catch (err) {
    console.error('[Seeding] Error seeding settings:', err);
  }
};



// Security Middleware: Verify JWT from Authorization Header or Cookie
const verifyToken = (req, res, next) => {
  let token = req.cookies.tote_token;

  // Extract from Authorization header if present
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.token = token; // Keep track of the token used
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
  }
};

// Security Middleware: Verify Admin Access
const verifyAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden. Administrative access required.' });
  }
  next();
};

// --- AUTHENTICATION API ---

// POST Google OAuth Login/Register
app.post('/api/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required.' });
    }
    if (!gClient) {
      return res.status(500).json({ success: false, message: 'Google login is not configured on the server.' });
    }

    let payload;
    try {
      const ticket = await gClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
    } catch (verifyErr) {
      return res.status(401).json({ success: false, message: 'Invalid Google token.' });
    }

    const { email, name, sub: googleId } = payload;
    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Could not extract user info from Google token.' });
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      user = new User({
        id: `google_${googleId}`,
        name,
        email: email.toLowerCase(),
        password: bcrypt.hashSync(googleId + '_google_oauth', 10),
        role: 'user',
        joinedDate: new Date().toISOString().split('T')[0]
      });
      await user.save();
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('tote_token', token, cookieOptions());

    return res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, joinedDate: user.joinedDate }
    });
  } catch (err) {
    console.error('[API Google Auth Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST Login
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('tote_token', token, cookieOptions());

    return res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, joinedDate: user.joinedDate }
    });
  } catch (err) {
    console.error('[API Login Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST Register
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Input validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || name.trim().length < 2 || name.trim().length > 60) {
      return res.status(400).json({ success: false, message: 'Name must be between 2 and 60 characters.' });
    }
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const newUser = new User({
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: email.toLowerCase(),
      password: bcrypt.hashSync(password, 10),
      role: 'user',
      joinedDate: new Date().toISOString().split('T')[0]
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.cookie('tote_token', token, cookieOptions());

    return res.status(201).json({
      success: true,
      token,
      user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, joinedDate: newUser.joinedDate }
    });
  } catch (err) {
    console.error('[API Register Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST Logout
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('tote_token');
  return res.json({ success: true, message: 'Logged out successfully.' });
});

// GET Me (Validate active session)
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const matchedUser = await User.findOne({ id: req.user.id });
    if (!matchedUser) {
      res.clearCookie('tote_token');
      return res.status(401).json({ success: false, message: 'User account not found.' });
    }
    return res.json({
      success: true,
      token: req.token,
      user: { id: matchedUser.id, name: matchedUser.name, email: matchedUser.email, role: matchedUser.role, joinedDate: matchedUser.joinedDate }
    });
  } catch (err) {
    console.error('[API GET Me Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// PUT Profile (Update credentials)
app.put('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    if (name) user.name = name.trim();
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const exists = await User.findOne({ id: { $ne: req.user.id }, email: email.toLowerCase() });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Email address already in use.' });
      }
      user.email = email.toLowerCase();
    }
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
      }
      user.password = bcrypt.hashSync(password, 10);
    }
    await user.save();
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.cookie('tote_token', token, cookieOptions());
    return res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, joinedDate: user.joinedDate }
    });
  } catch (err) {
    console.error('[API PUT Profile Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// --- CATALOG ARTWORKS API ---

// GET All Artworks (Public)
app.get('/api/artworks', async (req, res) => {
  try {
    const artworks = await Artwork.find({});
    return res.json({ success: true, artworks });
  } catch (err) {
    console.error('[API GET Artworks Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST Create Artwork (Admin Only)
app.post('/api/artworks', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { title, artist, category, subCategory, price, originalPrice, offerPrice, image, description, howItsMade, featured, quantity } = req.body;

    // Input validation
    if (!title || typeof title !== 'string' || title.trim().length > 200) {
      return res.status(400).json({ success: false, message: 'Title is required and must be under 200 characters.' });
    }
    const computedOriginalPrice = Number(originalPrice) || Number(price) || 0;
    const computedOfferPrice = Number(offerPrice) || 0;
    const computedPrice = computedOfferPrice > 0 ? computedOfferPrice : computedOriginalPrice;
    if (computedPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Price must be a positive number.' });
    }
    if (computedOfferPrice > 0 && computedOfferPrice >= computedOriginalPrice) {
      return res.status(400).json({ success: false, message: 'Offer price must be less than original price.' });
    }
    const computedQty = Number(quantity);
    if (!Number.isInteger(computedQty) || computedQty < 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a non-negative integer.' });
    }

    const newArt = new Artwork({
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim(),
      artist: artist || 'Tote Gallery',
      category,
      subCategory: subCategory || '',
      price: computedPrice,
      originalPrice: computedOriginalPrice,
      offerPrice: computedOfferPrice,
      currency: 'INR',
      image: image || 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=800&auto=format&fit=crop',
      description: description || '',
      howItsMade: howItsMade || '',
      featured: !!featured,
      quantity: computedQty
    });

    await newArt.save();
    return res.status(201).json({ success: true, artwork: newArt });
  } catch (err) {
    console.error('[API POST Artwork Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// PUT Update Artwork (Admin Only)
app.put('/api/artworks/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Construct safe update object (exclude id if present)
    const updateData = { ...req.body };
    delete updateData.id;

    const updatedArt = await Artwork.findOneAndUpdate(
      { id },
      { $set: updateData },
      { new: true }
    );
    
    if (!updatedArt) {
      return res.status(404).json({ success: false, message: 'Artwork not found.' });
    }

    return res.json({ success: true, artwork: updatedArt });
  } catch (err) {
    console.error('[API PUT Artwork Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// DELETE Artwork (Admin Only)
app.delete('/api/artworks/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Artwork.deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Artwork not found.' });
    }

    return res.json({ success: true, message: 'Artwork deleted successfully.' });
  } catch (err) {
    console.error('[API DELETE Artwork Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// --- ORDERS API ---

// GET User/Admin Orders
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      // Admin sees all orders
      const orders = await Order.find({});
      return res.json({ success: true, orders });
    } else {
      // Regular customer sees only their own orders that aren't hidden
      const userOrders = await Order.find({ userId: req.user.id, hiddenByUser: { $ne: true } });
      return res.json({ success: true, orders: userOrders });
    }
  } catch (err) {
    console.error('[API GET Orders Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST Create Order
app.post('/api/orders', verifyToken, async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, shippingAddress, city, postalCode, items, total, paymentScreenshot } = req.body;

    // Input validation
    const phoneRegex = /^[\d\s\+\-]{7,15}$/;
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must contain at least one item.' });
    }
    if (!total || Number(total) <= 0) {
      return res.status(400).json({ success: false, message: 'Order total is required.' });
    }
    if (!customerPhone || !phoneRegex.test(customerPhone.trim())) {
      return res.status(400).json({ success: false, message: 'A valid phone number (7–15 digits) is required.' });
    }
    if (!shippingAddress || shippingAddress.trim().length === 0 || shippingAddress.length > 200) {
      return res.status(400).json({ success: false, message: 'Shipping address is required (max 200 chars).' });
    }
    if (!city || city.trim().length === 0 || city.length > 200) {
      return res.status(400).json({ success: false, message: 'City is required (max 200 chars).' });
    }
    if (!postalCode || postalCode.trim().length === 0 || postalCode.length > 200) {
      return res.status(400).json({ success: false, message: 'Postal code is required.' });
    }

    // Check stock availability for all items
    for (const item of items) {
      const artwork = await Artwork.findOne({ id: item.id });
      if (artwork && artwork.quantity !== undefined && artwork.quantity < (item.quantity || 1)) {
        return res.status(400).json({
          success: false,
          message: `"${item.title}" is out of stock or has insufficient quantity.`
        });
      }
    }

    const newOrder = new Order({
      id: `ord_${Date.now()}`,
      userId: req.user.id,
      customerName: customerName || req.user.name,
      customerEmail: customerEmail || req.user.email,
      customerPhone: customerPhone || '',
      shippingAddress,
      city,
      postalCode,
      items,
      total: Number(total),
      date: new Date().toISOString(),
      status: 'Awaiting Payment',
      hiddenByUser: false,
      paymentScreenshot: paymentScreenshot || ''
    });

    await newOrder.save();

    // Decrement artwork quantity for each item ordered
    for (const item of items) {
      await Artwork.updateOne(
        { id: item.id },
        { $inc: { quantity: -(item.quantity || 1) } }
      );
    }

    return res.status(201).json({ success: true, order: newOrder });
  } catch (err) {
    console.error('[API POST Order Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// PUT Update Order Status (Admin Only)
app.put('/api/orders/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { id },
      { $set: { status } },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    return res.json({ success: true, order: updatedOrder });
  } catch (err) {
    console.error('[API PUT Order Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// DELETE Order (Admin Only)
app.delete('/api/orders/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ id });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Only orders with status "Delivered" can be deleted.' });
    }

    await Order.deleteOne({ id });
    return res.json({ success: true, message: 'Order removed successfully.' });
  } catch (err) {
    console.error('[API DELETE Order Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST Clear User Order History (Soft Delete)
app.post('/api/orders/clear-history', verifyToken, async (req, res) => {
  try {
    await Order.updateMany(
      { userId: req.user.id, hiddenByUser: { $ne: true } },
      { $set: { hiddenByUser: true } }
    );

    return res.json({ success: true, message: 'Order history cleared successfully.' });
  } catch (err) {
    console.error('[API Clear History Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST Hide Particular Order (Soft Delete)
app.post('/api/orders/:id/hide', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ id, userId: req.user.id });
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    if (order.status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'Only delivered orders can be removed from history.' });
    }

    order.hiddenByUser = true;
    await order.save();
    return res.json({ success: true, message: 'Order removed from history.' });
  } catch (err) {
    console.error('[API Hide Order Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// --- ADMIN USER ACCOUNTS MANAGEMENT ---

// GET All Users (Admin Only)
app.get('/api/users', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({});
    // Map users to remove hashed passwords for security
    const safeUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      joinedDate: u.joinedDate
    }));

    return res.json({ success: true, users: safeUsers });
  } catch (err) {
    console.error('[API GET Users Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// DELETE User (Admin Only)
app.delete('/api/users/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.id === id) {
      return res.status(400).json({ success: false, message: 'Cannot delete the currently logged in admin user.' });
    }

    const result = await User.deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    return res.json({ success: true, message: 'User account deleted successfully.' });
  } catch (err) {
    console.error('[API DELETE User Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// PATCH Update Artwork Quantity only (Admin Only)
app.patch('/api/artworks/:id/quantity', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    if (quantity === undefined || quantity < 0) {
      return res.status(400).json({ success: false, message: 'Valid quantity (>= 0) is required.' });
    }
    const updated = await Artwork.findOneAndUpdate(
      { id },
      { $set: { quantity: Number(quantity) } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'Artwork not found.' });
    return res.json({ success: true, artwork: updated });
  } catch (err) {
    console.error('[API PATCH Quantity Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// --- FAVORITES API ---

// GET user's favorites
app.get('/api/favorites', verifyToken, async (req, res) => {
  try {
    const doc = await Favorites.findOne({ userId: req.user.id });
    return res.json({ success: true, artworkIds: doc ? doc.artworkIds : [] });
  } catch (err) {
    console.error('[API GET Favorites Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST toggle a favorite (add if not present, remove if present)
app.post('/api/favorites/toggle', verifyToken, async (req, res) => {
  try {
    const { artworkId } = req.body;
    if (!artworkId) {
      return res.status(400).json({ success: false, message: 'artworkId is required.' });
    }

    let doc = await Favorites.findOne({ userId: req.user.id });
    if (!doc) {
      doc = new Favorites({ userId: req.user.id, artworkIds: [] });
    }

    const idx = doc.artworkIds.indexOf(artworkId);
    if (idx === -1) {
      doc.artworkIds.push(artworkId);
    } else {
      doc.artworkIds.splice(idx, 1);
    }

    await doc.save();
    return res.json({ success: true, artworkIds: doc.artworkIds });
  } catch (err) {
    console.error('[API Toggle Favorite Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// --- SETTINGS API ---

// GET WhatsApp Number Setting (Public)
app.get('/api/settings/whatsapp', async (req, res) => {
  try {
    let setting = await Settings.findOne({ key: 'whatsappNumber' });
    if (!setting) {
      return res.json({ success: true, whatsappNumber: '9019832399' });
    }
    return res.json({ success: true, whatsappNumber: setting.value });
  } catch (err) {
    console.error('[API GET WhatsApp Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST Update WhatsApp Number Setting (Admin Only)
app.post('/api/settings/whatsapp', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { whatsappNumber } = req.body;
    if (!whatsappNumber || whatsappNumber.trim() === '') {
      return res.status(400).json({ success: false, message: 'WhatsApp number is required.' });
    }

    let setting = await Settings.findOneAndUpdate(
      { key: 'whatsappNumber' },
      { $set: { value: whatsappNumber.trim() } },
      { new: true, upsert: true }
    );

    return res.json({ success: true, message: 'WhatsApp number updated successfully.', whatsappNumber: setting.value });
  } catch (err) {
    console.error('[API POST WhatsApp Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// GET Payment Settings (UPI ID and QR Code) (Public)
app.get('/api/settings/payment', async (req, res) => {
  try {
    let upiSetting = await Settings.findOne({ key: 'upiId' });
    let qrSetting = await Settings.findOne({ key: 'qrCode' });
    return res.json({
      success: true,
      upiId: upiSetting ? upiSetting.value : '',
      qrCode: qrSetting ? qrSetting.value : ''
    });
  } catch (err) {
    console.error('[API GET Payment Settings Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// POST Update Payment Settings (Admin Only)
app.post('/api/settings/payment', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { upiId, qrCode } = req.body;
    
    if (upiId !== undefined) {
      await Settings.findOneAndUpdate(
        { key: 'upiId' },
        { $set: { value: upiId.trim() } },
        { upsert: true }
      );
    }
    
    if (qrCode !== undefined) {
      await Settings.findOneAndUpdate(
        { key: 'qrCode' },
        { $set: { value: qrCode } },
        { upsert: true }
      );
    }

    return res.json({ success: true, message: 'Payment settings updated successfully.' });
  } catch (err) {
    console.error('[API POST Payment Settings Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// --- CANCELLED ORDERS API ---

// POST Cancel Order (Authenticated User)
app.post('/api/orders/:id/cancel', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findOne({ id });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    // Verify ownership
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. You do not own this order.' });
    }

    // Verify cancellation window (within 24 hours)
    const orderDate = new Date(order.date);
    const timeDiffHours = (new Date() - orderDate) / (1000 * 60 * 60);
    
    if (timeDiffHours > 24) {
      return res.status(400).json({ success: false, message: 'Orders can only be cancelled within 24 hours of placement.' });
    }

    // Check if payment was done (status: Placed, Shipped, Delivered)
    const isPaid = ['Placed', 'Shipped', 'Delivered'].includes(order.status);

    // Save to CancelledOrder collection
    const cancelledOrder = new CancelledOrder({
      id: `can_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      originalOrderId: order.id,
      userId: order.userId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      city: order.city,
      postalCode: order.postalCode,
      items: order.items,
      total: order.total,
      date: order.date,
      cancelledDate: new Date().toISOString(),
      originalStatus: order.status,
      paymentDone: isPaid
    });

    await cancelledOrder.save();

    // Restore artwork quantity for each cancelled item
    for (const item of order.items) {
      await Artwork.updateOne(
        { id: item.id },
        { $inc: { quantity: (item.quantity || 1) } }
      );
    }

    // Remove from active Order collection
    await Order.deleteOne({ id: order.id });

    return res.json({ success: true, message: 'Order cancelled successfully and logged for refund/review.', cancelledOrder });
  } catch (err) {
    console.error('[API Cancel Order Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// GET Cancelled Orders (Admin Only)
app.get('/api/cancelled-orders', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const cancelledOrders = await CancelledOrder.find({});
    return res.json({ success: true, cancelledOrders });
  } catch (err) {
    console.error('[API GET Cancelled Orders Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// GET My Cancelled Orders (Authenticated User — own orders only)
app.get('/api/my-cancelled-orders', verifyToken, async (req, res) => {
  try {
    const cancelledOrders = await CancelledOrder.find({ userId: req.user.id });
    return res.json({ success: true, cancelledOrders });
  } catch (err) {
    console.error('[API GET My Cancelled Orders Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// DELETE Cancelled Order Record (Admin Only)
app.delete('/api/cancelled-orders/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CancelledOrder.deleteOne({ id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Cancelled order record not found.' });
    }

    return res.json({ success: true, message: 'Cancelled order record cleared successfully.' });
  } catch (err) {
    console.error('[API DELETE Cancelled Order Error]:', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Start API Server
app.listen(PORT, () => {
  console.log(`[API Server] Running securely on http://localhost:${PORT}`);
});
