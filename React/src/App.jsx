import { Link, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useCart } from "./context/CartContext";

import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Admin from "./pages/Admin";

function App() {
  const { user, logout } = useAuth();
  const { totalItemsCount, total } = useCart();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Sticky Modern Navbar */}
      <nav className="navbar">
        <Link to="/" className="brand-wrapper">
          <div className="brand-icon">🍲</div>
          <div className="brand-info">
            <span className="brand-title">
              Campus<span>Bite</span>
            </span>
            <span className="brand-status">
              <span className="status-dot"></span>
              Kitchen Open & Ready
            </span>
          </div>
        </Link>

        <div className="nav-links">
          <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
            <span>🍽️</span> Menu
          </Link>

          {user && (
            <Link to="/orders" className={`nav-link ${isActive("/orders") ? "active" : ""}`}>
              <span>📋</span> My Orders
            </Link>
          )}

          {user?.role === "ADMIN" && (
            <Link to="/admin" className={`nav-link ${isActive("/admin") ? "active" : ""}`}>
              <span>⚙️</span> Admin Portal
            </Link>
          )}

          <Link to="/cart" className="nav-cart-btn">
            <span>🛒</span> Cart
            {totalItemsCount > 0 && (
              <span className="cart-badge">{totalItemsCount}</span>
            )}
          </Link>

          {!user ? (
            <>
              <Link to="/login" className={`nav-link ${isActive("/login") ? "active" : ""}`}>
                Login
              </Link>
              <Link to="/signup" className={`nav-link ${isActive("/signup") ? "active" : ""}`}>
                Signup
              </Link>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div className="user-badge">
                <span>👤</span>
                <span>{user.name.split(" ")[0]}</span>
                {user.role === "ADMIN" && <span className="user-role-tag">Admin</span>}
              </div>
              <button onClick={logout} className="btn-logout">
                Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Pages Container */}
      <main className="container">
        <Routes>
          <Route path="/" element={<Menu />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>

      {/* Bottom Footer */}
      <footer style={{
        marginTop: "auto",
        borderTop: "1px solid var(--border)",
        background: "white",
        padding: "24px 5%",
        textAlign: "center",
        fontSize: "0.85rem",
        color: "var(--text-muted)"
      }}>
        <div style={{ maxWidth: "1240px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <b>CampusBite Canteen Portal</b> • Express Food Pickup Counter #1 & #2
          </div>
          <div>
            ⏰ Canteen Hours: <b>8:00 AM – 9:30 PM</b> • Fast 10-Min Counter Pickup
          </div>
        </div>
      </footer>
    </>
  );
}

export default App;