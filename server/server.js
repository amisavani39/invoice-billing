const path = require('path');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require('compression');
require("dotenv").config();

const app = express();

// Disable Mongoose Buffering to prevent hanging queries on cold starts
mongoose.set('bufferCommands', false);

// --- 1. CORS CONFIGURATION ---
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://invoice-billing-s4u1.onrender.com',
  /\.vercel\.app$/ 
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) return allowed.test(origin);
      return allowed === origin;
    });
    callback(null, true); // Fallback allow during transition
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Clerk-SDK-Version', 'X-Clerk-Auth-Token'],
  optionsSuccessStatus: 200
}));

// --- 2. MIDDLEWARE ---
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- 3. API ROUTES ---
const auth = require('./middleware/auth');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const invoiceRoutes = require('./routes/invoices');
const challanRoutes = require('./routes/challan');

// Standard API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', auth, dashboardRoutes); // Registered BEFORE other specific resources to ensure precedence
app.use('/api/user', auth, userRoutes);
app.use('/api/invoices', auth, invoiceRoutes);
app.use('/api/challans', auth, challanRoutes);

// --- 4. HEALTH & STATUS ---
app.get("/api/health", (req, res) => {
  res.status(200).json({ 
    status: "UP", 
    db: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString() 
  });
});

app.get("/", (req, res) => res.send("GST Billing API v1.0 Production"));

// --- 5. PRODUCTION STATIC FILES ---
const NODE_ENV = process.env.NODE_ENV || 'production';
if (NODE_ENV === 'production') {
  const buildPath = path.join(__dirname, '../client/build');
  if (require('fs').existsSync(buildPath)) {
    app.use(express.static(buildPath));
    app.get(/.*/, (req, res) => {
      if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(buildPath, 'index.html'));
      }
    });
  }
}

// --- 6. ERROR HANDLER ---
app.use((err, req, res, next) => {
  console.error(`[SERVER ERROR] ${err.message}`);
  res.status(err.status || 500).json({
    success: false,
    msg: "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// --- 7. DB CONNECTION & SERVER START ---
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB Connected');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error(`❌ DB Connection Error: ${err.message}`);
    process.exit(1);
  });
