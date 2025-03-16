import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Typography, Box } from '@mui/material';
import authAPI from '../../services/authAPI';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await authAPI.login(data);
      
      if (response.mfaRequired) {
        navigate('/verify-mfa');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh', // Full viewport height
        width: '100vw', // Full viewport width
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          maxWidth: 400, // Ensures form doesn't stretch too much
          width: '90%', // Responsive width
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h4" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
          Login
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Email/Phone Number"
            {...register('identifier', { required: 'Email/Phone is required' })}
            error={!!errors.identifier}
            helperText={errors.identifier?.message}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Password"
            type="password"
            {...register('password', { required: 'Password is required' })}
            error={!!errors.password}
            helperText={errors.password?.message}
            fullWidth
            sx={{ mb: 3 }}
          />

          <Box sx={{ textAlign: 'right', mb: 2 }}>
            <Button onClick={() => navigate('/forgot-password')} sx={{ textTransform: 'none' }}>
              Forgot password?
            </Button>
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ py: 1.5, mb: 2 }}
          >
            Login
          </Button>

          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Don’t have an account?{' '}
            <Button onClick={() => navigate('/register')} sx={{ textTransform: 'none' }}>
              Register here
            </Button>
          </Typography>
        </form>
      </Box>
    </Box>
  );
}
