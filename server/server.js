const path = require('path');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const compression = require('compression');
require("dotenv").config();

const app = express();

// --- GLOBAL REQUEST LOGGER ---
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl || req.url} - ${new Date().toISOString()}`);
  next();
});

// --- MIDDLEWARE ---
app.use(compression());
app.use(cors({
  origin: "*",
  credentials: true,
}));
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

const auth = require('./middleware/auth');
const dashboardRoutes = require('./routes/dashboard');

// --- API ROUTES ---
console.log("[SERVER] Registering API Routes...");

app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', auth, require('./routes/user'));
app.use('/api/invoices', auth, require('./routes/invoices'));
app.use('/api/challans', auth, require('./routes/challan'));
app.use('/api/dashboard', auth, dashboardRoutes);

// Health Check API
app.get("/api/health", (req, res) => {
  console.log("[API] Health Check Hit");
  res.status(200).json({ 
    status: "OK", 
    uptime: process.uptime(),
    dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
  });
});

// --- PRODUCTION SETUP ---
// The static files and catch-all route MUST be after API routes
if (process.env.NODE_ENV === 'production') {
  console.log("[SERVER] Running in Production Mode - Serving static files");
  const buildPath = path.join(__dirname, '../client/build');
  app.use(express.static(buildPath));

  app.get("*path", (req, res) => {
    // Exclude API routes from catch-all to prevent HTML response for failed API calls
    if (!req.originalUrl.startsWith('/api')) {
      res.sendFile(path.join(buildPath, 'index.html'));
    } else {
      console.warn(`[SERVER] 404 - API Route Not Found: ${req.originalUrl}`);
      res.status(404).json({ msg: "API Route Not Found" });
    }
  });
} else {
  console.log("[SERVER] Running in Development Mode");
  app.get("/", (req, res) => {
    res.send("Backend API is running...");
  });
}

// --- DATABASE CONNECTION ---
console.log("[DB] Attempting to connect to MongoDB...");
if (!process.env.MONGO_URI) {
  console.error("[DB] FATAL ERROR: MONGO_URI is not defined in .env file");
  process.exit(1);
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("[DB] MongoDB Connected Successfully");
    console.log(`[DB] Database Name: ${mongoose.connection.name}`);
  })
  .catch((err) => {
    console.error("[DB] MongoDB Connection Error:");
    console.error(err.message);
    process.exit(1);
  });

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SERVER] Listening on port ${PORT}`);
  console.log(`[SERVER] API Root: http://localhost:${PORT}/api`);
});
