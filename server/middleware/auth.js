const { clerkClient } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');

// Minimal in-memory cache to prevent DB hammering on consecutive requests
const userCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ msg: 'Authorization denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token with Clerk
    let payload;
    try {
      payload = await clerkClient.verifyToken(token);
    } catch (verifyErr) {
      console.error('[AUTH] Token Verification Failed:', verifyErr.message);
      return res.status(401).json({ 
        msg: 'Invalid or expired token.', 
        error: verifyErr.message // This might return "Token is not valid" from Clerk
      });
    }

    const userId = payload.sub;
    
    // Check Cache first
    const cachedUser = userCache.get(userId);
    if (cachedUser && (Date.now() - cachedUser.timestamp < CACHE_TTL)) {
      req.user = { id: userId };
      req.fullUser = cachedUser.data;
      return next();
    }

    // DB Lookup
    try {
      let user = await User.findOne({ _id: userId }).select('name email companyDetails role').lean();
      
      if (!user) {
        console.log(`[AUTH] Syncing user ${userId} from Clerk...`);
        const clerkUser = await clerkClient.users.getUser(userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        
        if (email) {
          user = new User({
            _id: userId,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || email.split('@')[0],
            email: email,
          });
          await user.save();
          user = user.toObject();
        }
      }

      if (user) {
        userCache.set(userId, { data: user, timestamp: Date.now() });
        req.fullUser = user;
      }
    } catch (syncErr) {
      console.error('[AUTH] DB Sync Error:', syncErr.message);
    }

    req.user = { id: userId };
    next();
  } catch (err) {
    console.error('[AUTH] Global Error:', err.message);
    res.status(500).json({ msg: 'Authentication Error' });
  }
};

module.exports = auth;
