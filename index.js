const express = require("express");
const axios = require("axios");
const cron = require("node-cron");
const mongoose = require("mongoose");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT;

app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "❌ MongoDB connection error:"));
db.once("open", () => console.log("✅ Connected to MongoDB"));

const messageSchema = new mongoose.Schema({
  phone: String,
  template_name: String,
  message_status: mongoose.Schema.Types.Mixed,
  sentAt: { type: Date, default: Date.now },
});

const SentMessage = mongoose.model("sms-notification-sent", messageSchema);
const SmsMessage = mongoose.model("sms-text-notification", messageSchema);

const sendWhatsAppMessage = async (phone = "+918668264139") => {
  try {
    const loginRes = await axios.post(
      "https://apis.rmlconnect.net/auth/v1/login/",
      {
        username: "Streambox",
        password: "Asdfgh$$13",
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const token = loginRes.data.JWTAUTH;
    console.log("🔑 Token received:", token);

    const messageRes = await axios.post(
      "https://apis.rmlconnect.net/wba/v1/messages",
      {
        phone,
        media: {
          type: "media_template",
          template_name: "7dayfree",
          lang_code: "en",
          body: [
            { text: "Gaurav Test" },
            {
              text: "https://secure.payu.in/processInvoice?invoiceId=c52a4b6d2b63acfddd6de6d5ffdf04f2",
            },
          ],
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      }
    );

    const newMessage = new SentMessage({
      phone,
      template_name: "7dayfree",
      message_status: messageRes.data,
    });

    await newMessage.save();
    console.log("📩 Message saved to database:", newMessage);
    return { success: true, data: messageRes.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

const sendSmsMessage = async()=>{
  try {
    const smsRes = await axios.get(
      "https://api.smartping.ai/fe/api/v1/send",
      {
        params:{
          username:"strbotmpg.trans",
          password: "B5daU",
          unicode: true,
          from: "dorTV",
          to: "9689675896",
          dltPrincipalEntityId: "1701171991904309835",
          dltContentId: "1707174402366007486",
          text: "Dear Customer, This is regarding your installation request via call. Please fill the form using the link below. Our technician will contact you within 24–48 hours after submission to schedule your TV installation. Gaurav – Team Dor"
        }
      }
    );

    const newSmsMessage = new SmsMessage({
      phone: "9689675896",
      template_name: "SMS Template",
      message_status: smsRes.data,
    });

    await newSmsMessage.save();
    console.log("📤 SMS sent successfully:", smsRes.data);
    return { success: true, data: smsRes.data };
  } catch (error) {
    console.error("❌ Failed to send SMS:", error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
};


cron.schedule(
  "11 17 * * *",
  async () => {
    console.log("🔔 Running scheduled job at 5:05 PM IST...");
    const result = await sendWhatsAppMessage();
    const resultSms = await sendSmsMessage();
    console.log(
      result.success
        ? "✅ Scheduled Whatsapp message sent"
        : "❌ Scheduled message failed",
      result
    );
    console.log(
      resultSms.success
        ? "✅ Scheduled SMS Text sent"
        : "❌ Scheduled SMS failed",
      resultSms
    );
  },
  {
    timezone: "Asia/Kolkata",
  }
);

app.post("/send-message", async (req, res) => {
  // console.log("PORT:", process.env.PORT);
  // console.log("MONGO_URI:", process.env.MONGO_URI);

  const { phone } = req.body;
  console.log("Received request to send message:", phone);

  if (!phone) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  const result = await sendWhatsAppMessage(phone);
  console.log("Message send result:", result);

  if (result.success) {
    res
      .status(200)
      .json({ message: "Message sent and saved", data: result.data });
  } else {
    res
      .status(500)
      .json({ error: "Failed to send message", details: result.error });
  }
});

app.get("/send-sms", async (req, res) => {
  const result = await sendSmsMessage();
  console.log("SMS send result:", result);

  if (result.success) {
    res.status(200).json({ message: "SMS sent and saved", data: result.data });
  } else {
    res.status(500).json({ error: "Failed to send SMS", details: result.error });
  }
});

app.get("/", (req, res) => {
  res.send("🚀 API is running. Use /send-message to trigger WhatsApp message.");
});

app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});