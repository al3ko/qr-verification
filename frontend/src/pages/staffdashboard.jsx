import { useEffect, useState } from "react";
import axios from "axios";
import PortalLayout from "../components/portallayout";
import Icon from "../components/icon";

const API_URL = import.meta.env.VITE_API_URL || "";
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

export default function StaffDashboard() {
  const [profile, setProfile] = useState(null);
  const [qr, setQr] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    axios.get(`${API_URL}/api/staff/me`, { headers: headers() })
      .then((response) => setProfile(response.data))
      .catch((err) => setError(err.response?.data?.detail || "Unable to load staff account."));
  }, []);
  useEffect(() => {
    if (!qr) return undefined;
    const timer = window.setInterval(() => setRemaining(Math.max(0, Math.ceil((new Date(qr.expires_at).getTime() - Date.now()) / 1000))), 1000);
    return () => window.clearInterval(timer);
  }, [qr]);
  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(""), 2800);
    return () => window.clearTimeout(timer);
  }, [success]);
  async function generate() {
    setBusy(true); setError(""); setSuccess("");
    try {
      const response = await axios.post(`${API_URL}/api/staff/qr-code`, {}, { headers: headers() });
      setQr(response.data);
      setRemaining(Math.max(0, Math.ceil((new Date(response.data.expires_at).getTime() - Date.now()) / 1000)));
      setSuccess("QR code generated. It expires in 90 seconds and can be scanned once.");
    } catch (err) { setError(err.response?.data?.detail || "Unable to generate your QR code."); }
    finally { setBusy(false); }
  }
  return <PortalLayout title="Staff Dashboard" role="staff">
    {error && <div className="portal-notice" role="alert">{error}</div>}
    {success && <div className="portal-confirmation" role="status"><Icon name="check" />{success}</div>}
    {profile && <>
      <div className="portal-card student-welcome"><div className="student-avatar"><span>{profile.first_name?.slice(0, 1)}{profile.last_name?.slice(0, 1)}</span></div><div className="student-welcome-copy"><p className="portal-muted">Welcome back,</p><h2>{profile.full_name}</h2><p className="portal-muted">{profile.work_role}</p><span className="student-meta">School ID: {profile.school_id}</span></div></div>
      <div className="portal-card student-qr-card"><span className="entrycode-emblem"><Icon name="scan" /></span><h2>Generate EntryCode</h2><p className="portal-muted">Your staff credential is valid for 90 seconds and may be scanned once.</p>
        {qr && remaining > 0 && <img className="portal-qr" src={qr.qr_image} alt="Your staff QR credential" />}
        {qr && <p className={remaining > 0 ? "qr-countdown" : "qr-countdown expired"}>{remaining > 0 ? `Expires in ${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}` : "This QR code has expired."}</p>}
        <button type="button" className="portal-button" onClick={generate} disabled={busy}>{busy ? "Generating..." : qr ? "Generate a new QR code" : "Generate QR Code"}</button>
      </div>
    </>}
  </PortalLayout>;
}