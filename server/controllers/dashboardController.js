const Invoice = require('../models/Invoice');
const Challan = require('../models/Challan');

/**
 * @desc     Get consolidated dashboard statistics (Global)
 * @route    GET /api/dashboard
 * @access   Private
 */
exports.getDashboardStats = async (req, res) => {
  console.log("--- Dashboard API Hit ---");
  console.log('Target User ID:', req.user?.id || 'N/A');

  try {
    // 1. Total Invoices - Global Count
    const totalInvoices = await Invoice.countDocuments();
    console.log(`[DB Query] Total Invoices count: ${totalInvoices}`);

    // 2. Total Challans - Global Count
    const totalChallans = await Challan.countDocuments({});
    console.log(`[DB Query] Total Challans count: ${totalChallans}`);

    // 3. Total Revenue - Sum of grandTotal across all invoices
    const revenueResult = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: "$grandTotal"
          }
        }
      }
    ]);
    
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    console.log(`[DB Query] Total Revenue calculated: ${totalRevenue}`);

    // 4. Recent Invoices - Latest 5
    const recentInvoices = await Invoice.find()
      .select('invoiceNumber customerDetails.name date grandTotal createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(); // Use lean for faster retrieval and standard JS objects
    
    console.log(`[DB Query] Recent Invoices fetched: ${recentInvoices.length}`);

    const dashboardResponse = {
      totalInvoices,
      totalChallans,
      totalRevenue,
      recentInvoices: recentInvoices || []
    };

    console.log("Mongo Data (Dashboard Stats):", JSON.stringify(dashboardResponse, null, 2));
    console.log('--- DASHBOARD CONTROLLER SUCCESS ---');
    
    return res.status(200).json(dashboardResponse);

  } catch (err) {
    console.error('--- DASHBOARD CONTROLLER ERROR ---');
    console.error('Error Message:', err.message);
    console.error('Stack Trace:', err.stack);

    return res.status(500).json({
      success: false,
      msg: 'Server Error in Dashboard Controller',
      error: err.message,
      totalInvoices: 0,
      totalRevenue: 0,
      totalChallans: 0,
      recentInvoices: []
    });
  }
};
