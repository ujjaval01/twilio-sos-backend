require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

// Confirm environment variables are loaded
console.log("TWILIO_SID:", process.env.TWILIO_SID);
console.log("TWILIO_PHONE:", process.env.TWILIO_PHONE);

// Twilio client setup
const client = twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// SOS endpoint
app.post('/send-sos', (req, res) => {
    const { message, to, location } = req.body;

    console.log('Request received:', { message, to, location });
    console.log('Using From number:', process.env.TWILIO_PHONE);

    const promises = to.map((phoneNumber) => {
        return client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE,
            to: phoneNumber
        }).then(msg => ({
            number: phoneNumber,
            status: 'sent',
            sid: msg.sid,
            error: null
        })).catch(err => ({
            number: phoneNumber,
            status: 'rejected',
            sid: null,
            error: err.message
        }));
    });

    Promise.all(promises).then(report => {
        const hasFailure = report.some(r => r.status === 'rejected');
        if (hasFailure) {
            return res.status(500).json({
                success: false,
                message: 'SOS sent to some contacts, but failed for others',
                report
            });
        }
        res.json({ success: true, message: 'SOS sent to all contacts', report });
    });
});


// Start server
app.listen(port, () => {
    console.log(`🚨 SOS Server running on http://localhost:${port}`);
});
