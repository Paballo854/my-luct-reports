const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get all classes
router.get('/', protect, async (req, res) => {
    try {
        console.log('📋 Fetching classes for user:', req.user.id, req.user.role);
        
        let query = `SELECT c.*, 
                            u.first_name as lecturer_first_name, 
                            u.last_name as lecturer_last_name,
                            CONCAT(u.first_name, ' ', u.last_name) as lecturer_name
                     FROM classes c 
                     LEFT JOIN users u ON c.lecturer_id = u.id 
                     WHERE 1=1`;
        let params = [];

        // Role-based filtering
        if (req.user.role === 'lecturer') {
            query += ' AND c.lecturer_id = ?';
            params.push(req.user.id);
        } else if (req.user.role === 'principal_lecturer') {
            query += ' AND c.faculty = ?';
            params.push(req.user.faculty);
        }

        query += ' ORDER BY c.class_name';

        console.log('🔍 Executing query:', query);
        const [classes] = await pool.execute(query, params);

        console.log(`✅ Found ${classes.length} classes`);
        
        res.json({
            success: true,
            count: classes.length,
            data: classes
        });

    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching classes' 
        });
    }
});

// Get lecturer's classes
router.get('/my-classes', protect, async (req, res) => {
    try {
        console.log('📋 Fetching my classes for lecturer:', req.user.id);
        
        const [classes] = await pool.execute(
            `SELECT c.* 
             FROM classes c 
             WHERE c.lecturer_id = ? 
             ORDER BY c.class_name`,
            [req.user.id]
        );

        console.log(`✅ Found ${classes.length} classes for lecturer ${req.user.id}`);
        
        res.json({
            success: true,
            count: classes.length,
            data: classes
        });

    } catch (error) {
        console.error('Get my classes error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching your classes' 
        });
    }
});

// Create new class (Program Leader only)
router.post('/', [
    protect,
    body('class_name').notEmpty(),
    body('faculty').notEmpty(),
    body('total_registered_students').isInt({ min: 1 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { class_name, faculty, total_registered_students, description } = req.body;

        // Check if user is program leader
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({
                success: false,
                message: 'Only program leaders can create classes'
            });
        }

        // 🔥 FIXED: Handle optional description field
        const [result] = await pool.execute(
            'INSERT INTO classes (class_name, faculty, total_registered_students, description) VALUES (?, ?, ?, ?)',
            [class_name, faculty, total_registered_students, description || null]
        );

        // Get the newly created class
        const [newClass] = await pool.execute(`
            SELECT c.*, 
                   u.first_name as lecturer_first_name, 
                   u.last_name as lecturer_last_name
            FROM classes c
            LEFT JOIN users u ON c.lecturer_id = u.id
            WHERE c.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Class created successfully',
            data: newClass[0]
        });

    } catch (error) {
        console.error('Create class error:', error);
        
        // Handle missing column error
        if (error.code === 'ER_BAD_FIELD_ERROR') {
            return res.status(500).json({ 
                success: false,
                message: 'Database configuration error: Missing columns. Please run database migration.' 
            });
        }
        
        res.status(500).json({ 
            success: false,
            message: 'Server error creating class' 
        });
    }
});

// 🔥 NEW: Assign lecturer to class
router.post('/:id/assign', [
    protect,
    body('lecturer_id').isInt({ min: 1 }).withMessage('Valid lecturer ID is required')
], async (req, res) => {
    try {
        console.log('=== CLASS ASSIGNMENT REQUEST ===');
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { id } = req.params;
        const { lecturer_id } = req.body;

        console.log('📝 Assigning lecturer to class:', {
            classId: id,
            lecturerId: lecturer_id,
            userId: req.user.id,
            userRole: req.user.role
        });

        // Check if user is program leader
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({
                success: false,
                message: 'Only program leaders can assign lecturers to classes'
            });
        }

        // Check if class exists
        const [classes] = await pool.execute(
            'SELECT * FROM classes WHERE id = ?',
            [id]
        );

        if (classes.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        // Check if lecturer exists and is actually a lecturer
        const [lecturers] = await pool.execute(
            'SELECT * FROM users WHERE id = ? AND role = ?',
            [lecturer_id, 'lecturer']
        );

        if (lecturers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lecturer not found or user is not a lecturer'
            });
        }

        // Update class with lecturer assignment
        const [result] = await pool.execute(
            'UPDATE classes SET lecturer_id = ? WHERE id = ?',
            [lecturer_id, id]
        );

        console.log('✅ Class assignment result:', result);

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Failed to assign lecturer to class'
            });
        }

        // Get updated class with lecturer info
        const [updatedClass] = await pool.execute(`
            SELECT c.*, 
                   u.first_name as lecturer_first_name, 
                   u.last_name as lecturer_last_name
            FROM classes c
            LEFT JOIN users u ON c.lecturer_id = u.id
            WHERE c.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Lecturer assigned to class successfully!',
            data: updatedClass[0]
        });

    } catch (error) {
        console.error('❌ Assign lecturer to class error:', error);
        
        res.status(500).json({
            success: false,
            message: 'Error assigning lecturer to class: ' + error.message
        });
    }
});

// Update class
router.put('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { class_name, faculty, total_registered_students, description, active } = req.body;

        // Check if user is program leader
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({
                success: false,
                message: 'Only program leaders can update classes'
            });
        }

        // 🔥 FIXED: Handle optional description
        await pool.execute(
            'UPDATE classes SET class_name = ?, faculty = ?, total_registered_students = ?, description = ?, active = ? WHERE id = ?',
            [class_name, faculty, total_registered_students, description || null, active, id]
        );

        res.json({
            success: true,
            message: 'Class updated successfully'
        });

    } catch (error) {
        console.error('Update class error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating class'
        });
    }
});

// Delete class
router.delete('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user is program leader
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({
                success: false,
                message: 'Only program leaders can delete classes'
            });
        }

        const [result] = await pool.execute('DELETE FROM classes WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Class not found'
            });
        }

        res.json({
            success: true,
            message: 'Class deleted successfully'
        });

    } catch (error) {
        console.error('Delete class error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting class'
        });
    }
});

module.exports = router;