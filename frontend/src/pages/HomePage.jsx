
import Header from "../components/Header";
import FlashSaleBar from "../components/FlashSaleBar";
import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import { FaStar } from "react-icons/fa";
import "./HomePage.css";
import React, { useState, useEffect } from "react";
import API_BASE_URL from "../apiConfig";

const HomePage = () => {
  const [priceRange, setPriceRange] = useState(2000);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [minRating, setMinRating] = useState(0);


  const handleCategoryChange = (category) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  };

  // Filter products based on selected categories (OR logic), search term, price, and rating
  const filteredProducts = products.filter(product => {
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(product.category);

    const matchesSearch =
      (product.name || "").toLowerCase().includes(searchTerm.toLowerCase());

    const productPrice = Number(product.price);
    const matchesPrice = isNaN(productPrice) || productPrice <= priceRange;

    const matchesRating = (Number(product.averageRating) || 0) >= minRating;

    return matchesCategory && matchesSearch && matchesPrice && matchesRating;
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/products`)
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(err => console.error("Failed to fetch products", err));

    fetch(`${API_BASE_URL}/categories`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Failed to fetch categories", err));
  }, []);

  const clearFilters = () => {
    setSelectedCategories([]);
    setPriceRange(2000);
    setMinRating(0);
    setSearchTerm("");
  };

  return (
    <div className="homepage">
      <Header cartCount={3} onSearch={setSearchTerm} />
      <Hero />
      <FlashSaleBar />

      <div className="home-container container">
        {/* Sidebar Filters */}
        <aside className="sidebar">
          <div className="filter-section">
            <h3 className="filter-title">Filters</h3>

            <div className="filter-group">
              <h4>Categories</h4>
              <div className="checkbox-list">
                {categories.map(cat => (
                  <label key={cat._id} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.name)}
                      onChange={() => handleCategoryChange(cat.name)}
                    />
                    <span className="checkmark"></span>
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <h4>Price Range</h4>
              <div className="price-slider-container">
                <input
                  type="range"
                  min="0"
                  max="2000"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  className="price-slider"
                />
                <div className="price-values">
                  <span>₹0</span>
                  <span>₹{priceRange}</span>
                </div>
              </div>
            </div>

            <div className="filter-group">
              <h4>Minimum Rating</h4>
              <div className="rating-filters">
                {[4, 3, 2, 1].map(star => (
                  <div
                    key={star}
                    className={`rating-option ${minRating === star ? "active" : ""}`}
                    onClick={() => setMinRating(star)}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="stars">
                      {[...Array(5)].map((_, i) => (
                        <FaStar key={i} className={i < star ? "star-filled" : "star-empty"} />
                      ))}
                    </span>
                    <span className="rating-label">{star}+ Stars</span>
                  </div>
                ))}
              </div>
              <button className="filter-btn" onClick={() => setMinRating(0)}>All Ratings</button>
            </div>

            <button className="clear-btn" onClick={clearFilters}>Clear All Filters</button>
          </div>

          {/* Special Offer Banner */}
          <div className="sidebar-banner">
            <h3>Special Offer!</h3>
            <p>Get 15% off on your first order. Use code: <strong>FIRST15</strong></p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <div className="content-header">
            <div>
              <h2>All Products</h2>
              <p className="result-count">{filteredProducts.length} products found</p>
            </div>
            <div className="sort-box">
              <select>
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest</option>
              </select>
            </div>
          </div>

          <div className="products-grid">
            {filteredProducts.map(p => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
