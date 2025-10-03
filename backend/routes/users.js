const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all users (with role-based filtering)
router.get('/', protect, async (req, res) => {
    try {
        let query = `SELECT id, email, first_name, last_name, role, faculty, created_at, active
                     FROM users WHERE 1=1`;
        let params = [];

        // Filter based on user role
        if (req.user.role === 'program_leader') {
            query += ' AND role IN (?, ?, ?)';
            params.push('lecturer', 'principal_lecturer', 'student');
        } else if (req.user.role === 'principal_lecturer') {
            query += ' AND (role = ? OR (role = ? AND faculty = ?))';
            params.push('student', 'lecturer', req.user.faculty);
        } else if (req.user.role === 'lecturer') {
            query += ' AND role = ? AND faculty = ?';
            params.push('student', req.user.faculty);
        } else {
            return res.status(403).json({ message: 'Access denied' });
        }

        query += ' ORDER BY role, first_name';

        const [users] = await pool.execute(query, params);

        res.json({
            success: true,
            count: users.length,
            data: users
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error fetching users' });
    }
});

// Get user by ID
router.get('/:id', protect, async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT id, email, first_name, last_name, role, faculty, created_at, active
             FROM users WHERE id = ?`,
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error fetching user' });
    }
});

// Create new user (Program Leader only)
router.post('/', [
    protect,
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('first_name').notEmpty(),
    body('last_name').notEmpty(),
    body('role').isIn(['student', 'lecturer', 'principal_lecturer']),
    body('faculty').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        // Check if user is program leader
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({
                success: false,
                message: 'Only program leaders can create users'
            });
        }

        const { email, password, first_name, last_name, role, faculty, active = true } = req.body;

        // Check if user already exists
        const [existingUsers] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Hash password (you'll need to implement this)
        // For now, we'll store plain text (NOT recommended for production)
        const hashedPassword = password; // Replace with bcrypt in production

        const [result] = await pool.execute(
            'INSERT INTO users (email, password, first_name, last_name, role, faculty, active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [email, hashedPassword, first_name, last_name, role, faculty, active]
        );

        // Get the newly created user (without password)
        const [newUser] = await pool.execute(
            'SELECT id, email, first_name, last_name, role, faculty, created_at, active FROM users WHERE id = ?',
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser[0]
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error creating user' 
        });
    }
});

// Update user
router.put('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { first_name, last_name, role, faculty, active } = req.body;

        // Check if user is program leader
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({
                success: false,
                message: 'Only program leaders can update users'
            });
        }

        // Check if user exists
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await pool.execute(
            'UPDATE users SET first_name = ?, last_name = ?, role = ?, faculty = ?, active = ? WHERE id = ?',
            [first_name, last_name, role, faculty, active, id]
        );

        // Get updated user
        const [updatedUser] = await pool.execute(
            'SELECT id, email, first_name, last_name, role, faculty, created_at, active FROM users WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'User updated successfully',
            data: updatedUser[0]
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating user'
        });
    }
});

// 🔥 NEW: Delete user endpoint
router.delete('/:id', protect, async (req, res) => {
    try {
        console.log('🗑️ Deleting user request:', {
            userId: req.params.id,
            deleterId: req.user.id,
            deleterRole: req.user.role
        });

        const { id } = req.params;

        // Check if user is program leader
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({
                success: false,
                message: 'Only program leaders can delete users'
            });
        }

        // Prevent users from deleting themselves
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        // Check if user exists
        const [users] = await pool.execute(
            'SELECT * FROM users WHERE id = ?',
            [id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete user
        const [result] = await pool.execute(
            'DELETE FROM users WHERE id = ?',
            [id]
        );

        console.log('✅ User deletion result:', result);

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Failed to delete user'
            });
        }

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        console.error('❌ Delete user error:', error);
        
        // Handle foreign key constraints
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED' || error.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete user. User is associated with existing records (reports, classes, etc.). Please reassign or delete those records first.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error deleting user: ' + error.message
        });
    }
});

module.exports = router;