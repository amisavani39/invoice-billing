const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

// @route    GET api/dashboard
// @desc     Get consolidated dashboard statistics
// @access   Private
router.get('/', dashboardController.getDashboardStats);

module.exports = router;
