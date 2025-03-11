// ForgotPassword.jsx
export default function ForgotPassword() {
    const [email, setEmail] = useState('');
  
    const handleSubmit = async () => {
      await authAPI.forgotPassword(email);
      alert('Password reset instructions sent to your email');
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
  
  // Reset Password Component
  const ResetPassword = ({ token }) => {
    const [newPassword, setNewPassword] = useState('');
  
    const handleSubmit = async () => {
      await authAPI.resetPassword(token, newPassword);
      navigate('/login');
    };
  
    return (
      <div>
        <TextField
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Button onClick={handleSubmit}>Set New Password</Button>
      </div>
    );
  };