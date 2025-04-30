import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Button, TextField, Typography, Box, Alert, CircularProgress } from '@mui/material';
import authAPI from '../../services/authAPI';
import kycAPI from '../../services/kycAPI';
import { useState } from 'react';

export default function Register() {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFileName(e.target.files[0].name);
    }
  };

  const onSubmit = async (data) => {
  try {
    setLoading(true);
    setError('');
    
    // 1. First register the user
    const registerResponse = await authAPI.register({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: data.password
    });

    // 2. Store the token from registration response
    const { token } = registerResponse.data;
    localStorage.setItem('token', token);

    // 3. Prepare and upload KYC document
    const file = data.idDocument[0];
    if (!file) {
      throw new Error('Please select an ID document');
    }
    
    const formData = new FormData();
    formData.append('idDocument', file);
    await kycAPI.upload(formData);

    // 4. Send MFA code
    await authAPI.sendMFACode(data.email);
    
    navigate('/dashboard');
    
  } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response) {
        // Handle specific error messages from server
        if (error.response.status === 409) {
          errorMessage = 'Email already registered';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
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