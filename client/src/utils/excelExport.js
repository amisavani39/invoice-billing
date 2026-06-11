import * as XLSX from "xlsx";

/**
 * DEFINITIVE EXCEL EXPORT UTILITY
 * 
 * Root Cause of Corruption: 
 * The "file format or extension is not valid" error is caused by manual Blob creation 
 * and FileSaver.saveAs(). This process often corrupts the internal ZIP structure 
 * of the XLSX file.
 * 
 * Solution:
 * Use XLSX.writeFile(). It handles the binary stream and download headers 
 * natively, ensuring the file is a valid, uncorrupted ZIP-compressed XLSX.
 */
export const exportToExcel = (data, fileName = "Export.xlsx", sheetName = "Sheet1") => {
  // 5. Ensure data is a valid JavaScript array
  if (!Array.isArray(data) || data.length === 0) {
    alert("No data available");
    return;
  }

  try {
    // 7. Generate workbook correctly
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // 9. Validation logs for the developer
    console.log("Workbook Object:", workbook);
    console.log("Worksheet Object:", worksheet);

    // 8. Export only with XLSX.writeFile (Direct binary generation)
    // This line replaces the corrupted Blob implementation.
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error("Excel Export Error:", error);
    alert("An error occurred while generating the Excel file.");
  }
};

/**
 * Professional Excel Export Utility for Invoices
 * Requirement: Two-sheet export with full data mapping from MongoDB
 * @param {Object} invoice - The full invoice data object from backend
 */
export const exportInvoiceToExcel = (invoice) => {
  if (!invoice) {
    console.error("Export failed: No invoice data provided.");
    return;
  }

  // Requirement 7: Debugging logs
  console.log("Invoice Export Data:", invoice);
  console.log("Invoice Items:", invoice.products);

  const fileName = `Invoice_${invoice.invoiceNumber || 'Detail'}.xlsx`;

  // --- SHEET 1: INVOICE SUMMARY ---
  // Requirement 3: Company, Customer, Invoice, Financial, Bank Details
  const summaryRows = [
    ['COMPANY DETAILS'],
    ['Company Name', invoice.companyDetails?.name || "SHREE SHYAM FAB"],
    ['GST Number', invoice.companyDetails?.gstNumber || "24AEDPV3999J2ZR"],
    ['Address', invoice.companyDetails?.address || "ROAD - 3, PLOT NO - 2048 2TH FLOOR DIAMOND INDUSTRIAL PARK, SACHIN GIDC, SURAT, GUJARAT, INDIA - 394230"],
    ['Mobile Number', invoice.companyDetails?.phone || "N/A"],
    ['Email', 'N/A'],
    [],
    ['CUSTOMER DETAILS'],
    ['Customer Name', invoice.customerDetails?.name || ""],
    ['Billing Address', invoice.customerDetails?.billingAddress || ""],
    ['Mobile Number', invoice.customerDetails?.mobileNumber || ""],
    ['GSTIN', invoice.customerDetails?.gstNumber || ""],
    ['State', invoice.customerDetails?.state || ""],
    ['State Code', invoice.customerDetails?.stateCode || ""],
    [],
    ['INVOICE DETAILS'],
    ['Invoice Number', invoice.invoiceNumber || ""],
    ['Invoice Date', invoice.date ? new Date(invoice.date).toLocaleDateString('en-IN') : ""],
    ['Order Number', invoice.orderNumber || ""],
    ['Order Date', invoice.orderDate ? new Date(invoice.orderDate).toLocaleDateString('en-IN') : ""],
    ['Transport', invoice.transportName || ""],
    ['Parcel Bag', invoice.parcelBag || ""],
    ['E-Way Bill', invoice.eWayBill || ""],
    ['Status', invoice.status || "PENDING"],
    [],
    ['FINANCIAL DETAILS'],
    ['Sub Total', invoice.subTotal || 0],
    ['Taxable Amount', invoice.taxableAmount || 0],
    ['CGST Amount', invoice.cgst || 0],
    ['SGST Amount', invoice.sgst || 0],
    ['IGST Amount', invoice.igst || 0],
    ['Round Off', invoice.roundOff || 0],
    ['Grand Total', invoice.grandTotal || 0],
    [],
    ['BANK DETAILS'],
    ['Bank Name', invoice.bankDetails?.bankName || ""],
    ['Account Number', invoice.bankDetails?.accountNumber || ""],
    ['Branch', invoice.bankDetails?.branchName || ""],
    ['IFSC Code', invoice.bankDetails?.ifscCode || ""],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  
  // Requirement 9: Auto-size columns for Summary Sheet
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 50 }];

  // --- SHEET 2: ITEM DETAILS ---
  // Requirement 4: Sr No, Product Name, Description, HSN, GST %, Quantity, UOM, Rate, Amount
  const itemHeader = [['Sr No', 'Product Name', 'Description', 'HSN', 'GST %', 'Quantity', 'UOM', 'Rate', 'Amount']];
  const itemRows = (invoice.products || []).map((item, index) => [
    item.srNo || index + 1,
    item.description || "", // Product Name
    "", // Description
    item.hsn || "",
    item.gstPercent || 0,
    item.quantity || 0,
    item.uom || "",
    item.rate || 0,
    item.amount || 0
  ]);

  const wsItems = XLSX.utils.aoa_to_sheet([...itemHeader, ...itemRows]);

  // Requirement 9: Auto-size columns for Items Sheet
  wsItems['!cols'] = [
    { wch: 8 }, { wch: 30 }, { wch: 20 }, { wch: 12 }, 
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 15 }
  ];

  // --- FINAL WORKBOOK ---
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Invoice Summary');
  XLSX.utils.book_append_sheet(wb, wsItems, 'Item Details');

  // Requirement 14: Use XLSX.writeFile for valid workbook generation
  XLSX.writeFile(wb, fileName);
};
