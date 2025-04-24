require('dotenv').config();
const express = require('express');
const twilio = require('twilio');
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Endpoint to send SOS
app.post('/send-sos', async (req, res) => {
    const { message, to, location } = req.body;

    if (!message || !to || !Array.isArray(to) || to.length === 0) {
        return res.status(400).json({ success: false, message: 'Invalid request body' });
    }

    try {
        const results = await Promise.allSettled(
            to.map((phoneNumber) =>
                client.messages.create({
                    body: `${message}\nLocation: ${location || 'N/A'}`,
                    from: process.env.TWILIO_PHONE,
                    to: phoneNumber
                })
            )
        );

        const successes = results
            .map((result, index) => ({
                number: to[index],
                status: result.status,
                sid: result.status === "fulfilled" ? result.value.sid : null,
                error: result.status === "rejected" ? result.reason.message : null
            }));

        const hasFailures = successes.some(result => result.status === "rejected");

        if (hasFailures) {
            console.log("Partial failure in SOS:", successes);
            return res.status(500).json({
                success: false,
                message: "SOS sent to some contacts, but failed for others",
                report: successes
            });
        }

        console.log("All SOS messages sent successfully");
        res.json({ success: true, message: "SOS sent to all contacts", report: successes });

    } catch (err) {
        console.error("Unexpected error:", err.message);
        res.status(500).json({ success: false, message: "Unexpected server error" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
