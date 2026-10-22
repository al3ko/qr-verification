
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register"; 
import StudentDashboard from "./pages/studentdashboard";
import StudentProfile from "./pages/studentprofile";
import QRCodePage from "./pages/qrcode";
import StaffScanner from "./pages/staffscanner";
import AdminDashboard from "./pages/admindashboard";


function ComingSoon({ title }) {
  return (
    <main style={{ fontFamily: "Arial", padding: "40px", textAlign: "center" }}>
      <h1>{title}</h1>
      <p>This page is being developed.</p>
      <p><Link to="/">Back to Login</Link></p>
      <nav style={{ display: "flex", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
        <Link to="/register">Register</Link>
        <Link to="/student">Student Dashboard</Link>
        <Link to="/profile">Student Profile</Link>
        <Link to="/qr-code">My QR Code</Link>
        <Link to="/staff-scanner">Staff Scanner</Link>
        <Link to="/admin">Admin Dashboard</Link>
      </nav>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/profile" element={<StudentProfile />} />
        <Route path="/qr-code" element={<QRCodePage />} />
        <Route path="/staff-scanner" element={<StaffScanner />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<ComingSoon title="Page Not Found" />} />
      </Routes>
    </BrowserRouter>
  );
}
