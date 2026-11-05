/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout, getUser } from "../../utils/auth";
import "./Layout.css";

const NAV_LINKS = [
  { to: "/", label: "\u{1F3E0} Home" },
  { to: "/transactions", label: "\u{1F4DC} Transactions" },
  { to: "/transfer/bank-to-momo", label: "\u{1F4B0} Fund Transfer" },
  { to: "/bill-payment", label: "\u{1F4C4} Bill Payment" },
  { to: "/merchant-payment", label: "\u{1F3EA} Merchant Payment" },
  { to: "/notifications", label: "\u{1F514} Notifications" },
  { to: "/settings", label: "\u{2699}\u{FE0F} Settings" }
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent the page behind the drawer from scrolling while it is open.
  useEffect(() => {
    document.body.classList.toggle("no-scroll", mobileOpen);
    return () => document.body.classList.remove("no-scroll");
  }, [mobileOpen]);

  // Close the drawer if the viewport grows back to desktop size.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? "\u2715" : "\u2630"}
      </button>

      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className={`sidebar${mobileOpen ? " open" : ""}`}>
        <h2 className="logo">SOLVENT</h2>
        <div className="nav-links">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={location.pathname === to ? "active" : ""}
              onClick={() => setMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="logout">
            {"\u{1F6AA} Logout"}
          </a>
        </div>
      </div>
    </>
  );
};

const TopNavbar = ({ title }) => {
  const user = getUser();

  return (
    <div className="navbar">
      <h1>{title}</h1>
      <div className="user-info">
        <span className="card">{"\u{1F6D2}"}</span>
        <span className="user-name">{user?.fullName || "User"}</span>
      </div>
    </div>
  );
};

export default Sidebar;
export { TopNavbar };
