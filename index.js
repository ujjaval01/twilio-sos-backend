require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Endpoint to send SOS
app.post('/send-sos', (req, res) => {
    const { message, to, location } = req.body;

    // Loop over all phone numbers and send SOS SMS
    const promises = to.map((phoneNumber) => {
        return client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE, // Twilio phone number
            to: phoneNumber
        });
    });

    // Wait for all promises to resolve
    Promise.all(promises)
        .then((messages) => {
            res.json({ success: true, message: 'SOS sent to all contacts' });
        })
        .catch((error) => {
            console.error('Error sending SMS:', error);
            res.status(500).json({ success: false, message: 'Failed to send SOS' });
        });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
