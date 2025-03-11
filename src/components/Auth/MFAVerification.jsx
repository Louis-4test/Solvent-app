import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Typography, 
  TextField, 
  Button, 
  Box,
  CircularProgress,
  Alert 
} from '@mui/material';
import authAPI from '../../services/authAPI';

export default function MFAVerification() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleVerify = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      if (!/^\d{6}$/.test(code)) {
        throw new Error("Invalid code format - must be 6 digits");
      }

      await authAPI.verifyMFA(code);
      navigate("/dashboard");
    } catch (error) {
      setError(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Multi-Factor Authentication
      </Typography>
      
      <Typography variant="body1" gutterBottom>
        We've sent a 6-digit code to your registered email/phone
      </Typography>

      <TextField
        fullWidth
        label="Verification Code"
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} // Numbers only
        inputProps={{ 
          maxLength: 6,
          inputMode: 'numeric'
        }}
        sx={{ my: 2 }}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Button
        fullWidth
        variant="contained"
        onClick={handleVerify}
        disabled={isLoading || code.length !== 6}
      >
        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          'Verify Code'
        )}
      </Button>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button 
          variant="text" 
          onClick={() => authAPI.sendMFACode()}
        >
          Resend Code
        </Button>
      </Box>
    </Box>
  );
}