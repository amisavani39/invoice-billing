import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import './ViewChallan.css';

const ViewChallan = () => {
    const { id } = useParams();
    const { isLoaded, getToken } = useAuth();
    
    const [challan, setChallan] = useState(null);
    const [loading, setLoading] = unbeseState(true);
    const [error, setError] = useState(null);

    // Explicit Date Formatter
    const formatDate = (dateStr) => {
        if (!dateStr) return "____________";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return "____________";
        
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = String(date.getFullYear());
        return `${d}/${m}/${y}`;
    };

    useEffect(() => {
        const fetchChallan = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const token = await getToken();
                const res = await api.get(`/api/challans/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setChallan(res.data);
            } catch (err) {
                console.error("Fetch Error:", err);
                setError("Failed to load challan data.");
            } finally {
                setLoading(false);
            }
        };

        if (isLoaded) fetchChallan();
    }, [id, isLoaded, getToken]);

    if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Loading Physical Bill...</div>;
    if (error) return <div style={{textAlign: 'center', padding: '50px', color: 'red'}}>{error}</div>;

    // GSTIN Processing (Strictly 15 boxes)
    const gstin = challan?.gstin || "";
    const gstinArray = Array.from({ length: 15 }, (_, i) => gstin[i] || "");

    // Table Logic
    const items = challan?.items || [];
    
    // Calculate total
    const totalAmount = items.reduce((sum, item) => {
        const qty = Number(item.quantity) || 0;
        const rate = Number(item.rate) || 0;
        return sum + (qty * rate);
    }, 0);

    // Padding Logic: Ensure 10 total rows minimum
    const minRows = 10;
    const paddingRowsCount = Math.max(0, minRows - items.length);

    // Textile Fraction Renderer
    const renderQuantity = (qtyStr) => {
        if (!qtyStr) return "";
        const str = String(qtyStr);
        if (str.includes('/')) {
            const [num, den] = str.split('/');
            return (
                <div className="fraction-container">
                    <span className="fraction-num">{num}</span>
                    <span className="fraction-den">{den}</span>
                </div>
            );
        }
        return str;
    };

    return (
        <div className="physical-bill-wrapper">
            <div className="bill-container">
                <div className="duplicate-stamp">DUPLICATE</div>

                <h1 className="doc-title">DELIVERY CHALLAN</h1>
                <div className="title-divider"></div>

                <div className="header-grid">
                    <div className="header-left">
                        <div className="from-label">From: SHREE SHYAM FAB</div>
                        <p className="address-line">Plot No.-2048/8B, Road No.-03,</p>
                        <p className="address-line">Diamond Ind., Chachhi M.</p>
                        <p className="address-line">Surat, Gujarat</p>
                    </div>
                    <div className="header-right">
                        <div className="meta-row">
                            <span className="meta-label">P.O No. :</span>
                            <span className="meta-value">{challan?.poNo || "____________"}</span>
                        </div>
                        <div className="meta-row">
                            <span className="meta-label">Ch. No. :</span>
                            <span className="meta-value">{challan?.chNo || "____________"}</span>
                        </div>
                        <div className="meta-row">
                            <span className="meta-label">Date :</span>
                            <span className="meta-value">{formatDate(challan?.date)}</span>
                        </div>
                    </div>
                </div>

                <div className="customer-row">
                    <span className="customer-label">To M/s :</span>
                    <span className="customer-value">
                        {challan?.toDetails?.companyName || "________________________"} 
                        {challan?.toDetails?.locationBranch ? ` (${challan.toDetails.locationBranch})` : " (Saroli)"}
                    </span>
                </div>

                <div className="gstin-strip">
                    <span className="gstin-label">GSTIN:</span>
                    <div className="gstin-boxes">
                        {gstinArray.map((char, index) => (
                            <div key={index} className="gstin-box">{char}</div>
                        ))}
                    </div>
                </div>

                <div className="declaration">
                    Please receive the undermentioned goods in good order & condition
                </div>

                <table className="grid-table">
                    <thead>
                        <tr>
                            <th className="col-sr">SR.</th>
                            <th className="col-part">PARTICULARS</th>
                            <th className="col-qty">QUANTITY</th>
                            <th className="col-rate">RATE</th>
                            <th className="col-per">PER</th>
                            <th className="col-amt">AMOUNT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index}>
                                <td className="col-sr">{index + 1}</td>
                                <td className="col-part">{item.particulars}</td>
                                <td className="col-qty">{renderQuantity(item.quantity)}</td>
                                <td className="col-rate">{item.rate ? Number(item.rate).toFixed(2) : ""}</td>
                                <td className="col-per">{item.per}</td>
                                <td className="col-amt">
                                    {item.rate && item.quantity ? (Number(item.quantity) * Number(item.rate)).toFixed(2) : ""}
                                </td>
                            </tr>
                        ))}
                        
                        {/* Empty Row Padding */}
                        {Array.from({ length: paddingRowsCount }).map((_, i) => (
                            <tr key={`padding-${i}`}>
                                <td className="col-sr"></td>
                                <td className="col-part"></td>
                                <td className="col-qty"></td>
                                <td className="col-rate"></td>
                                <td className="col-per"></td>
                                <td className="col-amt"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div className="total-wrapper">
                    <div className="total-label">GRAND TOTAL</div>
                    <div className="total-value">{totalAmount > 0 ? totalAmount.toFixed(2) : ""}</div>
                </div>

                <div className="disclaimer-banner">
                    Note: Goods once sold will not be taken back. Our Responsibility ceases once the goods leave our premises.
                </div>

                <div className="signature-blocks">
                    <div className="sig-text">Received by _________________</div>
                    <div className="sig-text">Prepared by _________________</div>
                </div>
            </div>
        </div>
    );
};

export default ViewChallan;
