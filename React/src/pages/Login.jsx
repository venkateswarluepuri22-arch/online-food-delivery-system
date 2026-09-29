import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (credentials) => {
    setLoading(true);
    setError("");

    try {
      const data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials)
      });

      login(data);

      if (data.user.role === "ADMIN") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    handleLogin(form);
  };

  // Quick Demo Auto-Logins
  const demoStudentLogin = () => {
    const creds = { email: "student@canteen.edu", password: "student123" };
    setForm(creds);
    handleLogin(creds);
  };

  const demoAdminLogin = () => {
    const creds = { email: "admin@canteen.edu", password: "admin123" };
    setForm(creds);
    handleLogin(creds);
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-header">
        <div style={{ fontSize: "40px", marginBottom: "8px" }}>🍲</div>
        <h1>Welcome Back</h1>
        <p>Login to place orders or manage the college canteen</p>
      </div>

      {/* 1-Click Demo Login Box */}
      <div className="demo-login-box">
        <div className="demo-login-title">⚡ Instant 1-Click Demo Testing</div>
        <div className="demo-btn-group">
          <button type="button" className="btn-demo" onClick={demoStudentLogin}>
            🎓 Demo Student
          </button>
          <button type="button" className="btn-demo" onClick={demoAdminLogin}>
            🔑 Demo Admin
          </button>
        </div>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="form-group" style={{ marginBottom: "14px" }}>
          <label>Campus Email</label>
          <input
            className="form-control"
            placeholder="student@canteen.edu"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: "20px" }}>
          <label>Password</label>
          <input
            className="form-control"
            placeholder="Enter your password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="btn-auth-submit" disabled={loading}>
          {loading ? "Logging in..." : "Login to Canteen"}
        </button>
      </form>

      <div className="auth-footer">
        Don't have an account? <Link to="/signup">Create Student Account</Link>
      </div>
    </div>
  );
}

export default Login;