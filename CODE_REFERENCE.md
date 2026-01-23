# Code Changes Reference

## Main Fix: Products Showing 0 Count

### File: frontend/src/admin/AdminDashboard.jsx

**Line 43 - Changed:**
```javascript
// BEFORE:
fetch("http://localhost:5000/products")

// AFTER:
fetch("http://localhost:5000/products?showAll=true")
```

**Updated fetchStats() function:**
```javascript
const fetchStats = async () => {
  try {
    setLoading(true);

    const [productsRes, ordersRes] = await Promise.all([
      fetch("http://localhost:5000/products?showAll=true"),  // ← Added ?showAll=true
      fetch("http://localhost:5000/admin/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
    ]);

    const products = await productsRes.json();
    const ordersData = await ordersRes.json();

    const activeDiscounts = products.filter(
      (p) =>
        p.discountPercent > 0 &&
        new Date(p.discountStart) <= new Date() &&
        new Date(p.discountEnd) >= new Date()
    );

    // Now handles products without status field (legacy)
    const pendingProducts = products.filter(p => p.status === 'Pending');
    const approvedProducts = products.filter(p => p.status === 'Approved' || !p.status);

    setStats({
      products: approvedProducts.length,  // ← Shows approved products
      orders: ordersData.orders.length,
      discounts: activeDiscounts.length,
      pendingProducts: pendingProducts.length,  // ← Shows pending count
    });
  } catch (err) {
    console.error("Failed to load dashboard stats", err);
  } finally {
    setLoading(false);
  }
};
```

---

## Logo Implementation

### File: frontend/src/admin/AdminDashboard.jsx

**Header section with logo:**
```jsx
return (
  <div className="admin-page">
    <div className="admin-card">
      <div className="admin-header">
        <div className="admin-header-left">
          <img src="/mom_logo.jpg" alt="Company Logo" className="admin-logo" />
          <h2>Admin Dashboard</h2>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Rest of component */}
    </div>
  </div>
);
```

### File: frontend/src/admin/AdminOrdersPage.jsx

**Logo in Orders page:**
```jsx
return (
  <div className="admin-orders-page">
    <div className="ao-container">
      <div className="ao-header">
        <div className="ao-header-left">
          <button className="back-btn" onClick={() => navigate("/admin")}>
            <ArrowLeft size={20} /> Back
          </button>
          <img src="/mom_logo.jpg" alt="Company Logo" className="admin-orders-logo" />
          <h2><ShoppingBag size={24} /> Placed Orders</h2>
        </div>
      </div>
      {/* Rest of component */}
    </div>
  </div>
);
```

### File: frontend/src/admin/PendingProducts.jsx

**Logo in Pending Products page:**
```jsx
return (
  <div className="admin-page">
    <div className="pending-header">
      <button className="back-btn" onClick={() => navigate("/admin")}>
        ← Back to Dashboard
      </button>
      <img src="/mom_logo.jpg" alt="Company Logo" className="pending-logo" />
      <h2>Pending Products ({pendingProducts.length})</h2>
    </div>

    {/* Rest of component */}
  </div>
);
```

### File: frontend/src/admin/AdminProfile.jsx

**Logo in Admin Profile:**
```jsx
return (
  <div className="pro-page-bg">
    <div className="pro-back-wrapper">
      <button className="pro-back-btn" onClick={() => navigate("/admin")}>
        <FaArrowLeft /> Back to Dashboard
      </button>
      <img src="/mom_logo.jpg" alt="Company Logo" className="admin-profile-logo" />
    </div>

    <div className="pro-container">
      {/* Rest of component */}
    </div>
  </div>
);
```

---

## CSS Animations

### File: frontend/src/admin/AdminDashboard.css

**New animations added:**
```css
/* Header animations */
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Content animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Logo styling:**
```css
.admin-logo {
  height: 50px;
  width: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  animation: slideInLeft 0.5s ease-out;
}
```

**Enhanced stat cards:**
```css
.stat-card {
  padding: 25px;
  border-radius: 16px;
  color: white;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  animation: fadeInUp 0.6s ease-out forwards;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -50%;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  opacity: 0;
  transition: all 0.6s;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card.green { 
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%); 
}
.stat-card.blue { 
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); 
}
.stat-card.purple { 
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); 
}

.stat-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.stat-card:nth-child(1) { animation-delay: 0.1s; }
.stat-card:nth-child(2) { animation-delay: 0.2s; }
.stat-card:nth-child(3) { animation-delay: 0.3s; }
.stat-card:nth-child(4) { animation-delay: 0.4s; }
```

**Enhanced buttons:**
```css
.admin-actions-grid button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 2px solid transparent;
  padding: 14px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  color: var(--dark);
  animation: slideUp 0.5s ease-out forwards;
}

.admin-actions-grid button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.admin-actions-grid button:hover::before {
  left: 100%;
}

.admin-actions-grid button:hover {
  background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
  color: white;
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(46, 204, 113, 0.3);
  border-color: #2ecc71;
}
```

**Staggered button animations:**
```css
.admin-actions-grid button:nth-child(1) { animation-delay: 0.1s; }
.admin-actions-grid button:nth-child(2) { animation-delay: 0.15s; }
.admin-actions-grid button:nth-child(3) { animation-delay: 0.2s; }
.admin-actions-grid button:nth-child(4) { animation-delay: 0.25s; }
.admin-actions-grid button:nth-child(5) { animation-delay: 0.3s; }
.admin-actions-grid button:nth-child(6) { animation-delay: 0.35s; }
.admin-actions-grid button:nth-child(7) { animation-delay: 0.4s; }
```

---

## Email Configuration

### File: frontend/src/admin/AdminProfile.jsx

**Email save handler:**
```javascript
const handleSave = async (e) => {
  e.preventDefault();
  setMessage("Saving...");
  try {
    const res = await fetch("http://localhost:5000/admin/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        key: "adminEmail", 
        value: adminEmail 
      })
    });

    if (res.ok) {
      setMessage("✓ Email configuration saved successfully! All notifications will now use this email.");
    } else {
      setMessage("✗ Failed to save email configuration");
    }
  } catch (err) {
    console.error("Failed to save settings", err);
    setMessage("✗ Error: " + err.message);
  }
};
```

### File: backend/server.js (reference)

**How backend uses the email:**
```javascript
// When sending notifications
const settings = await Settings.findOne({ key: "adminEmail" });
const adminEmail = settings?.value || process.env.EMAIL_USER;

// Send email to admin
await sendEmail(adminEmail, notificationContent);
```

---

## Responsive Design Breakpoints

### File: frontend/src/admin/AdminDashboard.css

```css
/* Tablet and below */
@media (max-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .admin-actions-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Mobile devices */
@media (max-width: 768px) {
  .admin-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .admin-header-left {
    width: 100%;
  }

  .logout-btn {
    width: 100%;
    justify-content: center;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .admin-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .admin-card {
    padding: 20px;
  }

  .admin-logo {
    height: 40px;
  }

  .admin-header h2 {
    font-size: 24px;
  }
}

/* Small mobile devices */
@media (max-width: 480px) {
  .admin-actions-grid {
    grid-template-columns: 1fr;
  }

  .admin-header h2 {
    font-size: 20px;
  }

  .stat-card h3 {
    font-size: 20px;
  }
}
```

---

## Summary of Code Changes

| File | Lines Changed | Type | Purpose |
|------|---------------|------|---------|
| AdminDashboard.jsx | 43, 61-75 | Logic | Fix product fetch, add logo |
| AdminDashboard.css | All | Styling | Add animations, enhance design |
| AdminOrdersPage.jsx | 92-95 | UI | Add logo to header |
| AdminOrdersPage.css | 24-50 | Styling | Logo and header styling |
| PendingProducts.jsx | 84-89 | UI | Add logo to header |
| RemoveProductPage.css | 19-42 | Styling | Logo styling |
| AdminProfile.jsx | 67-71 | UI | Add logo to back wrapper |
| Profile.css | 343-370 | Styling | Back wrapper flex layout |

---

## Key Code Patterns Used

### Pattern 1: Fetch with Parameter
```javascript
// Default: only approved products
fetch("http://localhost:5000/products")

// For admin: all products
fetch("http://localhost:5000/products?showAll=true")
```

### Pattern 2: Staggered Animation
```javascript
.element:nth-child(1) { animation-delay: 0.1s; }
.element:nth-child(2) { animation-delay: 0.2s; }
.element:nth-child(3) { animation-delay: 0.3s; }
```

### Pattern 3: Hover Effect
```css
.button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.button:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(...);
}
```

### Pattern 4: Gradient Background
```css
background: linear-gradient(135deg, #color1 0%, #color2 100%);
```

---

**All code changes are production-ready and tested!**
