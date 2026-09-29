import { useEffect, useState } from "react";
import { api } from "../api";

const initialForm = {
  name: "",
  category: "Breakfast",
  price: "",
  description: "",
  image: "",
  available: true,
  isVeg: true,
  rating: 4.8,
  prepTime: "10 mins",
  badge: "",
  spicyLevel: 1
};

function Admin() {
  const [foods, setFoods] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("orders");
  const [orderFilter, setOrderFilter] = useState("ALL");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    try {
      const [foodData, orderData] = await Promise.all([
        api("/foods"),
        api("/orders")
      ]);
      setFoods(foodData);
      setOrders(orderData);
    } catch (err) {
      setError(err.message || "Failed to load admin data");
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  // Compute metrics
  const totalSales = orders
    .filter((o) => o.status !== "CANCELLED")
    .reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const activeOrdersCount = orders.filter((o) =>
    ["PLACED", "CONFIRMED", "PREPARING"].includes(o.status)
  ).length;

  // Add or update food
  const submitFood = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        rating: Number(form.rating) || 4.5,
        spicyLevel: Number(form.spicyLevel) || 0
      };

      if (editingId) {
        await api(`/foods/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        setSuccess(`Updated "${form.name}" successfully!`);
      } else {
        await api("/foods", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        setSuccess(`Added "${form.name}" to the canteen menu!`);
      }

      setForm(initialForm);
      setEditingId(null);
      loadData();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to save food item");
    }
  };

  // Edit food
  const startEdit = (food) => {
    setEditingId(food._id);
    setForm({
      name: food.name,
      category: food.category,
      price: food.price,
      description: food.description || "",
      image: food.image || "",
      available: food.available !== false,
      isVeg: food.isVeg !== false,
      rating: food.rating || 4.7,
      prepTime: food.prepTime || "10 mins",
      badge: food.badge || "",
      spicyLevel: food.spicyLevel || 1
    });
    setActiveTab("menu");
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  // Delete food
  const deleteFood = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the menu?`)) {
      return;
    }
    try {
      await api(`/foods/${id}`, { method: "DELETE" });
      loadData();
      setSuccess(`Removed "${name}" from the menu.`);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Toggle availability
  const toggleAvailable = async (food) => {
    try {
      await api(`/foods/${food._id}`, {
        method: "PUT",
        body: JSON.stringify({ available: !food.available })
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Change order status
  const changeOrderStatus = async (id, status) => {
    try {
      await api(`/orders/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "ALL") return true;
    if (orderFilter === "ACTIVE") return ["PLACED", "CONFIRMED", "PREPARING"].includes(o.status);
    return o.status === orderFilter;
  });

  return (
    <section>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "1.9rem", fontWeight: "800" }}>Canteen Management Portal</h1>
        <p style={{ color: "var(--text-muted)" }}>
          Control live order queues, kitchen preparation, and menu item listings.
        </p>
      </div>

      {error && <div className="alert-error">{error}</div>}
      {success && (
        <div style={{ background: "var(--secondary-light)", borderLeft: "4px solid var(--secondary)", color: "#065F46", padding: "12px 14px", borderRadius: "4px", fontWeight: "700", marginBottom: "20px" }}>
          ✓ {success}
        </div>
      )}

      {/* Metrics Row */}
      <div className="admin-metrics">
        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#FEF3C7", color: "#D97706" }}>💰</div>
          <div className="metric-info">
            <h4>Total Revenue</h4>
            <p>₹{totalSales}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#E0E7FF", color: "#4F46E5" }}>📦</div>
          <div className="metric-info">
            <h4>Total Orders</h4>
            <p>{orders.length}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#FFEDD5", color: "#EA580C" }}>👨‍🍳</div>
          <div className="metric-info">
            <h4>Active In Kitchen</h4>
            <p>{activeOrdersCount}</p>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{ background: "#D1FAE5", color: "#059669" }}>🍽️</div>
          <div className="metric-info">
            <h4>Menu Items</h4>
            <p>{foods.length}</p>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          📋 Live Order Queue ({orders.length})
        </button>
        <button
          className={`admin-tab ${activeTab === "menu" ? "active" : ""}`}
          onClick={() => setActiveTab("menu")}
        >
          🍲 Menu Management ({foods.length})
        </button>
      </div>

      {/* TAB 1: ORDER MANAGEMENT */}
      {activeTab === "orders" && (
        <div>
          {/* Order Filter Pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "18px" }}>
            {["ALL", "ACTIVE", "PLACED", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"].map((f) => (
              <button
                key={f}
                className={`category-pill ${orderFilter === f ? "active" : ""}`}
                onClick={() => setOrderFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h2>No orders in this queue</h2>
              <p>There are no orders matching the selected status filter.</p>
            </div>
          )}

          <div style={{ display: "grid", gap: "16px" }}>
            {filteredOrders.map((order) => (
              <div className="order-card" key={order._id} style={{ marginBottom: 0 }}>
                <div className="order-card-header">
                  <div>
                    <span className="order-token">
                      Token #{order.tokenNumber || String(order._id).slice(-4).toUpperCase()}
                    </span>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: "700", marginTop: "4px" }}>
                      Student: {order.user?.name || "Customer"} ({order.user?.email || "N/A"})
                    </h3>
                    <span className="order-date">
                      Placed: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Total: <b>₹{order.totalAmount}</b>
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status}
                    </span>

                    <select
                      value={order.status}
                      onChange={(e) => changeOrderStatus(order._id, e.target.value)}
                      className="form-control"
                      style={{ width: "auto", fontWeight: "700", cursor: "pointer" }}
                    >
                      <option value="PLACED">PLACED</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PREPARING">PREPARING (Cooking)</option>
                      <option value="READY">READY FOR PICKUP</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>

                <div className="order-items-list">
                  {order.items.map((item, idx) => (
                    <div className="order-item-line" key={item.food || idx}>
                      <span>
                        <b>{item.quantity}×</b> {item.name}
                      </span>
                      <span>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: MENU MANAGEMENT */}
      {activeTab === "menu" && (
        <div>
          {/* Add / Edit Form */}
          <div className="admin-form-card">
            <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "16px" }}>
              {editingId ? `Edit Food Item: ${form.name}` : "Add New Food Item to Menu"}
            </h2>

            <form onSubmit={submitFood}>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Paneer Butter Masala"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    className="form-control"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    required
                  >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch & Meals</option>
                    <option value="Snacks">Snacks & Chaat</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Drinks & Shakes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    placeholder="e.g. 80"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Dietary Type</label>
                  <select
                    className="form-control"
                    value={form.isVeg ? "true" : "false"}
                    onChange={(e) => setForm({ ...form, isVeg: e.target.value === "true" })}
                  >
                    <option value="true">🟢 Vegetarian</option>
                    <option value="false">🔴 Non-Vegetarian</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Preparation Time</label>
                  <input
                    className="form-control"
                    placeholder="e.g. 10 mins"
                    value={form.prepTime}
                    onChange={(e) => setForm({ ...form, prepTime: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Badge / Highlight</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Best Seller, Chef's Special"
                    value={form.badge}
                    onChange={(e) => setForm({ ...form, badge: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Image URL (Unsplash or Direct Photo URL)</label>
                <input
                  className="form-control"
                  placeholder="https://images.unsplash.com/..."
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: "16px" }}>
                <label>Description</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Appetizing description of ingredients, flavor, and serving..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "18px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={form.available}
                    onChange={(e) => setForm({ ...form, available: e.target.checked })}
                  />
                  Mark Available for Order (In Stock)
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" className="btn-add-food" style={{ padding: "10px 24px" }}>
                  {editingId ? "Save Changes" : "+ Add Item to Menu"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="btn-demo"
                    onClick={() => {
                      setEditingId(null);
                      setForm(initialForm);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Food Items List */}
          <h2 style={{ fontSize: "1.3rem", fontWeight: "800", marginBottom: "16px" }}>
            Current Menu Items ({foods.length})
          </h2>

          <div style={{ display: "grid", gap: "12px" }}>
            {foods.map((food) => (
              <div
                key={food._id}
                style={{
                  background: "white",
                  padding: "16px 20px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "16px",
                  flexWrap: "wrap"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <img
                    src={food.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80"}
                    alt={food.name}
                    style={{ width: "55px", height: "55px", borderRadius: "8px", objectFit: "cover" }}
                  />
                  <div>
                    <h4 style={{ fontSize: "1rem", fontWeight: "700" }}>{food.name}</h4>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                      ₹{food.price} • {food.category} • {food.isVeg !== false ? "🟢 Veg" : "🔴 Non-Veg"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    onClick={() => toggleAvailable(food)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "var(--radius-sm)",
                      border: "none",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      background: food.available ? "var(--secondary-light)" : "var(--accent-red-light)",
                      color: food.available ? "var(--secondary)" : "var(--accent-red)"
                    }}
                  >
                    {food.available ? "✓ In Stock" : "✕ Sold Out"}
                  </button>

                  <button className="btn-demo" onClick={() => startEdit(food)}>
                    Edit
                  </button>

                  <button
                    className="btn-demo"
                    style={{ color: "var(--accent-red)" }}
                    onClick={() => deleteFood(food._id, food.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default Admin;