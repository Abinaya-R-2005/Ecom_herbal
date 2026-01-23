import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useToast } from "../context/ToastContext";
import "./EditProductPage.css";

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [image, setImage] = useState(null);
  const { showToast } = useToast();

  const location = useLocation();
  const isDiscountTab = new URLSearchParams(location.search).get("tab") === "discount";

  const token = localStorage.getItem("token");

  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    description: "",
    discountAmount: 0,
    discountStart: "",
    discountEnd: "",
  });
  useEffect(() => {
    fetch("http://localhost:5000/categories")
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Failed to fetch categories", err));
  }, []);

  useEffect(() => {
    fetch(`http://localhost:5000/products/${id}?showAll=true`)
      .then(res => res.json())
      .then(data => {
        setForm({
          ...data,
          discountStart: data.discountStart ? data.discountStart.slice(0, 16) : "",
          discountEnd: data.discountEnd ? data.discountEnd.slice(0, 16) : "",
        });
      });
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    if (isDiscountTab) {
      formData.append("discountAmount", form.discountAmount);
      formData.append("discountStart", form.discountStart);
      formData.append("discountEnd", form.discountEnd);
    } else {
      formData.append("name", form.name);
      formData.append("category", form.category);
      formData.append("price", form.price);
      formData.append("description", form.description);
      if (image) {
        formData.append("image", image);
      }
    }

    const res = await fetch(`http://localhost:5000/admin/product/${id}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        // Content-Type not needed for FormData, browser sets it with boundary
      },
      body: formData,
    });

    if (res.ok) {
      showToast(isDiscountTab ? "Discount updated successfully" : "Product updated successfully", "success");
      navigate("/admin/remove-product");
    } else {
      const data = await res.json();
      showToast(data.message || "Failed to update product", "error");
    }
  };
  const discountedPrice =
    form.discountAmount === ""
      ? ""
      : form.price - Number(form.discountAmount || 0);

  return (
    <div className="edit-container">
      <h1 className="heading">{isDiscountTab ? "Manage Discount" : "Edit Product"}</h1>
      <button className="back-btn" onClick={() => navigate(-1)}> ← Back </button>



      <form className="edit-form" onSubmit={handleSubmit}>
        {!isDiscountTab && (
          <>
            <label>Product Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
            />

            <label>Category</label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
            >
              <option value="">Select Category</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            <label>Price</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              required
            />

            <label>Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
            />

            <label>Update Product Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
            />
          </>
        )}

        {isDiscountTab && (
          <>
            {/* Original Price */}
            <label>Original Price</label>
            <input
              type="number"
              value={form.price}
              disabled
            />

            {/* Discount Amount (Read Only) */}
            <label>Discount Amount (₹)</label>
            <input
              type="number"
              name="discountAmount"
              value={form.discountAmount}
              disabled
              className="read-only-input"
            />

            {/* Final Price (Editable) */}
            <label>Final Price After Discount (Enter this)</label>
            <input
              type="number"
              value={discountedPrice}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setForm({ ...form, discountAmount: "" });
                  return;
                }
                const finalPrice = parseFloat(val);
                const originalPrice = parseFloat(form.price);
                if (!isNaN(finalPrice) && !isNaN(originalPrice)) {
                  setForm({ ...form, discountAmount: (originalPrice - finalPrice) });
                }
              }}
              placeholder="Enter the final price you want"
            />

            {/* Discount Start */}
            <label>Discount Start</label>
            <input
              type="datetime-local"
              name="discountStart"
              value={form.discountStart}
              onChange={handleChange}
            />

            {/* Discount End */}
            <label>Discount End</label>
            <input
              type="datetime-local"
              name="discountEnd"
              value={form.discountEnd}
              onChange={handleChange}
            />
          </>
        )}


        <button type="submit" className="save-btn">Save</button>
      </form>
    </div>
  );
};

export default EditProductPage;
