import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import PortalLayout from "../components/portallayout";
import Icon from "../components/icon";
import VerificationIdCard from "../components/verificationidcard";

const API_URL = import.meta.env.VITE_API_URL || "";
const BUILDINGS = { "Phase 1": ["Central Building"], "Phase 2": ["Management Science Building (MSB)", "St Thomas Moore Building (STMB)", "Forge", "Oval Building", "Auditorium", "University Library"] };
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token")}` });

export default function StaffScanner() {
  const [phase, setPhase] = useState(() => sessionStorage.getItem("verification_phase") || "");
  const [location, setLocation] = useState(() => sessionStorage.getItem("verification_location") || "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [records, setRecords] = useState([]);
  const inFlight = useRef(false);
  const isSecurityGuard = JSON.parse(localStorage.getItem("user") || "{}").work_role === "Security Staff";

  const loadRecords = useCallback(async () => {
    try { const response = await axios.get(`${API_URL}/api/staff/history`, { headers: auth() }); setRecords(response.data); }
    catch { /* keep the scanner available if history is temporarily unavailable */ }
  }, []);
  useEffect(() => {
    axios.get(`${API_URL}/api/staff/history`, { headers: auth() }).then((response) => setRecords(response.data)).catch(() => {});
  }, []);
  useEffect(() => {
    if (phase) sessionStorage.setItem("verification_phase", phase);
    else sessionStorage.removeItem("verification_phase");
  }, [phase]);
  useEffect(() => {
    if (location) sessionStorage.setItem("verification_location", location);
    else sessionStorage.removeItem("verification_location");
  }, [location]);
  useEffect(() => {
    if (!result) return undefined;
    const timer = window.setTimeout(() => setResult(null), 5000);
    return () => window.clearTimeout(timer);
  }, [result]);

  const verifyToken = useCallback(async (token) => {
    if (!phase || !location) { setError("Select a campus phase and building before verifying."); return; }
    if (!token?.trim()) { setError("Scan a QR code first."); return; }
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true); setError(""); setResult(null);
    try {
      const response = await axios.post(`${API_URL}/api/staff/verify-qr`, { qr_token: token.trim(), phase, location }, { headers: auth() });
      if (response.data.verified) setResult(response.data);
      else setError(response.data.message || "Verification failed.");
      await loadRecords();
    } catch (err) {
      setError(err.response?.data?.detail || "Verification request failed.");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, [loadRecords, location, phase]);

  useEffect(() => {
    if (!scanning) return undefined;
    let cancelled = false;
    let scanner;
    async function start() {
      try {
        scanner = new Html5Qrcode("qr-reader");
        await scanner.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, async (decoded) => {
          if (cancelled || inFlight.current) return;
          setScanning(false);
          try { await scanner.stop(); } catch { /* scanner already stopped */ }
          if (!cancelled) await verifyToken(decoded);
        }, () => {});
      } catch (err) {
        if (!cancelled) { setError(`Camera error: ${err.message || "Unable to start camera."}`); setScanning(false); }
      }
    }
    start();
    return () => { cancelled = true; if (scanner?.isScanning) scanner.stop().catch(() => {}); };
  }, [scanning, verifyToken]);

  if (!isSecurityGuard) return <PortalLayout title="Security QR Scanner" role="staff"><div className="portal-notice" role="alert">QR scanning and verification are available only to Security Staff.</div></PortalLayout>;

  return <PortalLayout title="Security QR Scanner" role="guard">
    <div className="portal-card location-picker">
      <h2>Verification Location</h2><p className="portal-muted">This location stays selected until you log out. Change it here when your station changes.</p>
      <div className="location-fields">
        <label>Campus phase<select value={phase} onChange={(event) => { setPhase(event.target.value); setLocation(""); }} required><option value="">Select phase</option>{Object.keys(BUILDINGS).map((value) => <option key={value}>{value}</option>)}</select></label>
        <label>Building<select value={location} onChange={(event) => setLocation(event.target.value)} disabled={!phase} required><option value="">Select building</option>{(BUILDINGS[phase] || []).map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
    </div>
    <div className="portal-card guard-scanner-panel"><h2>Scan QR Code</h2><p className="portal-muted">Each QR code verifies once and expires after 90 seconds.</p><div id="qr-reader" className="qr-reader" />
      <button type="button" className="portal-button" disabled={loading || !phase || !location} onClick={() => { setError(""); setScanning((value) => !value); }}>{scanning ? "Stop Camera" : "Start Camera Scanner"}</button></div>
    {error && <div className="portal-notice" role="alert">{error}</div>}
    {result && <div className="verification-overlay" role="dialog" aria-modal="true" aria-label="Identity verified">
      <section className="verification-overlay-content" role="status" aria-live="polite">
        <div className="student-verified-title"><span><Icon name="check" /></span><strong>Identity Verified</strong></div>
        <p className="portal-muted">{result.message}</p>
        <VerificationIdCard result={result} />
      </section>
    </div>}
    <div className="portal-card"><h2>Verification Records</h2><p className="portal-muted">Recent scans recorded at your selected location.</p>
      <div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>School ID</th><th>Phase</th><th>Building</th><th>Accessed at</th><th>Result</th></tr></thead><tbody>
        {records.length === 0 ? <tr><td colSpan="5">No verification records yet.</td></tr> : records.map((row, index) => <tr key={`${row.scanned_at}-${index}`}><td>{row.school_id ?? "—"}</td><td>{row.phase ?? "—"}</td><td>{row.location ?? "—"}</td><td>{row.scanned_at ? new Date(row.scanned_at).toLocaleString() : "—"}</td><td>{row.outcome === "verified" ? <span className="portal-status success"><Icon name="check" size={15} /> Verified</span> : <span className="portal-status danger">{row.outcome}</span>}</td></tr>)}
      </tbody></table></div></div>
  </PortalLayout>;
}
