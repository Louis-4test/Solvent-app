import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Register from "./components/Auth/Register";
import Login from "./components/Auth/Login";
import ForgotPassword from "./components/Auth/ForgotPassword";
import MFAVerification from "./components/Auth/MFAVerification";

import Dashboard from "./components/Dashboard/Dashboard";
import Transfer from "./components/Transactions/Transfer";
import Transactions from "./components/Transactions/Transactions"; 
import BillPayment from "./components/payment/BillPayment";
import MerchantPayment from "./components/payment/MerchantPayment";


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
        <Route path="/transactions" element={<Transactions />} /> {/* Add this route */}
        <Route path="/transfer/:type" element={<Transfer />} />
        <Route path="/billpayment" element={<BillPayment />} />
        <Route path="/merchant-payment" element={<MerchantPayment />} />
      </Routes>
    </Router>
  );
}

export default App;