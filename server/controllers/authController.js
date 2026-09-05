import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { User } from '../models/index.js';
import emailService from '../services/emailService.js';
import { generateToken, generateTempToken } from '../utils/helpers.js';

// Constants
const MFA_CODE_EXPIRATION_MINUTES = 55;

// Helper to generate and save MFA code
const generateAndSaveMFACode = async (user) => {
  const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + MFA_CODE_EXPIRATION_MINUTES * 60 * 1000);
  
  await user.update({
    mfaCode,
    mfaCodeExpires: expiresAt
  });
  
  return mfaCode;
};

export const register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    // Validate input
    if (!email || !password || !fullName || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        code: 'MISSING_FIELDS'
      });
    }

    // Check for existing user
    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [{ email }, { phone }] 
      } 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: existingUser.email === email 
          ? 'Email already in use' 
          : 'Phone number already in use',
        code: existingUser.email === email ? 'EMAIL_EXISTS' : 'PHONE_EXISTS'
      });
    }

    // Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword,
      isVerified: process.env.NODE_ENV === 'development',
    });

    // Generate verification code and persist it for the verify step
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    await user.update({
      mfaCode: verificationCode,
      mfaCodeExpires: new Date(Date.now() + MFA_CODE_EXPIRATION_MINUTES * 60 * 1000)
    });

    // In development, skip sending the email (code is printed to the console)
    if (process.env.NODE_ENV !== 'development') {
      try {
        await emailService.sendEmail({
          to: user.email,
          subject: 'Verify your Solvent account',
          text: `Your verification code is: ${verificationCode} (expires in ${MFA_CODE_EXPIRATION_MINUTES} minutes)`
        });
      } catch (emailError) {
        console.error('Verification email failed:', emailError.message);
      }
    } else {
      console.log(`[DEV] Registration complete. Verification code would be sent to ${user.email}`);
    }

     // Generate JWT token (using consistent variable name)
     const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '24h' }
    );

    // In authController.js
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token, // JWT token
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    let statusCode = 500;
    let errorMessage = 'Registration failed';
    let errorCode = 'SERVER_ERROR';
    let details = process.env.NODE_ENV === 'development' ? error.message : undefined;

    if (error.name === 'SequelizeValidationError') {
      statusCode = 400;
      errorMessage = 'Validation error';
      errorCode = 'VALIDATION_ERROR';
      details = error.errors.map(e => e.message);
    }

    res.status(statusCode).json({ 
      success: false,
      error: errorMessage,
      code: errorCode,
      details
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'mfaCode', 'mfaCodeExpires', 'resetPasswordToken', 'resetPasswordExpires'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    return res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      code: 'SERVER_ERROR'
    });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email/phone and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Find user with explicit error handling
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    }).catch(dbError => {
      console.error('Database error:', dbError);
      throw new Error('Database operation failed');
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'No user found with this email/phone' 
      });
    }

    // Verify password with timing-safe comparison
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
        message: 'Incorrect password',
        field: 'password' 
      });
    }

    // Account verification check
    if (!user.isVerified) {
      return res.status(403).json({ 
        success: false,
        error: 'Account not verified. Please check your email.',
        code: 'UNVERIFIED_ACCOUNT',
        email: user.email,
        resendLink: true
      });
    }

    // MFA flow
    if (user.mfaEnabled) {
      const mfaCode = await generateAndSaveMFACode(user);
      
      try {
        await emailService.sendEmail({
          to: user.email,
          subject: 'Your Login Verification Code',
          text: `Your verification code is: ${mfaCode}`
        });
      } catch (emailError) {
        console.error('MFA email failed:', emailError);
        return res.status(500).json({
          success: false,
          error: 'Failed to send MFA code',
          code: 'EMAIL_FAILURE'
        });
      }

      return res.json({ 
        success: true,
        message: 'Verification code sent',
        mfaRequired: true,
        tempToken: generateTempToken(user.id),
        email: user.email
      });
    }

    // Regular login success
    const token = generateToken(user.id);

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isVerified: user.isVerified,
        mfaEnabled: user.mfaEnabled,
        kycVerified: user.kycVerified
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Login failed. Please try again.',
      code: 'SERVER_ERROR',
      systemError: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const verifyLoginMFA = async (req, res) => {
  try {
    const { code, tempToken } = req.body;
    
    // Validate input
    if (!code || !tempToken) {
      return res.status(400).json({ 
        success: false,
        error: 'Verification code and temporary token are required',
        code: 'MISSING_VERIFICATION_DATA'
      });
    }

    // Verify temp token
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify MFA code
    if (!user.mfaCode || user.mfaCode !== code) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid verification code',
        code: 'INVALID_MFA_CODE'
      });
    }

    if (new Date() > user.mfaCodeExpires) {
      return res.status(400).json({ 
        success: false,
        error: 'Verification code has expired',
        code: 'EXPIRED_MFA_CODE'
      });
    }

    // Clear MFA code and generate auth token
    await user.update({ 
      mfaCode: null,
      mfaCodeExpires: null 
    });

    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'MFA verification successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        mfaEnabled: user.mfaEnabled,
        kycVerified: user.kycVerified
      }
    });

  } catch (error) {
    console.error('MFA verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: 'Verification session expired. Please login again.',
        code: 'TEMP_TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid verification session',
        code: 'INVALID_TEMP_TOKEN'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'MFA verification failed',
      code: 'MFA_VERIFICATION_FAILED'
    });
  }
};

export const sendMFACode = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ 
        success: false,
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    const mfaCode = await generateAndSaveMFACode(user);
    
    await emailService.sendEmail({
      to: user.email,
      subject: 'Your MFA Verification Code',
      text: `Your verification code is: ${mfaCode} (expires in ${MFA_CODE_EXPIRATION_MINUTES} minutes)`
    });

    res.json({ 
      success: true,
      message: 'MFA code sent successfully',
      email: user.email
    });
  } catch (error) {
    console.error('MFA code sending error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to send MFA code',
      code: 'MFA_SEND_FAILED'
    });
  }
};

export const verifyMFA = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Validate input
    if (!email || !code) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and verification code are required',
        code: 'MISSING_VERIFICATION_DATA'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verify MFA code
    if (!user.mfaCode || user.mfaCode !== code) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid verification code',
        code: 'INVALID_MFA_CODE'
      });
    }

    if (new Date() > user.mfaCodeExpires) {
      return res.status(400).json({ 
        success: false,
        error: 'Verification code has expired',
        code: 'EXPIRED_MFA_CODE'
      });
    }

    // Update user verification status
    await user.update({ 
      isVerified: true,
      mfaEnabled: true,
      mfaCode: null,
      mfaCodeExpires: null 
    });

    const token = generateToken(user.id);

    res.json({ 
      success: true,
      message: 'MFA verification successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isVerified: true,
        mfaEnabled: true,
        kycVerified: user.kycVerified
      }
    });
  } catch (error) {
    console.error('MFA verification error:', error);
    res.status(500).json({ 
      success: false,
      error: 'MFA verification failed',
      code: 'MFA_VERIFICATION_FAILED'
    });
  }
};

const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        code: 'MISSING_EMAIL'
      });
    }

    const user = await User.findOne({ where: { email } });

    // Always respond the same way to avoid user enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If that email exists, a password reset link has been sent.'
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    await user.update({
      resetPasswordToken: hashResetToken(resetToken),
      resetPasswordExpires: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    await emailService.sendEmail({
      to: user.email,
      subject: 'Reset your Solvent password',
      text: `We received a request to reset your password.\n\nClick the link below to choose a new password (valid for 1 hour):\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`
    });

    return res.json({
      success: true,
      message: 'If that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send password reset email',
      code: 'RESET_EMAIL_FAILED'
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Token and new password are required',
        code: 'MISSING_RESET_DATA'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
        code: 'WEAK_PASSWORD'
      });
    }

    const user = await User.findOne({
      where: { resetPasswordToken: hashResetToken(token) }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset link',
        code: 'INVALID_RESET_TOKEN'
      });
    }

    if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      return res.status(400).json({
        success: false,
        error: 'Reset link has expired. Please request a new one.',
        code: 'EXPIRED_RESET_TOKEN'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    return res.json({
      success: true,
      message: 'Password reset successful. You can now log in.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to reset password',
      code: 'RESET_FAILED'
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current and new password are required',
        code: 'MISSING_PASSWORD_DATA'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters',
        code: 'WEAK_PASSWORD'
      });
    }

    const user = await User.findByPk(req.user.id);
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });

    return res.json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to change password',
      code: 'CHANGE_PASSWORD_FAILED'
    });
  }
};