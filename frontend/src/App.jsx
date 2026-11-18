
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Login from "./pages/login";
import Register from "./pages/register"; 
import StudentDashboard from "./pages/studentdashboard";
import StudentProfile from "./pages/studentprofile";
import QRCodePage from "./pages/qrcode";
import StaffScanner from "./pages/staffscanner";
import StaffDashboard from "./pages/staffdashboard";
import AccessHistory from "./pages/accesshistory";
import AdminDashboard from "./pages/admindashboard";
import { PwaInstallProvider } from "./components/pwainstall";


function ComingSoon({ title }) {
  return (
    <main className="entrycode-not-found">
      <div className="entrycode-auth-brand"><span className="entrycode-auth-mark">EC</span><span>Entry<span>Code</span></span></div>
      <h1>{title}</h1>
      <p>The page you requested could not be found.</p>
      <Link to="/">Return to sign in</Link>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PwaInstallProvider>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/profile" element={<StudentProfile />} />
        <Route path="/qr-code" element={<QRCodePage />} />
        <Route path="/staff-scanner" element={<StaffScanner />} />
        <Route path="/staff" element={<StaffDashboard />} />
        <Route path="/history" element={<AccessHistory />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/anomalies" element={<AdminDashboard page="anomalies" />} />
        <Route path="/admin/accounts" element={<AdminDashboard page="accounts" />} />
        <Route path="*" element={<ComingSoon title="Page Not Found" />} />
      </Routes>
      </PwaInstallProvider>
    </BrowserRouter>
  );
}

