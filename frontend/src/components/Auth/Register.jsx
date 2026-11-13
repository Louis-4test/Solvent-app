import { Controller, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material';
import authAPI from '../../services/authAPI';
import kycAPI from '../../services/kycAPI';
import { PasswordVisibilityAdornment } from './PasswordInput';
import './Auth.css';

const pageSx = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  width: '100%',
  p: 2,
  bgcolor: '#edf2f7'
};

const cardSx = {
  maxWidth: 400,
  width: '100%',
  p: { xs: 2.5, sm: 4 },
  boxShadow: 3,
  borderRadius: 2,
  bgcolor: 'background.paper'
};

const primaryButtonSx = {
  py: 1.5,
  bgcolor: '#1a73e8',
  '&:hover': {
    bgcolor: '#1765cc'
  }
};

export default function Register() {
  const { control, register, handleSubmit, formState: { errors }, watch, reset } = useForm();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const selectedFile = watch('idDocument')?.[0];

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setError('');

      // 1. Register the user
      const response = await authAPI.register({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password
      });

      // 2. Store token and user data
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // 3. Upload KYC document if provided
      if (data.idDocument?.[0]) {
        const formData = new FormData();
        formData.append('idDocument', data.idDocument[0]);
        await kycAPI.uploadKYC(formData);
      }

      // 4. Send verification email
      try {
        await authAPI.sendMFACode(data.email);
      } catch (emailError) {
        console.warn('Verification email failed:', emailError.message);
      }

      reset();
      navigate('/login', { replace: true });
    } catch (error) {
      let errorMessage = 'Registration failed. Please try again.';

      if (error.response) {
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
    <Box sx={pageSx}>
      <Box sx={cardSx}>
        <Typography variant="h5" sx={{ mb: 3, textAlign: 'center', fontWeight: 'bold' }}>
          Registration
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Stack spacing={2}>
            <Controller
              name="fullName"
              control={control}
              rules={{
                required: 'Full Name is required',
                minLength: {
                  value: 3,
                  message: 'Minimum 3 characters required'
                }
              }}
              render={({ field: { ref, ...field }, fieldState }) => (
                <TextField
                  {...field}
                  inputRef={ref}
                  label="Full Name"
                  type="text"
                  fullWidth
                  disabled={loading}
                  autoComplete="name"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="email"
              control={control}
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              }}
              render={({ field: { ref, ...field }, fieldState }) => (
                <TextField
                  {...field}
                  inputRef={ref}
                  label="E-Mail"
                  type="email"
                  fullWidth
                  disabled={loading}
                  autoComplete="email"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <Controller
              name="phone"
              control={control}
              rules={{
                required: 'Phone Number is required',
                pattern: {
                  value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/,
                  message: 'Invalid phone number'
                }
              }}
              render={({ field: { ref, ...field }, fieldState }) => (
                <TextField
                  {...field}
                  inputRef={ref}
                  label="Phone Number"
                  type="tel"
                  fullWidth
                  disabled={loading}
                  autoComplete="tel"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />

            <div className="auth-field">
              <input
                type="file"
                accept=".pdf,.jpg,.png,.jpeg"
                className="auth-file-input"
                id="idDocument"
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
              />
              <label
                htmlFor="idDocument"
                className={`auth-file-label${selectedFile ? ' has-file' : ''}`}
              >
                <span>Upload ID</span>
                {selectedFile && <span className="auth-file-meta">{selectedFile.name}</span>}
              </label>
              {errors.idDocument && <p className="auth-error-text">{errors.idDocument.message}</p>}
            </div>

            <Controller
              name="password"
              control={control}
              rules={{
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Minimum 8 characters required'
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                  message: 'Must contain uppercase, lowercase, number, and special character'
                }
              }}
              render={({ field: { ref, ...field }, fieldState }) => (
                <TextField
                  {...field}
                  inputRef={ref}
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  disabled={loading}
                  autoComplete="new-password"
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <PasswordVisibilityAdornment
                          visible={showPassword}
                          onToggle={() => setShowPassword((current) => !current)}
                          disabled={loading}
                        />
                      )
                    }
                  }}
                />
              )}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={primaryButtonSx}
            >
              {loading ? 'Creating account...' : 'Register'}
            </Button>
          </Stack>
        </form>

        <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }}>
          Already have an account?{' '}
          <Button
            type="button"
            size="small"
            onClick={() => navigate('/login')}
            disabled={loading}
            sx={{ textTransform: 'none', p: 0, minWidth: 0, fontSize: '0.875rem' }}
          >
            Login here
          </Button>
        </Typography>
      </Box>
    </Box>
  );
}
