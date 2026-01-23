const nodemailer = require("nodemailer");

let transporter = null;
let lastEmailSetting = null;
let lastPasswordSetting = null;

// Initialize transporter with database credentials
const initializeTransporter = async (Settings) => {
    try {
        const emailSetting = await Settings.findOne({ key: "adminEmail" });
        const passSetting = await Settings.findOne({ key: "googlePassword" });

        if (!emailSetting || !passSetting || !emailSetting.value || !passSetting.value) {
            console.warn("⚠️ Email credentials not configured in Admin Panel. Configure them in Admin Profile Settings.");
            return false;
        }

        // Only reinitialize if settings changed
        if (lastEmailSetting === emailSetting.value && lastPasswordSetting === passSetting.value && transporter) {
            return true;
        }

        transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: emailSetting.value,
                pass: passSetting.value,
            },
            tls: {
                rejectUnauthorized: false
            },
        });

        lastEmailSetting = emailSetting.value;
        lastPasswordSetting = passSetting.value;

        console.log("✓ Email transporter initialized with: " + emailSetting.value);
        return true;
    } catch (error) {
        console.error("❌ Error initializing transporter:", error.message);
        transporter = null;
        return false;
    }
};

const sendEmail = async (to, subject, html, fromEmail = null, Settings) => {
    try {
        // Always reinitialize with fresh credentials
        if (!Settings) {
            throw new Error("Settings model not provided");
        }

        const initialized = await initializeTransporter(Settings);
        if (!initialized) {
            console.error("Failed to initialize email transporter");
            return false;
        }

        if (!transporter) {
            console.error("Transporter not initialized after init attempt");
            return false;
        }

        // Fetch fresh credentials
        const emailSetting = await Settings.findOne({ key: "adminEmail" });
        if (!emailSetting || !emailSetting.value) {
            console.error("Admin email not configured in database");
            return false;
        }

        const sender = fromEmail || emailSetting.value;

        const info = await transporter.sendMail({
            from: `"Herbal Store Support" <${sender}>`,
            to,
            replyTo: sender,
            subject,
            html,
        });

        console.log("✓ Email sent successfully: " + info.messageId + " to: " + to);
        return true;
    } catch (error) {
        console.error("❌ Error sending email:", error.message);
        transporter = null; // Reset on error
        return false;
    }
};

module.exports = { sendEmail, initializeTransporter };
