// server.js
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("./middleware/mailer");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

/* ================= MONGODB ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

/* ================= SCHEMAS ================= */

// USER
const addressSchema = new mongoose.Schema({
  label: String,
  address: String,
  isDefault: Boolean,
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  isAdmin: { type: Boolean, default: false },
  addresses: [addressSchema],
});

const User = mongoose.model("User", userSchema);

// CATEGORY
const categorySchema = new mongoose.Schema({
  name: { type: String, unique: true },
});
const Category = mongoose.model("Category", categorySchema);

// PRODUCT
const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  description: String,
  image: String,
  images: [String],

  // ⭐ NEW: Discount fields (Direct Amount instead of Percentage)
  discountAmount: { type: Number, default: 0 },
  discountStart: Date,
  discountEnd: Date,

  averageRating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },

  // ⭐ NEW: Product approval status
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  approvedBy: String,
  approvedAt: Date,
  rejectionReason: String,
  rejectedAt: Date,
});

const Product = mongoose.model("Product", productSchema);

// ORDER
const orderSchema = new mongoose.Schema({
  productName: String,
  productId: String,
  quantity: Number,
  price: Number,
  userEmail: String,
  userName: String,
  shippingAddress: Object, // ✅ Added shippingAddress
  shippingMethod: String,  // ✅ Added shippingMethod
  paymentMethod: String,   // ✅ Added paymentMethod
  shippingCost: Number,    // ✅ Added shippingCost
  tax: Number,             // ✅ Added tax
  totalAmount: Number,     // ✅ Added totalAmount
  variation: String,       // ✅ Added variation (weight)
  phone: String,     // ✅ Added phone number
  status: { type: String, default: "Ordered" },
  createdAt: { type: Date, default: Date.now },
});

orderSchema.index({ createdAt: -1 });
const Order = mongoose.model("Order", orderSchema);

// CART
const cartSchema = new mongoose.Schema({
  userEmail: String,
  productId: String,
  name: String,
  unitPrice: Number,
  price: Number,
  img: String,
  qty: { type: Number, default: 1 },
  variation: String,      // ✅ Added variation (weight)
});
const Cart = mongoose.model("Cart", cartSchema);

// WISHLIST
const wishlistSchema = new mongoose.Schema({
  userEmail: String,
  productId: String,
  name: String,
  price: Number,
  image: String,
});
const Wishlist = mongoose.model("Wishlist", wishlistSchema);

// REVIEW
const reviewSchema = new mongoose.Schema({
  productId: String,
  userEmail: String,
  userName: String,
  rating: Number,
  comment: String,
  images: [String],
  createdAt: { type: Date, default: Date.now },
});
const Review = mongoose.model("Review", reviewSchema);

// CUSTOMER SUPPORT
// CUSTOMER SUPPORT CHAT
const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "admin"] },
  text: String,
  image: String,
  timestamp: { type: Date, default: Date.now },
});

const supportSchema = new mongoose.Schema({
  userEmail: String,
  userName: String,
  subject: String, // First message snippet
  messages: [messageSchema],
  lastUpdated: { type: Date, default: Date.now },
});
const Support = mongoose.model("Support", supportSchema);

// SETTINGS
const settingsSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: String,
});
const Settings = mongoose.model("Settings", settingsSchema);

/* ================= IMAGE UPLOAD ================= */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

/* ================= AUTH ================= */
const verifyAdmin = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });
    const decoded = jwt.verify(token, "SECRET_KEY");
    if (!decoded.isAdmin) return res.status(403).json({ message: "Admin only" });
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ... (Existing Login/Signup routes remain unchanged) ...

/* ================= SUPPORT CHAT ================= */

// START NEW CHAT (USER)
app.post("/support/start", upload.single("image"), async (req, res) => {
  try {
    const { userEmail, userName, message } = req.body;
    const initialMessage = {
      sender: "user",
      text: message,
      image: req.file ? `/uploads/${req.file.filename}` : "",
    };

    const support = await Support.create({
      userEmail,
      userName,
      subject: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
      messages: [initialMessage],
    });
    res.json(support);
  } catch (err) {
    res.status(500).json({ message: "Failed to start chat" });
  }
});

// GET USER CHATS
app.get("/support/user/:email", async (req, res) => {
  try {
    const chats = await Support.find({ userEmail: req.params.email }).sort({ lastUpdated: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch chats" });
  }
});

// GET ALL CHATS (ADMIN)
app.get("/support/admin", verifyAdmin, async (req, res) => {
  try {
    const chats = await Support.find().sort({ lastUpdated: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch chats" });
  }
});

// SEND MESSAGE (BOTH USER & ADMIN)
app.put("/support/:id/message", upload.single("image"), async (req, res) => {
  try {
    const { sender, text } = req.body; // sender: 'user' or 'admin'
    const newMessage = {
      sender,
      text,
      image: req.file ? `/uploads/${req.file.filename}` : "",
    };

    await Support.findByIdAndUpdate(req.params.id, {
      $push: { messages: newMessage },
      lastUpdated: new Date(),
    });

    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ message: "Failed to send message" });
  }
});

// DELETE CHAT (ADMIN)
app.delete("/admin/support/:id", verifyAdmin, async (req, res) => {
  try {
    await Support.findByIdAndDelete(req.params.id);
    res.json({ message: "Chat deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete chat" });
  }
});

/* ================= SERVER ================= */
app.listen(5000, () => console.log("Server running on port 5000"));

// SIGNUP
app.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Send a verification/welcome email to check if email is correct
    try {
      // Fetch the email configured in Admin Profile (Database only - no .env fallback)
      const adminEmailSetting = await Settings.findOne({ key: "adminEmail" });
      const adminFromEmail = adminEmailSetting?.value;

      // Only send if admin email is configured in database
      if (adminFromEmail) {
        await sendEmail(
          email,
          "Welcome to Herbal Store - Email Verification",
          `<h1>Welcome ${name}!</h1><p>Thank you for signing up. Your email has been verified successfully.</p>`,
          adminFromEmail, // Use admin email as the sender display/reply-to
          Settings
        );
      }
    } catch (err) {
      console.error("Signup Email Error:", err);
      return res.status(400).json({
        message: "Email delivery failed. Please check your credentials in the backend .env file.",
        error: err.message
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed });
    res.json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ message: "Signup failed" });
  }
});

// LOGIN
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    "SECRET_KEY",
    { expiresIn: "1d" }
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
    },
  });
});

// UPDATE PASSWORD - Connected directly to DB
app.put("/user/update-password", async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    // Validate input
    if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await User.findOneAndUpdate(
      { email },
      { password: hashedPassword },
      { new: true }
    );

    res.json({ message: "✓ Password updated successfully" });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ message: "Failed to update password" });
  }
});

// ADD ADDRESS
app.post("/user/address", async (req, res) => {
  try {
    const { email, label, address } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.addresses.push({ label, address, isDefault: false });
    await user.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to add address" });
  }
});

// GET USER INFO (FOR PROFILE RELOAD)
app.get("/user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

/* ================= ADMIN ================= */

// CATEGORY
app.post("/admin/category", verifyAdmin, async (req, res) => {
  try {
    const category = await Category.create({ name: req.body.name });
    res.json(category);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "Category already exists" });
    }
    res.status(500).json({ message: "Failed to create category" });
  }
});

app.get("/categories", async (req, res) => {
  try {
    res.json(await Category.find());
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

app.put("/admin/category/:id", verifyAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name: req.body.name },
      { new: true }
    );
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Failed to update category" });
  }
});

app.delete("/admin/category/:id", verifyAdmin, async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete category" });
  }
});

// PRODUCT
app.post("/admin/product", verifyAdmin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'galleryImages', maxCount: 5 }]), async (req, res) => {
  const mainImage = req.files['image'] ? `/uploads/${req.files['image'][0].filename}` : "";
  const galleryImages = req.files['galleryImages'] ? req.files['galleryImages'].map(f => `/uploads/${f.filename}`) : [];

  const product = await Product.create({
    ...req.body,
    image: mainImage,
    images: galleryImages,
    status: 'Approved', // ✅ Product is automatically approved
    approvedAt: new Date()
  });

  res.json({ message: "Product added successfully", product });
});

app.delete("/admin/product/:id", verifyAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Product deleted" });
});

// ✅ ADMIN ORDERS (ALL ORDERS, NO LIMIT)
app.get("/admin/orders", verifyAdmin, async (req, res) => {
  try {
    const query = {};

    if (req.query.from && req.query.to) {
      query.createdAt = {
        $gte: new Date(req.query.from),
        $lte: new Date(req.query.to + "T23:59:59"),
      };
    }

    // Add status filter
    if (req.query.status) {
      query.status = req.query.status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});


// ✅ CENTRALIZED STATUS UPDATE (ADMIN) - Trigger Email on Status Change
app.put("/admin/orders/:id", verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).json({ message: "Order not found" });

    // Only send email if status actually changed
    if (order.status !== status) {
      order.status = status;
      await order.save(); // Save first

      // 📧 Send Email Notifications based on new Status
      let subject = "";
      let html = "";
      let shouldSend = false;

      if (status === "Accepted") {
        subject = "Order Accepted";
        html = `<h1>Order Update</h1><p>Hi ${order.userName}, your order for <strong>${order.productName}</strong> has been confirmed!</p>`;
        shouldSend = true;
      } else if (status === "Rejected") {
        subject = "Order Rejected";
        html = `<h1>Order Update</h1><p>Hi ${order.userName}, unfortunately your order for <strong>${order.productName}</strong> has been rejected.</p>`;
        shouldSend = true;
      } else if (status === "Cancelled") {
        subject = "Order Cancelled";
        html = `<h1>Order Cancelled</h1><p>Your order for <strong>${order.productName}</strong> has been cancelled successfully.</p>`;
        shouldSend = true;
      } else if (status === "Shipped") {
        subject = "Order Shipped";
        html = `<h1>Order Shipped</h1><p>Your item <strong>${order.productName}</strong> is on its way!</p>`;
        order.shippedAt = new Date();
        await order.save();
        shouldSend = true;
      } else if (status === "Delivered") {
        subject = "Order Delivered";
        html = `<h1>Order Delivered</h1><p>Your item <strong>${order.productName}</strong> has been delivered. Enjoy!</p>`;
        order.deliveredAt = new Date();
        await order.save();
        shouldSend = true;
      }

      if (shouldSend) {
        try {
          await sendEmail(order.userEmail, subject, html, null, Settings);
        } catch (e) {
          console.error("Failed to send status email", e);
        }
      }
    }

    res.json({ message: "Status updated", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});
// UPDATE PRODUCT (ADMIN)
app.put(
  "/admin/product/:id",
  verifyAdmin,
  upload.fields([
    { name: "image", maxCount: 1 },
    { name: "galleryImages", maxCount: 5 },
  ]),
  async (req, res) => {
    try {
      const updateData = { ...req.body };

      // Find existing product to get old image path
      const oldProduct = await Product.findById(req.params.id);
      if (!oldProduct) return res.status(404).json({ message: "Product not found" });

      if (req.files?.image) {
        updateData.image = `/uploads/${req.files.image[0].filename}`;

        // Delete old image if it exists
        if (oldProduct.image) {
          const oldImagePath = path.join(__dirname, oldProduct.image);
          // Note: oldProduct.image starts with /uploads/ so path.join might need adjustment depending on how it's stored.
          // If stored as "/uploads/file.jpg", __dirname + "/uploads/file.jpg" is correct relative to server.js location?
          // Usually __dirname is backend/. uploads is backend/uploads.
          // so path.join(__dirname, oldProduct.image) should work if oldProduct.image is relative like "uploads/..." or "/uploads/..." 
          // but safe to strip leading slash.

          let relativePath = oldProduct.image;
          if (relativePath.startsWith("/") || relativePath.startsWith("\\")) {
            relativePath = relativePath.substring(1);
          }

          const fullPath = path.join(__dirname, relativePath);

          if (fs.existsSync(fullPath)) {
            fs.unlink(fullPath, (err) => {
              if (err) console.error("Failed to delete old image:", err);
            });
          }
        }
      }

      if (req.files?.galleryImages) {
        updateData.images = req.files.galleryImages.map(
          (f) => `/uploads/${f.filename}`
        );
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true }
      );

      res.json(updatedProduct);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update product" });
    }
  }
);


// SETTINGS ENDPOINTS
app.get("/admin/settings/:key", verifyAdmin, async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });
    res.json(setting || { key: req.params.key, value: "" });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch setting" });
  }
});

app.post("/admin/settings", verifyAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;
    const setting = await Settings.findOneAndUpdate(
      { key },
      { value },
      { upsert: true, new: true }
    );
    res.json(setting);
  } catch (err) {
    res.status(500).json({ message: "Failed to update setting" });
  }
});

/* ================= USER ================= */

// PRODUCTS
app.get("/products", async (req, res) => {
  try {
    let query = {};
    // If not a super admin request, only show approved products and products without status
    if (!req.query.showAll) {
      query = {
        $or: [
          { status: 'Approved' },
          { status: { $exists: false } }  // Show products without status field (legacy products)
        ]
      };
    }
    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

app.get("/products/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    // Don't show rejected or pending products to regular users (but show legacy products without status)
    if (product && !req.query.showAll && product.status && product.status !== 'Approved') {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

// PRODUCTS BY CATEGORY
app.get("/products/category/:category", async (req, res) => {
  try {
    const category = req.params.category;
    const query = {
      category: { $regex: new RegExp(`^${category}$`, "i") } // case-insensitive
    };
    // If not a super admin request, only show approved products
    if (!req.query.showAll) {
      query.status = 'Approved';
    }
    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ORDERS
app.post("/orders", async (req, res) => {
  try {
    const order = await Order.create(req.body);

    // Notify Admin (Fetch from DB only - no .env fallback)
    const adminEmailSetting = await Settings.findOne({ key: "adminEmail" });
    const adminEmail = adminEmailSetting?.value;

    if (adminEmail) {
      const shippingAddress = order.shippingAddress || {};
      await sendEmail(
        adminEmail,
        "New Order Received",
        `
        <h2>New Order Details</h2>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Customer:</strong> ${order.userName} (${order.userEmail})</p>
        <p><strong>Phone:</strong> ${order.phone || 'N/A'}</p>
        <p><strong>Product:</strong> ${order.productName}</p>
        <p><strong>Quantity:</strong> ${order.quantity}</p>
        <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
        <br/>
        <h3>Shipping Address:</h3>
        <p>${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}</p>
        <p>${shippingAddress.address || 'Address not provided'}</p>
        <p>Email: ${shippingAddress.email || order.userEmail}</p>
        <p>Phone: ${order.phone || shippingAddress.phone || 'N/A'}</p>
        <br/>
        <p><strong>Shipping Method:</strong> ${order.shippingMethod || 'Standard'}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
        <br/>
        <p>Please login to the Admin Dashboard to approve or reject this order.</p>
        `,
        adminEmail,
        Settings
      );
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to create order" });
  }
});

// USER CANCEL ORDER
// USER REQUESTS CANCELLATION
app.put("/orders/:id/cancel-by-user", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "Ordered" && order.status !== "Pending") {
      return res.status(400).json({ message: "Cannot cancel order at this stage" });
    }

    // Set status to 'Cancellation Requested' instead of immediately cancelling
    order.status = "Cancellation Requested";
    await order.save();

    // Notify Admin with Action Link
    const adminEmailSetting = await Settings.findOne({ key: "adminEmail" });
    const adminEmail = adminEmailSetting?.value;

    if (adminEmail) {
      await sendEmail(
        adminEmail,
        "Cancellation Request: User wants to cancel",
        `
        <h2>Cancellation Request</h2>
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Customer:</strong> ${order.userName} (${order.userEmail})</p>
        <p>The user has requested to cancel this order.</p>
        <br/>
        <p>Please login to the Admin Dashboard to confirm this cancellation.</p>
        `,
        adminEmail,
        Settings
      );
    }

    // Notify User
    await sendEmail(
      order.userEmail,
      "Cancellation Request Received",
      `<h1>Request Received</h1><p>We have received your request to cancel order <strong>${order._id}</strong>. You will receive a confirmation once the admin processes it.</p>`,
      order.userEmail,
      Settings
    );

    res.json({ message: "Cancellation requested successfully", order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to request cancellation" });
  }
});

// ADMIN APPROVE CANCELLATION (Via Email Link)
app.get("/orders/:id/approve-cancellation", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.send("Order not found");

    order.status = "Cancelled";
    await order.save();

    // Notify User of success
    await sendEmail(
      order.userEmail,
      "Order Cancelled Successfully",
      `<h1>Order Cancelled</h1><p>Your order for <strong>${order.productName}</strong> has been cancelled as requested.</p>`,
      order.userEmail,
      Settings
    );

    // Redirect to Admin Dashboard
    res.redirect("http://localhost:3000/admin/orders");
  } catch (err) {
    res.status(500).send("Error processing cancellation");
  }
});

// Admin Approval via Email
app.get("/orders/:id/approve", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.send("Order not found");

    order.status = "Accepted";
    await order.save();

    // Notify User
    const shippingAddress = order.shippingAddress || {};
    await sendEmail(
      order.userEmail,
      "Order Accepted",
      `
      <h1>Order Accepted!</h1>
      <p>Hi ${order.userName},</p>
      <p>Your order for <strong>${order.productName}</strong> has been accepted and is being processed!</p>
      <br/>
      <h3>Order Details:</h3>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Quantity:</strong> ${order.quantity}</p>
      <p><strong>Total Amount:</strong> ₹${order.totalAmount}</p>
      <br/>
      <h3>Shipping To:</h3>
      <p>${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}</p>
      <p>${shippingAddress.address || 'Your registered address'}</p>
      <p>Phone: ${order.phone || 'N/A'}</p>
      <br/>
      <p>We'll notify you once your order is shipped!</p>
      `,
      order.userEmail,
      Settings
    );

    // Redirect to Admin Dashboard
    res.redirect("http://localhost:3000/admin/orders");
  } catch (err) {
    res.status(500).send("Error approving order");
  }
});

// Admin Rejection via Email
app.get("/orders/:id/reject", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.send("Order not found");

    order.status = "Rejected";
    await order.save();

    // Notify User
    await sendEmail(
      order.userEmail,
      "Order Rejected",
      `<h1>Order Update</h1><p>Hi ${order.userName}, unfortunately your order for <strong>${order.productName}</strong> has been rejected.</p>`,
      order.userEmail,
      Settings
    );

    // Redirect to Admin Dashboard
    res.redirect("http://localhost:3000/admin/orders");
  } catch (err) {
    res.status(500).send("Error rejecting order");
  }
});

/* ================= PRODUCT APPROVAL VIA EMAIL ================= */

// Product Approval via Email
app.get("/products/:id/approve", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.send("<h1>Product not found</h1>");

    product.status = "Approved";
    product.approvedAt = new Date();
    await product.save();

    res.send(`
      <h1 style="color: #4CAF50;">✓ Product Approved Successfully</h1>
      <p><strong>Product:</strong> ${product.name}</p>
      <p>The product is now live and visible to customers.</p>
      <p><a href="http://localhost:3000" style="color: #4CAF50;">Go to Store</a></p>
    `);
  } catch (err) {
    res.status(500).send("<h1>Error approving product</h1>");
  }
});

// Product Rejection via Email
app.get("/products/:id/reject", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.send("<h1>Product not found</h1>");

    product.status = "Rejected";
    product.rejectionReason = req.query.reason || "Product does not meet store standards";
    product.rejectedAt = new Date();
    await product.save();

    res.send(`
      <h1 style="color: #f44336;">✗ Product Rejected</h1>
      <p><strong>Product:</strong> ${product.name}</p>
      <p><strong>Reason:</strong> ${product.rejectionReason}</p>
      <p>Please review and resubmit if needed.</p>
      <p><a href="http://localhost:3000" style="color: #f44336;">Go to Store</a></p>
    `);
  } catch (err) {
    res.status(500).send("<h1>Error rejecting product</h1>");
  }
});


app.get("/orders/:email", async (req, res) => {
  res.json(await Order.find({ userEmail: req.params.email }).sort({ createdAt: -1 }));
});

/* ================= SUPPORT ================= */

// SUBMIT SUPPORT REQUEST
app.post("/support", upload.single("image"), async (req, res) => {
  try {
    const { userEmail, userName, message } = req.body;
    const support = await Support.create({
      userEmail,
      userName,
      message,
      image: req.file ? `/uploads/${req.file.filename}` : "",
    });
    res.json({ message: "Support request submitted", support });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit request" });
  }
});

// GET SUPPORT REQUESTS (ADMIN)
app.get("/admin/support", verifyAdmin, async (req, res) => {
  try {
    const requests = await Support.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch support requests" });
  }
});

// ADMIN REPLY
app.put("/admin/support/:id/reply", verifyAdmin, async (req, res) => {
  try {
    await Support.findByIdAndUpdate(req.params.id, {
      reply: req.body.reply,
      replyAt: new Date(),
    });
    res.json({ message: "Reply sent" });
  } catch (err) {
    res.status(500).json({ message: "Failed to send reply" });
  }
});

// GET USER SUPPORT HISTORY
app.get("/support/history/:email", async (req, res) => {
  try {
    const history = await Support.find({ userEmail: req.params.email }).sort({ createdAt: -1 });
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch history" });
  }
});

/* ================= REVIEWS ================= */

// SUBMIT REVIEW
app.post("/reviews", upload.array("images", 5), async (req, res) => {

  try {
    const { productId, userEmail, userName, rating, comment } = req.body;

    const imagePaths = req.files
      ? req.files.map(file => `/uploads/${file.filename}`)
      : [];
    // 1. Create Review
    const newReview = await Review.create({
      productId,
      userEmail,
      userName,
      rating: Number(rating),
      comment,
      images: imagePaths,
    });

    // 2. Update Product Ratings
    const allReviews = await Review.find({ productId });
    const totalRating = allReviews.reduce((sum, rev) => sum + rev.rating, 0);
    const averageRating = totalRating / allReviews.length;

    await Product.findByIdAndUpdate(productId, {
      averageRating: Number(averageRating.toFixed(1)),

      ratingCount: allReviews.length,
    });

    res.json(newReview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to submit review" });
  }
});


app.get("/reviews/:productId", async (req, res) => {
  try {
    const reviews = await Review.find({
      productId: req.params.productId,
    }).sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews" });
  }
});

/* ================= CART ================= */

// GET CART ITEMS
app.get("/cart/:email", async (req, res) => {
  try {
    const cartItems = await Cart.find({ userEmail: req.params.email });
    res.json(cartItems);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cart items" });
  }
});

// ADD TO CART / UPDATE QUANTITY
app.post("/cart", async (req, res) => {
  try {
    const { userEmail, productId, name, price, img, qty } = req.body;

    let cartItem = await Cart.findOne({ userEmail, productId });

    if (cartItem) {
      cartItem.qty += qty;
      cartItem.price = cartItem.qty * cartItem.unitPrice;
      await cartItem.save();
    } else {
      cartItem = await Cart.create({
        userEmail,
        productId,
        name,
        unitPrice: price,
        price: price * qty,
        img,
        qty
      });
    }
    res.json(cartItem);
  } catch (err) {
    res.status(500).json({ message: "Failed to sync cart" });
  }
});

// REMOVE FROM CART
app.delete("/cart/:email/:productId", async (req, res) => {
  try {
    const { email, productId } = req.params;
    await Cart.findOneAndDelete({ userEmail: email, productId });
    res.json({ message: "Item removed from cart" });
  } catch (err) {
    res.status(500).json({ message: "Failed to remove item" });
  }
});

// UPDATE QTY DIRECTLY
app.post("/cart/update-qty", async (req, res) => {
  try {
    const { userEmail, productId, qty } = req.body;
    const cartItem = await Cart.findOne({ userEmail, productId });

    if (cartItem) {
      cartItem.qty = qty;
      cartItem.price = cartItem.qty * cartItem.unitPrice;
      await cartItem.save();
      res.json(cartItem);
    } else {
      res.status(404).json({ message: "Cart item not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Failed to update quantity" });
  }
});

/* ================= SERVER ================= */

