const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.register = async (req, res) => {
  try {
    const { email, password, phone } = req.body;
    
    const user = await User.create({ 
      email,
      password, // Automatically hashed by the model
      phone
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    res.status(201).json({ token });
    
  } catch (err) {
    res.status(400).json({ 
      error: err.errors?.[0]?.message || 'Registration failed' 
    });
  }
};