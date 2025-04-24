const express = require("express");
const schedule = require("node-schedule");
const axios = require("axios");
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

const sendWhatsAppMessage = async (phone = "+919689675896") => {
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
          template_name: "annual_plan1",
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
      template_name: "annual_plan1",
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

schedule.scheduleJob("35 11 * * *", async () => {
  console.log("🔔 Running scheduled job at 5:05 PM IST (11:35 AM UTC)...");
  const result = await sendWhatsAppMessage();
  console.log(
    result.success
      ? "✅ Scheduled message sent"
      : "❌ Scheduled message failed",
    result
  );
});

app.post("/send-message", async (req, res) => {
  console.log("PORT:", process.env.PORT);
  console.log("MONGO_URI:", process.env.MONGO_URI);

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

app.get("/", (req, res) => {
  res.send("🚀 API is running. Use /send-message to trigger WhatsApp message.");
});

app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
