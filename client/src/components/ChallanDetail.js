import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useReactToPrint } from 'react-to-print';
import { Printer, ArrowLeft, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './ViewChallan.css';

const ChallanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoaded, getToken } = useAuth();
  
  const [challan, setChallan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const componentRef = useRef();

  useEffect(() => {
    const fetchChallan = async () => {
      if (!id) {
        setError("Missing Challan ID");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const token = await getToken();
        const res = await axios.get(`/api/challans/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data) setChallan(res.data);
      } catch (err) {
        setError("Failed to load challan data.");
      } finally {
        setLoading(false);
      }
    };
    if (isLoaded) fetchChallan();
  }, [id, isLoaded, getToken]);

  const handlePrint = useReactToPrint({ contentRef: componentRef });
  
  const handleDownloadPDF = async () => {
    const element = componentRef.current;
    if (!element) return;
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Challan_${challan?.challanNo || 'Detail'}.pdf`);
      setMessage('PDF downloaded successfully');
    } catch (err) { setMessage('Error generating PDF'); }
  };

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

  if (!isLoaded || loading) return <div style={{textAlign: 'center', padding: '50px'}}>Loading Physical Bill...</div>;
  if (error) return <div style={{textAlign: 'center', padding: '50px', color: 'red'}}>{error}</div>;

  const gstin = challan?.gstin || "";
  const gstinArray = Array.from({ length: 15 }, (_, i) => gstin[i] || "");
  const items = challan?.items || [];
  
  const totalAmount = items.reduce((sum, item) => {
      const qty = Number(item.quantity) || 0;
      const rate = Number(item.rate) || 0;
      return sum + (qty * rate);
  }, 0);

  const minRows = 10;
  const paddingRowsCount = Math.max(0, minRows - items.length);

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
    <div className="container py-4">
      {/* ACTION BAR (NO PRINT) */}
      <div className="d-flex justify-content-between mb-4 no-print align-items-center">
        <button onClick={() => navigate('/challans')} className="btn btn-outline-secondary">
          <ArrowLeft size={18} className="me-2" /> Back
        </button>
        <div className="d-flex gap-2 align-items-center">
          {message && <span className="badge bg-success px-3 py-2">{message}</span>}
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={18} className="me-2" /> Print Bill
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-success">
            <Download size={18} className="me-2" /> Download PDF
          </button>
        </div>
      </div>

      {/* PIXEL PERFECT PHYSICAL SLIP (PRINT REF) */}
      <div ref={componentRef} className="physical-bill-wrapper">
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
      
      {/* Hide the top navbar/buttons during print using standard CSS */}
      <style>{`
        @media print {
          .no-print, .navbar, .sidebar { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default ChallanDetail;
