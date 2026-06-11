import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { ToWords } from 'to-words';

const toWords = new ToWords({
  localeCode: 'en-IN',
  converterOptions: {
    currency: true,
    ignoreDecimal: false,
    ignoreZeroCurrency: false,
    doNotAddOnly: false,
    currencyOptions: {
      name: 'Rupee',
      plural: 'Rupees',
      symbol: '₹',
      fractionalUnit:{
        name: 'Paisa',
        plural: 'Paise',
        symbol: '',
      }
    }
  }
});

const InvoiceForm = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [formData, setFormData] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    orderNumber: '',
    orderDate: '',
    parcelBag: '',
    eWayBill: '',
    transportName: '',
    companyDetails: {
      name: 'SHREE SHYAM FAB',
      address: 'ROAD - 3, PLOt NO - 2048 2TH FLOOR DIAMOND INDUSTRIAL PARK, SACHIN GIDC, SURAT, GUJARAT, INDIA - 394230',
      gstNumber: '',
      phone: '',
    },
    customerDetails: {
      name: '',
      billingAddress: '',
      shippingAddress: '',
      mobileNumber: '',
      state: 'Gujarat',
      stateCode: '24',
      gstNumber: '',
    },
    products: [
      { srNo: 1, description: '', hsn: '', gstPercent: 18, quantity: 0, uom: 'KGS', rate: 0, amount: 0 }
    ],
    pandFCharges: 0,
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      branchName: '',
    },
    terms: [
      'Interest at 24% will be charged if payment is not made within 15 days.',
      'Our responsibility ceases as soon as goods leave our premises.',
      'Any complaint regarding this invoice must be made within 3 days.',
      'Subject to Surat Jurisdiction.'
    ],
  });
  const [totals, setTotals] = useState({
    subTotal: 0,
    taxableAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    roundOff: 0,
    grandTotal: 0,
    taxAmountInWords: '',
    netAmountInWords: '',
  });

  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    try {
      const token = await getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const apiUrl = '/api/user/profile';
      console.log(`[FETCH] Profile from: ${apiUrl}`);
      const res = await api.get(apiUrl, config);
      if (res.data && res.data.companyDetails) {
        setFormData(prev => ({
          ...prev,
          companyDetails: {
            ...prev.companyDetails,
            ...res.data.companyDetails
          }
        }));
      }
    } catch (err) {
      console.error('Error fetching profile', err);
    }
  }, [getToken]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const calculateTotals = useCallback(() => {
    let subTotal = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const isInterState = formData.customerDetails.state && 
                        formData.customerDetails.state.toLowerCase() !== 'gujarat';

    // Calculate product totals and their GST
    formData.products.forEach(product => {
      const amount = product.amount || 0;
      const gstRate = product.gstPercent || 0;
      const gstAmount = (amount * gstRate) / 100;
      
      subTotal += amount;

      if (isInterState) {
        totalIgst += gstAmount;
      } else {
        totalCgst += gstAmount / 2;
        totalSgst += gstAmount / 2;
      }
    });

    const pandF = parseFloat(formData.pandFCharges) || 0;
    const taxableAmount = subTotal + pandF;
    
    // Add GST on P&F charges
    if (pandF > 0) {
      const pandFGstRate = formData.products.length > 0 ? formData.products[0].gstPercent : 18;
      const pandFGstAmount = (pandF * pandFGstRate) / 100;
      
      if (isInterState) {
        totalIgst += pandFGstAmount;
      } else {
        totalCgst += pandFGstAmount / 2;
        totalSgst += pandFGstAmount / 2;
      }
    }
    
    const totalGst = totalIgst + totalCgst + totalSgst;
    const rawGrandTotal = taxableAmount + totalGst;
    const grandTotal = Math.round(rawGrandTotal);
    const roundOff = parseFloat((grandTotal - rawGrandTotal).toFixed(2));

    setTotals({
      subTotal,
      taxableAmount,
      cgst: parseFloat(totalCgst.toFixed(2)),
      sgst: parseFloat(totalSgst.toFixed(2)),
      igst: parseFloat(totalIgst.toFixed(2)),
      roundOff,
      grandTotal,
      taxAmountInWords: totalGst > 0 ? toWords.convert(parseFloat(totalGst.toFixed(2))) : 'ZERO',
      netAmountInWords: toWords.convert(grandTotal),
    });
  }, [formData.products, formData.pandFCharges, formData.customerDetails.state]);

  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleProductChange = (index, e) => {
    const { name, value } = e.target;
    const newProducts = [...formData.products];
    const product = { ...newProducts[index] };
    
    if (name === 'description' || name === 'hsn' || name === 'uom') {
      product[name] = value;
    } else {
      product[name] = parseFloat(value) || 0;
    }
    
    if (name === 'quantity' || name === 'rate') {
      product.amount = product.quantity * product.rate;
    }
    
    newProducts[index] = product;
    setFormData({ ...formData, products: newProducts });
  };

  const addProduct = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { srNo: formData.products.length + 1, description: '', hsn: '', gstPercent: 18, quantity: 0, uom: 'KGS', rate: 0, amount: 0 }]
    });
  };

  const removeProduct = (index) => {
    const products = formData.products.filter((_, i) => i !== index).map((p, i) => ({ ...p, srNo: i + 1 }));
    setFormData({ ...formData, products });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const token = await getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      
      const invoiceData = {
        ...formData,
        ...totals,
      };

      const apiUrl = "/api/invoices";
      console.log(`[POST] Saving invoice to: ${apiUrl}`);
      const res = await api.post(apiUrl, invoiceData, config);

      setSuccessMessage("Invoice Saved Successfully!");
      const savedInvoice = res.data.invoice || res.data;
      
      // Wait 2 seconds before navigating so user can see the message
      setTimeout(() => {
        navigate(`/invoice/${savedInvoice._id}`);
      }, 2000);
    } catch (err) {
      console.error('Error saving invoice:', err);
      // PRIORITY: Use the message from the server if available
      const serverMessage = err.response?.data?.msg || err.response?.data?.message;
      setError(serverMessage || 'Failed to save invoice. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button onClick={() => navigate('/invoices')} className="btn btn-outline-secondary">
          <ArrowLeft size={18} className="me-2" /> Back
        </button>
        <h2 className="mb-0">Create GST Invoice</h2>
        <div />
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-sm">
        {/* Company Details Section */}
        <div className="row mb-4 border-bottom pb-3">
          <div className="col-12">
            <h5 className="text-primary border-bottom pb-2">Your Company Details (Header)</h5>
            <div className="row">
              <div className="col-md-4 mb-2">
                <label className="form-label small mb-1">Company Name</label>
                <input type="text" name="companyDetails.name" className="form-control form-control-sm" value={formData.companyDetails.name} onChange={handleInputChange} required />
              </div>
              <div className="col-md-4 mb-2">
                <label className="form-label small mb-1">Company GSTIN</label>
                <input type="text" name="companyDetails.gstNumber" className="form-control form-control-sm" value={formData.companyDetails.gstNumber} onChange={handleInputChange} />
              </div>
              <div className="col-md-4 mb-2">
                <label className="form-label small mb-1">Company Phone</label>
                <input type="text" name="companyDetails.phone" className="form-control form-control-sm" value={formData.companyDetails.phone} onChange={handleInputChange} />
              </div>
            </div>
            <div className="mb-2">
              <label className="form-label small mb-1">Company Address</label>
              <textarea name="companyDetails.address" className="form-control form-control-sm" rows="1" value={formData.companyDetails.address} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        {/* Invoice Header Section */}
        <div className="row mb-4 border-bottom pb-3">
          <div className="col-md-6 border-md-end border-sm-bottom pb-3 pb-md-0">
            <h5 className="text-primary border-bottom pb-2">Customer Details</h5>
            <div className="mb-2">
              <label className="form-label small mb-1">Customer Name</label>
              <input type="text" name="customerDetails.name" className="form-control form-control-sm" onChange={handleInputChange}  required />
            </div>
            <div className="mb-2">
              <label className="form-label small mb-1">Billing Address</label>
              <textarea name="customerDetails.billingAddress" className="form-control form-control-sm" rows="2" onChange={handleInputChange} required />
            </div>
            <div className="mb-2">
              <label className="form-label small mb-1">Shipping Address</label>
              <textarea name="customerDetails.shippingAddress" className="form-control form-control-sm" rows="2" onChange={handleInputChange} />
            </div>
            <div className="row">
              <div className="col-md-6 mb-2">
                <label className="form-label small mb-1">Mobile Number</label>
                <input type="text" name="customerDetails.mobileNumber" className="form-control form-control-sm" value={formData.customerDetails.mobileNumber} onChange={handleInputChange} />
              </div>
              <div className="col-md-6 mb-2">
                <label className="form-label small mb-1">GSTIN</label>
                <input type="text" name="customerDetails.gstNumber" className="form-control form-control-sm" value={formData.customerDetails.gstNumber} onChange={handleInputChange} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-2">
                <label className="form-label small mb-1">State</label>
                <input type="text" name="customerDetails.state" className="form-control form-control-sm" value={formData.customerDetails.state} onChange={handleInputChange} placeholder="e.g. Gujarat" />
              </div>
              <div className="col-md-6 mb-2">
                <label className="form-label small mb-1">State Code</label>
                <input type="text" name="customerDetails.stateCode" className="form-control form-control-sm" value={formData.customerDetails.stateCode} onChange={handleInputChange} placeholder="e.g. 24" />
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <h5 className="text-primary border-bottom pb-2">Invoice Details</h5>
            <div className="row">
              <div className="col-md-6 mb-2">
                <label className="form-label small mb-1">Invoice Number</label>
                <input type="text" name="invoiceNumber" className="form-control form-control-sm" value={formData.invoiceNumber} onChange={handleInputChange} required />
              </div>
              <div className="col-md-6 mb-2">
                <label className="form-label small mb-1">Invoice Date</label>
                <input type="date" name="date" className="form-control form-control-sm" value={formData.date} onChange={handleInputChange} required />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-2">
                <label className="form-label small mb-1">Order Number</label>
                <input type="text" name="orderNumber" className="form-control form-control-sm" value={formData.orderNumber} onChange={handleInputChange} />
              </div>
              <div className="col-md-6 mb-2">
                <label className="form-label small mb-1">Order Date</label>
                <input type="date" name="orderDate" className="form-control form-control-sm" value={formData.orderDate} onChange={handleInputChange} />
              </div>
            </div>
            <div className="row">
              <div className="col-md-6 mb-2">
                <label className="form-label small mb-1">Parcel Bag</label>
                <input type="text" name="parcelBag" className="form-control form-control-sm" value={formData.parcelBag} onChange={handleInputChange} />
              </div>
              <div className="col-md-6 mb-2">
                <label className="form-label small mb-1">E-Way Bill</label>
                <input type="text" name="eWayBill" className="form-control form-control-sm" value={formData.eWayBill} onChange={handleInputChange} />
              </div>
            </div>
            <div className="mb-2">
              <label className="form-label small mb-1">Transport Name</label>
              <input type="text" name="transportName" className="form-control form-control-sm" value={formData.transportName} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        {/* Product Table Section */}
        <div className="mb-4">
          <h5 className="text-primary mb-3">Products / Services</h5>
          <div className="table-responsive">
            <table className="table table-bordered table-sm align-middle">
              <thead className="table-light">
                <tr>
                  <th width="50">Sr</th>
                  <th>Description of Goods</th>
                  <th width="100">HSN</th>
                  <th width="80">GST %</th>
                  <th width="100">Qty</th>
                  <th width="80">UOM</th>
                  <th width="120">Rate</th>
                  <th width="120">Amount</th>
                  <th width="50"></th>
                </tr>
              </thead>
              <tbody>
                {formData.products.map((product, index) => (
                  <tr key={index}>
                    <td className="text-center">{product.srNo}</td>
                    <td><input type="text" name="description" className="form-control form-control-sm border-0" value={product.description} onChange={(e) => handleProductChange(index, e)} required /></td>
                    <td><input type="text" name="hsn" className="form-control form-control-sm border-0 text-center" value={product.hsn} onChange={(e) => handleProductChange(index, e)} /></td>
                    <td>
                      <select name="gstPercent" className="form-select form-select-sm border-0" value={product.gstPercent} onChange={(e) => handleProductChange(index, e)}>
                        <option value="5">5%</option>
                        <option value="12">12%</option>
                        <option value="18">18%</option>
                        <option value="28">28%</option>
                      </select>
                    </td>
                    <td><input type="number" name="quantity" className="form-control form-control-sm border-0 text-center" value={product.quantity} onChange={(e) => handleProductChange(index, e)} required /></td>
                    <td><input type="text" name="uom" className="form-control form-control-sm border-0 text-center" value={product.uom} onChange={(e) => handleProductChange(index, e)} /></td>
                    <td><input type="number" name="rate" className="form-control form-control-sm border-0 text-end" value={product.rate} onChange={(e) => handleProductChange(index, e)} required /></td>
                    <td className="text-end fw-bold">₹{product.amount.toFixed(2)}</td>
                    <td className="text-center">
                      <button type="button" onClick={() => removeProduct(index)} className="btn btn-link text-danger p-0" disabled={formData.products.length === 1}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addProduct} className="btn btn-sm btn-outline-primary">
            <Plus size={16} className="me-1" /> Add Product
          </button>
        </div>

        {/* Calculation and Bank Details Section */}
        <div className="row g-4">
          <div className="col-md-7">
            <div className="card border-0 bg-light mb-3">
              <div className="card-body">
                <h6 className="fw-bold border-bottom pb-2">Bank Details</h6>
                <div className="row small">
                  <div className="col-6 mb-2">
                    <label className="text-muted d-block">Bank Name</label>
                    <input type="text" name="bankDetails.bankName" className="form-control form-control-sm" value={formData.bankDetails.bankName} onChange={handleInputChange} />
                  </div>
                  <div className="col-6 mb-2">
                    <label className="text-muted d-block">Account Number</label>
                    <input type="text" name="bankDetails.accountNumber" className="form-control form-control-sm" value={formData.bankDetails.accountNumber} onChange={handleInputChange} />
                  </div>
                  <div className="col-6 mb-2">
                    <label className="text-muted d-block">IFSC Code</label>
                    <input type="text" name="bankDetails.ifscCode" className="form-control form-control-sm" value={formData.bankDetails.ifscCode} onChange={handleInputChange} />
                  </div>
                  <div className="col-6 mb-2">
                    <label className="text-muted d-block">Branch Name</label>
                    <input type="text" name="bankDetails.branchName" className="form-control form-control-sm" value={formData.bankDetails.branchName} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="card border-0 bg-light">
              <div className="card-body">
                <h6 className="fw-bold border-bottom pb-2">Terms & Conditions</h6>
                {formData.terms.map((term, i) => (
                  <div key={i} className="mb-2 d-flex gap-2">
                    <span className="small text-muted">{i+1}.</span>
                    <input 
                      type="text" 
                      className="form-control form-control-sm" 
                      value={term} 
                      onChange={(e) => {
                        const newTerms = [...formData.terms];
                        newTerms[i] = e.target.value;
                        setFormData({ ...formData, terms: newTerms });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-md-5">
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between mb-2">
                  <span>Sub Total:</span>
                  <span className="fw-bold">₹{totals.subTotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2 align-items-center">
                  <span>P & F Charges:</span>
                  <input type="number" name="pandFCharges" className="form-control form-control-sm w-50 text-end" value={formData.pandFCharges} onChange={handleInputChange} />
                </div>
                
                <div className="d-flex justify-content-between mb-2 border-top pt-2">
                  <span className="fw-bold">Taxable Amount:</span>
                  <span className="fw-bold">₹{totals.taxableAmount.toFixed(2)}</span>
                </div>

                {totals.igst > 0 ? (
                  <div className="d-flex justify-content-between mb-2">
                    <span>IGST:</span>
                    <span>₹{totals.igst.toFixed(2)}</span>
                  </div>
                ) : (
                  <>
                    <div className="d-flex justify-content-between mb-2">
                      <span>CGST (9%):</span>
                      <span>₹{totals.cgst.toFixed(2)}</span>
                    </div>
                    <div className="d-flex justify-content-between mb-2">
                      <span>SGST (9%):</span>
                      <span>₹{totals.sgst.toFixed(2)}</span>
                    </div>
                  </>
                )}

                <div className="d-flex justify-content-between mb-2 border-top pt-2">
                  <span className="fw-bold">Tax Amount:</span>
                  <span className="fw-bold">₹{(totals.cgst + totals.sgst + totals.igst).toFixed(2)}</span>
                </div>
                <div className="mb-2 p-2 bg-light rounded x-small" style={{ fontSize: '0.75rem' }}>
                  <strong>Tax Amount in words:</strong> {totals.taxAmountInWords}
                </div>

                <div className="d-flex justify-content-between mb-2 border-top pt-2">
                  <span>Round Off:</span>
                  <span className="text-muted small">{totals.roundOff.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mt-3 border-top pt-3">
                  <h5 className="mb-0">Grand Total:</h5>
                  <h5 className="mb-0 text-primary">₹{totals.grandTotal.toLocaleString()}</h5>
                </div>
                <div className="mt-3 p-2 bg-light rounded small">
                  <strong>In Words:</strong> {totals.netAmountInWords}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 border-top pt-4 text-end">
          {error && <div className="alert alert-danger py-2 px-3 small d-inline-block me-3">{error}</div>}
          {successMessage && <div className="alert alert-success py-2 px-3 small d-inline-block me-3">{successMessage}</div>}
          <button type="submit" className="btn btn-primary btn-lg px-5" disabled={submitting}>
            <Save size={20} className="me-2" /> {submitting ? 'Saving...' : 'Save Invoice'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default InvoiceForm;
