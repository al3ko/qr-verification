import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import Icon from "./icon";
import { PwaInstallButton } from "./pwainstall";
import "../styles/portal.css";

export default function PortalLayout({ title, role = "student", children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem("qr-portal-theme") || "light");
  useEffect(() => { localStorage.setItem("qr-portal-theme", theme); }, [theme]);
  const links = role === "admin" ? [{ to: "/admin", label: "Dashboard", icon: "dashboard" }] : role === "guard" ? [
    { to: "/staff-scanner", label: "QR Scanner", icon: "scan" }, { to: "/history", label: "Scan History", icon: "history" },
  ] : role === "staff" ? [
    { to: "/staff", label: "Home", icon: "home" }, { to: "/history", label: "History", icon: "history" },
  ] : [
    { to: "/student", label: "Home", icon: "home" }, { to: "/profile", label: "Profile", icon: "profile" }, { to: "/history", label: "History", icon: "history" },
  ];
  function logOut(event) {
    event.preventDefault();
    localStorage.removeItem("access_token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("verification_phase");
    sessionStorage.removeItem("verification_location");
    window.location.assign("/");
  }
  function renderLinks() {
    return links.map((link) => <NavLink key={link.to} to={link.to} end className={({ isActive }) => `portal-nav-link ${isActive ? "active" : ""}`}>
      <span className="portal-nav-icon"><Icon name={link.icon} /></span><span>{link.label}</span>
    </NavLink>);
  }
  return <div className="portal" data-theme={theme}>
    <aside className="portal-sidebar">
      <Link to="/" className="portal-brand"><span className="portal-brand-mark"><Icon name="dashboard" /></span>QR Verify</Link>
      <p className="portal-role">{role === "guard" ? "Security Staff" : role} portal</p>
      <nav className="portal-nav" aria-label="Main navigation">{renderLinks()}</nav>
      <Link to="/" onClick={logOut} className="portal-logout"><Icon name="logout" /><span>Log out</span></Link>
    </aside>
    <main className="portal-main">
      <header className="portal-header"><div><p className="portal-eyebrow">Student Identity Verification</p><h1>{title}</h1></div>
        <div className="portal-header-actions"><span className="portal-user">{role === "admin" ? "Administrator" : role === "guard" ? "Security Staff" : role === "staff" ? "Staff" : "Student"}</span>
          <PwaInstallButton className="pwa-install-header" />
          <button type="button" className="portal-theme-toggle" onClick={() => setTheme((value) => value === "light" ? "dark" : "light")} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`} title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}><Icon name={theme === "light" ? "moon" : "sun"} /></button>
        </div>
      </header>
      <section className="portal-content">{children}</section>
    </main>
    <nav className="portal-mobile-nav" aria-label="Mobile navigation">{renderLinks()}<Link to="/" onClick={logOut} className="portal-nav-link"><span className="portal-nav-icon"><Icon name="logout" /></span><span>Log out</span></Link></nav>
  </div>;
}