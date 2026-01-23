// src/pages/Profile.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import {
  FaUserCircle, FaBoxOpen, FaMapMarkerAlt,
  FaSignOutAlt, FaEdit, FaPlus,
  FaShoppingBag, FaShieldAlt, FaChevronRight,
  FaArrowLeft
} from "react-icons/fa";

import "./Profile.css";

// Force reload comment
const Profile = () => {

  const navigate = useNavigate();
  const { removeFromWishlist, setWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  // ✅ SAFE localStorage read (NO CRASH)
  const userLocal = localStorage.getItem("user")
    ? JSON.parse(localStorage.getItem("user"))
    : null;

  const userEmail = userLocal?.email;

  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);

  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLabel, setAddressLabel] = useState("");
  const [addressText, setAddressText] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profilePic, setProfilePic] = useState(localStorage.getItem("profilePic"));

  // ✅ IF NOT LOGGED IN → STOP LOADING
  if (!userEmail) {
    return (
      <div style={{ textAlign: "center", marginTop: "120px" }}>
        <h2>Please login to view your profile</h2>
      </div>
    );
  }

  // ✅ LOAD PROFILE DATA (WITH FALLBACK)
  useEffect(() => {
    Promise.all([
      fetch(`http://localhost:5000/user/${userEmail}`).then(r => r.json()).catch(() => null),
      fetch(`http://localhost:5000/orders/${userEmail}`).then(r => r.json()).catch(() => []),
      fetch(`http://localhost:5000/wishlist/${userEmail}`).then(r => r.json()).catch(() => [])
    ])
      .then(([userData, ordersData, wishlistData]) => {
        // ✅ CRITICAL FIX: fallback to localStorage user
        const safeUser = userData && userData.email ? userData : userLocal;

        setUser(safeUser);
        setAddresses(safeUser?.addresses || []);
        setOrders(ordersData || []);
        setWishlist(wishlistData || []);
      })
      .catch(() => {
        // ✅ EVEN IF EVERYTHING FAILS → PAGE LOADS
        setUser(userLocal);
      });
  }, [userEmail, setWishlist]);

  const logout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleAddAddress = async () => {
    if (!addressText) return showToast("Address required", "error");

    const res = await fetch("http://localhost:5000/user/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userEmail,
        label: addressLabel || "Other",
        address: addressText
      })
    });

    const data = await res.json();
    setAddresses(data.addresses || []);
    setShowAddressForm(false);
    setAddressLabel("");
    setAddressText("");
  };

  const handleChangePassword = async () => {
    // Validation
    if (!currentPassword) {
      return showToast("Current password is required", "error");
    }
    if (!newPassword) {
      return showToast("New password is required", "error");
    }
    if (!confirmPassword) {
      return showToast("Please confirm your new password", "error");
    }
    if (newPassword !== confirmPassword) {
      return showToast("New passwords do not match", "error");
    }
    if (newPassword.length < 6) {
      return showToast("New password must be at least 6 characters", "error");
    }

    try {
      const res = await fetch("http://localhost:5000/user/update-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message, "success");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(data.message, "error");
      }
    } catch (err) {
      console.error("Password update error:", err);
      showToast("Failed to update password", "error");
    }
  };

  // ✅ FINAL STOP FOR INFINITE LOADING
  if (!user) {
    return (
      <p style={{ textAlign: "center", marginTop: "120px" }}>
        Loading profile...
      </p>
    );
  }


  return (
    <div className="pro-page-bg">

      {/* BACK BUTTON */}
      <div className="pro-back-wrapper">
        <button className="pro-back-btn" onClick={() => navigate("/home")}>
          <FaArrowLeft /> Back to Store
        </button>
      </div>

      <div className="pro-container">

        {/* SIDEBAR */}
        <aside className="pro-sidebar">
          <div className="pro-user-card">

            <div className="pro-avatar-container">
              <div className="pro-avatar-wrapper">
                {profilePic ? (
                  <img src={profilePic} className="pro-avatar-img" alt="Profile" />
                ) : (
                  <FaUserCircle className="pro-avatar-placeholder" />
                )}
              </div>

              <button
                className="pro-avatar-edit-btn"
                onClick={() => document.getElementById("avatarInput").click()}
              >
                <FaEdit size={14} />
              </button>

              <input
                type="file"
                id="avatarInput"
                hidden
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      setProfilePic(reader.result);
                      localStorage.setItem("profilePic", reader.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>

            <h2>{user.name}</h2>
            <p className="pro-user-meta">{user.email}</p>
          </div>

          <nav className="pro-side-nav">
            <button className="pro-nav-btn" onClick={() => navigate("/orders")}>
              <FaBoxOpen /> <span>My Orders</span> <FaChevronRight />
            </button>

            <button className="pro-nav-btn pro-logout-btn" onClick={logout}>
              <FaSignOutAlt /> <span>Logout</span>
            </button>
          </nav>
        </aside>

        {/* MAIN CONTENT */}
        <main className="pro-content-area">

          {/* ORDERS */}
          <section className="pro-content-section">
            <div className="header-title">
              <FaShoppingBag /> <h3>Recent Orders</h3>
            </div>


            {orders.length === 0 ? (
              <div className="pro-empty-placeholder">No orders yet</div>
            ) : (
              orders.slice(0, 3).map(order => (
                <div key={order._id} className="pro-order-card">
                  <div>
                    <strong>{order.productName}</strong>
                    <p>{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span className={`status-badge ${order.status?.toLowerCase()}`}>
                      {order.status}
                    </span>
                    {(order.status === 'Ordered' || order.status === 'Pending') && (
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(`http://localhost:5000/orders/${order._id}/cancel-by-user`, {
                              method: "PUT"
                            });
                            const data = await res.json();
                            if (res.ok) {
                              showToast("Cancellation requested. Waiting for admin approval.", "success");
                              setOrders(prev => prev.map(o => o._id === order._id ? { ...o, status: 'Cancellation Requested' } : o));
                            } else {
                              showToast(data.message || "Failed to request cancellation", "error");
                            }
                          } catch (err) {
                            console.error(err);
                            showToast("Error requesting cancellation", "error");
                          }
                        }}
                        style={{
                          padding: '5px 10px',
                          backgroundColor: '#ff4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Request Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </section>

          {/* SECURITY */}
          <section className="pro-content-section">
            <div className="header-title">
              <FaShieldAlt /> <h3>Security</h3>
            </div>

            <div className="pro-form-card">
              <input type="password" placeholder="Current Password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
              <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              <button className="pro-pwd-btn" onClick={handleChangePassword}>Update Password</button>
            </div>
          </section>

        </main>
      </div>
    </div>
  );
};


export default Profile;
