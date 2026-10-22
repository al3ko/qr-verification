
import { NavLink, Link } from "react-router-dom";
import "../styles/portal.css";

function PortalLayout({ title, role = "student", children }) {
  const links =
    role === "admin"
      ? [
          { to: "/admin", label: "Admin Dashboard" },
          { to: "/staff-scanner", label: "Staff Scanner" },
        ]
      : role === "staff"
      ? [
          { to: "/staff-scanner", label: "QR Scanner" },
        ]
      : [
          { to: "/student", label: "Dashboard" },
          { to: "/profile", label: "My Profile" },
          { to: "/qr-code", label: "My QR Code" },
        ];

  return (
    <div className="portal">
      <aside className="portal-sidebar">
        <Link to="/" className="portal-brand">
          QR Verify
        </Link>

        <p className="portal-role">{role} portal</p>

        <nav className="portal-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `portal-nav-link ${isActive ? "active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <Link to="/" className="portal-logout">
          Log out
        </Link>
      </aside>

      <main className="portal-main">
        <header className="portal-header">
          <div>
            <p className="portal-eyebrow">Student Identity Verification</p>
            <h1>{title}</h1>
          </div>
          <span className="portal-user">
            {role === "admin"
              ? "Administrator"
              : role === "staff"
              ? "Verification Staff"
              : "Student"}
          </span>
        </header>

        <section className="portal-content">{children}</section>
      </main>
    </div>
  );
}

export default PortalLayout;
