import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { User } from '../models/index.js';
import emailService from '../services/emailService.js';
import { generateToken, generateTempToken } from '../utils/helpers.js';

// Helper to generate and save MFA code
const generateAndSaveMFACode = async (user) => {
  const mfaCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration
  
  await user.update({
    mfaCode,
    mfaCodeExpires: expiresAt
  });
  
  return mfaCode;
};

export const register = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    const existingUser = await User.findOne({ 
      where: { 
        [Op.or]: [{ email }, { phone }] 
      } 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email 
          ? 'Email already in use' 
          : 'Phone number already in use' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName,
      email,
      phone,
      password: hashedPassword
    });

    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      userId: user.id,
      token,
      user: {
        email: user.email,
        fullName: user.fullName
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: identifier },
          { phone: identifier }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Account not verified. Please complete verification.' 
      });
    }

    if (user.mfaEnabled) {
      const mfaCode = await generateAndSaveMFACode(user);
      
      await emailService.sendEmail({
        to: user.email,
        subject: 'Your Login Verification Code',
        text: `Your verification code is: ${mfaCode} (expires in 10 minutes)`
      });

      return res.json({ 
        message: 'MFA code sent to your registered email',
        mfaRequired: true,
        tempToken: generateTempToken(user.id),
        email: user.email
      });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
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
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

export const verifyLoginMFA = async (req, res) => {
  try {
    const { code, tempToken } = req.body;
    
    const decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mfaCode || user.mfaCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > user.mfaCodeExpires) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    await user.update({ 
      mfaCode: null,
      mfaCodeExpires: null 
    });

    const token = generateToken(user.id);

    res.json({
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
      return res.status(401).json({ error: 'Verification session expired. Please login again.' });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid verification session' });
    }
    
    res.status(500).json({ error: 'MFA verification failed' });
  }
};

export const sendMFACode = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const mfaCode = await generateAndSaveMFACode(user);
    
    await emailService.sendEmail({
      to: user.email,
      subject: 'Your MFA Verification Code',
      text: `Your verification code is: ${mfaCode} (expires in 10 minutes)`
    });

    res.json({ 
      message: 'MFA code sent successfully',
      email: user.email
    });
  } catch (error) {
    console.error('MFA code sending error:', error);
    res.status(500).json({ error: 'Failed to send MFA code' });
  }
};

export const verifyMFA = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mfaCode || user.mfaCode !== code) {
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    if (new Date() > user.mfaCodeExpires) {
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    await user.update({ 
      isVerified: true,
      mfaEnabled: true,
      mfaCode: null,
      mfaCodeExpires: null 
    });

    const token = generateToken(user.id);

    res.json({ 
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
    res.status(500).json({ error: 'MFA verification failed' });
  }
};