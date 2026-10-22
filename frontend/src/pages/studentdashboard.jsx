
import { Link } from "react-router-dom";
import PortalLayout from "../components/portallayout";

function StudentDashboard() {
  const student = {
    name: "Alex Student",
    studentNumber: "STU/2026/001",
    programme: "Computer Science",
    year: "Year 3",
  };

  return (
    <PortalLayout title="Student Dashboard">
      <div className="portal-card" style={{ marginBottom: 24 }}>
        <p className="portal-muted">Welcome back,</p>
        <h2>{student.name}</h2>
        <p className="portal-muted">
          Here is an overview of your student verification account.
        </p>
      </div>

      <div className="portal-grid">
        <div className="portal-card">
          <p className="portal-muted">Student Number</p>
          <p className="portal-number" style={{ fontSize: 22 }}>
            {student.studentNumber}
          </p>
        </div>

        <div className="portal-card">
          <p className="portal-muted">Account</p>
          <p>
            <span className="portal-status success">Demo account</span>
          </p>
        </div>

        <div className="portal-card">
          <p className="portal-muted">QR Credential</p>
          <p>
            <span className="portal-status warning">Demo only</span>
          </p>
        </div>
      </div>

      <div className="portal-grid">
        <div className="portal-card">
          <h3>My Profile</h3>
          <p className="portal-muted">
            View your student details and programme information.
          </p>
          <Link to="/profile" className="portal-button">
            View Profile
          </Link>
        </div>

        <div className="portal-card">
          <h3>My QR Code</h3>
          <p className="portal-muted">
            Open your demonstration QR code page.
          </p>
          <Link to="/qr-code" className="portal-button">
            View QR Code
          </Link>
        </div>

        <div className="portal-card">
          <h3>Verification</h3>
          <p className="portal-muted">
            Your actual verification history will appear here after backend
            integration.
          </p>
          <span className="portal-status warning">Not connected</span>
        </div>
      </div>

      <div className="portal-card">
        <h3>Student Information</h3>
        <p><strong>Programme:</strong> {student.programme}</p>
        <p><strong>Year of study:</strong> {student.year}</p>
      </div>
    </PortalLayout>
  );
}

export default StudentDashboard;
