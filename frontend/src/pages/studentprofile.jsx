
import PortalLayout from "../components/portallayout";

function StudentProfile() {
  const student = {
    name: "Alex Student",
    studentNumber: "STU/2026/001",
    email: "student@example.ac.ke",
    programme: "Computer Science",
    year: "Year 3",
    institution: "Sample University",
  };

  return (
    <PortalLayout title="My Profile">
      <div className="portal-card">
        <h2>Student Details</h2>
        <p className="portal-muted">
          These are demonstration details and are not editable yet.
        </p>

        <div className="portal-detail-list" style={{ marginTop: 28 }}>
          <div>
            <p className="portal-detail-label">Full Name</p>
            <p className="portal-detail-value">{student.name}</p>
          </div>

          <div>
            <p className="portal-detail-label">Student Number</p>
            <p className="portal-detail-value">{student.studentNumber}</p>
          </div>

          <div>
            <p className="portal-detail-label">University Email</p>
            <p className="portal-detail-value">{student.email}</p>
          </div>

          <div>
            <p className="portal-detail-label">Programme</p>
            <p className="portal-detail-value">{student.programme}</p>
          </div>

          <div>
            <p className="portal-detail-label">Year of Study</p>
            <p className="portal-detail-value">{student.year}</p>
          </div>

          <div>
            <p className="portal-detail-label">Institution</p>
            <p className="portal-detail-value">{student.institution}</p>
          </div>
        </div>

        <div className="portal-notice">
          Profile editing and retrieval from the database will be implemented
          when the backend is connected.
        </div>
      </div>
    </PortalLayout>
  );
}

export default StudentProfile;
