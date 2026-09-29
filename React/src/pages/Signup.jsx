import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";

function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await api("/auth/signup", {
        method: "POST",
        body: JSON.stringify(form)
      });

      login(data);
      alert(`Welcome to CampusBite, ${data.user.name}!`);
      navigate("/");
    } catch (err) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-header">
        <div style={{ fontSize: "40px", marginBottom: "8px" }}>🎓</div>
        <h1>Create Account</h1>
        <p>Join CampusBite to order food directly from your phone</p>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <form onSubmit={submit}>
        <div className="form-group" style={{ marginBottom: "14px" }}>
          <label>Full Name / Roll Number</label>
          <input
            className="form-control"
            placeholder="e.g. Rahul Sharma"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: "14px" }}>
          <label>Email Address</label>
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
          <label>Password (min 4 characters)</label>
          <input
            className="form-control"
            placeholder="Create password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        <button type="submit" className="btn-auth-submit" disabled={loading}>
          {loading ? "Creating Account..." : "Register & Start Ordering"}
        </button>
      </form>

      <div className="auth-footer">
        Already have an account? <Link to="/login">Login here</Link>
      </div>
    </div>
  );
}

export default Signup;