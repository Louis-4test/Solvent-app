/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Box, Divider, Menu, MenuItem, Typography } from "@mui/material";
import { logout, getUser, USER_UPDATED_EVENT } from "../../utils/auth";
import { resolveMediaUrl } from "../../services/api";
import "./Layout.css";

const BellIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
    <path d="M10 21h4" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M10 17l5-5-5-5" />
    <path d="M15 12H3" />
    <path d="M14 3h6a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1h-6" />
  </svg>
);

const NAV_LINKS = [
  {
    to: "/",
    label: "Home",
    icon: "/home_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.png",
    exact: true
  },
  {
    to: "/transactions",
    label: "Transactions",
    icon: "/point_of_sale_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.png"
  },
  {
    to: "/transfer/bank-to-momo",
    label: "Fund Transfer",
    icon: "/payments_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24(1).png",
    startsWith: "/transfer"
  },
  {
    to: "/bill-payment",
    label: "Bill Payment",
    icon: "/payments_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24(1).png"
  },
  {
    to: "/merchant-payment",
    label: "Merchant Payment",
    icon: "/add_shopping_cart_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.png"
  },
  {
    to: "/notifications",
    label: "Notifications",
    icon: "/notifications_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.png"
  },
  {
    to: "/settings",
    label: "Settings",
    icon: "/settings_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.png"
  }
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(getUser());

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

  // Keep the sidebar profile card in sync with profile updates.
  useEffect(() => {
    const syncUser = () => setUser(getUser());
    window.addEventListener(USER_UPDATED_EVENT, syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener(USER_UPDATED_EVENT, syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const isActive = ({ to, exact, startsWith }) => {
    if (exact) return location.pathname === to;
    if (startsWith) return location.pathname.startsWith(startsWith);
    return location.pathname === to;
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

      <aside className={`sidebar${mobileOpen ? " open" : ""}`}>
        <Link to="/" className="sidebar-logo-link" aria-label="Solvent home">
          <img src="/logo.png" alt="Solvent" className="sidebar-logo" />
        </Link>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {NAV_LINKS.map(({ to, label, icon, ...rest }) => {
            const active = isActive({ to, ...rest });
            return (
              <Link
                key={to}
                to={to}
                className={`nav-link${active ? " active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <span className="nav-icon">
                  <img src={icon} alt="" aria-hidden="true" />
                </span>
                <span className="nav-label">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <Link
            to="/profile"
            className={`sidebar-profile-link${location.pathname === "/profile" ? " active" : ""}`}
            aria-label="Open your profile"
            aria-current={location.pathname === "/profile" ? "page" : undefined}
            onClick={() => setMobileOpen(false)}
          >
            <span className="sidebar-profile-avatar" aria-hidden="true">
              {user?.avatarUrl ? (
                <img src={resolveMediaUrl(user.avatarUrl)} alt="" />
              ) : (
                getInitials(user)
              )}
            </span>
            <span className="sidebar-profile-info">
              <strong>{user?.fullName || "My Profile"}</strong>
              <small>{user?.email || "View profile details"}</small>
            </span>
          </Link>

          <a
            href="#"
            onClick={(e) => { e.preventDefault(); handleLogout(); }}
            className="nav-link logout-link"
          >
            <span className="nav-icon"><LogoutIcon /></span>
            <span className="nav-label">Logout</span>
          </a>
        </div>
      </aside>
    </>
  );
};

const getInitials = (user) => {
  const source = user?.fullName || user?.name || user?.email || "User";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const TopNavbar = ({ title, variant = "default" }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [menuAnchor, setMenuAnchor] = useState(null);

  useEffect(() => {
    const syncUser = () => setUser(getUser());
    window.addEventListener(USER_UPDATED_EVENT, syncUser);
    window.addEventListener("storage", syncUser);
    return () => {
      window.removeEventListener(USER_UPDATED_EVENT, syncUser);
      window.removeEventListener("storage", syncUser);
    };
  }, []);

  const closeMenu = () => setMenuAnchor(null);

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className={`navbar${variant === "muted" ? " navbar-muted" : ""}`}>
      <h1>{title}</h1>
      <div className="navbar-actions">
        <Link to="/notifications" className="icon-button" aria-label="Notifications">
          <BellIcon />
        </Link>
        <button
          type="button"
          className="avatar-button"
          onClick={(event) => setMenuAnchor(event.currentTarget)}
          aria-label="Open profile menu"
          aria-haspopup="menu"
          aria-expanded={Boolean(menuAnchor)}
        >
          <span className="avatar" title={user?.fullName || "User"}>
            {user?.avatarUrl ? (
              <img src={resolveMediaUrl(user.avatarUrl)} alt="" />
            ) : (
              getInitials(user)
            )}
          </span>
        </button>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={closeMenu}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
          slotProps={{
            paper: {
              sx: {
                mt: 1,
                minWidth: 240,
                borderRadius: 2,
                boxShadow: 4
              }
            }
          }}
        >
          <Box className="profile-menu-summary">
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {user?.fullName || "Your profile"}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", wordBreak: "break-word" }}
            >
              {user?.email || "View account details"}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={() => { closeMenu(); navigate("/profile"); }}>
            My Profile
          </MenuItem>
          <MenuItem onClick={() => { closeMenu(); navigate("/settings"); }}>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
            Log out
          </MenuItem>
        </Menu>
      </div>
    </header>
  );
};

export default Sidebar;
export { TopNavbar };
