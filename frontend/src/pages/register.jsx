import { useState } from "react";
import { Link } from "react-router-dom";

function Register() {
  const [formData, setFormData] = useState({
    studentNumber: "",
    fullName: "",
    email: "",
    programme: "",
    yearOfStudy: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
    setSuccess("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setError("");
    setSuccess(
      "Registration form validated successfully. Backend registration will be connected later."
    );
  };

  return (
    <main className="page-container">
      <div
        className="card"
        style={{ maxWidth: "600px", margin: "30px auto" }}
      >
        <h1 className="page-title">Student Registration</h1>

        <p className="page-description">
          Create an account to access the Student Identity Verification System.
        </p>

        {error && (
          <div
            className="alert"
            role="alert"
            style={{ color: "#b91c1c", marginBottom: "16px" }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            className="alert"
            role="status"
            style={{ color: "#15803d", marginBottom: "16px" }}
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="studentNumber">
              Student Number
            </label>
            <input
              className="form-input"
              id="studentNumber"
              name="studentNumber"
              value={formData.studentNumber}
              onChange={handleChange}
              placeholder="e.g. ABC/1234/2026"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="fullName">
              Full Name
            </label>
            <input
              className="form-input"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              University Email
            </label>
            <input
              className="form-input"
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@university.ac.ke"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="programme">
              Programme of Study
            </label>
            <input
              className="form-input"
              id="programme"
              name="programme"
              value={formData.programme}
              onChange={handleChange}
              placeholder="e.g. Bachelor of Computer Science"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="yearOfStudy">
              Year of Study
            </label>
            <select
              className="form-select"
              id="yearOfStudy"
              name="yearOfStudy"
              value={formData.yearOfStudy}
              onChange={handleChange}
              required
            >
              <option value="">Select year of study</option>
              <option value="1">Year 1</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
              <option value="5">Year 5</option>
              <option value="6">Year 6</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              className="form-input"
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={8}
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              className="form-input"
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Re-enter your password"
              required
            />
          </div>

          <button className="btn btn-primary" type="submit" block>
            Create Account
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "20px" }}>
          Already have an account? <Link to="/">Log in</Link>
        </p>
      </div>
    </main>
  );
}

export default Register;