/* eslint-disable react/prop-types */
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

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="sidebar">
      <h2 className="logo">SOLVENT</h2>
      <div className="nav-links">
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={location.pathname === to ? "active" : ""}
          >
            {label}
          </Link>
        ))}
        <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="logout">
          {"\u{1F6AA} Logout"}
        </a>
      </div>
    </div>
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