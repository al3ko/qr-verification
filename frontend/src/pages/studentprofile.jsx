import { useEffect, useState } from "react";
import axios from "axios";
import PortalLayout from "../components/portallayout";

const API_URL = import.meta.env.VITE_API_URL || "";
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem("access_token") || ""}` });

function Detail({ label, value }) {
  if (value === null || value === undefined || value === "") return null;
  return <div><p className="portal-detail-label">{label}</p><p className="portal-detail-value">{value}</p></div>;
}

function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    axios.get(`${API_URL}/api/student/me`, { headers: auth() })
      .then((response) => { if (active) setStudent(response.data); })
      .catch((err) => { if (active) setError(err.response?.data?.detail || "Unable to load your profile."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <PortalLayout title="My Profile">
    {loading && <div className="portal-card" role="status">Loading profile?</div>}
    {error && <div className="portal-notice" role="alert">{error}</div>}
    {student && <>
      <section className="portal-card student-welcome">
        <div className="student-avatar">{student.photo_data ? <img src={student.photo_data} alt={`${student.full_name} profile`} /> : <span>{student.first_name?.slice(0, 1)}{student.last_name?.slice(0, 1)}</span>}</div>
        <div className="student-welcome-copy"><p className="portal-muted">Student profile</p><h2>{student.full_name}</h2><p className="portal-muted">{student.degree || student.course}</p><span className="student-meta">School ID: {student.school_id}</span></div>
        <span className={`portal-status ${student.approval_status === "approved" ? "success" : student.approval_status === "rejected" ? "danger" : "warning"}`}>{student.approval_status}</span>
      </section>
      <section className="portal-card student-profile-details">
        <h2>Student details</h2>
        <div className="portal-detail-list">
          <Detail label="Registration number" value={student.registration_number} />
          <Detail label="School" value={student.school} />
          <Detail label="Programme" value={student.degree || student.course} />
          <Detail label="Year of study" value={student.year_of_study ? `Year ${student.year_of_study}` : null} />
          <Detail label="Group" value={student.group_name} />
          <Detail label="Email address" value={student.email} />
          <Detail label="Phone number" value={student.phone_number} />
        </div>
      </section>
    </>}
  </PortalLayout>;
}

export default StudentProfile;
