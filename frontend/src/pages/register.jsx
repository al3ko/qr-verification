import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "";
const SCHOOL_DEGREES = {
  "School of Computing and Engineering Sciences (SCES)": [
    "Bachelor of Science in Informatics and Computer Science (BICS)",
    "Bachelor of Business Information Technology (BBIT)",
    "Bachelor of Science in Computer Networks and Cyber Security (BNCS)",
    "Bachelor of Science in Electrical and Electronics Engineering (BEEE)",
  ],
  "Strathmore Business School (SBS)": ["Bachelor of Commerce (BCOM)", "Bachelor of Financial Services (BFS)"],
  "Strathmore Law School (SLS)": ["Bachelor of Laws (LLB)", "Bachelor of Science in Supply Chain and Operations Management (BSc SC&OM)"],
  "School of Humanities and Social Sciences (SHSS)": [
    "Bachelor of Arts in Communication",
    "Bachelor of Arts in International Studies",
    "Bachelor of Arts in Development Studies and Philosophy",
  ],
  "Strathmore Institute of Mathematical Sciences (SIMS)": [
    "Bachelor of Business Science in Actuarial Science (BBS Actuarial Science)",
    "Bachelor of Business Science in Financial Economics (BBS FE)",
    "Bachelor of Business Science in Financial Engineering (BBS FinEng)",
    "Bachelor of Science in Statistics and Data Science (BSc SDS)",
  ],
};
const GENDERS = ["Female", "Male", "Other", "Prefer not to say"];

function emailName(value) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
}

function Register() {
  const [formData, setFormData] = useState({
    school_id: "", first_name: "", last_name: "", gender: "", phone_number: "",
    school: "", degree: "", year_of_study: "", group_name: "",
    password: "", confirm_password: "", photo_data: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const degrees = SCHOOL_DEGREES[formData.school] || [];
  const emailPreview = useMemo(() => {
    const first = emailName(formData.first_name);
    const last = emailName(formData.last_name);
    return first && last ? first + "." + last + "@strathmore.edu" : "";
  }, [formData.first_name, formData.last_name]);

  function update(name, value) {
    setFormData((current) => ({
      ...current,
      [name]: value,
      ...(name === "school" ? { degree: "" } : {}),
    }));
    setError("");
    setSuccess("");
  }

  function readPassportPhoto(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Unable to read the passport photo."));
      reader.onload = () => {
        const image = new Image();
        image.onerror = () => reject(new Error("Choose a valid image file."));
        image.onload = () => {
          const scale = Math.min(1, 900 / Math.max(image.width, image.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (!formData.photo_data) { setError("Upload a passport photo to continue."); setLoading(false); return; }
      await axios.post(API_URL + "/api/auth/register", {
        ...formData,
        school_id: Number(formData.school_id),
        year_of_study: Number(formData.year_of_study),
        phone_number: formData.phone_number || null,
      });
      setSuccess("Registration submitted. Your account is pending administrator approval. Sign in with your School ID to check its status.");
      setFormData((current) => ({ ...current, school_id: "", password: "", confirm_password: "" }));
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to submit registration. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-container">
      <div className="card" style={{ maxWidth: 760, margin: "30px auto" }}>
        <h1 className="page-title">Student Registration</h1>
        <p className="page-description">Register with your Strathmore School ID. Student accounts need administrator approval before QR credentials are available.</p>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
        {success && <div className="alert alert-success" role="status">{success}</div>}
        <form onSubmit={handleSubmit}>
          <h2>Personal Information</h2>
          <div className="form-group"><label className="form-label" htmlFor="first_name">First name</label>
            <input className="form-input" id="first_name" value={formData.first_name} onChange={(e) => update("first_name", e.target.value)} autoComplete="given-name" maxLength={75} required /></div>
          <div className="form-group"><label className="form-label" htmlFor="last_name">Last name</label>
            <input className="form-input" id="last_name" value={formData.last_name} onChange={(e) => update("last_name", e.target.value)} autoComplete="family-name" maxLength={75} required /></div>
          <div className="form-group"><label className="form-label" htmlFor="gender">Gender</label>
            <select className="form-select" id="gender" value={formData.gender} onChange={(e) => update("gender", e.target.value)} required>
              <option value="">Select gender</option>{GENDERS.map((value) => <option key={value} value={value}>{value}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label" htmlFor="phone_number">Phone number (optional)</label>
            <input className="form-input" id="phone_number" type="tel" value={formData.phone_number} onChange={(e) => update("phone_number", e.target.value)} autoComplete="tel" maxLength={30} /></div>

          <div className="form-group"><label className="form-label" htmlFor="passport_photo">Passport photo</label>
            <input className="form-input" id="passport_photo" type="file" accept="image/jpeg,image/png,image/webp" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!file.type.match(/^image\/(jpeg|png|webp)$/)) { setError("Use a JPEG, PNG, or WebP passport photo."); return; }
              if (file.size > 8 * 1024 * 1024) { setError("Photo must be 8 MB or smaller."); return; }
              try { update("photo_data", await readPassportPhoto(file)); } catch (err) { setError(err.message); }
            }} required />
            {formData.photo_data && <img src={formData.photo_data} alt="Passport photo preview" style={{ width: 120, height: 150, objectFit: "cover", borderRadius: 8 }} />}
            <small>JPEG, PNG, or WebP. A compressed copy is stored with your ID profile.</small></div>

          <h2>Academic Information</h2>
          <div className="form-group"><label className="form-label" htmlFor="school_id">School ID number</label>
            <input className="form-input" id="school_id" type="number" min="100000" max="500000" step="1" value={formData.school_id} onChange={(e) => update("school_id", e.target.value)} required />
            <small>Student IDs must be between 100,000 and 500,000.</small></div>
          <div className="form-group"><label className="form-label" htmlFor="school">School</label>
            <select className="form-select" id="school" value={formData.school} onChange={(e) => update("school", e.target.value)} required>
              <option value="">Select school</option>{Object.keys(SCHOOL_DEGREES).map((value) => <option key={value} value={value}>{value}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label" htmlFor="degree">Degree</label>
            <select className="form-select" id="degree" value={formData.degree} onChange={(e) => update("degree", e.target.value)} disabled={!formData.school} required>
              <option value="">Select degree</option>{degrees.map((value) => <option key={value} value={value}>{value}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label" htmlFor="year_of_study">Year of study</label>
            <select className="form-select" id="year_of_study" value={formData.year_of_study} onChange={(e) => update("year_of_study", e.target.value)} required>
              <option value="">Select year</option>{[1, 2, 3, 4, 5, 6].map((year) => <option key={year} value={year}>Year {year}</option>)}
            </select></div>
          <div className="form-group"><label className="form-label" htmlFor="group_name">Group</label>
            <input className="form-input" id="group_name" value={formData.group_name} onChange={(e) => update("group_name", e.target.value)} maxLength={80} required /></div>

          <h2>Account Information</h2>
          <div className="form-group"><label className="form-label" htmlFor="email_preview">Strathmore email address</label>
            <input className="form-input" id="email_preview" value={emailPreview} readOnly placeholder="firstname.lastname@strathmore.edu" />
            <small>Generated from your name. Sign in with your School ID.</small></div>
          <div className="form-group"><label className="form-label" htmlFor="password">Password</label>
            <input className="form-input" id="password" type="password" value={formData.password} onChange={(e) => update("password", e.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required /></div>
          <div className="form-group"><label className="form-label" htmlFor="confirm_password">Confirm password</label>
            <input className="form-input" id="confirm_password" type="password" value={formData.confirm_password} onChange={(e) => update("confirm_password", e.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required /></div>
          <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? "Submitting..." : "Submit Registration"}</button>
        </form>
        <p style={{ textAlign: "center", marginTop: 20 }}>Already registered? <Link to="/">Sign in</Link></p>
      </div>
    </main>
  );
}

export default Register;

