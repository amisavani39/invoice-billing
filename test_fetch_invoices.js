const https = require('https');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNmEwNTkyN2I1YzY1OWM4MGFkNjA3NjM0In0sImlhdCI6MTc3ODc1MzI2MywiZXhwIjoxNzc5MTEzMjYzfQ.Y-Wu_yQjiTkot7jB5RwYePd9G0Cx8HrOx85_dKEfjng";

const options = {
  hostname: 'invoice-billing-s4u1.onrender.com',
  path: '/api/invoices',
  method: 'GET',
  headers: {
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

req.end();
