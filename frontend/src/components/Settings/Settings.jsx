import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from "@mui/material";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import authAPI from "../../services/authAPI";
import kycAPI from "../../services/kycAPI";
import { logout, saveUser } from "../../utils/auth";

export default function Settings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [kycFile, setKycFile] = useState(null);
  const [kycMsg, setKycMsg] = useState("");
  const [kycError, setKycError] = useState("");
  const [uploadingKyc, setUploadingKyc] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setIsLoading(true);
        setError("");
        const [meRes, kycRes] = await Promise.all([
          authAPI.getMe(),
          kycAPI.getKYCStatus()
        ]);
        if (!active) return;
        const me = meRes.user || meRes.data;
        setUser(me);
        saveUser(me);
        setKyc(kycRes.data);
      } catch (err) {
        setError(err.message || "Failed to load settings");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg("");
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      setSavingPassword(true);
      await authAPI.changePassword(currentPassword, newPassword);
      setPasswordMsg("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleKycUpload = async (e) => {
    e.preventDefault();
    setKycMsg("");
    setKycError("");

    if (!kycFile) {
      setKycError("Please select a file to upload");
      return;
    }

    try {
      setUploadingKyc(true);
      const formData = new FormData();
      formData.append("idDocument", kycFile);
      await kycAPI.uploadKYC(formData);
      setKycMsg("Document uploaded. Verification takes a few seconds.");
      setKycFile(null);
      const kycRes = await kycAPI.getKYCStatus();
      setKyc(kycRes.data);
    } catch (err) {
      setKycError(err.message || "KYC upload failed");
    } finally {
      setUploadingKyc(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  if (isLoading) {
    return (
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <TopNavbar title="Settings" />
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        </main>
      </div>
    );
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content">
        <TopNavbar title="Settings" />

        <Box sx={{ p: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Stack spacing={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Profile</Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                <TextField label="Full Name" value={user?.fullName || ""} fullWidth disabled />
                <TextField label="Email" value={user?.email || ""} fullWidth disabled />
                <TextField label="Phone" value={user?.phone || ""} fullWidth disabled />
                <FormControl fullWidth disabled>
                  <InputLabel>Verification</InputLabel>
                  <Select
                    value={user?.kycVerified ? "verified" : user?.isVerified ? "email_verified" : "pending"}
                    label="Verification"
                  >
                    <MenuItem value="pending">Pending</MenuItem>
                    <MenuItem value="email_verified">Email Verified</MenuItem>
                    <MenuItem value="verified">Fully Verified</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>KYC Verification</Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body2" sx={{ mb: 2 }}>
                Status:
                {kyc?.verified
                  ? " Verified \u2705"
                  : kyc?.submissions?.length
                    ? " Pending review \u23F3"
                    : " Not submitted \u26D4"}
              </Typography>

              {(kyc?.submissions?.length > 0) && (
                <Box sx={{ mb: 2 }}>
                  {kyc.submissions.map((s) => (
                    <Typography key={s.id} variant="caption" display="block" color="text.secondary">
                      {s.originalName} — {s.status}
                      {s.verifiedAt ? ` on ${new Date(s.verifiedAt).toLocaleDateString()}` : ""}
                    </Typography>
                  ))}
                </Box>
              )}

              {!kyc?.verified && (
                <form onSubmit={handleKycUpload}>
                  <TextField
                    type="file"
                    inputProps={{ accept: "image/*,.pdf" }}
                    onChange={(e) => setKycFile(e.target.files?.[0] || null)}
                    fullWidth
                    sx={{ mb: 1 }}
                    helperText={kycFile ? kycFile.name : "Upload a government-issued ID (max 5MB)"}
                  />
                  {kycError && <Alert severity="error" sx={{ mb: 1 }}>{kycError}</Alert>}
                  {kycMsg && <Alert severity="success" sx={{ mb: 1 }}>{kycMsg}</Alert>}
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={uploadingKyc || !kycFile}
                  >
                    {uploadingKyc ? "Uploading..." : "Upload ID"}
                  </Button>
                </form>
              )}
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Change Password</Typography>
              <Divider sx={{ mb: 2 }} />
              <form onSubmit={handleChangePassword}>
                <Stack spacing={2}>
                  <TextField
                    label="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    fullWidth
                    required
                    autoComplete="current-password"
                  />
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
                    <TextField
                      label="New Password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      fullWidth
                      required
                      autoComplete="new-password"
                    />
                    <TextField
                      label="Confirm New Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      fullWidth
                      required
                      autoComplete="new-password"
                    />
                  </Box>
                  {passwordError && <Alert severity="error">{passwordError}</Alert>}
                  {passwordMsg && <Alert severity="success">{passwordMsg}</Alert>}
                  <Box>
                    <Button type="submit" variant="contained" disabled={savingPassword}>
                      {savingPassword ? "Saving..." : "Change Password"}
                    </Button>
                  </Box>
                </Stack>
              </form>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Session</Typography>
              <Divider sx={{ mb: 2 }} />
              <Button variant="outlined" color="error" onClick={handleLogout}>
                Log Out
              </Button>
            </Paper>
          </Stack>
        </Box>
      </main>
    </div>
  );
}