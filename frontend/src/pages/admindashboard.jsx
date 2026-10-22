
import PortalLayout from "../components/portallayout";

function AdminDashboard() {
  const records = [
    {
      id: "LOG-001",
      student: "STU/2026/001",
      time: "Demo record",
      outcome: "Successful",
    },
    {
      id: "LOG-002",
      student: "STU/2026/014",
      time: "Demo record",
      outcome: "Failed",
    },
    {
      id: "LOG-003",
      student: "STU/2026/021",
      time: "Demo record",
      outcome: "Review",
    },
  ];

  return (
    <PortalLayout title="Admin Dashboard" role="admin">
      <div className="portal-notice">
        All figures and records below are sample data. Live statistics,
        audit logs, and machine-learning anomaly detection are not connected.
      </div>

      <div className="portal-grid">
        <div className="portal-card">
          <p className="portal-muted">Registered Students</p>
          <p className="portal-number">--</p>
          <p className="portal-muted">Awaiting database connection</p>
        </div>

        <div className="portal-card">
          <p className="portal-muted">Total Verifications</p>
          <p className="portal-number">--</p>
          <p className="portal-muted">Awaiting verification logs</p>
        </div>

        <div className="portal-card">
          <p className="portal-muted">Anomaly Alerts</p>
          <p className="portal-number">--</p>
          <p className="portal-muted">Awaiting ML integration</p>
        </div>
      </div>

      <div className="portal-card" style={{ marginBottom: 24 }}>
        <h2>Sample Verification History</h2>

        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Student Number</th>
                <th>Time</th>
                <th>Outcome</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td>{record.id}</td>
                  <td>{record.student}</td>
                  <td>{record.time}</td>
                  <td>
                    <span
                      className={`portal-status ${
                        record.outcome === "Successful"
                          ? "success"
                          : record.outcome === "Failed"
                          ? "danger"
                          : "warning"
                      }`}
                    >
                      {record.outcome}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="portal-card">
        <h2>Anomaly Alerts</h2>
        <p className="portal-muted">
          The system will display suspicious verification patterns detected
          by the machine-learning component here.
        </p>
        <span className="portal-status warning">ML not connected</span>
      </div>
    </PortalLayout>
  );
}

export default AdminDashboard;
