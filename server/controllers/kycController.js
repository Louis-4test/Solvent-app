// controllers/kycController.js
import { User, KYC } from '../models/index.js';
import fs from 'fs';
import { createNotificationForUser } from './notificationController.js';

export async function getKYCStatus(req, res) {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'fullName', 'kycVerified', 'kycVerifiedAt']
    });

    const submissions = await KYC.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'documentType', 'originalName', 'status', 'verifiedAt', 'createdAt']
    });

    return res.json({
      success: true,
      data: {
        verified: user.kycVerified,
        verifiedAt: user.kycVerifiedAt,
        submissions
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
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No file uploaded',
        code: 'MISSING_FILE'
      });
    }

    // Get user ID from auth middleware
    const userId = req.user.id;

    // Validate file exists on disk
    const fileExists = fs.existsSync(req.file.path);
    if (!fileExists) {
      return res.status(400).json({
        success: false,
        error: 'Uploaded file not found',
        code: 'FILE_NOT_FOUND'
      });
    }

    // Save KYC document info
    const kyc = await KYC.create({
      userId,
      documentType: 'ID',
      documentPath: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      status: 'pending'
    });

    // Verification process (runs in background)
    startVerificationProcess(userId, kyc);

    return res.status(201).json({ 
      success: true,
      message: 'KYC document uploaded successfully',
      data: {
        kycId: kyc.id,
        status: 'pending',
        documentType: 'ID',
        originalName: req.file.originalname,
        fileSize: req.file.size,
        createdAt: kyc.createdAt
      }
    });

  } catch (error) {
    console.error('KYC upload error:', error);
    
    // Clean up uploaded file if error occurred
    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (fsError) {
        console.error('Failed to clean up file:', fsError);
      }
    }

    return res.status(500).json({
      success: false,
      error: 'KYC processing failed',
      code: 'PROCESSING_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Separate function for verification process
async function startVerificationProcess(userId, kyc) {
  try {
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await kyc.update({ 
      status: 'verified',
      verifiedAt: new Date()
    });
    
    await User.update({ 
      kycVerified: true,
      kycVerifiedAt: new Date() 
    }, { 
      where: { id: userId } 
    });

    await createNotificationForUser(
      userId,
      'Your KYC documents have been verified. Your account is now fully verified.'
    );

    console.log(`KYC verified for user ${userId}`);
  } catch (error) {
    console.error('KYC verification failed:', error);
    await kyc.update({ status: 'failed' });
  }
}