
import { QRCodeSVG } from "qrcode.react";
import PortalLayout from "../components/portallayout";

function QRCodePage() {
  const demoCredential = JSON.stringify({
    type: "DEMO_ONLY",
    studentNumber: "STU/2026/001",
    credentialId: "DEMO-CREDENTIAL-001",
  });

  return (
    <PortalLayout title="My QR Code">
      <div className="portal-card" style={{ maxWidth: 650, margin: "auto" }}>
        <h2 style={{ textAlign: "center" }}>Student QR Credential</h2>

        <p className="portal-muted" style={{ textAlign: "center" }}>
          Demonstration QR code for the student identity verification system.
        </p>

        <QRCodeSVG
          value={demoCredential}
          size={240}
          level="H"
          includeMargin
          className="portal-qr"
        />

        <div style={{ textAlign: "center" }}>
          <p><strong>Student Number:</strong> STU/2026/001</p>
          <span className="portal-status warning">Demo QR Code</span>
        </div>

        <div className="portal-notice">
          This QR code contains demonstration data only. It must not be used
          to verify a real student. A secure, signed credential and server-side
          verification will be implemented with the backend.
        </div>

        <button
          className="portal-button"
          style={{ display: "block", margin: "auto" }}
          onClick={() => window.print()}
        >
          Print QR Code
        </button>
      </div>
    </PortalLayout>
  );
}

export default QRCodePage;
