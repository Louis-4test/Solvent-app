import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Typography, Box, Alert } from '@mui/material';
import authAPI from '../../services/authAPI';
import kycAPI from '../../services/kycAPI';

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const file = data.idDocument[0];
      const formData = new FormData();
      formData.append('idDocument', file);

      await authAPI.register(data);
      const kycResponse = await kycAPI.upload(formData);

      if (kycResponse.data.verified) {
        await authAPI.sendMFACode(data.email);
        navigate('/verify-mfa');
      }
    } catch (error) {
      console.error('Registration failed:', error.response?.data);
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        width: '100vw',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          maxWidth: 450,
          width: '90%',
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h4" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
          Registration
        </Typography>

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Full Name"
            {...register('fullName', { required: 'Full Name is required' })}
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Email"
            type="email"
            {...register('email', { required: 'Email is required' })}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Phone Number"
            {...register('phone', { required: 'Phone Number is required' })}
            error={!!errors.phone}
            helperText={errors.phone?.message}
            fullWidth
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              accept=".pdf,.jpg,.png"
              {...register('idDocument', { required: 'ID Document is required' })}
              style={{ display: 'none' }}
              id="idDocument"
            />
            <label htmlFor="idDocument">
              <Button variant="outlined" component="span" fullWidth sx={{ py: 1 }}>
                Upload ID
              </Button>
            </label>
            {errors.idDocument && (
              <Typography color="error" sx={{ mt: 1 }}>
                {errors.idDocument.message}
              </Typography>
            )}
          </Box>

          <TextField
            label="Password"
            type="password"
            {...register('password', { required: 'Password is required' })}
            error={!!errors.password}
            helperText={errors.password?.message}
            fullWidth
            sx={{ mb: 3 }}
          />

          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ py: 1.5, mb: 2 }}>
            Register
          </Button>

          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Already have an account?{' '}
            <Button onClick={() => navigate('/login')} sx={{ textTransform: 'none' }}>
              Login here
            </Button>
          </Typography>
        </form>
      </Box>
    </Box>
  );
}
