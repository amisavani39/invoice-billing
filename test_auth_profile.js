const https = require('https');

const API_URL = 'https://invoice-billing-s4u1.onrender.com';

function makeRequest(path, method, data, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : '';
    const options = {
      hostname: 'invoice-billing-s4u1.onrender.com',
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    if (token) {
      options.headers['x-auth-token'] = token;
    }

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const parsedBody = body ? JSON.parse(body) : {};
          resolve({ statusCode: res.statusCode, body: parsedBody });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  const timestamp = Date.now();
  const testUser = {
    name: `Test User ${timestamp}`,
    email: `test${timestamp}@example.com`,
    password: 'password123'
  };

  console.log('--- Testing Registration ---');
  const regRes = await makeRequest('/api/auth/register', 'POST', testUser);
  console.log('Status:', regRes.statusCode);
  if (regRes.statusCode !== 200) {
    console.error('Registration failed:', regRes.body);
    return;
  }
  const token = regRes.body.token;
  console.log('Registration successful, token received.');

  console.log('\n--- Testing Login ---');
  const loginRes = await makeRequest('/api/auth/login', 'POST', {
    email: testUser.email,
    password: testUser.password
  });
  console.log('Status:', loginRes.statusCode);
  if (loginRes.statusCode !== 200) {
    console.error('Login failed:', loginRes.body);
    return;
  }
  console.log('Login successful.');

  console.log('\n--- Testing Get Profile ---');
  const profileRes = await makeRequest('/api/user/profile', 'GET', null, token);
  console.log('Status:', profileRes.statusCode);
  console.log('Profile Data:', JSON.stringify(profileRes.body, null, 2));

  console.log('\n--- Testing Update Profile ---');
  const updateData = {
    name: `Updated ${testUser.name}`,
    companyDetails: {
      name: 'Test Company LLC',
      address: '123 Test St, Test City',
      gstNumber: '1234567890',
      phone: '9876543210'
    }
  };
  const updateRes = await makeRequest('/api/user/profile', 'POST', updateData, token);
  console.log('Status:', updateRes.statusCode);
  if (updateRes.statusCode === 200) {
    console.log('Update Profile successful.');
    console.log('Updated Profile:', JSON.stringify(updateRes.body, null, 2));
  } else {
    console.error('Update Profile failed:', updateRes.body);
  }
}

runTests().catch(console.error);
