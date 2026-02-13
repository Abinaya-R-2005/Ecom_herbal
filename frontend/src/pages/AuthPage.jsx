import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaGoogle, FaFacebookF, FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from "react-router-dom";
import { useToast } from '../context/ToastContext';
import './AuthPage.css';
import API_BASE_URL from '../apiConfig';

const AuthPage = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        },
        exit: {
            opacity: 0,
            x: -20,
            transition: { duration: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    const brandingVariants = {
        hidden: { x: -50, opacity: 0 },
        visible: {
            x: 0,
            opacity: 1,
            transition: { duration: 0.8, ease: "easeOut", staggerChildren: 0.2 }
        }
    };
    const handleSignup = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        if (!acceptedTerms) {
            setError("Please accept Terms & Privacy Policy");
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password })
            });

            const data = await res.json();


            if (!res.ok) {
                setError(data.message);
            } else {
                setSuccess(data.message);
                setIsLogin(true); // switch to login
            }
        } catch (err) {
            setError("Server not reachable");
        }
    };
    const handleLogin = async (e) => {
        e.preventDefault();   // 🔴 THIS LINE FIXES EVERYTHING

        const res = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showToast(data.message, "error");
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        if (data.user.isAdmin) {
            navigate("/admin");
        } else {
            navigate("/home");
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-content">
                {/* Left Side: Branding */}
                <motion.div
                    className="auth-branding"
                    initial="hidden"
                    animate="visible"
                    variants={brandingVariants}
                >
                    <motion.div variants={itemVariants} className="brand-logo-container">
                        <div className="brand-icon" style={{ background: 'none', boxShadow: 'none' }}>
                            <img src="/mom_logo.jpg" alt="MOM Logo" style={{ width: '100%', borderRadius: '12px' }} />
                        </div>
                        <h1 className="brand-name" style={{ color: '#2E7D32' }}>MOM SECRET HAIR OIL</h1>
                    </motion.div>

                    <motion.h2 variants={itemVariants} className="brand-headline">
                        Your Ultimate <br /> <span className="highlight-text">Shopping Destination</span>
                    </motion.h2>

                    <motion.p variants={itemVariants} className="brand-subtext">
                        Discover millions of products, exclusive deals, and seamless shopping experience.
                    </motion.p>

                    <motion.div variants={itemVariants} className="brand-stats">
                        <div className="stat-item">
                            <h3>2M+</h3>
                            <p>Products</p>
                        </div>
                        <div className="stat-item">
                            <h3>50K+</h3>
                            <p>Brands</p>
                        </div>
                        <div className="stat-item">
                            <h3>10M+</h3>
                            <p>Customers</p>
                        </div>
                    </motion.div>
                </motion.div>

                {/* Right Side: Form */}
                <div className="auth-form-card">
                    <div className="auth-tabs">
                        <button
                            className={`auth-tab ${isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(true)}
                        >
                            Login
                        </button>
                        <button
                            className={`auth-tab ${!isLogin ? 'active' : ''}`}
                            onClick={() => setIsLogin(false)}
                        >
                            Sign Up
                        </button>
                    </div>

                    <AnimatePresence mode='wait'>
                        {isLogin ? (
                            <motion.div
                                key="login"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="form-container"
                            >
                                <motion.div variants={itemVariants}>
                                    <h2>Welcome Back!</h2>
                                    <p className="form-subtitle">Login to continue shopping</p>
                                </motion.div>

                                <form onSubmit={handleLogin}>
                                    <motion.div variants={itemVariants} className="input-group">
                                        <label>Email Address</label>
                                        <div className="input-wrapper">
                                            <FaEnvelope className="input-icon" />
                                            <input
                                                type="email"
                                                placeholder="email@example.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="input-group">
                                        <label>Password</label>
                                        <div className="input-wrapper">
                                            <FaLock className="input-icon" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="form-actions">
                                        <label className="remember-me">
                                            <input type="checkbox" />
                                            Remember me
                                        </label>
                                        <a href="/" className="forgot-password">Forgot Password?</a>
                                    </motion.div>
                                    {error && <p className="error-text">{error}</p>}
                                    {success && <p className="success-text">{success}</p>}

                                    <motion.button
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className="submit-btn"
                                    >
                                        Login
                                    </motion.button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="signup"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                className="form-container"
                            >
                                <motion.div variants={itemVariants}>
                                    <h2>Create Account</h2>
                                    <p className="form-subtitle">Sign up to start shopping</p>
                                </motion.div>

                                <form onSubmit={handleSignup}>

                                    <motion.div variants={itemVariants} className="input-group">
                                        <label>Full Name</label>
                                        <div className="input-wrapper">
                                            <FaUser className="input-icon" />
                                            <input
                                                type="text"
                                                placeholder="Name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                            />
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="input-group">
                                        <label>Email Address</label>
                                        <div className="input-wrapper">
                                            <FaEnvelope className="input-icon" />
                                            <input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                                        </div>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="input-group">
                                        <label>Password</label>
                                        <div className="input-wrapper">
                                            <FaLock className="input-icon" />
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                            </button>
                                        </div>
                                        <span className="input-hint">Must be at least 6 characters</span>
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="form-actions checkbox-only">
                                        <label className="terms-check">
                                            <input type="checkbox" onChange={(e) => setAcceptedTerms(e.target.checked)} />
                                            I agree to the <a href="/">Terms of Service</a> and <a href="/">Privacy Policy</a>
                                        </label>
                                    </motion.div>
                                    {error && <p className="error-text">{error}</p>}
                                    {success && <p className="success-text">{success}</p>}

                                    <motion.button
                                        variants={itemVariants}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className="submit-btn"
                                    >
                                        Create Account
                                    </motion.button>
                                </form>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        className="social-login"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="divider">
                            <span>Or {isLogin ? 'continue' : 'sign up'} with</span>
                        </div>
                        <div className="social-buttons">
                            <button className="social-btn google">
                                <FaGoogle className="social-icon" /> Google
                            </button>
                            <button className="social-btn facebook">
                                <FaFacebookF className="social-icon" /> Facebook
                            </button>
                        </div>
                    </motion.div>

                </div>
            </div>
        </div>
    );
};

export default AuthPage;
