// utils/sendWhatsApp.js
require('dotenv').config();
const twilio = require('twilio');
const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const client = twilio(accountSid, authToken);

const sendWhatsApp = async (to,  mediaUrl) => {
  console.log('TWILIO_ACCOUNT_SID:', accountSid);
console.log('TWILIO_AUTH_TOKEN:', authToken ? '***' : 'NOT SET');
console.log('TWILIO_WHATSAPP_NUMBER:', whatsappNumber);

  try {
    await client.messages.create({
      from: `whatsapp:${whatsappNumber}`,
      to: `whatsapp:919998057291`,
      body: `Thank you for shopping with Sunrise Interior Hub! Please find the  bill attached.`,
      mediaUrl: [mediaUrl],
    });
  } catch (err) {
    throw new Error(`WhatsApp message failed: ${err.message}`);
  }
};

module.exports = sendWhatsApp;
