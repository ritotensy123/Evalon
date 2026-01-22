/**
 * Test Twilio with curl-like approach
 */

const https = require('https');

const accountSid = 'ACa124509010a17df7103e7445ec5f359a';
const authToken = 'e429f499c6adc380be1175faeb5e2ad8';
const phoneNumber = '+13093321126';
const toNumber = '+918075059538';

// Base64 encode credentials
const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

console.log('🔍 Testing Twilio with direct HTTP request...\n');

// Test 1: Fetch account info
const testAccount = () => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.twilio.com',
      path: `/2010-04-01/Accounts/${accountSid}.json`,
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          const account = JSON.parse(data);
          console.log('✅ Account authentication successful!');
          console.log(`   Account Status: ${account.status}`);
          console.log(`   Account Type: ${account.type}`);
          console.log(`   Account Name: ${account.friendly_name || 'N/A'}`);
          resolve(account);
        } else {
          const error = JSON.parse(data);
          console.error('❌ Authentication failed!');
          console.error(`   Status Code: ${res.statusCode}`);
          console.error(`   Error Code: ${error.code}`);
          console.error(`   Error Message: ${error.message}`);
          console.error(`   More Info: ${error.more_info || 'N/A'}`);
          reject(new Error(error.message));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    req.end();
  });
};

// Test 2: Send SMS
const testSMS = () => {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      To: toNumber,
      From: phoneNumber,
      Body: 'Test OTP from Evalon: 123456'
    }).toString();

    const options = {
      hostname: 'api.twilio.com',
      path: `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const message = JSON.parse(data);
          console.log('\n✅ SMS sent successfully!');
          console.log(`   Message SID: ${message.sid}`);
          console.log(`   Status: ${message.status}`);
          console.log(`   To: ${message.to}`);
          console.log(`   From: ${message.from}`);
          console.log(`\n📱 Check your phone (${toNumber}) for the test message.`);
          resolve(message);
        } else {
          const error = JSON.parse(data);
          console.error('\n❌ Failed to send SMS');
          console.error(`   Status Code: ${res.statusCode}`);
          console.error(`   Error Code: ${error.code}`);
          console.error(`   Error Message: ${error.message}`);
          if (error.code === 21608) {
            console.error('\n💡 Phone number needs verification in Twilio trial account');
            console.error('   Visit: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
          }
          reject(new Error(error.message));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    req.write(body);
    req.end();
  });
};

(async () => {
  try {
    await testAccount();
    await testSMS();
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
})();



