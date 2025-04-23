import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Typography, Box, Alert } from '@mui/material';
import authAPI from '../../services/authAPI';
import kycAPI from '../../services/kycAPI';
import { useState } from 'react';

export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
  
      // Step 1: Register user
      const registerResponse = await authAPI.register(data);
      
      // Step 2: Upload KYC document
      const file = data.idDocument[0];
      const formData = new FormData();
      formData.append('idDocument', file);
      formData.append('userId', registerResponse.userId);
      
      // Add headers for file upload
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const kycResponse = await kycAPI.upload(formData, config);
  
      // Step 3: Send MFA code
      await authAPI.sendMFACode(data.email);
      
      navigate('/verify-mfa', { 
        state: { 
          email: data.email,
          action: 'registration'
        }
      });
      
    } catch (error) {
      let errorMessage = 'Registration failed';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || errorMessage;
      } else if (error.request) {
        // Request was made but no response
        errorMessage = 'Network error - please check your connection';
      }
      
      setError(errorMessage);
      console.error('Registration error:', error);
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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            label="Full Name"
            {...register('fullName', { 
              required: 'Full Name is required',
              minLength: {
                value: 3,
                message: 'Minimum 3 characters required'
              }
            })}
            error={!!errors.fullName}
            helperText={errors.fullName?.message}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Email"
            type="email"
            {...register('email', { 
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address'
              }
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
            sx={{ mb: 2 }}
          />

          <TextField
            label="Phone Number"
            {...register('phone', { 
              required: 'Phone Number is required',
              pattern: {
                value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
                message: 'Invalid phone number'
              }
            })}
            error={!!errors.phone}
            helperText={errors.phone?.message}
            fullWidth
            sx={{ mb: 2 }}
          />

          <Box sx={{ mb: 2 }}>
            <input
              type="file"
              accept=".pdf,.jpg,.png,.jpeg"
              {...register('idDocument', { 
                required: 'ID Document is required',
                validate: {
                  fileSize: files => 
                    files[0]?.size <= 5 * 1024 * 1024 || 'Max file size is 5MB',
                  fileType: files => 
                    ['image/jpeg', 'image/png', 'application/pdf'].includes(files[0]?.type) || 
                    'Only JPG, PNG, or PDF files are allowed'
                }
              })}
              style={{ display: 'none' }}
              id="idDocument"
            />
            <label htmlFor="idDocument">
              <Button variant="outlined" component="span" fullWidth sx={{ py: 1 }}>
                Upload ID (JPG/PNG/PDF, max 5MB)
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
            {...register('password', { 
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Minimum 8 characters required'
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                message: 'Must contain uppercase, lowercase, number, and special character'
              }
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
            fullWidth
            sx={{ mb: 3 }}
          />

          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ py: 1.5, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Register'}
          </Button>

          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Already have an account?{' '}
            <Button 
              onClick={() => navigate('/login')} 
              sx={{ textTransform: 'none' }}
              disabled={loading}
            >
              Login here
            </Button>
          </Typography>
        </form>
      </Box>
    </Box>
  );
}