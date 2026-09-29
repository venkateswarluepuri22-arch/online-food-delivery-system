import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

function Cart() {
  const { cart, increase, decrease, removeFromCart, clearCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [counter, setCounter] = useState("Counter 1 (Main Hall)");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const tax = Math.round(total * 0.05); // 5% GST
  const grandTotal = total + tax;

  // Place order
  const placeOrder = async () => {
    if (!user) {
      alert("Please login to complete your canteen order!");
      navigate("/login");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const order = await api("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: cart.map((item) => ({
            food: item._id,
            quantity: item.quantity
          }))
        })
      });

      clearCart();
      alert(`🎉 Order placed successfully!\nYour Token Number: #${order.tokenNumber || "101"}\nPickup at: ${counter}`);
      navigate("/orders");
    } catch (err) {
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🛒</div>
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added any delicious food items yet!</p>
        <Link
          to="/"
          className="btn-add-food"
          style={{ textDecoration: "none", display: "inline-flex", margin: "0 auto" }}
        >
          Explore Delicious Menu
        </Link>
      </div>
    );
  }

  return (
    <section>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: "800" }}>Your Canteen Tray</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem" }}>
          Review your selected food items before confirming pickup.
        </p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="cart-layout">
        {/* Left: Cart Items List */}
        <div className="cart-items-container">
          <div className="cart-header">
            <h2>Order Items ({cart.length})</h2>
            <button className="btn-clear-cart" onClick={clearCart}>
              Clear Tray
            </button>
          </div>

          <div>
            {cart.map((item) => (
              <div className="cart-item-row" key={item._id}>
                <img
                  src={item.image || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&auto=format&fit=crop&q=80"}
                  alt={item.name}
                  className="cart-item-thumb"
                />

                <div className="cart-item-details">
                  <h4 className="cart-item-title">{item.name}</h4>
                  <div className="cart-item-unit-price">
                    ₹{item.price} each • {item.category}
                  </div>
                </div>

                {/* Stepper */}
                <div className="card-stepper">
                  <button onClick={() => decrease(item._id)}>−</button>
                  <span className="count">{item.quantity}</span>
                  <button onClick={() => increase(item._id)}>+</button>
                </div>

                <div className="cart-item-total">
                  ₹{item.price * item.quantity}
                </div>

                <button
                  onClick={() => removeFromCart(item._id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--text-light)",
                    cursor: "pointer",
                    fontSize: "1.1rem",
                    padding: "4px 8px"
                  }}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between" }}>
            <Link
              to="/"
              style={{
                textDecoration: "none",
                color: "var(--primary)",
                fontWeight: "700",
                fontSize: "0.9rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}
            >
              ← Add more food items
            </Link>
          </div>
        </div>

        {/* Right: Bill Summary */}
        <div className="cart-summary-card">
          <h3 className="summary-title">Bill Details</h3>

          <div className="summary-row">
            <span>Item Subtotal</span>
            <span>₹{total}</span>
          </div>

          <div className="summary-row">
            <span>Taxes & Canteen Cess (5%)</span>
            <span>₹{tax}</span>
          </div>

          <div className="summary-row">
            <span>Pickup & Packaging</span>
            <span style={{ color: "var(--secondary)", fontWeight: "700" }}>FREE</span>
          </div>

          <div className="summary-row total-row">
            <span>Total Payable</span>
            <span style={{ color: "var(--primary)" }}>₹{grandTotal}</span>
          </div>

          {/* Pickup Counter Selector */}
          <div style={{ marginTop: "18px" }}>
            <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--text-dark)", display: "block", marginBottom: "6px" }}>
              Select Pickup Counter:
            </label>
            <select
              value={counter}
              onChange={(e) => setCounter(e.target.value)}
              className="form-control"
              style={{ width: "100%", cursor: "pointer", fontWeight: "600" }}
            >
              <option value="Counter 1 (Main Hall)">Counter 1 (Main Hall - Express Pick)</option>
              <option value="Counter 2 (Juices & Snacks)">Counter 2 (Juices & Snacks Window)</option>
              <option value="Counter 3 (South Indian Corner)">Counter 3 (South Indian Corner)</option>
            </select>
          </div>

          <div className="pickup-notice">
            <span>⚡</span>
            <span>Average preparation time: <b>8–12 minutes</b>. Your token will be called on the counter screen!</span>
          </div>

          <button
            className="btn-place-order"
            onClick={placeOrder}
            disabled={submitting}
          >
            {submitting ? "Processing Order..." : `Confirm & Place Order (₹${grandTotal})`}
          </button>

          {!user && (
            <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "12px" }}>
              💡 Not logged in? You will be prompted to login/signup in 5 seconds.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default Cart;