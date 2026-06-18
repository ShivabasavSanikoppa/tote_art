const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { User, Artwork, Order, Settings, CancelledOrder, Favorites } = require('./models.cjs');

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = 'tote_gallery_secret_key_super_secure_12345';
const DB_FILE = path.join(__dirname, 'db.json');

// MongoDB Connection URI
const MONGO_URI = 'mongodb+srv://shivabasav13_db_user:F3LH5cxyMCSsHlIB@cluster0.mytcfgh.mongodb.net/tote_gallery?retryWrites=true&w=majority';

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Connect to MongoDB
mongoose.connect(MONGO_URI, { family: 4 })
  .then(async () => {
    console.log('[MongoDB] Connected successfully to Cluster0/tote_gallery');
    await seedDatabase();
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

// Database seeding helper from db.json
const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    const artworkCount = await Artwork.countDocuments();
    const orderCount = await Order.countDocuments();

    if (userCount === 0 || artworkCount === 0 || orderCount === 0) {
      console.log('[Seeding] Database is empty. Checking db.json for initial data...');
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        const dbData = JSON.parse(fileContent);

        if (userCount === 0 && dbData.users && dbData.users.length > 0) {
          console.log(`[Seeding] Importing ${dbData.users.length} users into MongoDB...`);
          await User.insertMany(dbData.users);
        }

        if (artworkCount === 0 && dbData.artworks && dbData.artworks.length > 0) {
          console.log(`[Seeding] Importing ${dbData.artworks.length} artworks into MongoDB...`);
          await Artwork.insertMany(dbData.artworks);
        }

        if (orderCount === 0 && dbData.orders && dbData.orders.length > 0) {
          console.log(`[Seeding] Importing ${dbData.orders.length} orders into MongoDB...`);
          await Order.insertMany(dbData.orders);
        }
        console.log('[Seeding] Seeding completed successfully!');
      } else {
        console.log('[Seeding] db.json file not found, skipping migration.');
      }
    } else {
      console.log('[Seeding] Database already has data. Skipping migration.');
    }
  } catch (e) {
    console.error('[Seeding] Error while seeding database:', e);
  }
};

// Security Middleware: Verify JWT from Cookie or Authorization header
const verifyToken = (req, res, next) => {
  let token = req.cookies.tote_token;
  let source = 'cookie';
  
  // Check Authorization header for tab-specific sessionStorage token
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
    source = 'Authorization header';
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.token = token; // Store token on request object
    console.log(`[Auth] User ${decoded.email} authenticated successfully via ${source}`);
    next();
  } catch (err) {
    console.error(`[Auth] Failed verification from ${source}:`, err.message);
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

// POST Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-Only Cookie
    res.cookie('tote_token', token, {
      httpOnly: true,
      secure: false, // Set to true in production over HTTPS
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

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
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Force role to be 'user' for all new self-registrations
    const assignedRole = 'user';

    const newUser = new User({
      id: `user_${Date.now()}`,
      name,
      email,
      password: bcrypt.hashSync(password, 10), // Hash password cryptographically
      role: assignedRole,
      joinedDate: new Date().toISOString().split('T')[0]
    });

    await newUser.save();

    // Sign token
    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set HTTP-Only Cookie
    res.cookie('tote_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

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

    // Update details
    if (name) user.name = name;
    
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const exists = await User.findOne({ id: { $ne: req.user.id }, email: email.toLowerCase() });
      if (exists) {
        return res.status(400).json({ success: false, message: 'Email address already in use.' });
      }
      user.email = email;
    }

    if (password) {
      user.password = bcrypt.hashSync(password, 10);
    }

    await user.save();

    // Issue new updated token cookie
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('tote_token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

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
    const { title, artist, category, subCategory, price, image, description, howItsMade, featured } = req.body;
    if (!title || !price) {
      return res.status(400).json({ success: false, message: 'Artwork title and price are required.' });
    }

    const newArt = new Artwork({
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      artist: artist || 'Tote Gallery',
      category,
      subCategory: subCategory || '',
      price: Number(price),
      currency: 'INR',
      image: image || 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?q=80&w=800&auto=format&fit=crop',
      description: description || 'A beautiful newly uploaded artwork.',
      howItsMade: howItsMade || 'Created with passion and dedication.',
      featured: !!featured
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
    const { customerName, customerEmail, customerPhone, shippingAddress, city, postalCode, items, total } = req.body;
    if (!items || items.length === 0 || !total || !customerPhone || customerPhone.trim() === '') {
      return res.status(400).json({ success: false, message: 'Order items, total value, and customer phone number are required.' });
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
      hiddenByUser: false
    });

    await newOrder.save();

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
