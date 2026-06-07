import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useReactToPrint } from 'react-to-print';
import { Printer, ArrowLeft, Trash2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ChallanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoaded, getToken } = useAuth();
  const [challan, setChallan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const handleDownloadPDF = async () => {
    const element = componentRef.current;
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Challan_${challan.challanNo}.pdf`);
      setMessage('PDF downloaded successfully');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setMessage('Error generating PDF');
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        const res = await axios.get(`/api/challan`, config);
        // Since the current API returns an array, find the specific one
        // Note: Realistically, we should have a /api/challan/:id endpoint
        const found = res.data.find(c => c._id === id);
        if (found) {
          setChallan(found);
        } else {
          setError('Challan not found');
        }
      } catch (err) {
        console.error('Error fetching challan', err);
        setError('Failed to load challan');
      } finally {
        setLoading(false);
      }
    };
    if (isLoaded) {
      fetchData();
    }
  }, [id, isLoaded, getToken]);

  if (!isLoaded || loading) return <div className="container py-5 text-center"><h3>Loading...</h3></div>;
  if (error || !challan) return <div className="container py-5 text-center"><h3 className="text-danger">{error || 'Challan not found'}</h3></div>;

  return (
    <div className="container py-4">
      {/* Action Buttons */}
      <div className="d-flex justify-content-between mb-4 no-print">
        <button onClick={() => navigate('/challans')} className="btn btn-outline-secondary">
          <ArrowLeft size={18} className="me-2" /> Back
        </button>
        <div className="d-flex gap-2">
          {message && (
            <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'} py-2 px-3 mb-0 d-flex align-items-center small`}>
              {message}
            </div>
          )}
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={18} className="me-2" /> Print Challan
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-success">
            <Download size={18} className="me-2" /> Download PDF
          </button>
        </div>
      </div>

      {/* Challan Document */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        ref={componentRef}
        className="challan-print-container"
      >
        <div className="challan-border-wrapper">
          {/* Duplicate Badge */}
          <div className="duplicate-badge">DUPLICATE</div>

          {/* Header */}
          <div className="challan-header">
            <h1 className="challan-title">DELIVERY CHALLAN</h1>
          </div>

          {/* Top Info Section */}
          <div className="top-info-grid">
            <div className="from-section">
              <span className="label">From:</span>
              <div className="company-info">
                <h2 className="company-name">{challan.fromDetails?.name}</h2>
                <p className="company-address">{challan.fromDetails?.address}</p>
              </div>
            </div>
            <div className="meta-info">
              <div className="meta-row">
                <span className="label">P.O. No.</span>
                <span className="value border-bottom">{challan.poNo || '........................'}</span>
              </div>
              <div className="meta-row">
                <span className="label">Ch. No.</span>
                <span className="value border-bottom">{challan.challanNo}</span>
              </div>
              <div className="meta-row">
                <span className="label">Date:</span>
                <span className="value border-bottom">{new Date(challan.date).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Customer Section */}
          <div className="customer-section">
            <div className="customer-row">
              <span className="label">To M/s.</span>
              <span className="value border-bottom flex-grow-1">{challan.toDetails?.clientName}</span>
            </div>
            <div className="customer-row mt-2">
              <span className="label">G.S.T.I.N.</span>
              <div className="gstin-boxes">
                {Array.from({ length: 15 }).map((_, index) => {
                  const char = (challan.toDetails?.gstin || '')[index];
                  return (
                    <span key={index} className="gstin-box">
                      {char || ''}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Center Message */}
          <div className="center-message">
            Please receive the undermentioned goods in good order & condition
          </div>

          {/* Item Table */}
          <table className="challan-table">
            <thead>
              <tr>
                <th width="50">Sr.</th>
                <th>Particulars</th>
                <th width="100">Quantity</th>
                <th width="100">Rate</th>
                <th width="80">Per</th>
              </tr>
            </thead>
            <tbody>
              {challan.items.map((item, index) => (
                <tr key={index}>
                  <td className="text-center">{index + 1}</td>
                  <td>{item.particulars}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-center">{item.rate}</td>
                  <td className="text-center">{item.per}</td>
                </tr>
              ))}
              {/* Blank Rows to fill space like a real book */}
              {[...Array(Math.max(1, 10 - challan.items.length))].map((_, i) => (
                <tr key={`blank-${i}`} className="blank-row">
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                  <td>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer */}
          <div className="challan-footer">
            <div className="terms-section">
              <p className="terms-text">
                Note: Goods once sold will not be taken back. Our Responsibility ceases once the goods leave our premises.
              </p>
            </div>
            
            <div className="signature-grid">
              <div className="sig-box">
                <div className="sig-line">Received By</div>
              </div>
              <div className="sig-box">
                <div className="sig-line">Prepared By</div>
              </div>
              <div className="sig-box text-end">
                <div className="for-company">For, {challan.fromDetails?.name}</div>
              </div>
            </div>
          </div>
        </div>

        <style>
          {`
            .challan-print-container {
              width: 210mm;
              min-height: 297mm;
              margin: 0 auto;
              background: white;
              padding: 10mm;
              font-family: 'Arial', sans-serif;
              color: #333;
            }

            .challan-border-wrapper {
              border: 3px double #ffb6c1; /* Pink Border */
              padding: 15mm;
              height: 100%;
              position: relative;
              background-color: #fff;
            }

            .duplicate-badge {
              position: absolute;
              top: 10mm;
              right: 10mm;
              border: 1px solid #ffb6c1;
              padding: 2px 8px;
              font-size: 10pt;
              font-weight: bold;
              color: #ffb6c1;
            }

            .challan-header {
              text-align: center;
              margin-bottom: 20px;
            }

            .challan-title {
              font-size: 22pt;
              font-weight: bold;
              color: #ffb6c1;
              text-decoration: underline;
              margin: 0;
            }

            .top-info-grid {
              display: grid;
              grid-template-columns: 1.5fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }

            .label {
              font-weight: bold;
              font-size: 11pt;
              margin-right: 5px;
            }

            .company-name {
              font-size: 18pt;
              font-weight: bold;
              margin: 5px 0;
              color: #000;
            }

            .company-address {
              font-size: 10pt;
              margin: 0;
              line-height: 1.4;
            }

            .meta-row {
              display: flex;
              align-items: baseline;
              margin-bottom: 8px;
            }

            .value {
              flex-grow: 1;
              padding-left: 5px;
            }

            .border-bottom {
              border-bottom: 1px dotted #333;
            }

            .customer-section {
              margin-bottom: 15px;
            }

            .customer-row {
              display: flex;
              align-items: center;
            }

            .gstin-boxes {
              display: flex;
              gap: 0;
            }

            .gstin-box {
              width: 22px;
              height: 25px;
              border: 1px solid #333;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 11pt;
            }

            .center-message {
              text-align: center;
              font-style: italic;
              font-size: 10pt;
              margin: 15px 0;
              padding: 5px;
              border-top: 1px solid #ffb6c1;
              border-bottom: 1px solid #ffb6c1;
            }

            .challan-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }

            .challan-table th {
              background-color: #fff0f5; /* Very light pink */
              border: 1px solid #ffb6c1;
              padding: 8px;
              text-align: center;
              font-size: 11pt;
            }

            .challan-table td {
              border-left: 1px solid #ffb6c1;
              border-right: 1px solid #ffb6c1;
              padding: 8px;
              font-size: 11pt;
              height: 35px;
            }

            .challan-table tr:last-child td {
              border-bottom: 1px solid #ffb6c1;
            }

            .blank-row td {
              height: 35px;
            }

            .challan-footer {
              margin-top: 30px;
            }

            .terms-text {
              font-size: 9pt;
              margin-bottom: 40px;
              color: #555;
            }

            .signature-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1.5fr;
              gap: 20px;
              align-items: flex-end;
            }

            .sig-line {
              border-top: 1px solid #333;
              display: inline-block;
              padding-top: 5px;
              width: 100%;
              text-align: center;
              font-weight: bold;
              font-size: 10pt;
            }

            .for-company {
              font-weight: bold;
              margin-bottom: 10px;
              font-size: 10pt;
            }

            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              .no-print { display: none !important; }
              body { margin: 0; padding: 0; }
              .challan-print-container {
                width: 100%;
                height: 100%;
                padding: 10mm;
                margin: 0;
              }
              .challan-border-wrapper {
                border-width: 2px;
              }
            }
          `}
        </style>
      </motion.div>
    </div>
  );
};

export default ChallanDetail;
