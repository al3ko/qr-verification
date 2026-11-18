import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import PortalLayout from "../components/portallayout";
import Icon from "../components/icon";

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
const TABS = [
  ["overview", "Overview"], ["buildings", "By building"],
  ["students", "By students"], ["staff", "By staff"],
];
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });
const number = (value) => new Intl.NumberFormat().format(value || 0);
const dateTime = (value) => value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "—";

function Metric({ label, value, note, icon, tone }) {
  return <article className="admin-metric">
    <div className={`admin-metric-icon ${tone}`}><Icon name={icon} /></div>
    <p>{label}</p><strong>{value}</strong><small>{note}</small>
  </article>;
}

function Outcome({ value }) {
  const success = value === "verified";
  return <span className={`admin-outcome ${success ? "is-success" : "is-other"}`}>
    <span />{success ? "Verified" : (value || "Unknown").replaceAll("_", " ")}
  </span>;
}

function AccessTable({ rows, type, role }) {
  if (type === "building") return <div className="portal-table-wrap admin-table-wrap"><table className="portal-table admin-table">
    <thead><tr><th>Building</th><th>Campus phase</th><th>Access scans</th><th>Successful entries</th><th>People</th></tr></thead>
    <tbody>{rows.length ? rows.map((row) => <tr key={`${row.phase}-${row.building}`}>
      <td><strong>{row.building}</strong></td><td>{row.phase || "—"}</td><td>{number(row.scans)}</td>
      <td>{number(row.verified)}</td><td>{number(row.people)}</td>
    </tr>) : <tr><td colSpan="5" className="admin-empty-cell">No building activity in this period.</td></tr>}</tbody>
  </table></div>;

  if (type === "person") return <div className="portal-table-wrap admin-table-wrap"><table className="portal-table admin-table">
    <thead><tr><th>{role === "staff" ? "Staff member" : "Student"}</th><th>School ID</th><th>{role === "staff" ? "Role" : "School"}</th><th>Visits</th><th>Successful</th><th>Last access</th></tr></thead>
    <tbody>{rows.length ? rows.map((row) => <tr key={row.school_id}>
      <td><strong>{row.name}</strong>{row.registration_number && <small className="admin-subline">{row.registration_number}</small>}</td>
      <td>{row.school_id}</td><td>{row.role === "staff" ? (row.work_role || "Staff") : (row.school || "—")}</td>
      <td><span className="admin-frequency">{number(row.scans)} <small>scans</small></span></td>
      <td>{number(row.verified)}</td><td>{dateTime(row.last_seen)}</td>
    </tr>) : <tr><td colSpan="6" className="admin-empty-cell">No access records in this period.</td></tr>}</tbody>
  </table></div>;

  return <div className="portal-table-wrap admin-table-wrap"><table className="portal-table admin-table">
    <thead><tr><th>User</th><th>School ID</th><th>Category</th><th>Building</th><th>Date and time</th><th>Result</th></tr></thead>
    <tbody>{rows.length ? rows.map((row) => <tr key={row.id}>
      <td><strong>{row.name}</strong></td><td>{row.school_id || "—"}</td>
      <td><span className="admin-role-chip">{row.role === "student" ? "Student" : row.role === "staff" ? (row.work_role || "Staff") : "Unknown"}</span></td>
      <td>{row.building || "—"}<small className="admin-subline">{row.phase || ""}</small></td>
      <td>{dateTime(row.scanned_at)}</td><td><Outcome value={row.outcome} /></td>
    </tr>) : <tr><td colSpan="6" className="admin-empty-cell">No access records found.</td></tr>}</tbody>
  </table></div>;
}

function AdminDashboard({ page = "dashboard" }) {
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [tab, setTab] = useState("overview");
  const [days, setDays] = useState("30");
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);

  const loadAnalytics = useCallback(async () => {
    if (!localStorage.getItem("access_token")) {
      setError("Sign in with an administrator account to view access analytics.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/admin/access-analytics`, { params: { days }, headers: auth() });
      setAnalytics(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load access analytics.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  const loadPending = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/students/pending`, { headers: auth() });
      setStudents(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load pending registrations.");
    }
  }, []);

  useEffect(() => { loadAnalytics(); loadPending(); }, [loadAnalytics, loadPending]);
  useEffect(() => {
    if (page !== "anomalies") return;
    axios.get(`${API_URL}/api/admin/anomaly-alerts`, { headers: auth() })
      .then((response) => setAlerts(response.data))
      .catch((err) => setError(err.response?.data?.detail || "Unable to load anomaly alerts."));
  }, [page]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = tab === "buildings" ? (analytics?.buildings || []) : tab === "students" ? (analytics?.students || []) : tab === "staff" ? (analytics?.staff || []) : (analytics?.recent || []);
    if (!q) return rows;
    return rows.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(q)));
  }, [analytics, search, tab]);

  function update(name, value) {
    setForm((current) => ({
      ...current, [name]: value,
      ...(name === "role" ? { work_role: value === "staff" ? "Security Staff" : "", head_school: "" } : {}),
    }));
    setError(""); setNotice("");
  }

  async function createAccount(event) {
    event.preventDefault(); setAccountLoading(true); setError(""); setNotice("");
    try {
      await axios.post(`${API_URL}/api/admin/users`, {
        ...form, school_id: Number(form.school_id), phone_number: form.phone_number || null,
        work_role: form.role === "staff" ? form.work_role : null,
        head_school: form.role === "admin" ? form.head_school : null,
      }, { headers: auth() });
      setNotice(form.role === "staff" ? "Staff account created." : "Administrator account created.");
      setForm(EMPTY_FORM);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to create account. Check the School ID range and fields.");
    } finally { setAccountLoading(false); }
  }

  async function reviewStudent(schoolId, action, reason) {
    try {
      await axios.post(`${API_URL}/api/admin/students/${schoolId}/${action}`, action === "reject" ? { reason } : undefined, { headers: auth() });
      setNotice(`Student registration ${action === "approve" ? "approved" : "rejected"}.`);
      await loadPending();
    } catch (err) { setError(err.response?.data?.detail || "Unable to update this registration."); }
  }

  const summary = analytics?.summary || {};
  const maxBuildingScans = Math.max(1, ...(analytics?.buildings || []).map((row) => row.scans));
  const panelTitle = { overview: "Recent access activity", buildings: "Access by building", students: "Student access records", staff: "Staff access records" }[tab];
  const isDashboard = page === "dashboard";
  const pageTitle = page === "anomalies" ? "Anomaly Alerts" : page === "accounts" ? "Accounts" : "Admin Dashboard";

  return <PortalLayout title={pageTitle} role="admin">
    <div className="admin-welcome">
      <div><p className="admin-kicker">ACCESS CONTROL · STRATHMORE UNIVERSITY</p><h2>{page === "anomalies" ? "Anomaly alerts" : page === "accounts" ? "Account management" : "Access overview"}</h2><p>{page === "anomalies" ? "Review unusual access activity." : page === "accounts" ? "Review registrations and manage staff accounts." : "See who is entering campus and where activity is happening."}</p></div>
      {isDashboard && <div className="admin-toolbar">
        <label className="admin-period"><span>Reporting period</span><select value={days} onChange={(event) => setDays(event.target.value)}>
          <option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option>
        </select></label>
        <button type="button" className="portal-button portal-button-secondary admin-refresh" onClick={loadAnalytics} disabled={loading}><Icon name="history" />{loading ? "Updating" : "Refresh"}</button>
      </div>}
    </div>

    {isDashboard && <nav className="admin-tabs" aria-label="Admin dashboard sections">
      {TABS.map(([key, label]) => <button key={key} type="button" className={`admin-tab ${tab === key ? "active" : ""}`} onClick={() => { setTab(key); setSearch(""); }}>
        {label}
      </button>)}
    </nav>}

    {error && <div className="portal-notice admin-message" role="alert">{error}</div>}
    {notice && <div className="portal-notice admin-message success" role="status">{notice}</div>}

    {isDashboard && tab === "overview" && <>
      <div className="admin-metrics">
        <Metric label="Verified entries" value={number(summary.verified_entries)} note={`of ${number(summary.total_scans)} total scans`} icon="check" tone="blue" />
        <Metric label="Students accessed" value={number(summary.unique_students)} note="unique students in period" icon="profile" tone="violet" />
        <Metric label="Staff accessed" value={number(summary.unique_staff)} note="unique staff in period" icon="home" tone="teal" />
        <Metric label="Visits per person" value={summary.average_scans_per_person ?? 0} note={`${number(summary.active_buildings)} active buildings`} icon="history" tone="amber" />
      </div>

      <div className="admin-overview-grid">
        <section className="portal-card admin-panel admin-building-chart">
          <div className="admin-panel-heading"><div><h3>Building activity</h3><p className="portal-muted">Access scans by campus building</p></div><button className="admin-text-button" type="button" onClick={() => setTab("buildings")}>View all <span>→</span></button></div>
          {(analytics?.buildings || []).length ? <div className="admin-bars">{analytics.buildings.slice(0, 6).map((row) => <div className="admin-bar-row" key={`${row.phase}-${row.building}`}>
            <div className="admin-bar-label"><span>{row.building}</span><strong>{number(row.scans)}</strong></div>
            <div className="admin-bar-track"><span style={{ width: `${Math.max(5, (row.scans / maxBuildingScans) * 100)}%` }} /></div>
            <small>{row.phase || "Campus"} · {number(row.people)} people</small>
          </div>)}</div> : <div className="admin-empty">No access activity for this period yet.</div>}
        </section>
        <section className="portal-card admin-panel admin-insight-card">
          <div className="admin-insight-icon"><Icon name="dashboard" /></div><p className="admin-kicker">AT A GLANCE</p>
          <h3>{summary.active_buildings ? `${summary.active_buildings} buildings active` : "Ready for activity"}</h3>
          <p className="portal-muted">{summary.total_scans ? `${number(summary.total_scans)} scans recorded. ${number(summary.verified_entries)} resulted in successful identity checks.` : "New access checks will appear here as security staff verify QR credentials."}</p>
          <div className="admin-insight-stat"><span>Unique people recorded</span><strong>{number(summary.unique_people)}</strong></div>
          <div className="admin-insight-stat"><span>Pending registrations</span><strong>{number(students.length)}</strong></div>
        </section>
      </div>

      <section className="portal-card admin-panel admin-records-panel">
        <div className="admin-panel-heading"><div><h3>Recent access activity</h3><p className="portal-muted">Latest identity checks across campus</p></div><button className="admin-text-button" type="button" onClick={() => setTab("buildings")}>Explore records <span>→</span></button></div>
        <AccessTable rows={(analytics?.recent || []).slice(0, 8)} type="recent" />
      </section>
    </>}

    {isDashboard && ["buildings", "students", "staff"].includes(tab) && <section className="portal-card admin-panel admin-record-browser">
      <div className="admin-panel-heading"><div><p className="admin-kicker">{days === "365" ? "LAST 12 MONTHS" : `LAST ${days} DAYS`}</p><h3>{panelTitle}</h3>
        <p className="portal-muted">{tab === "buildings" ? "Compare scan volume, successful entries, and people at each building." : "Review visit frequency and each person’s latest recorded access."}</p></div>
        <label className="admin-search"><Icon name="history" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search records" aria-label="Search records" /></label>
      </div>
      <AccessTable rows={filteredRows} type={tab === "buildings" ? "building" : "person"} role={tab} />
    </section>}

    {page === "anomalies" && <section className="portal-card admin-panel admin-record-browser">
      <div className="admin-panel-heading"><div><h3>Anomaly alerts</h3>
        <p className="portal-muted">Review access activity that falls outside expected patterns.</p></div>
        <Link to="/admin" className="portal-button portal-button-secondary">Back to dashboard</Link>
      </div>
      <div className="portal-table-wrap admin-table-wrap"><table className="portal-table admin-table">
        <thead><tr><th>Severity</th><th>Person</th><th>Building</th><th>Reason</th><th>Detected</th></tr></thead>
        <tbody>{alerts.length ? alerts.map((alert) => <tr key={alert.id}>
          <td><span className={`admin-role-chip ${alert.severity === "high" ? "is-other" : ""}`}>{alert.severity}</span></td>
          <td><strong>{alert.name}</strong><small className="admin-subline">{alert.school_id ?? "Unknown ID"}</small></td>
          <td>{alert.building || "Unknown"}<small className="admin-subline">{alert.phase || ""}</small></td>
          <td>{alert.description}</td><td>{dateTime(alert.detected_at)}</td>
        </tr>) : <tr><td colSpan="5" className="admin-empty-cell">No anomaly alerts recorded.</td></tr>}</tbody>
      </table></div>
    </section>}

    {page === "accounts" && <div className="admin-account-grid">
      <section className="portal-card admin-panel">
        <div className="admin-panel-heading"><div><h3>Pending student registrations</h3><p className="portal-muted">Review student details before enabling QR credentials.</p></div><span className="admin-count-badge">{students.length} pending</span></div>
        <div className="portal-table-wrap admin-table-wrap"><table className="portal-table admin-table">
          <thead><tr><th>Student</th><th>School and course</th><th>Year</th><th>Review</th></tr></thead>
          <tbody>{students.length ? students.map((student) => <tr key={student.school_id}>
            <td><strong>{student.full_name}</strong><small className="admin-subline">ID {student.school_id} · {student.email}</small></td>
            <td>{student.school || "Not provided"}<small className="admin-subline">{student.degree || "Course not provided"}</small></td>
            <td>{student.year_of_study || "—"}</td>
            <td><div className="admin-review-actions"><button type="button" className="admin-approve" onClick={() => reviewStudent(student.school_id, "approve")}>Approve</button><button type="button" className="admin-reject" onClick={() => { const reason = window.prompt("Reason for rejection:"); if (reason?.trim()) reviewStudent(student.school_id, "reject", reason.trim()); }}>Reject</button></div></td>
          </tr>) : <tr><td colSpan="4" className="admin-empty-cell">No pending registrations.</td></tr>}</tbody>
        </table></div>
      </section>

      <section className="portal-card admin-panel admin-create-panel">
        <div className="admin-panel-heading"><div><h3>Create an account</h3><p className="portal-muted">Add staff or administrator access.</p></div></div>
        <form className="portal-form admin-account-form" onSubmit={createAccount}>
          <label>Account type<select value={form.role} onChange={(event) => update("role", event.target.value)}><option value="staff">Staff</option><option value="admin">Administrator</option></select></label>
          <label>School ID<input type="number" min={form.role === "admin" ? 100 : form.work_role === "Lecturer" ? 50000 : 1001} max={form.role === "admin" ? 1000 : form.work_role === "Lecturer" ? 99999 : 49999} value={form.school_id} onChange={(event) => update("school_id", event.target.value)} required /><small>{form.role === "admin" ? "100–1,000" : form.work_role === "Lecturer" ? "Lecturers: 50,000–99,999" : "Other staff: 1,001–49,999"}</small></label>
          <div className="admin-form-pair"><label>First name<input value={form.first_name} onChange={(event) => update("first_name", event.target.value)} maxLength={75} required /></label><label>Last name<input value={form.last_name} onChange={(event) => update("last_name", event.target.value)} maxLength={75} required /></label></div>
          <label>Email address<input type="email" value={form.email} onChange={(event) => update("email", event.target.value)} required /></label>
          <label>Gender<select value={form.gender} onChange={(event) => update("gender", event.target.value)} required><option value="">Select gender</option>{["Female", "Male", "Other", "Prefer not to say"].map((v) => <option key={v}>{v}</option>)}</select></label>
          <label>Phone number <span className="admin-optional">Optional</span><input type="tel" value={form.phone_number} onChange={(event) => update("phone_number", event.target.value)} maxLength={30} /></label>
          <label>Initial password<input type="password" value={form.password} onChange={(event) => update("password", event.target.value)} minLength={8} maxLength={128} required /></label>
          {form.role === "staff" ? <label>Staff role<select value={form.work_role} onChange={(event) => update("work_role", event.target.value)} required>{STAFF_ROLES.map((value) => <option key={value}>{value}</option>)}</select></label> : <label>School headed<select value={form.head_school} onChange={(event) => update("head_school", event.target.value)} required><option value="">Select school</option>{SCHOOLS.map(([code, label]) => <option key={code} value={code}>Head of {label} ({code})</option>)}</select></label>}
          <button className="portal-button admin-submit" type="submit" disabled={accountLoading}>{accountLoading ? "Creating account…" : "Create account"}</button>
        </form>
      </section>
    </div>}
  </PortalLayout>;
}

export default AdminDashboard;
