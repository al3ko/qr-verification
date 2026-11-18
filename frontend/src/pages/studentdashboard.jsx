import { useEffect, useRef, useState } from "react";
import axios from "axios";
import PortalLayout from "../components/portallayout";
import Icon from "../components/icon";
import VerificationIdCard from "../components/verificationidcard";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [qr, setQr] = useState(null);
  const [qrRemaining, setQrRemaining] = useState(0);
  const [latestScan, setLatestScan] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const token = localStorage.getItem("access_token");
  const dashboardEnteredAt = useRef(new Date().toISOString());
  const lastScanId = useRef(null);

  useEffect(() => {
    axios.get(`${API_URL}/api/student/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((response) => setStudent(response.data))
      .catch((err) => setError(err.response?.data?.detail || "Unable to load your student dashboard."))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!student || student.approval_status !== "approved") return undefined;
    let active = true;
    async function pollForScan() {
      try {
        const response = await axios.get(`${API_URL}/api/student/latest-verification`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { after: dashboardEnteredAt.current },
        });
        const scan = response.data;
        if (active && scan?.id && lastScanId.current !== scan.id) {
          lastScanId.current = scan.id;
          setQr(null);
          setLatestScan(scan);
        }
      } catch { /* keep the dashboard available while polling retries */ }
    }
    pollForScan();
    const interval = window.setInterval(pollForScan, 1200);
    return () => { active = false; window.clearInterval(interval); };
  }, [student, token]);

  useEffect(() => {
    if (!latestScan) return undefined;
    const timer = window.setTimeout(() => setLatestScan(null), 3000);
    return () => window.clearTimeout(timer);
  }, [latestScan]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(""), 2800);
    return () => window.clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    if (!qr) return undefined;
    const timer = window.setInterval(() => {
      const seconds = Math.max(0, Math.ceil((new Date(qr.expires_at).getTime() - Date.now()) / 1000));
      setQrRemaining(seconds);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [qr]);

  async function generateQR() {
    setError("");
    setSuccess("");
    setGenerating(true);
    try {
      const response = await axios.post(`${API_URL}/api/student/qr-code`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setQr(response.data);
      setQrRemaining(Math.max(0, Math.ceil((new Date(response.data.expires_at).getTime() - Date.now()) / 1000)));
      setSuccess("QR code generated. It expires in 90 seconds and can be scanned once.");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to generate your QR code.");
    } finally {
      setGenerating(false);
    }
  }

  const approved = student?.approval_status === "approved";
  return <PortalLayout title="Student Dashboard">
    {loading && <div className="portal-card">Loading your dashboard...</div>}
    {error && <div className="portal-notice" role="alert">{error}</div>}
    {success && <div className="portal-confirmation" role="status"><Icon name="check" />{success}</div>}
    {student && <>
      <section className="portal-card student-welcome">
        <div className="student-avatar">{student.photo_data ? <img src={student.photo_data} alt="" /> : <span>{student.first_name?.slice(0, 1)}{student.last_name?.slice(0, 1)}</span>}</div><div className="student-welcome-copy"><p className="portal-muted">Welcome back,</p><h2>{student.first_name}</h2><p className="portal-muted">{student.degree} | Year {student.year_of_study}</p><span className="student-meta">ID: {student.school_id} &middot; Active Semester</span></div>
        <span className={`portal-status ${approved ? "success" : student.approval_status === "rejected" ? "danger" : "warning"}`}>{approved && <Icon name="check" size={13} />}{approved ? "Approved" : student.approval_status}</span>
      </section>
      {!approved && <div className="portal-notice">{student.approval_status === "rejected" ? `Registration rejected: ${student.rejection_reason || "Contact an administrator."}` : "Your registration is awaiting administrator approval. QR generation will be available after approval."}</div>}
      {approved && <section className="portal-card student-qr-card">
        <span className="entrycode-emblem"><Icon name="scan" /></span><h2>Generate EntryCode</h2>
        <p className="portal-muted">Show this single-use credential to Security Staff. It expires after 90 seconds.</p>
        {qr && qrRemaining > 0 && <img className="portal-qr" src={qr.qr_image} alt="Your student QR credential" />}
        {qr && <p className={qrRemaining > 0 ? "qr-countdown" : "qr-countdown expired"} aria-live="polite">{qrRemaining > 0 ? `Expires in ${Math.floor(qrRemaining / 60)}:${String(qrRemaining % 60).padStart(2, "0")}` : "This QR code has expired. Generate another code."}</p>}
        <button type="button" className="portal-button" disabled={generating} onClick={generateQR}>{generating ? "Generating..." : qr ? "Generate a new QR code" : "Generate QR Code"}</button>
      </section>}
    </>}
    {latestScan && <div className="verification-overlay" role="status" aria-live="polite">
      <div className="verification-overlay-content"><div className="student-verified-title"><span><Icon name="check" /></span><strong>Verified</strong></div>
        <p className="portal-muted">{latestScan.location} | {latestScan.scanned_at ? new Date(latestScan.scanned_at).toLocaleTimeString() : ""}</p>
        <VerificationIdCard result={latestScan} />
        <button type="button" className="portal-button portal-button-secondary overlay-close" onClick={() => setLatestScan(null)}>Close</button>
      </div>
    </div>}
  </PortalLayout>;
}