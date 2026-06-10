import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useReactToPrint } from 'react-to-print';
import { Printer, ArrowLeft, Trash2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import api from '../utils/api';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user, isLoaded: isUserLoaded } = useUser();
  
  const [invoice, setInvoice] = useState(null);
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
        scale: 3,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoice?.invoiceNumber || 'Detail'}.pdf`);
      setMessage('PDF downloaded successfully');
    } catch (err) {
      console.error('Error generating PDF:', err);
      setMessage('Error generating PDF');
    }
  };

  const deleteInvoice = async () => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        const token = await getToken();
        const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
        await api.delete(`/api/invoices/${id}`, config);
        setMessage('Invoice deleted successfully');
        setTimeout(() => navigate('/invoices'), 2000);
      } catch (err) {
        console.error('Error deleting invoice:', err);
        setMessage('Failed to delete invoice');
      }
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
        const res = await api.get(`/api/invoices/${id}`, config);
        setInvoice(res.data);
      } catch (err) {
        console.error('Error fetching invoice', err);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    if (isUserLoaded && user?.id) {
      fetchData();
    }
  }, [id, isUserLoaded, user?.id, getToken]);

  if (!isUserLoaded || loading) return <div className="container py-5 text-center"><h3>Loading Invoice...</h3></div>;
  if (error || !invoice) return <div className="container py-5 text-center"><h3 className="text-danger">{error || 'Invoice not found'}</h3></div>;

  const products = invoice.products || [];
  // Ensure enough empty rows to fill the table area
  const emptyRows = Math.max(0, 8 - products.length);

  return (
    <div className="container py-4">
      {/* Action Buttons (No Print) */}
      <div className="d-flex justify-content-between mb-4 no-print">
        <button onClick={() => navigate('/invoices')} className="btn btn-outline-secondary d-flex align-items-center">
          <ArrowLeft size={18} className="me-2" /> Back
        </button>
        <div className="d-flex gap-2">
          {message && (
            <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'} py-2 px-3 mb-0 d-flex align-items-center small`}>
              {message}
            </div>
          )}
          <button onClick={handlePrint} className="btn btn-primary d-flex align-items-center">
            <Printer size={18} className="me-2" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-success d-flex align-items-center">
            <Download size={18} className="me-2" /> Download PDF
          </button>
          <button onClick={deleteInvoice} className="btn btn-danger d-flex align-items-center">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Invoice Document Layout */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="invoice-wrapper mx-auto"
      >
        <div ref={componentRef} className="invoice-container">
          <div className="invoice-box">
            
            {/* 1. HEADER SECTION */}
            <div className="row g-0 border-bottom">
              <div className="col-4 p-1 fw-bold text-start ps-2" style={{ fontSize: '11px' }}>TAX INVOICE</div>
              <div className="col-4 p-1 fw-bold text-center" style={{ fontSize: '11px' }}>|| શ્રી ગણેશાય નમઃ ||</div>
              <div className="col-4 p-1 fw-bold text-end pe-2" style={{ fontSize: '11px' }}>Original</div>
            </div>

            {/* 2. COMPANY SECTION */}
            <div className="text-center py-3 border-bottom">
              <h1 className="company-name mb-0">SHREE SHYAM FAB</h1>
              <p className="fw-bold mt-1 mb-1" style={{ fontSize: '11px', lineHeight: '1.2' }}>
                STOCKIST & SUPPLIERS OF :<br />
                MOSQUITO NET AND KURTI MANUFACTURING
              </p>
              <p className="mb-0 px-5" style={{ fontSize: '10px' }}>
                ROAD - 3, PLOT NO - 2048 2TH FLOOR DIAMOND INDUSTRIAL PARK, SACHIN GIDC, SURAT, GUJARAT, INDIA - 394230
              </p>
              <p className="fw-bold mt-1 mb-0" style={{ fontSize: '12px' }}>GSTIN: 24AEDPV3999J2ZR</p>
            </div>

            {/* 3. CUSTOMER + INVOICE DETAILS */}
            <div className="row g-0 border-bottom align-items-stretch">
              {/* Left: Customer Details */}
              <div className="col-6 border-end p-2">
                <p className="fw-bold mb-2 text-decoration-underline text-uppercase" style={{ fontSize: '12px' }}>Customer Details:</p>
                <table className="w-100" style={{ tableLayout: 'fixed' }}>
                  <tbody style={{ fontSize: '11px' }}>
                    <tr>
                      <td className="fw-bold py-1" style={{ width: '40%' }}>Name</td>
                      <td className="fw-bold py-1 text-wrap">: {invoice.customerDetails?.name || '-'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold py-1 align-top">Billing Address</td>
                      <td className="py-1 text-wrap">: {invoice.customerDetails?.billingAddress || '-'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold py-1">Mobile Number</td>
                      <td className="fw-bold py-1">: {invoice.customerDetails?.mobileNumber || '-'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold py-1">State</td>
                      <td className="py-1">: {invoice.customerDetails?.state || '-'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold py-1">State Code</td>
                      <td className="py-1">: {invoice.customerDetails?.stateCode || '-'}</td>
                    </tr>
                    <tr>
                      <td className="fw-bold py-1">Party GSTIN</td>
                      <td className="fw-bold py-1">: {invoice.customerDetails?.gstNumber || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Right: Invoice Details */}
              <div className="col-6 p-0">
                <table className="w-100 h-100 table-bordered-cells" style={{ tableLayout: 'fixed' }}>
                  <tbody style={{ fontSize: '11px' }}>
                    <tr><td className="fw-bold ps-2 py-1 border-bottom border-end">Invoice No</td><td className="fw-bold ps-2 py-1 border-bottom">{invoice.invoiceNumber || '-'}</td></tr>
                    <tr><td className="fw-bold ps-2 py-1 border-bottom border-end">Invoice Date</td><td className="ps-2 py-1 border-bottom">{invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN') : '-'}</td></tr>
                    <tr><td className="fw-bold ps-2 py-1 border-bottom border-end">Order No</td><td className="ps-2 py-1 border-bottom">{invoice.orderNumber || '-'}</td></tr>
                    <tr><td className="fw-bold ps-2 py-1 border-bottom border-end">Order Date</td><td className="ps-2 py-1 border-bottom">{invoice.orderDate ? new Date(invoice.orderDate).toLocaleDateString('en-IN') : '-'}</td></tr>
                    <tr><td className="fw-bold ps-2 py-1 border-bottom border-end">Parcel Bag</td><td className="ps-2 py-1 border-bottom">{invoice.parcelBag || '-'}</td></tr>
                    <tr><td className="fw-bold ps-2 py-1 border-bottom border-end">E-Way Bill</td><td className="ps-2 py-1 border-bottom">{invoice.eWayBill || '-'}</td></tr>
                    <tr><td className="fw-bold ps-2 py-1 border-end">Transport</td><td className="ps-2 py-1">{invoice.transportName || '-'}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. PRODUCT TABLE */}
            <div className="product-table-area border-bottom p-0">
              <table className="w-100 product-table" style={{ tableLayout: 'fixed' }}>
                <thead>
                  <tr className="bg-light text-center fw-bold border-bottom">
                    <td style={{ width: '40px' }} className="border-end">Sr No</td>
                    <td className="text-start ps-2 border-end">Description of Goods</td>
                    <td style={{ width: '70px' }} className="border-end">HSN</td>
                    <td style={{ width: '50px' }} className="border-end">GST %</td>
                    <td style={{ width: '50px' }} className="border-end">Qty</td>
                    <td style={{ width: '50px' }} className="border-end">UOM</td>
                    <td style={{ width: '90px' }} className="text-end pe-2 border-end">Rate</td>
                    <td style={{ width: '100px' }} className="text-end pe-2">Amount</td>
                  </tr>
                </thead>
                <tbody>
                  {products.map((item, idx) => (
                    <tr key={idx} style={{ fontSize: '11px' }}>
                      <td className="text-center border-end border-bottom" style={{ height: '25px' }}>{item.srNo || idx + 1}</td>
                      <td className="text-start ps-2 border-end border-bottom">{item.description}</td>
                      <td className="text-center border-end border-bottom">{item.hsn || '-'}</td>
                      <td className="text-center border-end border-bottom">{item.gstPercent || 0}%</td>
                      <td className="text-center border-end border-bottom">{item.quantity}</td>
                      <td className="text-center border-end border-bottom">{item.uom || '-'}</td>
                      <td className="text-end pe-2 border-end border-bottom">{(item.rate || 0).toFixed(2)}</td>
                      <td className="text-end pe-2 border-bottom fw-bold">{(item.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                  {[...Array(emptyRows)].map((_, i) => (
                    <tr key={`empty-${i}`} style={{ height: '25px' }}>
                      <td className="border-end border-bottom">&nbsp;</td>
                      <td className="border-end border-bottom"></td>
                      <td className="border-end border-bottom"></td>
                      <td className="border-end border-bottom"></td>
                      <td className="border-end border-bottom"></td>
                      <td className="border-end border-bottom"></td>
                      <td className="border-end border-bottom"></td>
                      <td className="border-bottom"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 5. BOTTOM SECTION (SPLIT) */}
            <div className="bottom-section row g-0 align-items-stretch">
              {/* LEFT SIDE: TAX, WORDS, BANK, TERMS */}
              <div className="col-6 border-end d-flex flex-column">
                <div className="p-2 border-bottom">
                  <div className="mb-2">
                    <p className="fw-bold mb-0" style={{ fontSize: '11px' }}>Tax Amount:</p>
                    <p className="fw-bold mb-0" style={{ fontSize: '12px' }}>₹{((invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="mb-2">
                    <p className="fw-bold mb-0" style={{ fontSize: '11px' }}>Tax Amount in words:</p>
                    <p className="fw-bold text-uppercase mb-0" style={{ fontSize: '10px', lineHeight: '1.2' }}>{((invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0)) > 0 ? invoice.taxAmountInWords : 'Zero Only'}</p>
                  </div>
                  <div>
                    <p className="fw-bold mb-0" style={{ fontSize: '11px' }}>Net Amount in words:</p>
                    <p className="fw-bold text-uppercase mb-0" style={{ fontSize: '10px', lineHeight: '1.2' }}>{invoice.netAmountInWords || 'Zero Only'}</p>
                  </div>
                </div>

                <div className="p-2 border-bottom">
                  <p className="fw-bold mb-1 text-decoration-underline text-uppercase" style={{ fontSize: '11px' }}>Bank Details:</p>
                  <table className="w-100" style={{ tableLayout: 'fixed', fontSize: '10px' }}>
                    <tbody>
                      <tr><td className="fw-bold py-0" style={{ width: '30%' }}>Bank Name</td><td className="py-0 text-uppercase">: {invoice.bankDetails?.bankName || '-'}</td></tr>
                      <tr><td className="fw-bold py-0">A/c No</td><td className="py-0 fw-bold">: {invoice.bankDetails?.accountNumber || '-'}</td></tr>
                      <tr><td className="fw-bold py-0">Branch</td><td className="py-0 text-uppercase">: {invoice.bankDetails?.branchName || '-'}</td></tr>
                      <tr><td className="fw-bold py-0">IFSC Code</td><td className="py-0 text-uppercase">: {invoice.bankDetails?.ifscCode || '-'}</td></tr>
                    </tbody>
                  </table>
                </div>

                <div className="p-2 flex-grow-1 terms-section">
                  <p className="fw-bold mb-1 text-decoration-underline" style={{ fontSize: '11px' }}>Terms & Conditions:</p>
                  <ul className="ps-3 mb-0" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                    {invoice.terms && invoice.terms.length > 0 ? (
                      invoice.terms.map((term, i) => <li key={i} className="mb-1">{term}</li>)
                    ) : (
                      <>
                        <li className="mb-1">Interest at 24% will be charged if payment is not made within 15 days.</li>
                        <li className="mb-1">Our responsibility ceases as soon as goods leave our premises.</li>
                        <li className="mb-1">Any complaint regarding this invoice must be made within 3 days.</li>
                        <li>Subject to Surat Jurisdiction.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              {/* RIGHT SIDE: SUMMARY + SIGNATURE */}
              <div className="col-6 d-flex flex-column">
                <div className="summary-section">
                  <table className="w-100 summary-table" style={{ tableLayout: 'fixed' }}>
                    <tbody style={{ fontSize: '11px' }}>
                      <tr><td className="ps-2 py-1 border-bottom border-end fw-bold">Sub Total</td><td className="text-end pe-2 py-1 border-bottom fw-bold">{(invoice.subTotal || 0).toFixed(2)}</td></tr>
                      <tr><td className="ps-2 py-1 border-bottom border-end">P & F Charges</td><td className="text-end pe-2 py-1 border-bottom fw-bold">{(invoice.pandFCharges || 0).toFixed(2)}</td></tr>
                      <tr><td className="ps-2 py-1 border-bottom border-end fw-bold">Taxable Amount</td><td className="text-end pe-2 py-1 border-bottom fw-bold">{(invoice.taxableAmount || 0).toFixed(2)}</td></tr>
                      <tr><td className="ps-2 py-1 border-bottom border-end fw-bold">CGST (9%)</td><td className="text-end pe-2 py-1 border-bottom fw-bold">{(invoice.cgst || 0).toFixed(2)}</td></tr>
                      <tr><td className="ps-2 py-1 border-bottom border-end fw-bold">SGST (9%)</td><td className="text-end pe-2 py-1 border-bottom fw-bold">{(invoice.sgst || 0).toFixed(2)}</td></tr>
                      <tr><td className="ps-2 py-1 border-bottom border-end fw-bold">Round-Off</td><td className="text-end pe-2 py-1 border-bottom fw-bold">{(invoice.roundOff || 0).toFixed(2)}</td></tr>
                      <tr className="grand-total" style={{ backgroundColor: '#fff' }}>
                        <td className="ps-2 py-2 border-end fw-bold">Grand Total</td>
                        <td className="text-end pe-2 py-2 fw-bold">₹{(invoice.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="signature-section p-3 text-center border-top">
                  <p className="fw-bold mb-0 text-uppercase" style={{ fontSize: '11px' }}>FOR, SHREE SHYAM FAB</p>
                  <div style={{ height: '25px' }}></div>
                  <div className="mx-auto" style={{ width: '80%', borderTop: '1px solid #000' }}></div>
                  <p className="fw-bold mb-0 mt-1" style={{ fontSize: '10px' }}>Authorized Signature</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* ULTRA ACCURATE PIXEL PERFECT STYLING */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }

        .invoice-container {
          width: 190mm;
          height: 270mm;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #444;
          box-sizing: border-box;
          position: relative;
          display: flex;
          flex-direction: column;
          font-family: Arial, Helvetica, sans-serif;
          color: #000;
          overflow: hidden;
        }
        
        .invoice-box {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          background-color: #fff;
        }

        .invoice-container table {
          width: 100% !important;
          border-collapse: collapse !important;
          table-layout: fixed !important;
          margin: 0 !important;
          min-width: 0 !important;
        }

        .invoice-container td, 
        .invoice-container th {
          padding: 4px;
          color: #000;
          word-break: break-word;
          border: none;
        }

        .product-table-area {
          height: 260px;
          overflow: hidden;
        }

        .bottom-section {
          height: 220px;
        }

        .summary-section {
          overflow: hidden;
        }

        .summary-table {
          width: 100%;
          height: 210px;
          table-layout: fixed;
        }

        .summary-table tr {
          height: 30px;
        }

        .summary-table .grand-total {
          height: 40px;
        }

        .summary-table .grand-total td {
          font-weight: 700;
          font-size: 22px;
        }

        .signature-section {
          height: 70px;
          margin-top: 10px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding-bottom: 5px;
        }

        .company-name {
          font-size: 24px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .product-table thead td {
          background-color: #f8f9fa !important;
          -webkit-print-color-adjust: exact;
        }

        .product-table td {
          vertical-align: middle;
        }

        .summary-table td {
          height: 25px;
          vertical-align: middle;
        }

        .table-bordered-cells td {
          border-color: #000 !important;
        }

        @media print {
          html,
          body {
            width: 210mm;
            height: 297mm;
            margin: 0;
            padding: 0;
          }
          .no-print { 
            display: none !important; 
          }
          .container { 
            max-width: none !important; 
            width: auto !important; 
            padding: 0 !important; 
            margin: 0 !important; 
          }
          .invoice-wrapper {
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .invoice-container {
            page-break-inside: avoid;
            break-inside: avoid;
            margin: 0 auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceDetail;
