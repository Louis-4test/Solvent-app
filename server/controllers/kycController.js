import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Op } from 'sequelize';
import { User, KYC } from '../models/index.js';
import { KYC_DOCUMENT_TYPES, KYC_STATUSES } from '../models/kyc.js';
import { createNotificationForUser } from './notificationController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KYC_UPLOAD_DIR = path.join(__dirname, '../uploads/kyc');

const REVIEWABLE_STATUSES = ['pending', 'under_review'];

const removeUploadedFiles = async (files = []) => {
  await Promise.all(
    files.filter(Boolean).map(async (file) => {
      try {
        await fs.promises.unlink(file.path);
      } catch (error) {
        if (error.code !== 'ENOENT') {
          console.warn('Could not remove KYC file:', file.path, error.message);
        }
      }
    })
  );
};

const fileToUrl = (file) => (file ? `/uploads/kyc/${file.filename}` : null);

const documentPath = (url) => {
  if (!url || !url.startsWith('/uploads/kyc/')) return null;
  return path.join(KYC_UPLOAD_DIR, path.basename(url));
};

const serializeSubmission = (submission) => ({
  id: submission.id,
  documentType: submission.document_type,
  documentNumber: submission.document_number,
  documentFrontUrl: submission.document_front_url,
  documentBackUrl: submission.document_back_url,
  selfieUrl: submission.selfie_url,
  status: submission.status,
  rejectionReason: submission.rejection_reason,
  verifiedAt: submission.verified_at,
  submittedAt: submission.submitted_at,
  updatedAt: submission.updated_at,
  reviewedBy: submission.reviewed_by
});

const loadUser = (userId) =>
  User.findByPk(userId, {
    attributes: ['id', 'fullName', 'email', 'kycVerified', 'kycVerifiedAt']
  });

export async function getKYCStatus(req, res) {
  try {
    const [user, submissions] = await Promise.all([
      loadUser(req.user.id),
      KYC.findAll({
        where: { user_id: req.user.id },
        order: [['submitted_at', 'DESC']]
      })
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const latest = submissions[0] || null;
    const verifiedAt =
      user.kycVerifiedAt ||
      submissions.find((submission) => submission.status === 'approved')?.verified_at ||
      null;

    return res.json({
      success: true,
      data: {
        verified: user.kycVerified === true,
        verifiedAt,
        latestStatus: latest?.status || null,
        canSubmit: !user.kycVerified && !REVIEWABLE_STATUSES.includes(latest?.status),
        submissions: submissions.map(serializeSubmission),
        documentTypes: KYC_DOCUMENT_TYPES
      }
    });
  } catch (error) {
    console.error('KYC status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch KYC status',
      code: 'KYC_STATUS_FAILED'
    });
  }
}

export async function uploadKYCDocument(req, res) {
  const files = req.files || {};
  const frontFile = files.idDocument?.[0] || files.documentFront?.[0];
  const backFile = files.documentBack?.[0];
  const selfieFile = files.selfie?.[0];
  const allFiles = [frontFile, backFile, selfieFile];

  try {
    const documentType = String(
      req.body.documentType || req.body.document_type || ''
    ).trim();
    const documentNumber = String(
      req.body.documentNumber || req.body.document_number || ''
    )
      .trim()
      .toUpperCase();

    if (!frontFile) {
      await removeUploadedFiles(allFiles);
      return res.status(400).json({
        success: false,
        error: 'Upload the front of your identity document',
        code: 'MISSING_DOCUMENT_FRONT'
      });
    }

    if (!KYC_DOCUMENT_TYPES.includes(documentType)) {
      await removeUploadedFiles(allFiles);
      return res.status(400).json({
        success: false,
        error: 'Choose a supported document type',
        code: 'INVALID_DOCUMENT_TYPE'
      });
    }

    if (documentNumber.length < 4 || documentNumber.length > 80) {
      await removeUploadedFiles(allFiles);
      return res.status(400).json({
        success: false,
        error: 'Enter the document number shown on your ID',
        code: 'INVALID_DOCUMENT_NUMBER'
      });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      await removeUploadedFiles(allFiles);
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    if (user.kycVerified) {
      await removeUploadedFiles(allFiles);
      return res.status(409).json({
        success: false,
        error: 'Your identity is already verified',
        code: 'KYC_ALREADY_VERIFIED'
      });
    }

    const activeSubmission = await KYC.findOne({
      where: {
        user_id: user.id,
        status: { [Op.in]: REVIEWABLE_STATUSES }
      }
    });

    if (activeSubmission) {
      await removeUploadedFiles(allFiles);
      return res.status(409).json({
        success: false,
        error: 'You already have a KYC submission under review',
        code: 'KYC_ALREADY_PENDING',
        data: { submission: serializeSubmission(activeSubmission) }
      });
    }

    const submission = await KYC.create({
      user_id: user.id,
      document_type: documentType,
      document_number: documentNumber,
      document_front_url: fileToUrl(frontFile),
      document_back_url: fileToUrl(backFile),
      selfie_url: fileToUrl(selfieFile),
      status: 'pending'
    });

    startVerificationProcess(user.id, submission.id);

    return res.status(201).json({
      success: true,
      message: 'KYC documents submitted. Verification usually completes in a few seconds.',
      data: {
        submission: serializeSubmission(submission),
        status: submission.status
      }
    });
  } catch (error) {
    console.error('KYC upload error:', error);
    await removeUploadedFiles(allFiles);

    return res.status(500).json({
      success: false,
      error: 'KYC processing failed',
      code: 'PROCESSING_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

async function startVerificationProcess(userId, submissionId) {
  const timer = setTimeout(async () => {
    try {
      const submission = await KYC.findByPk(submissionId);

      if (!submission || submission.status !== 'pending') return;

      await submission.update({
        status: 'approved',
        verified_at: new Date(),
        rejection_reason: null
      });

      await User.update(
        {
          kycVerified: true,
          kycVerifiedAt: new Date()
        },
        { where: { id: userId } }
      );

      await createNotificationForUser(
        userId,
        'Your KYC documents have been verified. Your account is now fully verified.'
      );

      console.log(`KYC verified for user ${userId}`);
    } catch (error) {
      console.error('KYC verification failed:', error);

      try {
        await KYC.update(
          {
            status: 'rejected',
            rejection_reason: 'Automatic verification failed. Please try again.'
          },
          { where: { id: submissionId } }
        );
      } catch (updateError) {
        console.error('Could not mark KYC submission as rejected:', updateError.message);
      }
    }
  }, 2000);

  if (typeof timer.unref === 'function') timer.unref();
}

export async function getKYCDocument(req, res) {
  try {
    const submission = await KYC.findByPk(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'KYC submission not found',
        code: 'KYC_NOT_FOUND'
      });
    }

    if (submission.user_id !== req.user.id && !req.user.isAdmin) {
      return res.status(404).json({
        success: false,
        error: 'KYC submission not found',
        code: 'KYC_NOT_FOUND'
      });
    }

    const sides = {
      front: submission.document_front_url,
      back: submission.document_back_url,
      selfie: submission.selfie_url
    };
    const filePath = documentPath(sides[req.params.side]);

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Document file not found',
        code: 'KYC_FILE_NOT_FOUND'
      });
    }

    return res.sendFile(filePath);
  } catch (error) {
    console.error('Get KYC document error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to load KYC document',
      code: 'KYC_DOCUMENT_FAILED'
    });
  }
}

export async function reviewKYCSubmission(req, res) {
  try {
    const { decision, reason = '' } = req.body;
    const submission = await KYC.findByPk(req.params.id);

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'KYC submission not found',
        code: 'KYC_NOT_FOUND'
      });
    }

    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: 'Decision must be approve or reject',
        code: 'INVALID_KYC_DECISION'
      });
    }

    if (decision === 'reject' && !String(reason).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Provide a reason for rejecting the submission',
        code: 'MISSING_REJECTION_REASON'
      });
    }

    if (!KYC_STATUSES.includes(submission.status)) {
      return res.status(400).json({
        success: false,
        error: 'This submission has an invalid status',
        code: 'INVALID_KYC_STATUS'
      });
    }

    if (!REVIEWABLE_STATUSES.includes(submission.status)) {
      return res.status(409).json({
        success: false,
        error: 'This KYC submission has already been reviewed',
        code: 'KYC_ALREADY_REVIEWED'
      });
    }

    const now = new Date();

    if (decision === 'approve') {
      await submission.update({
        status: 'approved',
        reviewed_by: req.user.id,
        verified_at: now,
        rejection_reason: null
      });

      await User.update(
        { kycVerified: true, kycVerifiedAt: now },
        { where: { id: submission.user_id } }
      );

      await createNotificationForUser(
        submission.user_id,
        'Your KYC documents have been approved. Your account is now fully verified.'
      );
    } else {
      await submission.update({
        status: 'rejected',
        reviewed_by: req.user.id,
        verified_at: null,
        rejection_reason: String(reason).trim()
      });

      const approvedCount = await KYC.count({
        where: { user_id: submission.user_id, status: 'approved' }
      });

      if (approvedCount === 0) {
        await User.update(
          { kycVerified: false, kycVerifiedAt: null },
          { where: { id: submission.user_id } }
        );
      }

      await createNotificationForUser(
        submission.user_id,
        `Your KYC submission was rejected: ${String(reason).trim()}`
      );
    }

    const updated = await KYC.findByPk(submission.id);

    return res.json({
      success: true,
      message: `KYC submission ${decision === 'approve' ? 'approved' : 'rejected'}`,
      data: serializeSubmission(updated)
    });
  } catch (error) {
    console.error('Review KYC error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to review KYC submission',
      code: 'KYC_REVIEW_FAILED'
    });
  }
}

export default {
  getKYCStatus,
  uploadKYCDocument,
  getKYCDocument,
  reviewKYCSubmission
};
