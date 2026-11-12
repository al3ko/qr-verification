import { useEffect, useState } from "react";
import axios from "axios";
import PortalLayout from "../components/portallayout";
import Icon from "../components/icon";

const API_URL = import.meta.env.VITE_API_URL || "";
export default function AccessHistory() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const staff = user.role === "staff";
  const guard = staff && user.work_role === "Security Staff";
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    axios.get(`${API_URL}/api/${staff ? "staff" : "student"}/history`, { headers: { Authorization: `Bearer ${localStorage.getItem("access_token")}` } })
      .then((response) => setRows(response.data))
      .catch((err) => setError(err.response?.data?.detail || "Unable to load access history."));
  }, [staff]);
  return <PortalLayout title={guard ? "Scan History" : "Access History"} role={guard ? "guard" : staff ? "staff" : "student"}>
    <div className="portal-card"><h2>{guard ? "Recent Verifications" : "Buildings Accessed"}</h2><p className="portal-muted">{guard ? "Recent identities scanned by your account." : "Your successful and unsuccessful campus access scans."}</p>
      {error && <div className="portal-notice" role="alert">{error}</div>}
      <div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>School ID</th><th>Phase</th><th>Building</th><th>Date and time</th><th>Result</th></tr></thead><tbody>
        {rows.length ? rows.map((row, index) => <tr key={`${row.scanned_at}-${index}`}><td>{row.school_id ?? "—"}</td><td>{row.phase ?? "—"}</td><td>{row.location ?? "—"}</td><td>{row.scanned_at ? new Date(row.scanned_at).toLocaleString() : "—"}</td><td>{row.outcome === "verified" ? <span className="portal-status success"><Icon name="check" size={15} /> Verified</span> : row.outcome}</td></tr>) : <tr><td colSpan="5">No access records found.</td></tr>}
      </tbody></table></div>
    </div>
  </PortalLayout>;
}