import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Typography } from '@mui/material';
import authAPI from '../../services/authAPI';
import kycAPI from '../../services/kycAPI';

export default function Register() {
  
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      // Handle file upload
      const file = data.idDocument[0];
      const formData = new FormData();
      formData.append('idDocument', file);

      // Submit registration with KYC
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
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h4">Registration</Typography>

      <TextField
        label="Full Name"
        {...register('fullName', { required: 'Full Name is required' })}
        error={!!errors.fullName}
        helperText={errors.fullName?.message}
        fullWidth
      />

      <TextField
        label="Email"
        type="email"
        {...register('email', { required: 'Email is required' })}
        error={!!errors.email}
        helperText={errors.email?.message}
        fullWidth
      />

      <TextField
        label="Phone Number"
        {...register('phone', { required: 'Phone Number is required' })}
        error={!!errors.phone}
        helperText={errors.phone?.message}
        fullWidth
      />

      <input
        type="file"
        accept=".pdf,.jpg,.png"
        {...register('idDocument', { required: 'ID Document is required' })}
      />
      {errors.idDocument && (
        <Typography color="error">{errors.idDocument.message}</Typography>
      )}

      <TextField
        label="Password"
        type="password"
        {...register('password', { required: 'Password is required' })}
        error={!!errors.password}
        helperText={errors.password?.message}
        fullWidth
      />

      <Button type="submit" variant="contained" color="primary">
        Register
      </Button>

      <Typography>
        Already have an account?{' '}
        <Button onClick={() => navigate('/login')}>Login here</Button>
      </Typography>
    </form>
  );
}