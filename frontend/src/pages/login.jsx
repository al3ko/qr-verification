
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });

      const { access_token, user } = response.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));

      if (user.role === "student") {
        navigate("/student-dashboard");
      } else if (user.role === "staff") {
        navigate("/staff-scanner");
      } else if (user.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        setError("Your account has an unrecognized role.");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Invalid email or password.");
      } else if (err.response?.status === 403) {
        setError("Your account is inactive or access is denied.");
      } else {
        setError(
          "Unable to connect to the server. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="page-container"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <section className="card" style={{ width: "100%", maxWidth: "420px" }}>
        <div
          style={{
            width: "54px",
            height: "54px",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 20px",
            background: "var(--primary)",
            color: "#fff",
            borderRadius: "var(--radius-lg)",
            fontWeight: "bold",
            fontSize: "20px",
          }}
        >
          QR
        </div>

        <h1 style={{ textAlign: "center", marginBottom: "8px" }}>
          QR Verification
        </h1>

        <p className="page-description" style={{ textAlign: "center" }}>
          Student Identity Verification System
        </p>

        {error && (
          <p role="alert" style={{ color: "#dc2626", marginBottom: "16px" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email address
            </label>
            <input
              className="form-input"
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              className="form-input"
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "22px", marginBottom: "0" }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </section>
    </main>
  );
}
