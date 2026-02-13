import { useEffect, useState } from "react";
import API_BASE_URL from "../apiConfig";

export default function Categories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/categories`)
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(err => console.error("Failed to fetch categories", err));
  }, []);

  // Map database category names to icons
  const iconMap = {
    "Herbal Oils": "💧",
    "Handmade Soaps": "🧼",
    "Hair Cleansers": "✨",
    "Skin Care": "🍃",
    "Health Beverages": "🍵",
    "Pure Ghee": "🥣",
    "Lip Balms": "💄",
  };

  return (
    <div className="categories">
      {/* Static header – keep this */}
      <span>☰ All Categories</span>

      {/* Dynamic categories from database */}
      {categories.map((cat) => (
        <span key={cat._id}>
          {iconMap[cat.name] || "📦"} {cat.name}
        </span>
      ))}
    </div>
  );
}
