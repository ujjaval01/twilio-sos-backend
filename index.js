const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const twilio = require("twilio");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE;

const client = twilio(accountSid, authToken);

app.post("/send-sos", async (req, res) => {
    const { to, message } = req.body;
  
    if (!Array.isArray(to)) {
      return res.status(400).json({ success: false, error: "'to' must be an array" });
    }
  
    try {
      const sendPromises = to.map(phone =>
        client.messages.create({
          body: message,
          from: fromNumber,
          to: phone,
        })
      );
  
      const results = await Promise.all(sendPromises);
      res.status(200).json({ success: true, message: "Messages sent", sids: results.map(r => r.sid) });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
