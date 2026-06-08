import React from 'react';
import './ChallanView.css';

const ChallanView = ({ challan }) => {
    // Helper to format date as DD/MM/YY
    const formatDate = (dateStr) => {
        if (!dateStr) return "__________________";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "__________________";
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}/${month}/${year}`;
    };

    // Helper for null/empty values
    const val = (value, placeholder = "__________________") => {
        return (value && value !== "") ? value : placeholder;
    };

    // GSTIN array logic (exactly 15 boxes)
    const gstin = challan?.gstin || "";
    const gstinArray = Array.from({ length: 15 }, (_, i) => gstin[i] || "");

    // Item Table Logic
    const items = challan?.items || [];
    const minRows = 15; // Increased to ensure min-height look
    const fillerRowsCount = Math.max(0, minRows - items.length);

    return (
        <div className="challan-container">
            <div className="challan-paper">
                <div className="doc-type-badge">DUPLICATE</div>

                {/* Header: Hardcoded Company + Dynamic Metadata */}
                <header className="header-row">
                    <div className="from-block">
                        <h1>SHREE SHYAM FAB</h1>
                        <p>Plot No-2048/8B, Road No-03, Diamond Ind. Chachhi M.</p>
                    </div>
                    
                    <div className="meta-block">
                        <div className="meta-item">
                            <span className="label-text">P.O. No :</span>
                            <span className="value-underline">{val(challan?.poNo)}</span>
                        </div>
                        <div className="meta-item">
                            <span className="label-text">Ch. No :</span>
                            <span className="value-underline">{val(challan?.chNo)}</span>
                        </div>
                        <div className="meta-item">
                            <span className="label-text">Date :</span>
                            <span className="value-underline">{formatDate(challan?.date)}</span>
                        </div>
                    </div>
                </header>

                {/* Recipient Section */}
                <section className="recipient-section">
                    <div className="to-ms-row">
                        <span className="to-label">To M/s.</span>
                        <div className="to-value">
                            {val(challan?.toDetails?.companyName)} 
                            {challan?.toDetails?.locationBranch ? ` (${challan.toDetails.locationBranch})` : ""}
                        </div>
                    </div>

                    <div className="gstin-row">
                        <span className="gstin-label">G.S.T.I.N. :</span>
                        <div className="gstin-grid">
                            {gstinArray.map((char, index) => (
                                <div key={index} className="gstin-box">{char}</div>
                            ))}
                        </div>
                    </div>

                    <div className="to-ms-row" style={{ marginTop: '10px' }}>
                        <span className="to-label">Mobile:</span>
                        <div className="to-value">{val(challan?.toDetails?.mobileNumber)}</div>
                    </div>
                </section>

                <div className="declaration-text">
                    Please receive the undermentioned goods in good order & condition
                </div>

                {/* Items Table */}
                <div className="items-table-container">
                    <table className="challan-table">
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
                            {items.map((item, index) => (
                                <tr key={index} className="row-item">
                                    <td className="col-sr">{index + 1}</td>
                                    <td className="col-particulars">{item.particulars}</td>
                                    <td className="col-qty">
                                        {item.quantity}
                                    </td>
                                    <td className="col-rate">{item.rate ? Number(item.rate).toFixed(2) : ""}</td>
                                    <td className="col-per">{item.per}</td>
                                    <td className="col-amount">
                                        {item.rate ? (item.quantity * item.rate).toFixed(2) : ""}
                                    </td>
                                </tr>
                            ))}
                            {/* Filler Rows to maintain height and vertical lines */}
                            {Array.from({ length: fillerRowsCount }).map((_, i) => (
                                <tr key={`filler-${i}`} className="filler-row">
                                    <td className="col-sr">&nbsp;</td>
                                    <td className="col-particulars">&nbsp;</td>
                                    <td className="col-qty">&nbsp;</td>
                                    <td className="col-rate">&nbsp;</td>
                                    <td className="col-per">&nbsp;</td>
                                    <td className="col-amount">&nbsp;</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer Section */}
                <footer className="footer-row">
                    <div className="signature-space">
                        Received by __________________
                    </div>
                    <div className="signature-space right">
                        Prepared by __________________
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default ChallanView;
