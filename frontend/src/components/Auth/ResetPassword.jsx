import { useState } from "react";
import { useNavigate, useSearchParams, Link as RouterLink } from "react-router-dom";
import { TextField, Button, Typography, Box, Alert } from "@mui/material";
import authAPI from "../../services/authAPI";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Missing reset token. Please use the link from your email.");
      return;
    }

    try {
      setIsLoading(true);
      await authAPI.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        bgcolor: "background.default"
      }}
    >
      <Box
        sx={{
          maxWidth: 400,
          width: "90%",
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: "background.paper"
        }}
      >
        <Typography variant="h5" sx={{ mb: 1, textAlign: "center", fontWeight: "bold" }}>
          Reset Password
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, textAlign: "center" }}>
          Choose a new password for your account.
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Password reset successful! Redirecting to login...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            label="New Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            autoComplete="new-password"
            sx={{ mb: 2 }}
          />
          <TextField
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            required
            autoComplete="new-password"
            sx={{ mb: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
            sx={{ py: 1.5, mb: 2 }}
          >
            {isLoading ? "Saving..." : "Reset Password"}
          </Button>

          <Typography variant="body2" sx={{ textAlign: "center" }}>
            Remembered your password?{" "}
            <Button component={RouterLink} to="/login" sx={{ textTransform: "none" }}>
              Back to Login
            </Button>
          </Typography>
        </form>
      </Box>
    </Box>
  );
}