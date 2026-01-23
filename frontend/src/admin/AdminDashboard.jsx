import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  Percent,
  PlusCircle,
  Layers,
  Headphones,
  LogOut,
  User,
  AlertCircle,
} from "lucide-react";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    discounts: 0,
    pendingProducts: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || !user || !user.isAdmin) {
      navigate("/login", { replace: true });
      return;
    }
    fetchStats();
  }, [navigate, token]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [productsRes, ordersRes] = await Promise.all([
        fetch("http://localhost:5000/products?showAll=true"),
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
          p.discountAmount > 0 &&
          new Date(p.discountStart) <= new Date() &&
          new Date(p.discountEnd) >= new Date()
      );

      const pendingProducts = products.filter(p => p.status === 'Pending');
      const totalProducts = products.length;

      setStats({
        products: totalProducts,  // Now shows total products count
        orders: ordersData.orders.length,
        discounts: activeDiscounts.length,
        pendingProducts: pendingProducts.length,
      });
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return <div className="admin-loading">Loading dashboard...</div>;
  }

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

        <div className="stats-grid">
          <div className="stat-card green">
            <Package />
            <h3>{stats.products}</h3>
            <p>Total Products</p>
          </div>

          <div className="stat-card blue">
            <ShoppingBag />
            <h3>{stats.orders}</h3>
            <p>Placed Orders</p>
          </div>

          <div className="stat-card purple">
            <Percent />
            <h3>{stats.discounts}</h3>
            <p>Active Discounts</p>
          </div>

          <div className="stat-card orange" style={{ background: 'linear-gradient(135deg, #ff9a56 0%, #ff6b6b 100%)' }}>
            <AlertCircle />
            <h3>{stats.pendingProducts}</h3>
            <p>Pending Products</p>
          </div>
        </div>

        <div className="admin-actions-grid">
          <button onClick={() => navigate("/admin/add-category")}>
            <Layers /> Add Category
          </button>

          <button onClick={() => navigate("/admin/add-product")}>
            <PlusCircle /> Add Product
          </button>

          <button onClick={() => navigate("/admin/remove-product")}>
            <Package /> Manage Products
          </button>



          <button onClick={() => navigate("/admin/orders")}>
            <ShoppingBag /> Orders
          </button>

          <button onClick={() => navigate("/admin/support")}>
            <Headphones /> Support
          </button>

          <button onClick={() => navigate("/admin/profile")}>
            <User /> Admin Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
