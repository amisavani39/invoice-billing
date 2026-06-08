import React from 'react';
import './ChallanReplica.css';

const ChallanReplica = ({ data }) => {
  // Static data matching the 1:1 reproduction requirement
  const challan = {
    from: {
      name: "Shree Shyam Fab",
      line2: "Plot No. 2048/BB, Road No. 03",
      line3: "Diamond Ind., Chalthan"
    },
    meta: {
      poNo: "100",
      chNo: "01",
      date: "26/05/26"
    },
    to: {
      name: "Vamiya Ent (Saroli)"
    },
    item: {
      particulars: "D.No-2537 - Maroon",
      quantity: "50 pic"
    }
  };

  return (
    <div className="replica-container">
      <div className="replica-paper">
        {/* 1. OUTER BORDER is handled via .replica-paper border in CSS */}

        {/* 2. HEADER */}
        <div className="replica-header">
          <h1 className="centered-title">DELIVERY CHALLAN</h1>
          <div className="duplicate-badge">DUPLICATE</div>
        </div>

        {/* 3. FIRST INFORMATION SECTION */}
        <div className="info-section">
          <div className="from-container">
            <span className="label">From</span>
            <div className="handwritten-blue content-padding">
              <div>{challan.from.name}</div>
              <div>{challan.from.line2}</div>
              <div>{challan.from.line3}</div>
            </div>
          </div>
          <div className="meta-vertical-box">
            <div className="meta-row">
              <span className="label">P.O. No. :</span>
              <span className="handwritten-blue">{challan.meta.poNo}</span>
            </div>
            <div className="meta-row">
              <span className="label">Ch. No. :</span>
              <span className="handwritten-blue">{challan.meta.chNo}</span>
            </div>
            <div className="meta-row">
              <span className="label">Date :</span>
              <span className="handwritten-blue">{challan.meta.date}</span>
            </div>
          </div>
        </div>

        {/* 4. CUSTOMER SECTION */}
        <div className="customer-section">
          <span className="label">To M/s :</span>
          <span className="handwritten-blue customer-name">{challan.to.name}</span>
        </div>

        {/* 5. GSTIN ROW */}
        <div className="gstin-section">
          <div className="gstin-grid">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="gstin-cell"></div>
            ))}
          </div>
        </div>

        {/* 6. GREEN NOTICE LINE */}
        <div className="green-notice-line">
          Please receive the undermentioned goods in good order & condition
        </div>

        {/* 7. ITEMS TABLE */}
        <div className="table-container">
          <table className="items-table">
            <thead>
              <tr>
                <th className="col-particulars">Particulars</th>
                <th className="col-quantity">Quantity</th>
                <th className="col-rate">Rate</th>
                <th className="col-per">Per</th>
              </tr>
            </thead>
            <tbody>
              <tr className="item-row">
                <td className="col-particulars handwritten-blue">{challan.item.particulars}</td>
                <td className="col-quantity handwritten-blue">{challan.item.quantity}</td>
                <td className="col-rate"></td>
                <td className="col-per"></td>
              </tr>
              {/* Maintain identical row heights and table ruling */}
              {Array.from({ length: 15 }).map((_, i) => (
                <tr key={i} className="empty-row">
                  <td></td><td></td><td></td><td></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 8. LOWER PAGE */}
        <div className="lower-page-ruled">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="ruled-line"></div>
          ))}
          <div className="signature-area">
            <div className="handwritten-blue signature">{challan.from.name}</div>
          </div>
        </div>

        {/* 9. FOOTER */}
        <div className="replica-footer">
          <div className="footer-item">
            <span className="label">Received by</span>
            <div className="footer-line"></div>
          </div>
          <div className="footer-item center-align">
            <span className="label">Prepared by</span>
            <div className="footer-line"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanReplica;
