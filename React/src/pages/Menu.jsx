import { useEffect, useState, useMemo } from "react";
import { api } from "../api";
import { useCart } from "../context/CartContext";

const CATEGORIES = [
  { id: "All", label: "All Items", icon: "✨" },
  { id: "Breakfast", label: "Breakfast", icon: "🥞" },
  { id: "Lunch", label: "Lunch & Meals", icon: "🍛" },
  { id: "Snacks", label: "Snacks & Chaat", icon: "🥪" },
  { id: "Desserts", label: "Desserts", icon: "🍨" },
  { id: "Beverages", label: "Drinks & Shakes", icon: "🥤" }
];

function Menu() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState("featured");
  const [error, setError] = useState("");

  const { addToCart, increase, decrease, getItemQuantity } = useCart();

  // Load foods from API
  const loadFoods = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/foods");
      setFoods(data);
    } catch (err) {
      setError(err.message || "Failed to load foods");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFoods();
  }, []);

  // Filtered & Sorted food items
  const filteredFoods = useMemo(() => {
    let result = [...foods];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q)) ||
          f.category.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (selectedCategory !== "All") {
      result = result.filter(
        (f) => f.category.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Veg Only filter
    if (vegOnly) {
      result = result.filter((f) => f.isVeg === true);
    }

    // Sorting
    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === "rating") {
      result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return result;
  }, [foods, search, selectedCategory, vegOnly, sortBy]);

  return (
    <section>
      {/* Hero Welcome Banner */}
      <div className="hero-banner">
        <span className="hero-badge">🎓 College Canteen Portal</span>
        <h1 className="hero-title">
          Fast, Delicious & Fresh Food at <span>Campus Prices</span>
        </h1>
        <p className="hero-subtitle">
          Order from your phone or laptop, skip the long queues, and pick up hot fresh meals at Counter #1 in under 10 minutes!
        </p>

        <div className="hero-perks">
          <div className="perk-item">
            <span>⚡</span> 8–12 Min Express Prep
          </div>
          <div className="perk-item">
            <span>🍃</span> 100% Fresh Daily Ingredients
          </div>
          <div className="perk-item">
            <span>💳</span> UPI / Cash at Counter
          </div>
          <div className="perk-item">
            <span>⭐</span> 4.8 Student Satisfaction
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="filter-toolbar">
        <div className="search-row">
          <div className="search-box-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search dishes (Biryani, Dosa, Burger, Coffee...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="dietary-filters">
            <button
              type="button"
              className={`veg-toggle-btn ${vegOnly ? "active" : ""}`}
              onClick={() => setVegOnly(!vegOnly)}
            >
              <span className="veg-icon" style={{ borderColor: vegOnly ? "white" : "#10B981" }}></span>
              Pure Veg Only
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="form-control"
              style={{ width: "auto", cursor: "pointer", fontWeight: "600" }}
            >
              <option value="featured">Featured (Recommended)</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Top Rated ⭐</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="filter-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`category-pill ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert-error">
          <b>Could not fetch menu:</b> {error}.{" "}
          <button
            onClick={loadFoods}
            style={{ textDecoration: "underline", background: "none", border: "none", color: "inherit", cursor: "pointer", fontWeight: 700 }}
          >
            Click to Retry
          </button>
        </div>
      )}

      {/* Results Count */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: "800" }}>
          {selectedCategory === "All" ? "Full Menu" : `${selectedCategory}`}
          <span style={{ fontSize: "0.9rem", color: "var(--text-muted)", fontWeight: "500", marginLeft: "10px" }}>
            ({filteredFoods.length} items available)
          </span>
        </h2>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "40px", marginBottom: "12px", animation: "spin 1s infinite linear" }}>🍲</div>
          <p style={{ color: "var(--text-muted)", fontWeight: "600" }}>Loading fresh canteen specials...</p>
        </div>
      )}

      {/* Empty Search Result */}
      {!loading && filteredFoods.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🍽️</div>
          <h2>No matching dishes found</h2>
          <p>Try searching for something else or clear your category and veg filters.</p>
          <button
            className="btn-add-food"
            style={{ margin: "0 auto" }}
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
              setVegOnly(false);
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Food Cards Grid */}
      <div className="food-grid">
        {filteredFoods.map((food) => {
          const qty = getItemQuantity(food._id);

          return (
            <div className="food-card" key={food._id}>
              {/* Image Container */}
              <div className="food-img-container">
                <img
                  src={food.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80"}
                  alt={food.name}
                  className="food-img"
                  loading="lazy"
                />

                {/* Dietary badge */}
                <div className="veg-badge">
                  <span className={food.isVeg !== false ? "veg-icon" : "nonveg-icon"}></span>
                  <span>{food.isVeg !== false ? "VEG" : "NON-VEG"}</span>
                </div>

                {/* Special Tag or Best Seller */}
                {food.badge && (
                  <span className="special-badge">{food.badge}</span>
                )}

                {/* Rating Badge */}
                <div className="rating-badge">
                  <span>⭐</span>
                  <span>{food.rating || 4.7}</span>
                </div>
              </div>

              {/* Food Details */}
              <div className="food-details">
                <div className="food-meta">
                  <span className="food-category-tag">{food.category}</span>
                  <span className="food-prep-time">
                    <span>⏱️</span> {food.prepTime || "10 mins"}
                  </span>
                </div>

                <h3 className="food-name">{food.name}</h3>

                <p className="food-desc" title={food.description}>
                  {food.description || "Prepared fresh upon order with authentic campus recipe."}
                </p>

                {/* Footer with Price and Interactive Add / Stepper */}
                <div className="food-footer">
                  <div className="food-price">
                    <span>₹</span>{food.price}
                  </div>

                  <div>
                    {!food.available ? (
                      <button className="btn-add-food" disabled>
                        Sold Out
                      </button>
                    ) : qty === 0 ? (
                      <button
                        className="btn-add-food"
                        onClick={() => addToCart(food)}
                      >
                        <span>+</span> Add
                      </button>
                    ) : (
                      <div className="card-stepper">
                        <button onClick={() => decrease(food._id)} title="Decrease quantity">−</button>
                        <span className="count">{qty}</span>
                        <button onClick={() => increase(food._id)} title="Increase quantity">+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Menu;