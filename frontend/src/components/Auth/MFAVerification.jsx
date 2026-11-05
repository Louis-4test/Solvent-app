import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert } from '@mui/material';
import authAPI from '../../services/authAPI';
import { saveAuth } from '../../utils/auth';

export default function MFAVerification() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  const handleVerify = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await authAPI.verifyMFA(email, code);

      // Store token in localStorage
      saveAuth(response.token, response.user);

      // Navigate to dashboard
      navigate('/');
    } catch (error) {
      console.error('MFA verification failed:', error);
      setError(error.response?.data?.error || error.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        width: '100%',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: '100%',
          p: { xs: 2.5, sm: 4 },
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h4" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
          Verify Your Identity
        </Typography>
        <Typography sx={{ mb: 3, textAlign: 'center' }}>
          We have sent a 6-digit code to your email. Please enter it below.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          label="Verification Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />

        <Button
          variant="contained"
          onClick={handleVerify}
          disabled={loading || !code}
          fullWidth
          sx={{ py: 1.5 }}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </Button>
      </Box>
    </Box>
  );
}