import React from 'react';
import './ChallanView.css';

/**
 * ChallanView Component
 * 
 * A production-ready React component that replicates a traditional 
 * printed pink delivery challan book page.
 * 
 * Props:
 * @param {string} poNo - Purchase Order Number
 * @param {string} challanNo - Delivery Challan Number
 * @param {string} date - Date of the challan
 * @param {string} clientName - Consignee / Client Name
 * @param {string} gstin - 15-character GST identification number
 * @param {Array} products - Array of product objects { particulars, quantity, rate, per, amount }
 */
const ChallanView = ({ 
  poNo = '', 
  challanNo = '', 
  date = '', 
  clientName = '', 
  gstin = '', 
  products = [] 
}) => {
  
  // Calculate grand total automatically
  const grandTotal = products.reduce((sum, item) => {
    const amt = parseFloat(item.amount) || 0;
    return sum + amt;
  }, 0);

  // Calculate empty rows to maintain fixed height (10 total rows)
  const emptyRowsCount = Math.max(0, 10 - products.length);
  const emptyRows = Array.from({ length: emptyRowsCount });

  // Prepare GSTIN boxes (exactly 15)
  const gstinChars = gstin.padEnd(15, ' ').split('').slice(0, 15);

  return (
    <div className="challan-page-wrapper">
      <div className="challan-container">
        {/* Duplicate Badge */}
        <div className="duplicate-badge">DUPLICATE</div>

        {/* Header Section */}
        <header className="challan-header">
          <h1 className="main-title">DELIVERY CHALLAN</h1>
          <div className="double-rule"></div>
        </header>

        {/* Sender Information Block */}
        <div className="info-block">
          <div className="sender-info">
            <span className="label-text">From:</span>
            <div className="company-name">SHREE SHYAM FAB</div>
            <address className="address-details">
              Plot No.-2048/8B, Road No.-03,<br />
              Diamond Ind., Chachhi M.<br />
              Surat, Gujarat
            </address>
          </div>
          <div className="meta-info">
            <div className="meta-item">
              <span className="meta-label">P.O No.</span>
              <span className="meta-value">{poNo}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Ch. No.</span>
              <span className="meta-value">{challanNo}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Date</span>
              <span className="meta-value">{date}</span>
            </div>
          </div>
        </div>

        {/* Consignee Section */}
        <div className="consignee-section">
          <div className="to-line">
            <span className="label-text">To M/s :</span>
            <span className="client-underline">{clientName}</span>
          </div>
          <div className="gstin-line">
            <span className="label-text">GSTIN :</span>
            <div className="gstin-boxes">
              {gstinChars.map((char, index) => (
                <div key={index} className="gstin-box">{char}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Goods Receipt Notice */}
        <div className="receipt-notice">
          Please receive the undermentioned goods in good order & condition
        </div>

        {/* Ledger Table */}
        <table className="ledger-table">
          <thead>
            <tr>
              <th className="col-sr">SR.</th>
              <th className="col-particulars">PARTICULARS</th>
              <th className="col-qty">QUANTITY</th>
              <th className="col-rate">RATE</th>
              <th className="col-per">PER</th>
              <th className="col-amount">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {/* Dynamic Product Rows */}
            {products.map((product, index) => (
              <tr key={`prod-${index}`}>
                <td className="col-sr">{index + 1}</td>
                <td className="col-particulars">{product.particulars}</td>
                <td className="col-qty">{product.quantity}</td>
                <td className="col-rate">{product.rate}</td>
                <td className="col-per">{product.per}</td>
                <td className="col-amount">{product.amount}</td>
              </tr>
            ))}
            {/* Dynamic Empty Rows */}
            {emptyRows.map((_, index) => (
              <tr key={`empty-${index}`}>
                <td className="col-sr">&nbsp;</td>
                <td className="col-particulars"></td>
                <td className="col-qty"></td>
                <td className="col-rate"></td>
                <td className="col-per"></td>
                <td className="col-amount"></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Grand Total Section */}
        <div className="grand-total-container">
          <div className="total-label-area">
            GRAND TOTAL
          </div>
          <div className="total-amount-area">
            {grandTotal.toFixed(2)}
          </div>
        </div>

        {/* Disclaimer */}
        <footer className="challan-footer">
          <p className="disclaimer-text">
            Note: Goods once sold will not be taken back. Our Responsibility ceases once the goods leave our premises.
          </p>

          {/* Signature Section */}
          <div className="signature-section">
            <div className="sig-block">
              <div className="sig-line"></div>
              <div className="sig-label">Received by</div>
            </div>
            <div className="sig-block">
              <div className="sig-line"></div>
              <div className="sig-label">Prepared by</div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default ChallanView;
