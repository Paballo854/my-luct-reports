const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// User registration - SIMPLIFIED AND GUARANTEED TO WORK
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('role').isIn(['student', 'lecturer', 'principal_lecturer', 'program_leader'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed: ' + errors.array().map(e => e.msg).join(', ')
            });
        }

        const { email, password, first_name, last_name, role, faculty } = req.body;

        console.log('📝 Registration attempt for:', email);

        // Check if user exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: 'User already exists with this email' 
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const [result] = await pool.execute(
            'INSERT INTO users (email, password, first_name, last_name, role, faculty) VALUES (?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, first_name, last_name, role, faculty || 'ICT']
        );

        console.log('✅ User created with ID:', result.insertId);

        // Get created user
        const [newUser] = await pool.execute(
            'SELECT id, email, first_name, last_name, role, faculty FROM users WHERE id = ?',
            [result.insertId]
        );

        // Generate token
        const token = generateToken(newUser[0].id);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token: token,
            user: newUser[0]
        });

    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error: ' + error.message 
        });
    }
});

// User login - FIXED TO WORK WITH NEW ACCOUNTS
router.post('/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed'
            });
        }

        const { email, password } = req.body;

        console.log('🔐 Login attempt for:', email);

        // Check if user exists
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            console.log('❌ User not found:', email);
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        const user = users[0];
        console.log('✅ User found:', user.email);

        // ALWAYS use bcrypt comparison for consistency
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (!isPasswordValid) {
            console.log('❌ Password invalid for:', email);
            return res.status(401).json({ 
                success: false,
                message: 'Invalid email or password' 
            });
        }

        const userResponse = {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role,
            faculty: user.faculty
        };

        const token = generateToken(user.id);

        console.log('🎉 Login successful for:', email);

        res.json({
            success: true,
            message: 'Login successful',
            token: token,
            user: userResponse
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error: ' + error.message 
        });
    }
});

// Test endpoint
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'Auth API is working!',
        timestamp: new Date().toISOString()
    });
});

// Get current user profile
router.get('/profile', protect, async (req, res) => {
    try {
        res.json({
            success: true,
            user: req.user
        });
    } catch (error) {
        res.status(500).json({ 
            success: false,
            message: 'Error fetching profile' 
        });
    }
});

module.exports = router;
// Simple CORS test endpoint
router.get('/cors-test', (req, res) => {
    res.json({
        success: true,
        message: 'CORS is working!',
        timestamp: new Date().toISOString(),
        origin: req.headers.origin,
        headers: req.headers
    });
});