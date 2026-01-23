import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaEnvelope, FaSave, FaArrowLeft, FaShieldAlt, FaEye, FaEyeSlash, FaKey } from "react-icons/fa";
import "../pages/Profile.css"; // Correct path

const AdminProfile = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    const [adminEmail, setAdminEmail] = useState("");
    const [googlePassword, setGooglePassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!token || !user || !user.isAdmin) {
            navigate("/login", { replace: true });
            return;
        }
        fetchAdminSettings();
    }, [navigate, token]);

    const fetchAdminSettings = async () => {
        try {
            const emailRes = await fetch("http://localhost:5000/admin/settings/adminEmail", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const emailData = await emailRes.json();
            setAdminEmail(emailData.value || "");

            const passRes = await fetch("http://localhost:5000/admin/settings/googlePassword", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const passData = await passRes.json();
            setGooglePassword(passData.value || "");
        } catch (err) {
            console.error("Failed to fetch settings", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!adminEmail) {
            setMessage("Admin email is required!");
            return;
        }
        if (!googlePassword) {
            setMessage("Google App Password is required!");
            return;
        }

        setMessage("Saving...");
        try {
            const emailRes = await fetch("http://localhost:5000/admin/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ key: "adminEmail", value: adminEmail })
            });

            const passRes = await fetch("http://localhost:5000/admin/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ key: "googlePassword", value: googlePassword })
            });

            if (emailRes.ok && passRes.ok) {
                setMessage("✓ All settings saved successfully!");
                setTimeout(() => setMessage(""), 3000);
            } else {
                setMessage("Failed to save settings.");
            }
        } catch (err) {
            setMessage("Error saving settings.");
        }
    };

    if (loading) return <div className="pro-page-bg"><p style={{ textAlign: "center", marginTop: "120px" }}>Loading profile...</p></div>;

    return (
        <div className="pro-page-bg">
            <div className="pro-back-wrapper">
                <button className="pro-back-btn" onClick={() => navigate("/admin")}>
                    <FaArrowLeft /> Back to Dashboard
                </button>
                <img src="/mom_logo.jpg" alt="Company Logo" className="admin-profile-logo" />
            </div>

            <div className="pro-container">
                {/* SIDEBAR - Reusing the user profile look */}
                <aside className="pro-sidebar">
                    <div className="pro-user-card">
                        <div className="pro-avatar-container">
                            <div className="pro-avatar-wrapper">
                                <FaUserCircle className="pro-avatar-placeholder" />
                            </div>
                        </div>
                        <h2>{user.name}</h2>
                        <p className="pro-user-meta">System Administrator</p>
                        <p className="pro-user-meta">{user.email}</p>
                    </div>

                    <div className="pro-side-nav">
                        <div style={{ padding: '16px', color: '#666', fontSize: '14px', textAlign: 'center' }}>
                            <FaShieldAlt style={{ marginBottom: '8px', fontSize: '20px', color: '#2E7D32' }} /><br />
                            Secure Admin Panel
                        </div>
                    </div>
                </aside>

                {/* MAIN CONTENT */}
                <main className="pro-content-area">
                    <section className="pro-content-section">
                        <div className="header-title">
                            <FaEnvelope color="#2E7D32" /> <h3>Email Configuration</h3>
                        </div>

                        <div className="pro-form-card">
                            <p style={{ marginBottom: '20px', color: '#64748b', fontSize: '0.95rem' }}>
                                Configure the email address that will receive notifications for new orders and product approvals. This email is also used as the sender for automated notifications sent to customers.
                            </p>

                            <form onSubmit={handleSave}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e293b' }}>
                                    Admin Email Address
                                </label>
                                <input
                                    type="email"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    placeholder="your-admin-email@gmail.com"
                                    required
                                />

                                <div style={{ marginTop: '20px', padding: '15px', background: '#E3F2FD', borderRadius: '8px', border: '1px solid #90CAF9' }}>
                                    <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', color: '#1565C0', fontSize: '0.9rem' }}>📧 This email will receive:</p>
                                    <ul style={{ margin: '0', paddingLeft: '20px', color: '#1565C0', fontSize: '0.85rem' }}>
                                        <li>New order notifications with approval links</li>
                                        <li>New product submission requests for approval</li>
                                        <li>Order status update notifications</li>
                                    </ul>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '20px 0', padding: '15px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <FaShieldAlt style={{ marginTop: '3px', color: '#2E7D32', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                        <strong>Important:</strong> No need to contact the development team anymore! Update your email here and it will automatically be used for all notifications. Changes take effect immediately.
                                    </span>
                                </div>

                                {message && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '12px',
                                        marginBottom: '20px',
                                        background: message.includes('success') ? '#E8F5E9' : '#FFEBEE',
                                        color: message.includes('success') ? '#2E7D32' : '#C62828',
                                        borderRadius: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {message}
                                    </div>
                                )}

                                <button type="submit" className="pro-pwd-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <FaSave /> Save Email Configuration
                                </button>
                            </form>
                        </div>
                    </section>

                    <section className="pro-content-section" style={{ marginTop: '30px' }}>
                        <div className="header-title">
                            <FaKey color="#2E7D32" /> <h3>Google App Password Configuration</h3>
                        </div>

                        <div className="pro-form-card">
                            <p style={{ marginBottom: '20px', color: '#64748b', fontSize: '0.95rem' }}>
                                Set up a Google App Password to enable secure email sending. This is different from your regular Gmail password.
                            </p>

                            <form onSubmit={handleSave}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#1e293b' }}>
                                    Google App Password
                                </label>
                                <div style={{ position: 'relative', display: 'flex', gap: '8px' }}>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={googlePassword}
                                        onChange={(e) => setGooglePassword(e.target.value)}
                                        placeholder="Enter 16-character app password"
                                        required
                                        style={{ flex: 1 }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            padding: '10px 15px',
                                            background: '#f0f0f0',
                                            border: '1px solid #ddd',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px'
                                        }}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>

                                <div style={{ marginTop: '20px', padding: '15px', background: '#FFF3E0', borderRadius: '8px', border: '1px solid #FFE0B2' }}>
                                    <p style={{ margin: '0 0 15px 0', fontWeight: 'bold', color: '#E65100', fontSize: '0.95rem' }}>🔐 Quick Setup - Get Google App Password:</p>
                                    
                                    <div style={{ marginBottom: '15px', padding: '10px', background: '#fff9f0', borderRadius: '6px', border: '1px solid #FFE0B2' }}>
                                        <p style={{ margin: '5px 0', color: '#E65100', fontSize: '0.9rem' }}><strong>Step 1:</strong> Click here to go directly to Google App Passwords:</p>
                                        <a 
                                            href="https://myaccount.google.com/apppasswords" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-block',
                                                marginTop: '8px',
                                                padding: '10px 20px',
                                                background: '#4285F4',
                                                color: 'white',
                                                textDecoration: 'none',
                                                borderRadius: '6px',
                                                fontWeight: 'bold',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            🔗 Open Google App Passwords
                                        </a>
                                    </div>

                                    <div style={{ marginBottom: '15px', padding: '10px', background: '#fff9f0', borderRadius: '6px' }}>
                                        <p style={{ margin: '5px 0', color: '#E65100', fontSize: '0.9rem' }}><strong>Step 2:</strong> If 2-Step Verification is NOT enabled:</p>
                                        <a 
                                            href="https://myaccount.google.com/security" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'inline-block',
                                                marginTop: '8px',
                                                padding: '10px 20px',
                                                background: '#EA4335',
                                                color: 'white',
                                                textDecoration: 'none',
                                                borderRadius: '6px',
                                                fontWeight: 'bold',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            🔐 Enable 2-Step Verification First
                                        </a>
                                    </div>

                                    <div style={{ padding: '10px', background: '#fff9f0', borderRadius: '6px' }}>
                                        <p style={{ margin: '5px 0', color: '#E65100', fontSize: '0.9rem' }}><strong>Step 3:</strong> After 2-Step is enabled, go back and:</p>
                                        <ol style={{ margin: '8px 0', paddingLeft: '20px', color: '#E65100', fontSize: '0.85rem', lineHeight: '1.6' }}>
                                            <li>Select <strong>Mail</strong> as the app</li>
                                            <li>Select <strong>Windows Computer</strong> (or your device)</li>
                                            <li>Copy the <strong>16-character password</strong></li>
                                            <li>Paste it below and click <strong>Save</strong></li>
                                        </ol>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', margin: '20px 0', padding: '15px', background: '#E3F2FD', borderRadius: '8px', border: '1px solid #90CAF9' }}>
                                    <FaShieldAlt style={{ marginTop: '3px', color: '#1565C0', flexShrink: 0 }} />
                                    <span style={{ fontSize: '0.85rem', color: '#1565C0' }}>
                                        <strong>Security Note:</strong> This password is stored securely in the database. It's different from your Gmail password and can be revoked anytime from Google Account settings.
                                    </span>
                                </div>

                                {message && (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '12px',
                                        marginBottom: '20px',
                                        background: message.includes('success') ? '#E8F5E9' : '#FFEBEE',
                                        color: message.includes('success') ? '#2E7D32' : '#C62828',
                                        borderRadius: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {message}
                                    </div>
                                )}

                                <button type="submit" className="pro-pwd-btn" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                    <FaSave /> Save All Settings
                                </button>
                            </form>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
};

export default AdminProfile;
