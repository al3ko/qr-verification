
import { useState } from "react";
import PortalLayout from "../components/portalayout";

function StaffScanner() {
  const [studentNumber, setStudentNumber] = useState("");
  const [result, setResult] = useState(null);

  const handleDemoCheck = (e) => {
    e.preventDefault();

    if (!studentNumber.trim()) return;

    setResult({
      studentNumber: studentNumber.trim(),
      message:
        "Demo only. Connect the backend to verify this student's identity.",
    });
  };

  return (
    <PortalLayout title="Staff QR Scanner" role="staff">
      <div className="portal-grid">
        <div className="portal-card">
          <h2>QR Scanner</h2>
          <p className="portal-muted">
            The camera scanner will be connected in a later step.
          </p>

          <div
            style={{
              minHeight: 220,
              border: "2px dashed #94a3b8",
              borderRadius: 10,
              display: "grid",
              placeItems: "center",
              textAlign: "center",
              padding: 20,
              margin: "20px 0",
            }}
          >
            <div>
              <div style={{ fontSize: 40 }}>▦</div>
              <strong>Camera scanner not connected</strong>
              <p className="portal-muted">
                Camera access and QR detection will be added later.
              </p>
            </div>
          </div>

          <button
            className="portal-button"
            disabled
            title="Camera scanning is not implemented yet"
          >
            Start Camera Scanner
          </button>
        </div>

        <div className="portal-card">
          <h2>Manual Demo Check</h2>
          <p className="portal-muted">
            Enter a student number to test the interface. This does not verify
            identity.
          </p>

          <form className="portal-form" onSubmit={handleDemoCheck}>
            <label>
              Student Number
              <input
                value={studentNumber}
                onChange={(e) => {
                  setStudentNumber(e.target.value);
                  setResult(null);
                }}
                placeholder="e.g. STU/2026/001"
                required
              />
            </label>

            <button className="portal-button" type="submit">
              Run Demo Check
            </button>
          </form>

          {result && (
            <div className="portal-notice" role="status">
              <strong>Demo result — not verified</strong>
              <p>Student: {result.studentNumber}</p>
              <p>{result.message}</p>
            </div>
          )}
        </div>
      </div>

      <div className="portal-card">
        <h3>Verification Records</h3>
        <p className="portal-muted">
          Timestamp, staff identity, location, and verification outcome will
          be recorded after backend integration.
        </p>
      </div>
    </PortalLayout>
  );
}

export default StaffScanner;
