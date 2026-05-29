import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useReactToPrint } from 'react-to-print';
import { Printer, ArrowLeft, Trash2, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const InvoiceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoaded, getToken } = useAuth();
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
        scale: 2,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${invoice.invoiceNumber}.pdf`);
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
        await axios.delete(`/api/invoices/${id}`, config);
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
        const res = await axios.get(`/api/invoices/${id}`, config);
        setInvoice(res.data);
      } catch (err) {
        console.error('Error fetching invoice', err);
        setError('Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };
    if (isLoaded) {
      fetchData();
    }
  }, [id, isLoaded, getToken]);

  if (!isLoaded || loading) return <div className="container py-5 text-center"><h3>Loading Invoice...</h3></div>;
  if (error || !invoice) return <div className="container py-5 text-center"><h3 className="text-danger">{error || 'Invoice not found'}</h3></div>;

  return (
    <div className="container py-4">
      {/* Action Buttons */}
      <div className="d-flex justify-content-between mb-4 no-print">
        <button onClick={() => navigate('/invoices')} className="btn btn-outline-secondary">
          <ArrowLeft size={18} className="me-2" /> Back
        </button>
        <div className="d-flex gap-2">
          {message && (
            <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-danger'} py-2 px-3 mb-0 d-flex align-items-center small`}>
              {message}
            </div>
          )}
          <button onClick={handlePrint} className="btn btn-primary">
            <Printer size={18} className="me-2" /> Print
          </button>
          <button onClick={handleDownloadPDF} className="btn btn-success">
            <Download size={18} className="me-2" /> Download PDF
          </button>
          <button onClick={deleteInvoice} className="btn btn-danger">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Invoice Document */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        ref={componentRef}
        className="invoice-container bg-white mx-auto"
        style={{
          width: '210mm',
          height: '297mm',
          padding: '10mm',
          color: '#000',
          fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          fontSize: '10pt',
          lineHeight: '1.2',
          border: '1px solid #000',
          boxSizing: 'border-box',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Top Header */}
        <div className="d-flex justify-content-between px-2 py-1" style={{ borderBottom: '1px solid #000' }}>
          <span className="fw-bold">TAX INVOICE</span>
          <span className="fw-bold">|| શ્રી ગણેશાય નમઃ ||</span>
          <span className="fw-bold">Original</span>
        </div>

        {/* Company Header */}
        <div className="text-center py-3" style={{ borderBottom: '1px solid #000' }}>
          <h2 className="fw-bold mb-1" style={{ fontSize: '24pt', color: '#000' }}>{invoice.companyDetails?.name || ''}</h2>
          <p className="fw-bold mb-1 text-uppercase" style={{ fontSize: '9pt', letterSpacing: '0.5px' }}>
            STOCKIST & SUPPLIERS OF : <br />
            MOSQUITO NET AND KURTI MANUFACTURERING
          </p>
          <p className="mb-1" style={{ fontSize: '10pt' }}>
            {invoice.companyDetails?.address || ''}
          </p>
          <p className="fw-bold mb-0">GSTIN: {invoice.companyDetails?.gstNumber || ''}</p>
        </div>

        {/* Customer and Invoice Details Row */}
        <div className="row m-0" style={{ borderBottom: '1px solid #000' }}>
          <div className="col-6 p-2 border-end border-dark">
            <h6 className="fw-bold text-decoration-underline mb-2 small">Customer Details:</h6>
            <div className="mb-1"><strong>Name:</strong> {invoice.customerDetails.name}</div>
            <div className="mb-1"><strong>Billing Address:</strong> {invoice.customerDetails.billingAddress}</div>
            <div className="mb-1"><strong>Mobile Number:</strong> {invoice.customerDetails.mobileNumber}</div>
            <div className="row mb-1">
              <div className="col-6"><strong>State:</strong> {invoice.customerDetails.state}</div>
              <div className="col-6"><strong>State Code:</strong> {invoice.customerDetails.stateCode}</div>
            </div>
            <div className="mb-0"><strong>Party GSTIN:</strong> {invoice.customerDetails.gstNumber}</div>
          </div>
          <div className="col-6 p-0">
            <table className="table table-bordered mb-0 h-100 border-0">
              <tbody className="small">
                <tr>
                  <td className="p-1 px-2 border-0 border-bottom border-dark" style={{ width: '40%' }}><strong>Invoice No</strong></td>
                  <td className="p-1 px-2 border-0 border-bottom border-dark border-start"><strong>{invoice.invoiceNumber}</strong></td>
                </tr>
                <tr>
                  <td className="p-1 px-2 border-0 border-bottom border-dark"><strong>Invoice Date</strong></td>
                  <td className="p-1 px-2 border-0 border-bottom border-dark border-start">{new Date(invoice.date).toLocaleDateString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="p-1 px-2 border-0 border-bottom border-dark"><strong>Order No</strong></td>
                  <td className="p-1 px-2 border-0 border-bottom border-dark border-start">{invoice.orderNumber || '-'}</td>
                </tr>
                <tr>
                  <td className="p-1 px-2 border-0 border-bottom border-dark"><strong>Order Date</strong></td>
                  <td className="p-1 px-2 border-0 border-bottom border-dark border-start">{invoice.orderDate ? new Date(invoice.orderDate).toLocaleDateString('en-IN') : '-'}</td>
                </tr>
                <tr>
                  <td className="p-1 px-2 border-0 border-bottom border-dark"><strong>Parcel Bag</strong></td>
                  <td className="p-1 px-2 border-0 border-bottom border-dark border-start">{invoice.parcelBag || '-'}</td>
                </tr>
                <tr>
                  <td className="p-1 px-2 border-0 border-bottom border-dark"><strong>E-Way Bill</strong></td>
                  <td className="p-1 px-2 border-0 border-bottom border-dark border-start">{invoice.eWayBill || '-'}</td>
                </tr>
                <tr>
                  <td className="p-1 px-2 border-0 border-dark"><strong>Transport</strong></td>
                  <td className="p-1 px-2 border-0 border-dark border-start">{invoice.transportName || '-'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Product Table */}
        <div className="mt-0">
          <table className="table table-bordered mb-0 border-dark" style={{ border: 'none' }}>
            <thead style={{ backgroundColor: '#f8f9fa' }}>
              <tr style={{ borderBottom: '1px solid #000' }}>
                <th width="40" className="text-center p-1 border-dark border-bottom small">Sr No</th>
                <th className="p-1 border-dark border-bottom small">Description of Goods</th>
                <th width="70" className="text-center p-1 border-dark border-bottom small">HSN</th>
                <th width="50" className="text-center p-1 border-dark border-bottom small">GST %</th>
                <th width="60" className="text-center p-1 border-dark border-bottom small">Qty</th>
                <th width="50" className="text-center p-1 border-dark border-bottom small">UOM</th>
                <th width="90" className="text-center p-1 border-dark border-bottom small">Rate</th>
                <th width="110" className="text-center p-1 border-dark border-bottom border-end-0 small">Amount</th>
              </tr>
            </thead>
            <tbody className="small">
              {invoice.products.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #000' }}>
                  <td className="text-center p-1 border-dark">{item.srNo || idx + 1}</td>
                  <td className="p-1 border-dark" style={{ minHeight: '30px' }}>{item.description}</td>
                  <td className="text-center p-1 border-dark">{item.hsn}</td>
                  <td className="text-center p-1 border-dark">{item.gstPercent}%</td>
                  <td className="text-center p-1 border-dark">{item.quantity}</td>
                  <td className="text-center p-1 border-dark">{item.uom}</td>
                  <td className="text-end p-1 border-dark">{(item.rate || 0).toFixed(2)}</td>
                  <td className="text-end p-1 border-dark border-end-0 fw-bold">{(item.amount || 0).toFixed(2)}</td>
                </tr>
              ))}
              {/* Fill remaining space to keep table look consistent */}
              {[...Array(Math.max(0, 10 - invoice.products.length))].map((_, i) => (
                <tr key={`empty-${i}`} style={{ height: '25px', borderBottom: '1px solid #000' }}>
                  <td className="border-dark"></td>
                  <td className="border-dark"></td>
                  <td className="border-dark"></td>
                  <td className="border-dark"></td>
                  <td className="border-dark"></td>
                  <td className="border-dark"></td>
                  <td className="border-dark"></td>
                  <td className="border-dark border-end-0"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="row m-0" style={{ borderBottom: '1px solid #000' }}>
          <div className="col-7 p-2 border-end border-dark d-flex flex-column justify-content-between">
            <div>
              <div className="mb-2">
                <span className="fw-bold text-decoration-underline small">Tax Amount:</span><br />
                <span className="fw-bold">₹{( (invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0) ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="mb-2">
                <span className="fw-bold text-decoration-underline small">Tax Amount in words:</span><br />
                <span className="small text-uppercase fw-bold">{( (invoice.cgst || 0) + (invoice.sgst || 0) + (invoice.igst || 0) ) > 0 ? invoice.taxAmountInWords : 'Zero'}</span>
              </div>
              <div className="mb-2">
                <span className="fw-bold text-decoration-underline small">Net Amount in words:</span><br />
                <span className="small text-uppercase fw-bold">{invoice.netAmountInWords}</span>
              </div>
            </div>
            
            <div className="pt-2 border-top border-dark">
              <h6 className="fw-bold mb-1 small text-decoration-underline">Bank Details:</h6>
              <div className="row small">
                <div className="col-6"><strong>Bank Name:</strong> {invoice.bankDetails?.bankName}</div>
                <div className="col-6"><strong>A/c No:</strong> {invoice.bankDetails?.accountNumber}</div>
                <div className="col-6"><strong>IFSC Code:</strong> {invoice.bankDetails?.ifscCode}</div>
                <div className="col-6"><strong>Branch:</strong> {invoice.bankDetails?.branchName}</div>
              </div>
            </div>
          </div>
          
          <div className="col-5 p-0">
            <table className="table table-bordered mb-0 border-0 h-100">
              <tbody className="small">
                <tr>
                  <td className="p-1 px-2 border-0 border-bottom border-dark">Sub Total</td>
                  <td className="p-1 px-2 text-end fw-bold border-0 border-bottom border-dark border-start" style={{ width: '130px' }}>{(invoice.subTotal || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-1 px-2 border-0 border-bottom border-dark">P & F Charges</td>
                  <td className="p-1 px-2 text-end fw-bold border-0 border-bottom border-dark border-start">{(invoice.pandFCharges || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-1 px-2 border-0 border-bottom border-dark fw-bold">Taxable Amount</td>
                  <td className="p-1 px-2 text-end fw-bold border-0 border-bottom border-dark border-start">{(invoice.taxableAmount || 0).toFixed(2)}</td>
                </tr>
                {(invoice.igst || 0) > 0 ? (
                  <tr>
                    <td className="p-1 px-2 border-0 border-bottom border-dark">IGST</td>
                    <td className="p-1 px-2 text-end fw-bold border-0 border-bottom border-dark border-start">{(invoice.igst || 0).toFixed(2)}</td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td className="p-1 px-2 border-0 border-bottom border-dark">CGST (9%)</td>
                      <td className="p-1 px-2 text-end fw-bold border-0 border-bottom border-dark border-start">{(invoice.cgst || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="p-1 px-2 border-0 border-bottom border-dark">SGST (9%)</td>
                      <td className="p-1 px-2 text-end fw-bold border-0 border-bottom border-dark border-start">{(invoice.sgst || 0).toFixed(2)}</td>
                    </tr>
                  </>
                )}
                <tr>
                  <td className="p-1 px-2 border-0 border-bottom border-dark">Round-Off</td>
                  <td className="p-1 px-2 text-end fw-bold border-0 border-bottom border-dark border-start">{(invoice.roundOff || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="p-1 px-2 fw-bold border-0 bg-light">Grand Total</td>
                  <td className="p-1 px-2 text-end fw-bold border-0 border-start bg-light" style={{ fontSize: '11pt' }}>₹{(invoice.grandTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Terms and Signature */}
        <div className="row m-0" style={{ borderBottom: '1px solid #000' }}>
          <div className="col-7 p-2 border-end border-dark">
            <h6 className="fw-bold mb-1 small text-decoration-underline">Terms & Conditions:</h6>
            <ul className="ps-3 mb-0" style={{ fontSize: '7.5pt' }}>
              {invoice.terms.map((term, i) => <li key={i}>{term}</li>)}
            </ul>
          </div>
          <div className="col-5 p-2 text-center d-flex flex-column justify-content-between" style={{ height: '100px' }}>
            <div className="fw-bold small text-uppercase" style={{ fontSize: '8pt' }}>For, {invoice.companyDetails?.name || ''}</div>
            <div className="mt-auto">
              <div className="border-top border-dark pt-1 fw-bold small">Authorized Signature</div>
            </div>
          </div>
        </div>
      </motion.div>
      
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            .no-print { display: none !important; }
            body { 
              background: white !important; 
              padding: 0 !important; 
              margin: 0 !important;
            }
            .container { 
              max-width: 100% !important; 
              width: 100% !important; 
              padding: 0 !important; 
              margin: 0 !important; 
            }
            .invoice-container { 
              border: none !important; 
              box-shadow: none !important; 
              padding: 10mm !important; 
              margin: 0 !important; 
              width: 210mm !important;
              height: 297mm !important;
              overflow: hidden !important;
              page-break-after: avoid !important;
              page-break-before: avoid !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default InvoiceDetail;
