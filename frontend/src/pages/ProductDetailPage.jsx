import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { FaStar, FaShoppingCart, FaArrowLeft } from "react-icons/fa";
import { useToast } from "../context/ToastContext";

import { useCart } from "../context/CartContext";
import "./ProductDetailPage.css";

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState("");
  const [allImages, setAllImages] = useState([]);

  // Fetch product from API
  useEffect(() => {
    fetch(`http://localhost:5000/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Product not found");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        const images = [data.image, ...(data.images || [])].filter(Boolean);
        setAllImages(images);
        setCurrentImage(data.image);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch product:", err);
        setLoading(false);
      });
  }, [id]);

  const [selectedSize, setSelectedSize] = useState("50g");
  const [quantity, setQuantity] = useState(1);

  // Review State
  const [reviews, setReviews] = useState([]);
  const [userRating, setUserRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [uploadImages, setUploadImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchReviews();
  }, [id]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`http://localhost:5000/reviews/${id}`);
      const data = await res.json();
      if (Array.isArray(data)) setReviews(data);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    }
  };

  const handleImageChange = (e) => {
    setUploadImages(Array.from(e.target.files));
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast("Please login to leave a review", "error");
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("productId", id);
    formData.append("userEmail", user.email);
    formData.append("userName", user.name);
    formData.append("rating", userRating);
    formData.append("comment", newComment);
    uploadImages.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const res = await fetch("http://localhost:5000/reviews", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setNewComment("");
        setUserRating(5);
        setUploadImages([]);
        fetchReviews();
        fetch(`http://localhost:5000/products/${id}`)
          .then(res => res.json())
          .then(data => setProduct(data));
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sizes = ["50g", "100g", "250g", "500g"];

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        ...product,
        qty: quantity,
        size: selectedSize,
      });
    }
  };

  const handleBuyNow = () => {
    if (!product) return;

    // Calculate dynamic price based on discount logic
    const now = new Date();
    const isDiscountActive =
      product.discountAmount > 0 &&
      product.discountStart &&
      product.discountEnd &&
      now >= new Date(product.discountStart) &&
      now <= new Date(product.discountEnd);

    const finalPrice = isDiscountActive
      ? (product.price - product.discountAmount)
      : product.price;

    navigate("/checkout", {
      state: {
        buyNowItem: {
          ...product,
          productId: product._id || product.id,
          qty: quantity,
          size: selectedSize,
          price: finalPrice // Ensure checkout gets the discounted price
        }
      }
    });
  };

  if (loading) return <div className="container" style={{ marginTop: '100px' }}>Loading...</div>;
  if (!product) return <div className="container" style={{ marginTop: '100px' }}>Product not found</div>;
  const now = new Date();

  const isDiscountActive =
    product.discountAmount > 0 &&
    product.discountStart &&
    product.discountEnd &&
    now >= new Date(product.discountStart) &&
    now <= new Date(product.discountEnd);

  const discountedPrice = isDiscountActive
    ? (product.price - product.discountAmount).toFixed(2)
    : product.price;

  return (
    <div className="product-detail-page">
      <Header />
      <div className="container detail-container">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft size={14} /> Back to Shop
        </button>
        <div className="detail-grid">
          <div className="product-image-section">
            <div className="main-image-container">
              <img
                src={`http://localhost:5000${currentImage}` || "https://via.placeholder.com/600"}
                alt={product.name}
                className="main-detail-img"
              />
            </div>
            {allImages.length > 1 && (
              <div className="thumbnail-gallery">
                {allImages.map((img, i) => (
                  <img
                    key={i}
                    src={`http://localhost:5000${img}`}
                    alt={`thumb-${i}`}
                    className={`thumb-img ${currentImage === img ? "active-thumb" : ""}`}
                    onClick={() => setCurrentImage(img)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="product-info-section">
            <span className="detail-tag">{product.tag || "New"}</span>
            <h1 className="detail-title">{product.name}</h1>
            <div className="detail-rating">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <FaStar
                    key={i}
                    className={i < Math.round(product.averageRating || 0) ? "star-filled" : "star-empty"}
                  />
                ))}
              </div>
              <span className="reviews">({product.ratingCount || 0} ratings)</span>
            </div>
            <div className="detail-price">
              {isDiscountActive ? (
                <>
                  <span className="old-price">₹{product.price}</span>
                  <span className="price">
                    ₹{discountedPrice}
                    <span className="off-text"> ({product.discountPercent}% OFF)</span>
                  </span>
                </>
              ) : (
                <span className="price">₹{product.price}</span>
              )}
            </div>
            <p className="detail-description">
              {product.description || `Elevate your style with this premium quality ${product.name.toLowerCase()}.`}
            </p>

            <div className="selection-group">
              <h4>Quantity</h4>
              <div className="quantity-control">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
            </div>
            <div className="action-buttons">
              <button className="add-to-cart-outline" onClick={handleAddToCart}>
                <FaShoppingCart /> Add to Cart
              </button>
              <button className="buy-now-btn" onClick={handleBuyNow}>Buy Now</button>
            </div>
          </div>
        </div>

        <div className="review-section">
          <h2>Customer Reviews</h2>
          <div className="reviews-layout">
            <div className="review-form-card">
              <h3>Write a Review</h3>
              <form onSubmit={handleSubmitReview}>
                <div className="rating-input">
                  <label>Rating:</label>
                  <div className="star-selector">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <FaStar
                        key={star}
                        className={star <= userRating ? "star-filled" : "star-empty"}
                        onClick={() => setUserRating(star)}
                      />
                    ))}
                  </div>
                </div>
                <div className="comment-input">
                  <label>Comment:</label>
                  <textarea
                    placeholder="Share your experience..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  ></textarea>
                </div>
                <div className="image-input">
                  <label>Upload Images:</label>
                  <input type="file" multiple accept="image/*" onChange={handleImageChange} />
                  <div className="image-previews">
                    {uploadImages.map((img, i) => (
                      <img
                        key={i}
                        src={URL.createObjectURL(img)}
                        alt="preview"
                        className="preview-thumb"
                      />
                    ))}
                  </div>
                </div>
                <button type="submit" className="submit-review-btn" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Post Review"}
                </button>
              </form>
            </div>
            <div className="reviews-list">
              {reviews.length === 0 ? (
                <p className="no-reviews">No reviews yet. Be the first to rate this product!</p>
              ) : (
                reviews.map((rev, index) => (
                  <div key={index} className="review-item">
                    <div className="review-header">
                      <div className="user-info">
                        <strong>{rev.userName}</strong>
                        <span className="review-date">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="review-rating">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < rev.rating ? "star-filled" : "star-empty"} />
                        ))}
                      </div>
                    </div>
                    <p className="review-comment">{rev.comment}</p>
                    {rev.images && rev.images.length > 0 && (
                      <div className="review-images">
                        {rev.images.map((img, i) => (
                          <img
                            key={i}
                            src={`http://localhost:5000${img}`}
                            alt="review"
                            onClick={() => window.open(`http://localhost:5000${img}`, "_blank")}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;