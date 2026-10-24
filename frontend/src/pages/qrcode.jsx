
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import axios from "axios";
import PortalLayout from "../components/portallayout";

const API_URL = "http://127.0.0.1:8000";

function QRCodePage() {
  const [credential, setCredential] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function generateQRCode() {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Please log in before generating your QR code.");
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/student/qr-code`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCredential(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else if (err.response?.status === 403) {
        setError("Only student accounts can generate QR credentials.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to generate your QR code. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <PortalLayout title="My QR Code">
      <div
        className="portal-card"
        style={{ maxWidth: 650, margin: "auto" }}
      >
        <h2 style={{ textAlign: "center" }}>Student QR Credential</h2>

        <p className="portal-muted" style={{ textAlign: "center" }}>
          Generate your secure QR credential for student identity verification.
        </p>

        {error && (
          <div className="portal-notice" role="alert">
            {error}
          </div>
        )}

        {!credential ? (
          <div style={{ textAlign: "center", padding: "24px 0" }}>
            <p>Generate a QR code to get started.</p>

            <button
              className="portal-button"
              onClick={generateQRCode}
              disabled={loading}
            >
              {loading ? "Generating..." : "Generate QR Code"}
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                margin: "24px 0",
              }}
            >
              <QRCodeSVG
                value={credential.qr_token}
                size={240}
                level="H"
                includeMargin
                className="portal-qr"
              />
            </div>

            <div style={{ textAlign: "center" }}>
              <span className="portal-status">
                Active QR Credential
              </span>

              <p>
                <strong>Credential ID:</strong>{" "}
                {credential.qr_code_id}
              </p>

              <p>
                <strong>Expires:</strong>{" "}
                {new Date(credential.expires_at).toLocaleString()}
              </p>

              <p className="portal-muted">
                {credential.message}
              </p>
            </div>

            <div className="portal-notice">
              Keep your QR credential private. It expires after 24 hours.
              Generating a new credential revokes the previous one.
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <button
                className="portal-button"
                onClick={() => window.print()}
              >
                Print QR Code
              </button>

              <button
                className="portal-button"
                onClick={generateQRCode}
                disabled={loading}
              >
                {loading ? "Generating..." : "Regenerate QR"}
              </button>
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}

export default QRCodePage;
