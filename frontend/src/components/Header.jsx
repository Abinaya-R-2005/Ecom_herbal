import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaUser,
  FaHeart,
  FaShoppingCart,
  FaBars,
  FaMapMarkerAlt,
  FaSignOutAlt,
  FaBoxOpen,
  FaTimes // Added close icon
} from "react-icons/fa";
import "./Header.css";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { categories as localCategories } from "../data/categories";

const Header = ({ onSearch }) => {
  const [showCategories, setShowCategories] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };
  const [categories, setCategories] = useState([]);

  const { wishlist } = useWishlist();
  const { cart } = useCart(); // ✅ cart count
  useEffect(() => {
    // verifying that we can use local static categories now
    setCategories(localCategories);
  }, []);

  return (
    <header className="sh-header">
      {/* Top Banner */}
      <div className="top-banner">
        <div className="container banner-flex">
          <div className="delivery-loc">
            <FaMapMarkerAlt className="loc-icon" />
            <span>
              Deliver to: <strong>New York 10001</strong>
            </span>
          </div>
          <div className="top-links">
            <Link to="/customer-service">Customer Service</Link>
            <Link to="/app">Download App</Link>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="main-nav container">
        <Link to="/home" className="logo-brand">
          <img src="/mom_logo.jpg" alt="MOM SECRET HAIR OIL" className="header-logo-img" />
        </Link>

        {/* Search Bar - Moved outside nav-content for mobile visibility */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search for products..."
            onChange={(e) => onSearch && onSearch(e.target.value)}
          />
          <button className="search-btn">
            <FaSearch />
          </button>
        </div>

        <div className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </div>

        <div className={`nav-content ${isMobileMenuOpen ? "open" : ""}`}>

          <div className="nav-icons">
            <Link to="/profile" className="icon-link" onClick={() => setIsMobileMenuOpen(false)}>
              <FaUser />
              <span className="mobile-label">Profile</span>
            </Link>

            <Link to="/orders" className="icon-link" title="My Orders" onClick={() => setIsMobileMenuOpen(false)}>
              <FaBoxOpen />
              <span className="mobile-label">Orders</span>
            </Link>

            {/* ❤️ Wishlist */}
            <Link to="/wishlist" className="icon-link" onClick={() => setIsMobileMenuOpen(false)}>
              <FaHeart />
              {wishlist.length > 0 && (
                <span className="cart-badge">{wishlist.length}</span>
              )}
              <span className="mobile-label">Wishlist</span>
            </Link>

            {/* 🛒 Cart */}
            <Link to="/cart" className="icon-link" onClick={() => setIsMobileMenuOpen(false)}>
              <FaShoppingCart />
              {cart.length > 0 && (
                <span className="cart-badge">
                  {cart.reduce((sum, i) => sum + i.qty, 0)}
                </span>
              )}
              <span className="mobile-label">Cart</span>
            </Link>

            {/* 🚪 Logout */}
            <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="icon-link" style={{ background: "none", border: "none", cursor: "pointer" }}>
              <FaSignOutAlt />
              <span className="mobile-label">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <nav className="categories-bar">
        <div className="container categories-flex">
          <div
            className="all-categories"
            onClick={() => setShowCategories(!showCategories)}
          >
            <FaBars />
            <span>All Categories</span>
          </div>

          <div className="cat-links">
            {/* Import categories directly if not already done, or pass as props/context. 
                For now assuming we replace the fetch logic with local import at top of file, 
                but here we can just map the local array if we imported it. 
                Let's use the fetched/state ones but filled from local data in useEffect */}
            {categories.map((cat) => (
              <Link
                key={cat.id || cat._id}
                to={`/category/${cat.name}`}
                className="cat-item"
              >
                <span className="cat-icon-wrapper">
                  {cat.icon || "📦"}
                </span>
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;