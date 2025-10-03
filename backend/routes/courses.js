const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Get all courses
router.get('/', protect, async (req, res) => {
    try {
        console.log('📋 Fetching courses for user:', req.user.id, req.user.role);
        
        let query = `SELECT c.*, 
                            u.first_name as lecturer_first_name, 
                            u.last_name as lecturer_last_name,
                            CONCAT(u.first_name, ' ', u.last_name) as lecturer_name
                     FROM courses c 
                     LEFT JOIN users u ON c.lecturer_id = u.id 
                     WHERE 1=1`;
        let params = [];

        // Program leaders can see all courses, others see limited view
        if (req.user.role !== 'program_leader') {
            query += ' AND c.active = true';
        }

        query += ' ORDER BY c.course_code';

        console.log('🔍 Executing query:', query);
        const [courses] = await pool.execute(query, params);

        console.log(`✅ Found ${courses.length} courses`);
        
        res.json({
            success: true,
            count: courses.length,
            data: courses
        });

    } catch (error) {
        console.error('Get courses error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error fetching courses' 
        });
    }
});

// Create new course (Program Leader only)
router.post('/', [
    protect,
    body('course_code').notEmpty(),
    body('course_name').notEmpty(),
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

        const { course_code, course_name, description, faculty } = req.body;

        const [result] = await pool.execute(
            'INSERT INTO courses (course_code, course_name, description, faculty, program_leader_id) VALUES (?, ?, ?, ?, ?)',
            [course_code, course_name, description, faculty, req.user.id]
        );

        // Get the newly created course
        const [newCourse] = await pool.execute(`
            SELECT c.*, 
                   u.first_name as lecturer_first_name, 
                   u.last_name as lecturer_last_name
            FROM courses c
            LEFT JOIN users u ON c.lecturer_id = u.id
            WHERE c.id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Course created successfully',
            data: newCourse[0]
        });

    } catch (error) {
        console.error('Create course error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error creating course' 
        });
    }
});

// 🔥 SIMPLE WORKING VERSION: Assign lecturer to course
router.post('/:id/assign', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { lecturer_id } = req.body;

        console.log('🎯 Assigning lecturer to course:', { courseId: id, lecturerId: lecturer_id });

        // Check if user is program leader
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({
                success: false,
                message: 'Only program leaders can assign lecturers to courses'
            });
        }

        // Simple update - assign lecturer to course
        const [result] = await pool.execute(
            'UPDATE courses SET lecturer_id = ? WHERE id = ?',
            [lecturer_id, id]
        );

        console.log('✅ Assignment result:', result);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Course not found'
            });
        }

        // Get updated course with lecturer info
        const [updatedCourse] = await pool.execute(`
            SELECT c.*, 
                   u.first_name as lecturer_first_name, 
                   u.last_name as lecturer_last_name
            FROM courses c
            LEFT JOIN users u ON c.lecturer_id = u.id
            WHERE c.id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Lecturer assigned successfully!',
            data: updatedCourse[0]
        });

    } catch (error) {
        console.error('❌ Assign lecturer error:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning lecturer: ' + error.message
        });
    }
});

// Update course
router.put('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { course_code, course_name, faculty, description, active } = req.body;

        // Check if user is program leader
        if (req.user.role !== 'program_leader') {
            return res.status(403).json({
                success: false,
                message: 'Only program leaders can update courses'
            });
        }

        await pool.execute(
            'UPDATE courses SET course_code = ?, course_name = ?, faculty = ?, description = ?, active = ? WHERE id = ?',
            [course_code, course_name, faculty, description, active, id]
        );

        res.json({
            success: true,
            message: 'Course updated successfully'
        });

    } catch (error) {
        console.error('Update course error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating course'
        });
    }
});

module.exports = router;