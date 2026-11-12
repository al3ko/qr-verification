export default function VerificationIdCard({ result }) {
  const isStudent = result.subject_role === "student";
  return <article className="identity-card" aria-label="Verified identity card">
    <div className="identity-photo">{result.photo_data ? <img src={result.photo_data} alt={`${result.student_name || "User"} passport photo`} /> : <span>Photo unavailable</span>}</div>
    <div className="identity-details">
      <p className="portal-muted">{isStudent ? "STUDENT ID CARD" : "STAFF ID CARD"}</p>
      <h3>{result.student_name || "Verified user"}</h3>
      <p><span>Student No.</span><strong>{result.registration_number || "—"}</strong></p>
      <p><span>School ID</span><strong>{result.school_id ?? "—"}</strong></p>
      <p><span>Degree</span><strong>{result.course || (isStudent ? "—" : result.subject_role || "Staff")}</strong></p>
      <p><span>Year of study</span><strong>{result.year_of_study || "—"}</strong></p>
    </div>
  </article>;
}