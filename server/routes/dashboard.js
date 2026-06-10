const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// @route    GET api/dashboard/stats
// @desc     Get consolidated dashboard statistics
// @access   Private
router.get('/stats', dashboardController.getDashboardStats);

// Fallback for / to ensure compatibility
router.get('/', dashboardController.getDashboardStats);

// @route    GET api/dashboard/debug
// @desc     Debug data visibility issues
// @access   Private
router.get('/debug', dashboardController.debugDashboardData);

module.exports = router;
