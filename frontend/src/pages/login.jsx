import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { PwaInstallButton } from "../components/pwainstall";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function Login() {
  const [schoolId, setSchoolId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post(API_URL + "/api/auth/login", {
        school_id: Number(schoolId),
        password,
      });
      const { access_token, user } = response.data;
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("user", JSON.stringify(user));
      if (user.role === "student") navigate("/student");
      else if (user.role === "staff") navigate(user.work_role === "Security Staff" ? "/staff-scanner" : "/staff");
      else if (user.role === "admin") navigate("/admin");
      else setError("Your account has an unrecognized role.");
    } catch (err) {
      if (err.response?.status === 401) setError("Incorrect School ID or password.");
      else if (err.response?.status === 403) setError("Your account is inactive.");
      else setError("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-container" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <section className="card" style={{ width: "100%", maxWidth: 420 }}>
        <h1 style={{ textAlign: "center" }}>QR Verification</h1>
        <p className="page-description" style={{ textAlign: "center" }}>Student Identity Verification System</p>
        {error && <p role="alert" className="alert alert-danger">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="school_id">School ID number</label>
            <input className="form-input" id="school_id" type="number" min="100" max="500000" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} autoComplete="username" required />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input className="form-input" id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="login-install"><PwaInstallButton /></div>
        <p style={{ textAlign: "center", marginTop: 22, marginBottom: 0 }}>New student? <Link to="/register">Register</Link></p>
      </section>
    </main>
  );
}

