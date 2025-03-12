import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import authAPI from "../../services/authAPI";


export default function Login() {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      const response = await authAPI.login(data);
      
      if(response.mfaRequired) {
        navigate('/verify-mfa');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Typography variant="h4">LOGIN</Typography>

      <TextField
        label="Email/Phone Number"
        {...register('identifier', { required: true })}
        fullWidth
      />

      <TextField
        label="Password"
        type="password"
        {...register('password', { required: true })}
        fullWidth
      />

      <Button onClick={() => navigate('/forgot-password')}>
        Forgot password? Click here
      </Button>

      <Button type="submit" variant="contained" color="primary">
        Login
      </Button>

      <Typography>
        Don’t have an account? <Button onClick={() => navigate('/register')}>Register here</Button>
      </Typography>
    </form>
  );
}