const mongoose = require('mongoose');
const Invoice = require('../models/Invoice');
const Challan = require('../models/Challan');

/**
 * @desc     Get consolidated dashboard statistics for the logged-in user
 * @route    GET /api/dashboard/stats
 * @access   Private
 */
exports.getDashboardStats = async (req, res) => {
  const userId = req.user?.id;
  
  if (!userId) {
    console.error('[DASHBOARD] No userId in request');
    return res.status(401).json({ msg: "Unauthorized" });
  }

  try {
    const filter = { user: userId };
    
    // Aggregation for speed and accuracy + Real Challan Count
    const [invoiceData, totalChallans] = await Promise.all([
      Invoice.aggregate([
        { $match: filter },
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: null,
                  count: { $sum: 1 },
                  revenue: { $sum: "$grandTotal" }
                }
              }
            ],
            recent: [
              { $sort: { createdAt: -1 } },
              { $limit: 500 },
              { 
                  $project: { 
                      invoiceNumber: 1, 
                      'customerDetails.name': 1, 
                      date: 1, 
                      grandTotal: 1, 
                      createdAt: 1 
                  } 
              }
            ]
          }
        }
      ]),
      Challan.countDocuments(filter) // REQUIREMENT: Fetch real challan count
    ]);

    const stats = invoiceData[0]?.totals[0] || { count: 0, revenue: 0 };
    const recentTransactions = invoiceData[0]?.recent || [];

    const dashboardData = {
      totalInvoices: stats.count || 0,
      revenue: stats.revenue || 0,
      challans: totalChallans || 0, // REAL COUNT: No longer mirroring invoices
      recentTransactions: recentTransactions,
      systemStatus: "Connected",
      timestamp: new Date().toISOString()
    };

    // Mandatory Logging (Requirement #Debug)
    console.log("--- DASHBOARD API DEBUG ---");
    console.log("API URL: /api/dashboard/stats");
    console.log("User ID:", userId);
    console.log("Fetched Records Count:", dashboardData.totalInvoices);
    console.log("Calculated Revenue:", dashboardData.revenue);
    console.log("Latest Transactions (Count):", recentTransactions.length);
    console.log("---------------------------");

    return res.status(200).json(dashboardData);

  } catch (err) {
    console.error('[DASHBOARD ERROR]', err.message);
    return res.status(500).json({
      success: false,
      msg: "Server Error",
      error: err.message,
      totalInvoices: 0,
      revenue: 0,
      challans: 0,
      recentTransactions: []
    });
  }
};

/**
 * @desc     Debug visibility issues
 */
exports.debugDashboardData = async (req, res) => {
  const userId = req.user?.id;
  try {
    const [invTotal, invUser, chTotal, chUser, invOrphan, chOrphan] = await Promise.all([
      Invoice.countDocuments({}),
      Invoice.countDocuments({ user: userId }),
      Challan.countDocuments({}),
      Challan.countDocuments({ user: userId }),
      Invoice.countDocuments({ user: { $exists: false } }),
      Challan.countDocuments({ user: { $exists: false } })
    ]);
    res.json({ 
      userId, 
      invoices: { 
        total: invTotal, 
        withThisUser: invUser, 
        orphan: invOrphan 
      }, 
      challans: { 
        total: chTotal, 
        withThisUser: chUser, 
        orphan: chOrphan 
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
