import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import Sidebar, { TopNavbar } from "../Layout/Sidebar";
import { PasswordVisibilityAdornment } from "../Auth/PasswordInput";
import authAPI from "../../services/authAPI";
import { resolveMediaUrl } from "../../services/api";
import { getUser, logout, saveUser } from "../../utils/auth";

const initialsFor = (name) => {
  const source = name || "User";
  return source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

const CameraIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
    <path
      d="M4 7h3l2-2h6l2 2h3v12H4V7Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="13"
      r="3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);

const MAX_AVATAR_SIZE = 3 * 1024 * 1024;
const emptyForm = { fullName: "", email: "", phone: "" };

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(getUser());
  const [form, setForm] = useState(emptyForm);
  const [savedForm, setSavedForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const avatarInputRef = useRef(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError("");
        const response = await authAPI.getMe();
        const me = response.user || response.data;

        if (!active || !me) return;

        setUser(me);
        saveUser(me);
        const nextForm = {
          fullName: me.fullName || "",
          email: me.email || "",
          phone: me.phone || ""
        };
        setForm(nextForm);
        setSavedForm(nextForm);
      } catch (err) {
        if (active) setError(err.message || "Failed to load your profile");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadProfile();
    return () => { active = false; };
  }, []);

  const openAvatarPicker = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarSelect = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setError("");
    setSuccess("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setError("Profile picture must be 3 MB or smaller.");
      return;
    }

    try {
      setAvatarUploading(true);
      const response = await authAPI.uploadAvatar(file);
      const updated = response.user;

      if (!updated) {
        throw new Error("Profile picture upload failed");
      }

      setUser(updated);
      saveUser(updated);
      setSuccess("Profile picture updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update your profile picture");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setError("");
    setSuccess("");

    try {
      setAvatarUploading(true);
      const response = await authAPI.removeAvatar();
      const updated = response.user;

      if (!updated) {
        throw new Error("Profile picture removal failed");
      }

      setUser(updated);
      saveUser(updated);
      setSuccess("Profile picture removed.");
    } catch (err) {
      setError(err.message || "Failed to remove your profile picture");
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleReset = () => {
    setForm(savedForm);
    setError("");
    setSuccess("");
  };

  const isDirty =
    form.fullName !== savedForm.fullName ||
    form.email !== savedForm.email ||
    form.phone !== savedForm.phone;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.fullName.trim().length < 3) {
      setError("Full name must be at least 3 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Phone number is required.");
      return;
    }

    try {
      setSaving(true);
      const response = await authAPI.updateProfile({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim()
      });
      const updated = response.user || { ...user, ...form };

      setUser(updated);
      saveUser(updated);
      const nextForm = {
        fullName: updated.fullName || "",
        email: updated.email || "",
        phone: updated.phone || ""
      };
      setForm(nextForm);
      setSavedForm(nextForm);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.message || "Failed to update your profile");
    } finally {
      setSaving(false);
    }
  };

  const openDeleteDialog = () => {
    setDeletePassword("");
    setShowDeletePassword(false);
    setDeleteError("");
    setDeleteOpen(true);
  };

  const closeDeleteDialog = () => {
    if (deleting) return;
    setDeleteOpen(false);
    setDeletePassword("");
    setShowDeletePassword(false);
    setDeleteError("");
  };

  const handleDelete = async () => {
    setDeleteError("");

    if (!deletePassword) {
      setDeleteError("Enter your password to confirm account deletion.");
      return;
    }

    try {
      setDeleting(true);
      await authAPI.deleteProfile(deletePassword);
      logout();
      navigate("/login", { replace: true });
    } catch (err) {
      setDeleteError(err.message || "Failed to delete your account");
    } finally {
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-content">
          <TopNavbar title="Profile" />
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <TopNavbar title="Profile" />

        <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 980, mx: "auto" }}>
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <Paper sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap"
                }}
              >
                <Box sx={{ position: "relative", flex: "0 0 auto" }}>
                  <Avatar
                    src={user?.avatarUrl ? resolveMediaUrl(user.avatarUrl) : undefined}
                    alt={user?.fullName || "Profile picture"}
                    sx={{
                      width: 96,
                      height: 96,
                      bgcolor: "#1a73e8",
                      fontSize: 32,
                      fontWeight: 700
                    }}
                  >
                    {initialsFor(user?.fullName)}
                  </Avatar>
                  <IconButton
                    size="small"
                    onClick={openAvatarPicker}
                    disabled={avatarUploading}
                    aria-label="Change profile picture"
                    sx={{
                      position: "absolute",
                      right: -2,
                      bottom: -2,
                      width: 34,
                      height: 34,
                      bgcolor: "#ffffff",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 2px 8px rgba(15, 23, 42, 0.12)",
                      "&:hover": { bgcolor: "#f8fafc" }
                    }}
                  >
                    {avatarUploading ? <CircularProgress size={16} /> : <CameraIcon />}
                  </IconButton>
                </Box>
                <Box sx={{ flex: 1, minWidth: 220 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {user?.fullName || "Your profile"}
                  </Typography>
                  <Typography color="text.secondary">
                    {user?.email || "No email available"}
                  </Typography>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.25, flexWrap: "wrap" }}>
                    <Chip
                      size="small"
                      label={user?.kycVerified ? "KYC verified" : "KYC pending"}
                      color={user?.kycVerified ? "success" : "warning"}
                    />
                    <Chip
                      size="small"
                      label={user?.isVerified ? "Email verified" : "Email unverified"}
                      color={user?.isVerified ? "success" : "default"}
                    />
                    <Chip
                      size="small"
                      label={user?.mfaEnabled ? "2FA enabled" : "2FA off"}
                      color={user?.mfaEnabled ? "success" : "default"}
                    />
                  </Stack>
                  <Stack direction="row" spacing={1} useFlexGap sx={{ mt: 1.5, flexWrap: "wrap" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<CameraIcon />}
                      onClick={openAvatarPicker}
                      disabled={avatarUploading}
                    >
                      {avatarUploading
                        ? "Uploading..."
                        : user?.avatarUrl
                          ? "Change photo"
                          : "Add photo"}
                    </Button>
                    {user?.avatarUrl && (
                      <Button
                        size="small"
                        variant="text"
                        color="error"
                        onClick={handleRemoveAvatar}
                        disabled={avatarUploading}
                      >
                        Remove photo
                      </Button>
                    )}
                  </Stack>
                </Box>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  hidden
                  onChange={handleAvatarSelect}
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box
                component="form"
                onSubmit={handleSubmit}
                noValidate
                sx={{ display: "grid", gap: 2 }}
              >
                <Typography variant="h6">Personal information</Typography>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                    gap: 2
                  }}
                >
                  <TextField
                    label="Full Name"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    fullWidth
                    disabled={saving}
                    autoComplete="name"
                  />
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    fullWidth
                    disabled={saving}
                    autoComplete="email"
                  />
                  <TextField
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    fullWidth
                    disabled={saving}
                    autoComplete="tel"
                  />
                  <TextField
                    label="Member since"
                    value={
                      user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })
                        : "—"
                    }
                    fullWidth
                    disabled
                  />
                </Box>

                <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: "wrap" }}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={saving || !isDirty}
                    sx={{ bgcolor: "#1a73e8", "&:hover": { bgcolor: "#1765cc" } }}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleReset}
                    disabled={saving || !isDirty}
                  >
                    Reset
                  </Button>
                </Stack>
              </Box>
            </Paper>

            <Paper
              sx={{
                p: { xs: 2, sm: 3 },
                border: "1px solid #fecaca",
                borderRadius: 3
              }}
            >
              <Typography variant="h6" color="error" sx={{ mb: 1 }}>
                Delete account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Permanently delete your profile and associated account data. This action
                cannot be undone.
              </Typography>
              <Button variant="outlined" color="error" onClick={openDeleteDialog}>
                Delete My Account
              </Button>
            </Paper>
          </Stack>
        </Box>

        <Dialog open={deleteOpen} onClose={closeDeleteDialog} fullWidth maxWidth="xs">
          <DialogTitle>Delete your account?</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Enter your password to permanently delete your Solvent account. This cannot be
              undone.
            </DialogContentText>
            <TextField
              label="Password"
              type={showDeletePassword ? "text" : "password"}
              value={deletePassword}
              onChange={(event) => setDeletePassword(event.target.value)}
              fullWidth
              autoFocus
              autoComplete="current-password"
              disabled={deleting}
              sx={{ mt: 2 }}
              slotProps={{
                input: {
                  endAdornment: (
                    <PasswordVisibilityAdornment
                      visible={showDeletePassword}
                      onToggle={() => setShowDeletePassword((current) => !current)}
                      disabled={deleting}
                    />
                  )
                }
              }}
            />
            {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDeleteDialog} disabled={deleting}>
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              color="error"
              variant="contained"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Account"}
            </Button>
          </DialogActions>
        </Dialog>
      </main>
    </div>
  );
}
