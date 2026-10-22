
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    alert("Login interface ready. Backend authentication will be connected later.");
  }

  return (
    <main className="page-container" style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <section className="card" style={{ width: "100%", maxWidth: "420px" }}>
        <div style={{
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
        }}>
          QR
        </div>

        <h1 style={{ textAlign: "center", marginBottom: "8px" }}>
          QR Verification
        </h1>
        <p className="page-description" style={{ textAlign: "center" }}>
          Student Identity Verification System
        </p>

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

          <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
            Sign In
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "22px", marginBottom: "0" }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </section>
    </main>
  );
}
