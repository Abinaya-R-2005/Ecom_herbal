import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, ArrowLeft, Search, Edit } from "lucide-react";
import { useToast } from "../context/ToastContext";

import "./RemoveProductPage.css";

const RemoveProductPage = () => {

    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        if (!user || !user.isAdmin) {
            navigate("/login", { replace: true });
            return;
        }
        fetchProducts();
    }, [navigate]);

    const fetchProducts = async () => {
        try {
            const res = await fetch("http://localhost:5000/products?showAll=true");
            const data = await res.json();
            setProducts(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch products", err);
            setLoading(false);
        }
    };

    const handleDelete = async (productId) => {
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`http://localhost:5000/admin/product/${productId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (res.ok) {
                setProducts(products.filter((p) => p._id !== productId));
                showToast("Product deleted successfully", "success");
            } else {
                showToast("Failed to delete product", "error");
            }
        } catch (err) {
            console.error("Error deleting product:", err);
            showToast("Error deleting product", "error");
        }
    };

    const filteredProducts = products.filter((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="remove-product-page">
            <div className="rp-container">
                <div className="rp-header">
                    <button className="back-btn" onClick={() => navigate("/admin")}>
                        <ArrowLeft size={20} /> Back to Dashboard
                    </button>
                    <h2>Manage Inventory</h2>
                </div>

                <div className="rp-search-bar">
                    <Search size={20} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search products to remove..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <p>Loading products...</p>
                ) : (
                    <div className="rp-list">
                        {filteredProducts.length === 0 ? (
                            <p className="no-results">No products found.</p>
                        ) : (
                            filteredProducts.map((product) => (
                                <div key={product._id} className="rp-item">
                                    <div className="rp-item-info">
                                        <img
                                            src={`http://localhost:5000${product.image}`}
                                            alt={product.name}
                                            onError={(e) => (e.target.src = "https://via.placeholder.com/50")}
                                        />
                                        <div>
                                            <h3>{product.name}</h3>
                                            <p>₹{product.price}</p>
                                        </div>
                                    </div>
                                    <div className="rp-actions">
                                        <div className="rp-actions">
                                            <button
                                                className="rp-edit-btn"
                                                onClick={() => navigate(`/admin/edit-product/${product._id}`)}
                                            >
                                                <Edit size={18} /> Edit
                                            </button>

                                            <button
                                                className="rp-discount-btn"
                                                onClick={() => navigate(`/admin/edit-product/${product._id}?tab=discount`)}
                                            >
                                                💸 Discount
                                            </button>

                                            <button
                                                className="rp-delete-btn"
                                                onClick={() => handleDelete(product._id)}
                                            >
                                                <Trash2 size={18} /> Delete
                                            </button>
                                        </div>

                                    </div>

                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RemoveProductPage;
