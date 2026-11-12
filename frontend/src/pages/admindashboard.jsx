import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import PortalLayout from "../components/portallayout";

const API_URL = import.meta.env.VITE_API_URL || "";
const SCHOOLS = [
  ["SCES", "School of Computing and Engineering Sciences"],
  ["SBS", "Strathmore Business School"],
  ["SLS", "Strathmore Law School"],
  ["SHSS", "School of Humanities and Social Sciences"],
  ["SIMS", "Strathmore Institute of Mathematical Sciences"],
];
const STAFF_ROLES = ["Security Staff", "Lecturer", "Cleaning Staff", "Cooking Staff", "Invigilator"];
const EMPTY_FORM = {
  role: "staff", school_id: "", first_name: "", last_name: "", gender: "",
  phone_number: "", email: "", password: "", work_role: "Security Staff", head_school: "",
};

function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPending = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setError("Sign in with an administrator account to review registrations.");
      return;
    }
    try {
      const response = await axios.get(API_URL + "/api/admin/students/pending", {
        headers: { Authorization: "Bearer " + token },
      });
      setStudents(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load pending registrations.");
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { loadPending(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPending]);

  function update(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === "role" ? { work_role: value === "staff" ? "Security Staff" : "", head_school: "" } : {}),
    }));
    setError("");
    setNotice("");
  }

  async function createAccount(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const token = localStorage.getItem("access_token");
      await axios.post(API_URL + "/api/admin/users", {
        ...form,
        school_id: Number(form.school_id),
        phone_number: form.phone_number || null,
        work_role: form.role === "staff" ? form.work_role : null,
        head_school: form.role === "admin" ? form.head_school : null,
      }, { headers: { Authorization: "Bearer " + token } });
      setNotice(form.role === "staff" ? "Staff account created." : "Administrator account created.");
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to create account. Check the School ID range and fields.");
    } finally {
      setLoading(false);
    }
  }

  async function reviewStudent(schoolId, action, reason) {
    const token = localStorage.getItem("access_token");
    try {
      const path = API_URL + "/api/admin/students/" + schoolId + "/" + action;
      await axios.post(path, action === "reject" ? { reason } : undefined, {
        headers: { Authorization: "Bearer " + token },
      });
      setNotice("Student registration " + (action === "approve" ? "approved." : "rejected."));
      await loadPending();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to update this registration.");
    }
  }

  return (
    <PortalLayout title="Admin Dashboard" role="admin">
      <div className="portal-card">
        <h2>Pending Student Registrations</h2>
        <p className="portal-muted">Review student details before enabling QR credentials.</p>
        {students.length === 0 ? <p>No pending registrations.</p> : (
          <div className="portal-table-wrap">
            <table className="portal-table">
              <thead><tr><th>School ID</th><th>Student</th><th>School and degree</th><th>Year / group</th><th>Actions</th></tr></thead>
              <tbody>{students.map((student) => (
                <tr key={student.school_id}>
                  <td>{student.school_id}</td>
                  <td>{student.full_name}<br /><small>{student.email}</small><br /><small>{student.phone_number || "No phone"} · {student.gender || "Not specified"}</small></td>
                  <td>{student.school || "Not provided"}<br /><small>{student.degree || "Not provided"}</small></td>
                  <td>{student.year_of_study || "—"} / {student.group_name || "—"}</td>
                  <td>
                    <button className="portal-button" type="button" onClick={() => reviewStudent(student.school_id, "approve")}>Approve</button>
                    <button className="portal-button portal-button-secondary" type="button" onClick={() => {
                      const reason = window.prompt("Reason for rejection:");
                      if (reason?.trim()) reviewStudent(student.school_id, "reject", reason.trim());
                    }}>Reject</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      {error && <div className="portal-notice" role="alert">{error}</div>}
      {notice && <div className="portal-notice" role="status">{notice}</div>}

      <div className="portal-card" style={{ marginTop: 24 }}>
        <h2>Create Staff or Admin Account</h2>
        <p className="portal-muted">Only administrators can create staff and admin accounts. Accounts sign in with School ID and password.</p>
        <form className="portal-form" onSubmit={createAccount}>
          <label>Account type<select value={form.role} onChange={(e) => update("role", e.target.value)}>
            <option value="staff">Staff</option><option value="admin">Admin</option>
          </select></label>
          <label>School ID number
            <input type="number" min={form.role === "admin" ? 100 : form.work_role === "Lecturer" ? 50000 : 1001}
              max={form.role === "admin" ? 1000 : form.work_role === "Lecturer" ? 99999 : 49999}
              value={form.school_id} onChange={(e) => update("school_id", e.target.value)} required />
            <small>{form.role === "admin" ? "100–1,000" : form.work_role === "Lecturer" ? "Lecturers: 50,000–99,999" : "Other staff: 1,001–49,999"}</small>
          </label>
          <label>First name<input value={form.first_name} onChange={(e) => update("first_name", e.target.value)} maxLength={75} required /></label>
          <label>Last name<input value={form.last_name} onChange={(e) => update("last_name", e.target.value)} maxLength={75} required /></label>
          <label>Gender<select value={form.gender} onChange={(e) => update("gender", e.target.value)} required>
            <option value="">Select gender</option>{["Female", "Male", "Other", "Prefer not to say"].map((v) => <option key={v} value={v}>{v}</option>)}
          </select></label>
          <label>Phone number (optional)<input type="tel" value={form.phone_number} onChange={(e) => update("phone_number", e.target.value)} maxLength={30} /></label>
          <label>Email address<input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required /></label>
          <label>Initial password<input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} minLength={8} maxLength={128} required /></label>
          {form.role === "staff" ? (
            <label>Staff role<select value={form.work_role} onChange={(e) => update("work_role", e.target.value)} required>
              {STAFF_ROLES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select></label>
          ) : (
            <label>School headed<select value={form.head_school} onChange={(e) => update("head_school", e.target.value)} required>
              <option value="">Select school</option>{SCHOOLS.map(([code, label]) => <option key={code} value={code}>Head of {label} ({code})</option>)}
            </select></label>
          )}
          <button className="portal-button" type="submit" disabled={loading}>{loading ? "Creating..." : "Create account"}</button>
        </form>
      </div>
    </PortalLayout>
  );
}

export default AdminDashboard;
