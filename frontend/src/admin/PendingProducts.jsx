import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import { useToast } from "../context/ToastContext";
import "./RemoveProductPage.css"; // Reuse existing styles

const PendingProducts = () => {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    if (!token || !user || !user.isAdmin) {
      navigate("/login", { replace: true });
      return;
    }
    fetchPendingProducts();
  }, [navigate, token]);

  const fetchPendingProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/products?showAll=true");
      const allProducts = await response.json();
      const pending = allProducts.filter(p => p.status === 'Pending');
      setPendingProducts(pending);
    } catch (err) {
      console.error("Failed to fetch pending products", err);
      showToast("Error loading pending products", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId) => {
    try {
      const response = await fetch(
        `http://localhost:5000/products/${productId}/approve`
      );
      if (response.ok) {
        showToast("Product approved successfully!", "success");
        fetchPendingProducts();
        setSelectedProduct(null);
      }
    } catch (err) {
      console.error("Failed to approve product", err);
      showToast("Error approving product", "error");
    }
  };

  const handleReject = async (productId, reason) => {
    const rejectionReason = reason || "Product does not meet store standards";
    try {
      const response = await fetch(
        `http://localhost:5000/products/${productId}/reject?reason=${encodeURIComponent(
          rejectionReason
        )}`
      );
      if (response.ok) {
        showToast("Product rejected!", "success");
        fetchPendingProducts();
        setSelectedProduct(null);
      }
    } catch (err) {
      console.error("Failed to reject product", err);
      showToast("Error rejecting product", "error");
    }
  };

  if (loading) {
    return <div className="loading">Loading pending products...</div>;
  }

  return (
    <div className="admin-page">
      <div className="pending-header">
        <button className="back-btn" onClick={() => navigate("/admin")}>
          ← Back to Dashboard
        </button>
        <img src="/mom_logo.jpg" alt="Company Logo" className="pending-logo" />
        <h2>Pending Products ({pendingProducts.length})</h2>
      </div>

      {pendingProducts.length === 0 ? (
        <div className="no-products">
          <p>✓ All products have been reviewed!</p>
        </div>
      ) : (
        <div className="products-table-container">
          <table className="products-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingProducts.map((product) => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.category}</td>
                  <td>${product.price}</td>
                  <td>
                    <span className="status-badge pending">Pending</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => setSelectedProduct(product)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="approve-btn"
                        onClick={() => handleApprove(product._id)}
                        title="Approve Product"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() =>
                          handleReject(product._id, product.rejectionReason)
                        }
                        title="Reject Product"
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for detailed view */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setSelectedProduct(null)}
            >
              ✕
            </button>

            <h3>{selectedProduct.name}</h3>

            {selectedProduct.image && (
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                className="modal-image"
              />
            )}

            <p>
              <strong>Category:</strong> {selectedProduct.category}
            </p>
            <p>
              <strong>Price:</strong> ${selectedProduct.price}
            </p>
            <p>
              <strong>Description:</strong> {selectedProduct.description}
            </p>

            {selectedProduct.images && selectedProduct.images.length > 0 && (
              <div>
                <strong>Gallery Images:</strong>
                <div className="gallery">
                  {selectedProduct.images.map((img, idx) => (
                    <img key={idx} src={img} alt={`Gallery ${idx}`} />
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="approve-btn"
                onClick={() => {
                  handleApprove(selectedProduct._id);
                }}
              >
                <CheckCircle size={16} /> Approve Product
              </button>
              <button
                className="reject-btn"
                onClick={() =>
                  handleReject(
                    selectedProduct._id,
                    selectedProduct.rejectionReason
                  )
                }
              >
                <XCircle size={16} /> Reject Product
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }
        .status-badge.pending {
          background-color: #ffd700;
          color: #000;
        }
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        .view-btn {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
        }
        .approve-btn {
          background-color: #4CAF50;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
        }
        .reject-btn {
          background-color: #f44336;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
        }
        .approve-btn:hover {
          background-color: #45a049;
        }
        .reject-btn:hover {
          background-color: #da190b;
        }
        .view-btn:hover {
          background-color: #45a049;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .modal-content {
          background: white;
          padding: 30px;
          border-radius: 10px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          position: relative;
        }
        .close-btn {
          position: absolute;
          top: 15px;
          right: 15px;
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
        }
        .modal-image {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          border-radius: 8px;
          margin: 15px 0;
        }
        .gallery {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 15px 0;
        }
        .gallery img {
          width: 100%;
          height: 100px;
          object-fit: cover;
          border-radius: 4px;
        }
        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }
        .modal-actions button {
          flex: 1;
          padding: 10px 15px;
        }
        .loading {
          text-align: center;
          padding: 40px;
          font-size: 16px;
          color: #666;
        }
        .no-products {
          text-align: center;
          padding: 40px;
          background-color: #f0f8f0;
          border-radius: 8px;
          color: #4CAF50;
          font-size: 16px;
        }
        .products-table-container {
          overflow-x: auto;
          margin-top: 20px;
        }
        .products-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
        }
        .products-table thead {
          background-color: #f5f5f5;
        }
        .products-table th {
          padding: 15px;
          text-align: left;
          font-weight: bold;
          border-bottom: 2px solid #ddd;
        }
        .products-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #ddd;
        }
        .products-table tbody tr:hover {
          background-color: #f9f9f9;
        }
      `}</style>
    </div>
  );
};

export default PendingProducts;