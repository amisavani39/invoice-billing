const https = require('https');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNmEwNTkyN2I1YzY1OWM4MGFkNjA3NjM0In0sImlhdCI6MTc3ODc1MDA3NiwiZXhwIjoxNzc5MTEwMDc2fQ.ZGmo6Mx1fuFb11ScprjsXcZOPBZJNa-JAnjJsOHL19U";

const data = JSON.stringify({
    invoiceNumber: 'INV-001',
    date: '2026-05-14',
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
      name: 'Test Customer',
      billingAddress: '123 Test St',
      shippingAddress: '',
      mobileNumber: '',
      state: 'Gujarat',
      stateCode: '24',
      gstNumber: '',
    },
    products: [
      { srNo: 1, description: 'Test Product', hsn: '', gstPercent: 18, quantity: 1, uom: 'KGS', rate: 100, amount: 100 }
    ],
    pandFCharges: 0,
    bankDetails: {
      bankName: 'STATE BANK OF INDIA',
      accountNumber: '1234567890',
      ifscCode: 'SBIN0001234',
      branchName: 'Kathwada Branch',
    },
    terms: [
      'Interest at 24% will be charged if payment is not made within 15 days.',
      'Our responsibility ceases as soon as goods leave our premises.',
      'Any complaint regarding this invoice must be made within 3 days.',
      'Subject to Ahmedabad Jurisdiction.'
    ],
    subTotal: 100,
    taxableAmount: 100,
    cgst: 9,
    sgst: 9,
    igst: 0,
    roundOff: 0,
    grandTotal: 118,
    taxAmountInWords: 'Eighteen Rupees',
    netAmountInWords: 'One Hundred Eighteen Rupees',
});

const options = {
  hostname: 'invoice-billing-s4u1.onrender.com',
  path: '/api/invoices',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'x-auth-token': token
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.write(data);
req.end();
