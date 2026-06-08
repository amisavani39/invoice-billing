import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { motion } from "framer-motion";

const initialFormState = {
  challanType: "ORIGINAL",
  poNo: "",
  chNo: "",
  date: new Date().toISOString().split("T")[0],
  fromDetails: {
    companyName: "SHREE SHYAM FAB",
    plotNo: "2048",
    roadNo: "3",
    area: "DIAMOND INDUSTRIAL PARK",
    cityRegion: "SACHIN GIDC, SURAT",
  },
  toDetails: {
    companyName: "",
    locationBranch: "",
  },
  gstin: "",
  items: [{ particulars: "", quantity: 0, rate: 0, per: "pcs" }],
  preparedBySignature: "",
  receivedBySignature: ""
};

const ChallanForm = () => {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [formData, setFormData] = useState(initialFormState);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: { ...formData[parent], [child]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    const item = { ...newItems[index] };

    if (name === "particulars" || name === "per") {
      item[name] = value;
    } else {
      item[name] = parseFloat(value) || 0;
    }

    newItems[index] = item;
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { particulars: "", quantity: 0, rate: 0, per: "pcs" }],
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setLoading(true);
    try {
      const token = await getToken();
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};

      const apiUrl = "/api/challans";
      console.log(`[POST] Saving challan to: ${apiUrl}`);
      await axios.post(apiUrl, formData, config);

      setSuccessMessage("Challan saved successfully");
      
      setFormData(initialFormState);

      setTimeout(() => {
        setSuccessMessage("");
        navigate("/challans");
      }, 2000);

    } catch (err) {
      console.error("Error saving challan:", err);
      setError(err.response?.data?.msg || "Error saving challan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <button onClick={() => navigate("/dashboard")} className="btn btn-outline-secondary">
          <ArrowLeft size={18} className="me-2" /> Back
        </button>
        <h2 className="mb-0">Create Delivery Challan</h2>
        <div />
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow-sm border">
        {/* Header Details */}
        <div className="row mb-4">
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Challan Type</label>
            <select name="challanType" className="form-select" value={formData.challanType} onChange={handleInputChange}>
                <option value="ORIGINAL">ORIGINAL</option>
                <option value="DUPLICATE">DUPLICATE</option>
                <option value="TRIPLICATE">TRIPLICATE</option>
                <option value="OFFICE COPY">OFFICE COPY</option>
            </select>
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">P.O. No.</label>
            <input type="text" name="poNo" className="form-control" value={formData.poNo} onChange={handleInputChange} />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Challan No. (chNo)</label>
            <input type="text" name="chNo" className="form-control" value={formData.chNo} onChange={handleInputChange} required />
          </div>
          <div className="col-md-3 mb-3">
            <label className="form-label fw-bold">Date</label>
            <input type="date" name="date" className="form-control" value={formData.date} onChange={handleInputChange} required />
          </div>
        </div>

        {/* Address Details */}
        <div className="row mb-4">
          <div className="col-md-6 mb-3">
            <h5 className="text-primary border-bottom pb-2">From (Sender)</h5>
            <div className="mb-2">
              <label className="form-label small mb-1">Company Name</label>
              <input type="text" name="fromDetails.companyName" className="form-control" value={formData.fromDetails.companyName} onChange={handleInputChange} required />
            </div>
            <div className="row">
                <div className="col-md-6 mb-2">
                    <label className="form-label small mb-1">Plot No</label>
                    <input type="text" name="fromDetails.plotNo" className="form-control" value={formData.fromDetails.plotNo} onChange={handleInputChange} />
                </div>
                <div className="col-md-6 mb-2">
                    <label className="form-label small mb-1">Road No</label>
                    <input type="text" name="fromDetails.roadNo" className="form-control" value={formData.fromDetails.roadNo} onChange={handleInputChange} />
                </div>
            </div>
            <div className="mb-2">
              <label className="form-label small mb-1">Area (Diamond Ind)</label>
              <input type="text" name="fromDetails.area" className="form-control" value={formData.fromDetails.area} onChange={handleInputChange} />
            </div>
            <div className="mb-2">
              <label className="form-label small mb-1">City/Region (Chachhi M)</label>
              <input type="text" name="fromDetails.cityRegion" className="form-control" value={formData.fromDetails.cityRegion} onChange={handleInputChange} />
            </div>
          </div>
          <div className="col-md-6 mb-3">
            <h5 className="text-primary border-bottom pb-2">To (Recipient)</h5>
            <div className="mb-2">
              <label className="form-label small mb-1">Client Company Name</label>
              <input type="text" name="toDetails.companyName" className="form-control" value={formData.toDetails.companyName} onChange={handleInputChange} required />
            </div>
            <div className="mb-2">
              <label className="form-label small mb-1">Location / Branch</label>
              <input type="text" name="toDetails.locationBranch" className="form-control" value={formData.toDetails.locationBranch} onChange={handleInputChange} />
            </div>
            <div className="mb-2">
                <label className="form-label small mb-1">GSTIN</label>
                <input type="text" name="gstin" className="form-control" placeholder="15-character GSTIN" maxLength="15" value={formData.gstin} onChange={handleInputChange} />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-4">
          <h5 className="text-primary mb-3">Items / Particulars</h5>
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th width="50">Sr</th>
                  <th>Particulars</th>
                  <th width="120">Qty</th>
                  <th width="120">Rate</th>
                  <th width="100">Per</th>
                  <th width="50"></th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index}>
                    <td className="text-center">{index + 1}</td>
                    <td><input type="text" name="particulars" className="form-control border-0" value={item.particulars} onChange={(e) => handleItemChange(index, e)} required /></td>
                    <td><input type="number" name="quantity" className="form-control border-0 text-center" value={item.quantity} onChange={(e) => handleItemChange(index, e)} required /></td>
                    <td><input type="number" name="rate" className="form-control border-0 text-end" value={item.rate} onChange={(e) => handleItemChange(index, e)} /></td>
                    <td><input type="text" name="per" className="form-control border-0 text-center" value={item.per} onChange={(e) => handleItemChange(index, e)} /></td>
                    <td className="text-center">
                      <button type="button" onClick={() => removeItem(index)} className="btn btn-link text-danger p-0" disabled={formData.items.length === 1}><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={addItem} className="btn btn-sm btn-outline-primary"><Plus size={16} className="me-1" /> Add Item</button>
        </div>

        <div className="row mb-4">
            <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Prepared By Signature</label>
                <input type="text" name="preparedBySignature" className="form-control" value={formData.preparedBySignature} onChange={handleInputChange} />
            </div>
            <div className="col-md-6 mb-3">
                <label className="form-label fw-bold">Received By Signature</label>
                <input type="text" name="receivedBySignature" className="form-control" value={formData.receivedBySignature} onChange={handleInputChange} />
            </div>
        </div>

        <div className="mt-4 border-top pt-4 text-end">
          {error && <div className="alert alert-danger py-2 px-3 small d-inline-block me-3">{error}</div>}
          {successMessage && <div className="alert alert-success py-2 px-3 small d-inline-block me-3">{successMessage}</div>}
          <button type="submit" className="btn btn-primary btn-lg px-5" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2" role="status"></span>Saving...</> : <><Save size={20} className="me-2" /> Save Challan</>}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default ChallanForm;
