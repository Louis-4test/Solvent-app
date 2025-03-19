import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Register from "./components/Auth/Register";
import Login from "./components/Auth/Login";
import ForgotPassword from "./components/Auth/ForgotPassword";
import MFAVerification from "./components/Auth/MFAVerification";

import Dashboard from "./components/Dashboard/Dashboard";
import Transfer from "./components/Transactions/Transfer";

function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-mfa" element={<MFAVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Dashboard and Transactions */}
        <Route path="/" element={<Dashboard />} />
        <Route path="/transfer/:type" element={<Transfer />} />
      </Routes>
    </Router>
  );
}

export default App;
