const { clerkClient } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');

    // Check if no token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('Auth Warning: No token or invalid format');
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const token = authHeader.split(' ')[1];

    // Verify session with Clerk
    // In Clerk SDK v4, verifyToken is the standard way to verify a session JWT
    let payload;
    try {
      payload = await clerkClient.verifyToken(token);
    } catch (verifyErr) {
      console.error('Clerk Token Verification Failed:', verifyErr.message);
      return res.status(401).json({ msg: 'Token is not valid' });
    }

    const userId = payload.sub;
    
    // Check if user exists in our DB, if not create them
    let user = await User.findById(userId);
    
    if (!user) {
      try {
        // Get user details from Clerk to sync with our DB
        const clerkUser = await clerkClient.users.getUser(userId);
        const email = clerkUser.emailAddresses[0]?.emailAddress;
        const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
        
        if (!email) {
          throw new Error('User has no email address in Clerk');
        }

        user = new User({
          _id: userId,
          name: name || email.split('@')[0],
          email: email,
        });
        
        await user.save();
        console.log(`New user synced from Clerk: ${userId}`);
      } catch (syncErr) {
        console.error('Error syncing user from Clerk:', syncErr.message);
        // We still continue if we can't sync, as long as we have a valid userId
        // But the route might fail if it depends on the user being in the DB
      }
    }

    // Add userId to request object for use in routes
    req.user = { id: userId };
    next();
  } catch (err) {
    console.error('Global Auth Middleware Error:', err.message);
    res.status(500).json({ msg: 'Server Error in Authentication' });
  }
};

module.exports = auth;
