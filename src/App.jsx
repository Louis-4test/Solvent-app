import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Register from "./components/Auth/Register";
import Login from "./components/Auth/Login";
import ForgotPassword from "./components/Auth/ForgotPassword";
import MFAVerification from './components/Auth/MFAVerification';

function App() {
  return (
    <Router> {/* Wrap everything inside Router here */}
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/verify-mfa" element={<MFAVerification />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
