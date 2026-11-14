/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import kycAPI from "../../services/kycAPI";

const DOCUMENT_LABELS = {
  national_id: "National ID",
  passport: "Passport",
  drivers_license: "Driver's licence",
  voters_card: "Voter's card"
};

const STATUS_LABELS = {
  pending: "Pending review",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected"
};

const STATUS_COLORS = {
  pending: "warning",
  under_review: "info",
  approved: "success",
  rejected: "error"
};

const EMPTY_FORM = {
  documentType: "national_id",
  documentNumber: "",
  front: null,
  back: null,
  selfie: null
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const FileField = ({ id, label, file, onChange, hint }) => (
  <Box>
    <Typography
      component="label"
      htmlFor={id}
      sx={{ display: "block", mb: 0.8, color: "#475569", fontSize: 13, fontWeight: 700 }}
    >
      {label}
    </Typography>
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        minHeight: 48,
        px: 1.4,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 2
      }}
    >
      <Button component="label" variant="outlined" size="small" sx={{ flex: "0 0 auto", textTransform: "none" }}>
        Choose file
        <input id={id} type="file" hidden accept="image/jpeg,image/png,image/webp,application/pdf" onChange={onChange} />
      </Button>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {file?.name || hint}
      </Typography>
    </Box>
  </Box>
);

const KycVerificationPanel = ({ kyc, onRefresh }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [formKey, setFormKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const refreshTimer = useRef(null);

  useEffect(() => () => {
    if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
  }, []);

  const documentTypes = kyc?.documentTypes?.length
    ? kyc.documentTypes
    : Object.keys(DOCUMENT_LABELS);
  const latest = kyc?.submissions?.[0] || null;
  const activeReview = ["pending", "under_review"].includes(latest?.status);
  const canSubmit = kyc?.canSubmit ?? (!kyc?.verified && !activeReview);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const refresh = async () => {
    try {
      setRefreshing(true);
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.documentType) {
      setError("Choose the type of identity document.");
      return;
    }

    if (form.documentNumber.trim().length < 4) {
      setError("Enter the document number shown on your ID.");
      return;
    }

    if (!form.front) {
      setError("Upload the front of your identity document.");
      return;
    }

    const body = new FormData();
    body.append("documentType", form.documentType);
    body.append("documentNumber", form.documentNumber.trim());
    body.append("idDocument", form.front);
    if (form.back) body.append("documentBack", form.back);
    if (form.selfie) body.append("selfie", form.selfie);

    try {
      setUploading(true);
      const response = await kycAPI.uploadKYC(body);
      setSuccess(response.message || "KYC documents submitted successfully.");
      setForm(EMPTY_FORM);
      setFormKey((key) => key + 1);
      await onRefresh?.();
      refreshTimer.current = window.setTimeout(() => onRefresh?.(), 2600);
    } catch (uploadError) {
      setError(uploadError.message || "Could not submit your KYC documents.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} justifyContent="space-between" gap={1.5} sx={{ mb: 1 }}>
        <Box>
          <Typography variant="h6">KYC verification</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.4 }}>
            Verify your identity to unlock higher transfer limits and full account access.
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {kyc?.verified ? (
            <Chip label="Verified" color="success" size="small" />
          ) : activeReview ? (
            <Chip label="Under review" color="warning" size="small" />
          ) : latest?.status === "rejected" ? (
            <Chip label="Action needed" color="error" size="small" />
          ) : (
            <Chip label="Not submitted" variant="outlined" size="small" />
          )}
          <Button
            type="button"
            size="small"
            variant="text"
            onClick={refresh}
            disabled={refreshing}
            sx={{ textTransform: "none" }}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </Box>
      </Stack>
      <Divider sx={{ mb: 2.2 }} />

      {kyc?.verified && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Your identity has been verified
          {kyc.verifiedAt ? ` on ${formatDate(kyc.verifiedAt)}` : ""}. You have full access to Solvent.
        </Alert>
      )}

      {!kyc?.verified && activeReview && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Your documents were submitted
          {latest?.submittedAt ? ` on ${formatDate(latest.submittedAt)}` : ""}. Verification usually takes a few
          seconds in this demo. Use Refresh if the status does not update automatically.
        </Alert>
      )}

      {!kyc?.verified && latest?.status === "rejected" && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Your previous submission was rejected
          {latest.rejectionReason ? `: ${latest.rejectionReason}` : "."} You can correct the details and submit again.
        </Alert>
      )}

      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {canSubmit && !kyc?.verified && (
        <Box component="form" key={formKey} onSubmit={submit} sx={{ mb: 2.5 }}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
            <TextField
              select
              label="Document type"
              value={form.documentType}
              onChange={(event) => update("documentType", event.target.value)}
              fullWidth
              required
            >
              {documentTypes.map((type) => (
                <MenuItem key={type} value={type}>{DOCUMENT_LABELS[type] || type}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Document number"
              value={form.documentNumber}
              onChange={(event) => update("documentNumber", event.target.value)}
              placeholder="e.g. 1234567890"
              fullWidth
              required
              slotProps={{ htmlInput: { maxLength: 80, autoCapitalize: "characters" } }}
            />
            <FileField
              id="kyc-front"
              label="Identity document (front) *"
              file={form.front}
              onChange={(event) => update("front", event.target.files?.[0] || null)}
              hint="JPG, PNG, WEBP, or PDF · max 5 MB"
            />
            <FileField
              id="kyc-back"
              label="Identity document (back)"
              file={form.back}
              onChange={(event) => update("back", event.target.files?.[0] || null)}
              hint="Optional for passports"
            />
            <Box sx={{ gridColumn: { md: "1 / -1" } }}>
              <FileField
                id="kyc-selfie"
                label="Selfie holding your ID"
                file={form.selfie}
                onChange={(event) => update("selfie", event.target.files?.[0] || null)}
                hint="Optional · helps us match your face to the document"
              />
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mt: 2.4 }}>
            <Button type="submit" variant="contained" disabled={uploading} sx={{ textTransform: "none", bgcolor: "#1a73e8", "&:hover": { bgcolor: "#1765cc" } }}>
              {uploading ? "Submitting..." : "Submit for verification"}
            </Button>
            {uploading && <CircularProgress size={20} />}
            <Typography variant="caption" color="text.secondary">
              Your documents are stored privately and only reviewed by platform admins.
            </Typography>
          </Box>
        </Box>
      )}

      <Typography variant="subtitle2" sx={{ mb: 1.2, color: "#334155" }}>
        Submission history
      </Typography>

      {!kyc?.submissions?.length ? (
        <Typography variant="body2" color="text.secondary">
          No KYC documents have been submitted yet.
        </Typography>
      ) : (
        <Stack spacing={1.2}>
          {kyc.submissions.map((submission) => (
            <Box
              key={submission.id}
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                p: 1.5,
                background: "#f8fafc",
                border: "1px solid #edf2f7",
                borderRadius: 2
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "#1f2937" }}>
                  {DOCUMENT_LABELS[submission.documentType] || submission.documentType}
                  {submission.documentNumber ? ` · ${submission.documentNumber}` : ""}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Submitted {formatDate(submission.submittedAt)}
                  {submission.verifiedAt ? ` · Verified ${formatDate(submission.verifiedAt)}` : ""}
                </Typography>
                {submission.rejectionReason && (
                  <Typography variant="caption" display="block" color="error.main" sx={{ mt: 0.4 }}>
                    {submission.rejectionReason}
                  </Typography>
                )}
              </Box>
              <Chip
                label={STATUS_LABELS[submission.status] || submission.status}
                color={STATUS_COLORS[submission.status] || "default"}
                size="small"
                variant={submission.status === "approved" ? "filled" : "outlined"}
              />
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
};

export default KycVerificationPanel;
