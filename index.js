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
app.post('/send-sos', async (req, res) => {
    const { message, to } = req.body;

    if (!message || !to || !Array.isArray(to) || to.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid input: message or to[] is missing' });
    }

    const results = await Promise.allSettled(to.map((number) => {
        return client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE,
            to: number
        });
    }));

    // Format success/failure response
    const report = results.map((result, index) => {
        if (result.status === 'fulfilled') {
            return {
                number: to[index],
                status: 'success',
                sid: result.value.sid,
                error: null
            };
        } else {
            return {
                number: to[index],
                status: 'rejected',
                sid: null,
                error: result.reason.message
            };
        }
    });

    const failed = report.filter(r => r.status === 'rejected');

    if (failed.length === 0) {
        res.json({ success: true, message: 'SOS sent to all contacts', report });
    } else {
        res.status(500).json({
            success: false,
            message: 'SOS sent to some contacts, but failed for others',
            report
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚨 SOS Server running on http://localhost:${port}`);
});
