// Override DNS resolution to use public DNS (fixes querySrv ECONNREFUSED on some ISPs/networks)
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Normalize paths for serverless / API gateway environments
app.use((req, res, next) => {
  if (req.url.startsWith('/.netlify/functions/api')) {
    req.url = req.url.replace('/.netlify/functions/api', '') || '/';
  } else if (req.url.startsWith('/api')) {
    req.url = req.url.replace('/api', '') || '/';
  }
  next();
});

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: ServerApiVersion.v1,
});

const db = client.db("UtilityBillsDb");
const BillsCollection = db.collection("bills");
const PaidBillsCollection = db.collection("paid-bills");
const OtpCollection = db.collection("otps");

// Ensure TTL index for OTPs (expire after 300 seconds / 5 minutes)
OtpCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 }).catch(console.error);

// Register routes directly at module level
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

    // Ensure TTL index for OTPs (expire after 300 seconds / 5 minutes)
    OtpCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 300 }).catch(console.error);

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

app.post("/bills", async (req, res) => {
  try {
    const bill = req.body;
    const result = await BillsCollection.insertOne(bill);
    res.json(result);
  } catch (err) {
    console.error("Error inserting bill:", err);
    res.status(500).json({ error: "Failed to create bill" });
  }
});

// Endpoint to add sample bills
app.post("/bills/sample", async (req, res) => {
  try {
    const sampleBills = [
      {
        title: "Apartment Electricity Bill",
        category: "Electricity",
        amount: 1250.50,
        location: "Sector 4, Uttara, Dhaka",
        description: "Monthly electricity bill for the main residential apartment.",
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        date: new Date().toISOString().split("T")[0],
        email: "mahbuburrahman4209@gmail.com"
      },
      {
        title: "Kitchen Gas Bill",
        category: "Gas",
        amount: 975.00,
        location: "Banani, Dhaka",
        description: "Gas pipeline connection monthly charge.",
        image: "https://images.unsplash.com/photo-1585970480901-90d6bb2a48b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        date: new Date().toISOString().split("T")[0],
        email: "mahbuburrahman4209@gmail.com"
      },
      {
        title: "Water Supply Bill",
        category: "Water",
        amount: 450.25,
        location: "Mirpur 10, Dhaka",
        description: "Water usage and sewerage charge for the office space.",
        image: "https://images.unsplash.com/photo-1551085254-e96b210db58a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        date: new Date().toISOString().split("T")[0],
        email: "mahbuburrahman4209@gmail.com"
      },
      {
        title: "High-Speed Fiber Internet",
        category: "Internet",
        amount: 1500.00,
        location: "Dhanmondi, Dhaka",
        description: "Monthly broadband internet bill for work-from-home setup.",
        image: "https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        date: new Date().toISOString().split("T")[0],
        email: "mahbuburrahman4209@gmail.com"
      },
      {
        title: "Office Electricity Bill",
        category: "Electricity",
        amount: 3400.75,
        location: "Gulshan 2, Dhaka",
        description: "Commercial power usage for the workspace.",
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        date: new Date().toISOString().split("T")[0],
        email: "mahbuburrahman4209@gmail.com"
      },
      {
        title: "Backup Cylinder Gas",
        category: "Gas",
        amount: 1400.00,
        location: "Mohakhali, Dhaka",
        description: "Refill charges for emergency backup LPG cylinder.",
        image: "https://images.unsplash.com/photo-1585970480901-90d6bb2a48b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        date: new Date().toISOString().split("T")[0],
        email: "mahbuburrahman4209@gmail.com"
      },
      {
        title: "Home Water Connection",
        category: "Water",
        amount: 320.00,
        location: "Uttara Sector 11, Dhaka",
        description: "Residential water bill.",
        image: "https://images.unsplash.com/photo-1551085254-e96b210db58a?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        date: new Date().toISOString().split("T")[0],
        email: "mahbuburrahman4209@gmail.com"
      },
      {
        title: "Link3 Router Rental & Internet",
        category: "Internet",
        amount: 1200.00,
        location: "Badda, Dhaka",
        description: "Subscription charges for connection.",
        image: "https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
        date: new Date().toISOString().split("T")[0],
        email: "mahbuburrahman4209@gmail.com"
      }
    ];

    const result = await BillsCollection.insertMany(sampleBills);
    res.json({ success: true, insertedCount: result.insertedCount });
  } catch (err) {
    console.error("Error inserting sample bills:", err);
    res.status(500).json({ error: "Failed to insert sample bills" });
  }
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

// Start the server locally when run directly (not as a serverless function)
if (require.main === module) {
  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port} 🚀`);
  });
}

module.exports = app;
