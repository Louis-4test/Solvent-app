import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authAPI from './path-to-authAPI';  

export default function ForgotPassword() {
  const navigate = useNavigate();  

  const [email, setEmail] = useState("");
  
  const handleSubmit = async () => {
    await authAPI.forgotPassword(email);
    alert("Password reset instructions sent to your email");
    navigate("/login");  // ✅ Use navigate properly
  };

  return (
    <div>
      <TextField
        label="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button onClick={handleSubmit}>Reset Password</Button>
    </div>
  );
}
