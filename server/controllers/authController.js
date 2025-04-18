// server/controllers/authController.js
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';  

export const register = async (req, res) => {
  try {
    const { fullname, email, password, phone } = req.body;

    const user = await User.create({
      fullname,
      email,
      password, 
      phone,
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.status(201).json({ token });

  } catch (err) {
    res.status(400).json({
      error: err.errors?.[0]?.message || 'Registration failed',
    });
  }
};
