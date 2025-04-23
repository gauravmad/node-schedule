const express = require('express');
const schedule = require('node-schedule');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Schedule job to run every day at 5:05 PM IST (11:45 AM UTC)
schedule.scheduleJob('35 11 * * *', async () => {
  console.log('🔔 Scheduled job running to send WhatsApp message...');

  try {
    // 1. Login and get JWT token
    const loginRes = await axios.post('https://apis.rmlconnect.net/auth/v1/login/', {
      username: 'Streambox',
      password: 'Asdfgh$$13',
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const token = loginRes.data.JWTAUTH;

    // 2. Send WhatsApp message
    const messageRes = await axios.post(
      'https://apis.rmlconnect.net/wba/v1/messages',
      {
        phone: '+919689675896',
        media: {
          type: 'media_template',
          template_name: 'annual_plan1',
          lang_code: 'en',
          body: [
            { text: 'Gaurav Test' },
            {
              text: 'https://secure.payu.in/processInvoice?invoiceId=c52a4b6d2b63acfddd6de6d5ffdf04f2',
            },
          ],
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: token,
        },
      }
    );

    console.log('✅ Message sent:', messageRes.data);
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
});

// Set up a simple route
app.get('/', (req, res) => {
  res.send('Hello, your scheduled task backend is running!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
