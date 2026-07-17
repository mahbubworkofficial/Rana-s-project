const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    const db = client.db("UtilityBillsDb");
    const BillsCollection = db.collection("bills");
    const PaidBillsCollection = db.collection("paid-bills");
    const OtpCollection = db.collection("otps");

    // Ensure TTL index for OTPs (expire after 300 seconds / 5 minutes)
    OtpCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 }).catch(console.error);

    console.log("MongoDB Connected ✔️");

    app.get("/", (req, res) => {
      res.send("Smart Deals Server Running ✔️");
    });

    // Endpoint to generate and send OTP
    app.post("/send-otp", async (req, res) => {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      try {
        // Store or update OTP in database
        await OtpCollection.updateOne(
          { email: email.toLowerCase() },
          { $set: { otp, createdAt: new Date() } },
          { upsert: true }
        );

        console.log(`[OTP Verification] Generated OTP for ${email}: ${otp}`);

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Verification OTP for SmartUtility",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 8px;">
              <h2 style="color: #1a73e8; text-align: center;">SmartUtility Verification Code</h2>
              <p>Hello,</p>
              <p>Thank you for registering. Please use the following One-Time Password (OTP) to complete your registration:</p>
              <div style="font-size: 24px; font-weight: bold; color: #1a73e8; text-align: center; padding: 15px; background-color: #f1f3f4; border-radius: 4px; letter-spacing: 4px; margin: 20px 0;">
                ${otp}
              </div>
              <p>This OTP is valid for 5 minutes. If you did not request this code, please ignore this email.</p>
              <br/>
              <p>Best regards,<br/>The SmartUtility Team</p>
            </div>
          `,
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });
          await transporter.sendMail(mailOptions);
          res.json({ success: true, message: "OTP sent successfully to your email." });
        } else {
          res.json({
            success: true,
            message: "OTP generated successfully. (Developer Mode: SMTP not configured, OTP logged to console)",
            devMode: true
          });
        }
      } catch (err) {
        console.error("Error sending OTP:", err);
        res.status(500).json({ error: "Failed to send OTP email." });
      }
    });

    // Endpoint to verify OTP
    app.post("/verify-otp", async (req, res) => {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ error: "Email and OTP are required" });
      }

      try {
        const record = await OtpCollection.findOne({
          email: email.toLowerCase(),
          otp: otp.trim(),
        });

        if (!record) {
          return res.status(400).json({ error: "Invalid OTP or OTP expired" });
        }

        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (record.createdAt < fiveMinutesAgo) {
          await OtpCollection.deleteOne({ _id: record._id });
          return res.status(400).json({ error: "OTP has expired" });
        }

        await OtpCollection.deleteOne({ _id: record._id });
        res.json({ success: true, message: "OTP verified successfully" });
      } catch (err) {
        console.error("Error verifying OTP:", err);
        res.status(500).json({ error: "Internal server error during verification" });
      }
    });

    // Endpoint to save registered user information
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        const query = { email: user.email };
        const existingUser = await db.collection("users").findOne(query);
        if (existingUser) {
          return res.json({ message: "User already exists", insertedId: null });
        }
        const result = await db.collection("users").insertOne(user);
        res.json(result);
      } catch (err) {
        console.error("Error saving user:", err);
        res.status(500).json({ error: "Failed to save user" });
      }
    });

    app.get("/bills", async (req, res) => {
      const bills = await BillsCollection.find().toArray();
      res.json(bills);
    });

    app.get("/bills/limited/6", async (req, res) => {
      const bills = await BillsCollection.find().limit(6).toArray();
      res.json(bills);
    });

    app.get("/bills/:id", async (req, res) => {
      const bill = await BillsCollection.findOne({
        _id: new ObjectId(req.params.id),
      });
      res.json(bill);
    });

    app.post("/paid-bills", async (req, res) => {
      const paidBill = { ...req.body, createdAt: new Date() };
      const result = await PaidBillsCollection.insertOne(paidBill);
      res.json(result);
    });

    app.get("/paid-bills", async (req, res) => {
      const email = req.query.email;
      const bills = await PaidBillsCollection.find({ email }).toArray();
      res.json(bills);
    });

    app.put("/paid-bills/:id", async (req, res) => {
      const result = await PaidBillsCollection.updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: req.body }
      );
      res.json(result);
    });
    app.delete("/paid-bills/:id", async (req, res) => {
      const result = await PaidBillsCollection.deleteOne({
        _id: new ObjectId(req.params.id),
      });
      res.json(result);
    });

    // Start the server locally when run directly (not as a serverless function on Vercel)
    if (require.main === module) {
      const port = process.env.PORT || 5000;
      app.listen(port, () => {
        console.log(`Server is running on port ${port} 🚀`);
      });
    }

  } catch (error) {
    console.error(error);
  }
}

run();

// ❗ Vercel requires this (NO app.listen)
module.exports = app;
