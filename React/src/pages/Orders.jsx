import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";

const STATUS_STEPS = ["PLACED", "CONFIRMED", "PREPARING", "READY", "COMPLETED"];

function getStepIndex(status) {
  const idx = STATUS_STEPS.indexOf(status);
  return idx !== -1 ? idx : 0;
}

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api("/orders/my");
      setOrders(data);
    } catch (err) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // Auto refresh every 15 seconds to track preparation
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="orders-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem", fontWeight: "800" }}>Live Order Tracker</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.92rem" }}>
            Track your meal preparation and pickup token status in real-time.
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="btn-demo"
          style={{ width: "auto", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <span>🔄</span> Refresh Status
        </button>
      </div>

      {error && <div className="alert-error">{error}</div>}

      {loading && orders.length === 0 && (
        <div style={{ textAlign: "center", padding: "50px 20px" }}>
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>⏳</div>
          <p style={{ color: "var(--text-muted)" }}>Fetching your orders...</p>
        </div>
      )}

      {!loading && orders.length === 0 && !error && (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2>No Orders Placed Yet</h2>
          <p>You haven't ordered any food today. Check out our menu!</p>
          <Link
            to="/"
            className="btn-add-food"
            style={{ textDecoration: "none", display: "inline-flex", margin: "0 auto" }}
          >
            Order Food Now
          </Link>
        </div>
      )}

      {orders.map((order) => {
        const stepIdx = getStepIndex(order.status);
        const isCancelled = order.status === "CANCELLED";

        return (
          <div className="order-card" key={order._id}>
            {/* Header */}
            <div className="order-card-header">
              <div className="order-id-block">
                <span className="order-token">
                  Token #{order.tokenNumber || String(order._id).slice(-4).toUpperCase()}
                </span>
                <span style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Order ID: {order._id}
                </span>
                <span className="order-date">
                  🕒 {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div>
                <span className={`status-badge status-${order.status}`}>
                  {order.status === "READY" ? "🔔 READY FOR PICKUP" : order.status}
                </span>
              </div>
            </div>

            {/* Visual Stepper (Only if not cancelled) */}
            {!isCancelled ? (
              <div className="order-tracker">
                {STATUS_STEPS.map((step, idx) => {
                  let stateClass = "";
                  if (idx < stepIdx) stateClass = "completed";
                  else if (idx === stepIdx) stateClass = "active";

                  return (
                    <div className={`tracker-step ${stateClass}`} key={step}>
                      <div className="step-circle">
                        {idx < stepIdx ? "✓" : idx + 1}
                      </div>
                      <span className="step-label">
                        {step === "PREPARING" ? "👨‍🍳 Cooking" : step === "READY" ? "🔔 Ready" : step}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: "10px", background: "var(--accent-red-light)", borderRadius: "8px", color: "var(--accent-red)", fontWeight: 700, margin: "16px 0", fontSize: "0.85rem" }}>
                ⚠️ This order was cancelled.
              </div>
            )}

            {/* Items List */}
            <div className="order-items-list">
              <h4 style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>
                Items in this order:
              </h4>
              {order.items.map((item, idx) => (
                <div className="order-item-line" key={item.food || idx}>
                  <span>
                    <b>{item.quantity}×</b> {item.name}
                  </span>
                  <span>₹{item.price * item.quantity}</span>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px" }}>
              <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Pickup: <b>Counter #1 Express</b>
              </span>
              <span style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--text-dark)" }}>
                Total Paid: <span style={{ color: "var(--primary)" }}>₹{order.totalAmount}</span>
              </span>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default Orders;