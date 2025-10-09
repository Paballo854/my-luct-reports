const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

// Import database - make sure this path is correct
let pool;
try {
    const db = require('../database/db');
    pool = db.pool;
    console.log('✅ Database module loaded successfully');
} catch (error) {
    console.error('❌ Failed to load database module:', error.message);
    pool = null;
}

const router = express.Router();

// Simple protect middleware for now
const protect = (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
};

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: process.env.JWT_EXPIRE || '30d',
    });
};

// User registration with detailed logging
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('role').isIn(['student', 'lecturer', 'principal_lecturer', 'program_leader'])
], async (req, res) => {
    console.log('🔍 REGISTRATION STARTED ======================');
    
    try {
        console.log('1. Checking validation...');
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('❌ Validation errors:', errors.array());
            return res.status(400).json({ 
                success: false,
                message: 'Validation failed: ' + errors.array().map(e => e.msg).join(', ')
            });
        }

        const { email, password, first_name, last_name, role, faculty } = req.body;
        console.log('2. Registration data received:', { email, first_name, last_name, role });

        // Check if database is available
        if (!pool) {
            console.log('❌ Database pool is not available');
            return res.status(500).json({ 
                success: false,
                message: 'Database connection not available'
            });
        }

        console.log('3. Checking if user exists...');
        // Check if user exists
        const checkResult = await pool.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        console.log('4. User check result:', checkResult);

        if (checkResult.success && checkResult.results.length > 0) {
            console.log('❌ User already exists');
            return res.status(400).json({ 
                success: false,
                message: 'User already exists with this email' 
            });
        }

        console.log('5. Hashing password...');
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        console.log('✅ Password hashed');

        console.log('6. Creating user in database...');
        // Create user - with better error handling
        let insertResult;
        try {
            insertResult = await pool.query(
                'INSERT INTO users (email, password, first_name, last_name, role, faculty) VALUES (?, ?, ?, ?, ?, ?)',
                [email, hashedPassword, first_name, last_name, role, faculty || 'ICT']
            );
            console.log('7. Insert result:', insertResult);
        } catch (insertError) {
            console.error('💥 INSERT ERROR DETAILS:', insertError);
            console.error('💥 INSERT ERROR CODE:', insertError.code);
            console.error('💥 INSERT ERROR MESSAGE:', insertError.message);
            throw insertError;
        }

        if (!insertResult.success) {
            console.log('❌ Database insert failed. Full error info:');
            console.log('- Success:', insertResult.success);
            console.log('- Error:', insertResult.error);
            console.log('- Results:', insertResult.results);
            throw new Error('Database insert failed: ' + (insertResult.error || 'Unknown error'));
        }

        console.log('✅ User created with ID:', insertResult.results.insertId);

        // Get created user
        const userResult = await pool.query(
            'SELECT id, email, first_name, last_name, role, faculty FROM users WHERE id = ?',
            [insertResult.results.insertId]
        );

        console.log('8. User fetch result:', userResult);

        if (!userResult.success || userResult.results.length === 0) {
            throw new Error('Failed to fetch created user');
        }

        const newUser = userResult.results[0];

        // Generate token
        const token = generateToken(newUser.id);

        console.log('🎉 REGISTRATION SUCCESSFUL for:', email);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token: token,
            user: newUser
        });

    } catch (error) {
        console.error('💥 REGISTRATION ERROR:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            success: false,
            message: 'Server error: ' + error.message 
        });
    }
});

// Simple test endpoint
router.get('/test', (req, res) => {
    console.log('✅ Auth test endpoint called');
    res.json({
        success: true,
        message: 'Auth API is working!',
        timestamp: new Date().toISOString()
    });
});

// Simple login for testing
router.post('/simple-login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Simple login attempt for:', email);
        
        res.json({
            success: true,
            message: 'Login successful (test)',
            user: { email, role: 'student' }
        });
    } catch (error) {
        console.error('Simple login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login error'
        });
    }
});

module.exports = router;