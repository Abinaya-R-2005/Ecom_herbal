import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import API_BASE_URL from '../apiConfig';
import "./AddProduct.css";

const AddProduct = () => {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
  });
  const [image, setImage] = useState(null);


  const adminEmail = "admin@gmail.com";
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories`)
      .then((res) => res.json())
      .then((data) => setCategories(data));
  }, []);

  const handleAddProduct = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    Object.keys(form).forEach((key) => formData.append(key, form[key]));
    formData.append("email", adminEmail); // Keep this as it's not part of `form` state
    formData.append("image", image); // Keep this as it's not part of `form` state

    const token = localStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/admin/product`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formData
    });

    if (res.ok) {
      showToast("Product added successfully and is now live!", "success");
      navigate(-1);
    } else {
      const data = await res.json();
      showToast(data.message || "Failed to add product", "error");
    }
  };

  return (
    <div className="add-product-page">

      {/* Back Button */}
      <button className="back-btn" onClick={() => navigate(-1)}>
        ← Back
      </button>

      <h2>Add Product</h2>

      <div className="product-form">

        <input
          placeholder="Product name"
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <select
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="">Select category</option>
          {categories.map((c) => (
            <option key={c._id} value={c.name}>{c.name}</option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Price"
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />

        {/* Image Upload */}
        <label className="upload-label">Upload Product Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImage(e.target.files[0])}
        />

        <textarea
          placeholder="Description"
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
        />

        <button onClick={handleSubmit}>Add Product</button>
      </div>
    </div>
  );
};

export default AddProduct;
