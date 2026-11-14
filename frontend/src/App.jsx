import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Register from "./components/Auth/Register";
import Login from "./components/Auth/Login";
import ForgotPassword from "./components/Auth/ForgotPassword";
import ResetPassword from "./components/Auth/ResetPassword";
import MFAVerification from "./components/Auth/MFAVerification";
import ProtectedRoute from "./components/Auth/ProtectedRoute";

import Dashboard from "./components/Dashboard/Dashboard";
import Transfer from "./components/Transactions/Transfer";
import Transactions from "./components/Transactions/Transactions";
import BillPayment from "./components/payment/BillPayment";
import MerchantPayment from "./components/payment/MerchantPayment";
import Receipts from "./components/Receipts/Receipts";
import ReceiptView from "./components/Receipts/ReceiptView";
import Notifications from "./components/Notifications/Notifications";
import Settings from "./components/Settings/Settings";
import Profile from "./components/Profile/Profile";
import AdminDashboard from "./components/Admin/AdminDashboard";
import AdminRoute from "./components/Auth/AdminRoute";


function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-mfa" element={<MFAVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Dashboard and Transactions (protected) */}
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/receipts" element={<ProtectedRoute><Receipts /></ProtectedRoute>} />
        <Route path="/receipts/:reference" element={<ProtectedRoute><ReceiptView /></ProtectedRoute>} />
        <Route path="/transfer/:type" element={<ProtectedRoute><Transfer /></ProtectedRoute>} />
        <Route path="/bill-payment" element={<ProtectedRoute><BillPayment /></ProtectedRoute>} />
        <Route path="/merchant-payment" element={<ProtectedRoute><MerchantPayment /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;