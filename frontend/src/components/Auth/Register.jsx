import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Typography, Box, Alert, CircularProgress } from '@mui/material';
import authAPI from '../../services/authAPI';
import uploadKYC from '../../services/kycAPI';
import { useState } from 'react';

export default function Register() {
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');
      setSuccess(false);
      
      // 1. Register the user
      const response = await authAPI.register({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password
      });

      console.log('Registration response:', response); // Debugging

      // 2. Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Skip KYC in development if you want
    if (process.env.NODE_ENV !== 'development' && data.idDocument?.[0]) {
      const formData = new FormData();
      formData.append('idDocument', data.idDocument[0]);
      await uploadKYC(formData);
    }

      // 4. Send verification email
      try {
        await authAPI.sendMFACode(data.email);
      } catch (emailError) {
        console.warn('Verification email failed:', emailError.message);
        // Continue even if email fails
      }

      // 5. Handle successful registration
      setSuccess(true);
      reset();
      
      // Always go to dashboard in development
      navigate('/', { replace: true });

    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response) {
        // Handle specific HTTP errors
        switch (error.response.status) {
          case 409:
            errorMessage = 'Email already registered';
            break;
          case 400:
            errorMessage = error.response.data?.message || 'Invalid registration data';
            break;
          case 422:
            errorMessage = 'Validation failed: ' + 
              (error.response.data?.errors?.join(', ') || 'Invalid data');
            break;
          default:
            errorMessage = error.response.data?.message || `Server error (${error.response.status})`;
        }
      } else if (error.message) {
        errorMessage = error.message.includes('Invalid server response') 
          ? 'Registration service is currently unavailable'
          : error.message;
      }
      
      setError(errorMessage);
      console.error('Registration error:', {
        error: error.message,
        response: error.response?.data,
        stack: error.stack
      });
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
        width: '100vw',
        bgcolor: 'background.default',
        p: 2
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
          Create Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
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
              <Button 
                variant="outlined" 
                component="span" 
                fullWidth 
                sx={{ 
                  py: 1.5,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>
                  {fileName || 'Upload ID (JPG/PNG/PDF)'}
                </span>
                {fileName && (
                  <Typography variant="caption" sx={{ ml: 1 }}>
                    {(watch('idDocument')?.[0]?.size / (1024 * 1024)).toFixed(2)}MB
                  </Typography>
                )}
              </Button>
            </label>
            {errors.idDocument && (
              <Typography color="error" variant="caption" sx={{ mt: 0.5, display: 'block' }}>
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
            disabled={loading}
          />

          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth 
            sx={{ 
              py: 1.5, 
              mb: 2,
              height: 48
            }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Create Account'
            )}
          </Button>

          <Typography variant="body2" sx={{ textAlign: 'center' }}>
            Already have an account?{' '}
            <Button 
              onClick={() => navigate('/login')} 
              sx={{ 
                textTransform: 'none',
                fontWeight: 'bold'
              }}
              disabled={loading}
            >
              Sign In
            </Button>
          </Typography>
        </form>
      </Box>
    </Box>
  );
}