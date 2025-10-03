const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// 🔥 TEST ENDPOINT - Check if this route file is loaded
router.get('/test', (req, res) => {
    console.log('✅ /api/reports/test endpoint was hit!');
    res.json({
        success: true,
        message: 'Reports API is working!',
        timestamp: new Date().toISOString()
    });
});

// Get all reports
router.get('/', protect, async (req, res) => {
    try {
        console.log('📋 Fetching all reports for user:', req.user.id);
        
        const [reports] = await pool.execute(`
            SELECT lr.*, 
                   c.course_code, 
                   c.course_name,
                   u.first_name as lecturer_first_name, 
                   u.last_name as lecturer_last_name
            FROM lecture_reports lr
            LEFT JOIN courses c ON lr.course_id = c.id
            LEFT JOIN users u ON lr.lecturer_id = u.id
            ORDER BY lr.date_of_lecture DESC
        `);
        
        console.log(`✅ Found ${reports.length} reports`);
        
        res.json({
            success: true,
            data: reports
        });
    } catch (error) {
        console.error('Get reports error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching reports'
        });
    }
});

// Create new report
router.post('/', protect, async (req, res) => {
    try {
        const {
            faculty_name = 'ICT',
            class_name,
            week_of_reporting,
            date_of_lecture,
            course_id,
            actual_students_present,
            total_registered_students,
            venue,
            scheduled_lecture_time = '09:00:00',
            topic_taught,
            learning_outcomes,
            recommendations = ''
        } = req.body;

        const lecturer_id = req.user.id;

        console.log('📝 Creating report for lecturer:', lecturer_id);

        // Insert the report
        const [result] = await pool.execute(
            `INSERT INTO lecture_reports 
             (faculty_name, class_name, week_of_reporting, date_of_lecture, course_id, lecturer_id, 
              actual_students_present, total_registered_students, venue, scheduled_lecture_time, 
              topic_taught, learning_outcomes, recommendations) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                faculty_name,
                class_name,
                week_of_reporting,
                date_of_lecture,
                course_id || null,
                lecturer_id,
                actual_students_present,
                total_registered_students,
                venue,
                scheduled_lecture_time,
                topic_taught,
                learning_outcomes,
                recommendations
            ]
        );

        console.log('✅ Report created with ID:', result.insertId);

        res.json({
            success: true,
            message: 'Report submitted successfully!',
            data: {
                id: result.insertId,
                faculty_name,
                class_name,
                week_of_reporting,
                date_of_lecture,
                lecturer_id,
                actual_students_present,
                total_registered_students,
                venue,
                scheduled_lecture_time,
                topic_taught,
                learning_outcomes,
                recommendations
            }
        });

    } catch (error) {
        console.error('❌ Report creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating report: ' + error.message
        });
    }
});

// 🔥 CRITICAL: ADD THE MISSING RATING ENDPOINT
router.post('/:id/rate', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const studentId = req.user.id;

        console.log('🎯 RATING ENDPOINT CALLED - Report ID:', id);
        console.log('📊 Rating data:', { rating, comment, studentId });

        // Check if report exists
        const [reports] = await pool.execute(
            'SELECT id FROM lecture_reports WHERE id = ?',
            [id]
        );

        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lecture report not found'
            });
        }

        // Check if student already rated this report
        const [existingRatings] = await pool.execute(
            'SELECT id FROM ratings WHERE report_id = ? AND student_id = ?',
            [id, studentId]
        );

        if (existingRatings.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You have already rated this lecture'
            });
        }

        // Add rating to database
        const [result] = await pool.execute(
            'INSERT INTO ratings (report_id, student_id, rating, comment) VALUES (?, ?, ?, ?)',
            [id, studentId, rating, comment || '']
        );

        console.log('✅ Rating added successfully. ID:', result.insertId);

        res.json({
            success: true,
            message: `Thank you for your ${rating}-star rating!`,
            ratingId: result.insertId
        });

    } catch (error) {
        console.error('❌ Rating error:', error);
        
        // Handle duplicate entry
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({
                success: false,
                message: 'You have already rated this lecture'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error submitting rating: ' + error.message
        });
    }
});

// Get user's ratings
router.get('/my-ratings', protect, async (req, res) => {
    try {
        const studentId = req.user.id;
        console.log('⭐ Fetching ratings for student:', studentId);

        const [ratings] = await pool.execute(`
            SELECT r.*, 
                   lr.class_name, 
                   lr.topic_taught,
                   lr.date_of_lecture,
                   c.course_name, 
                   c.course_code
            FROM ratings r
            JOIN lecture_reports lr ON r.report_id = lr.id
            LEFT JOIN courses c ON lr.course_id = c.id
            WHERE r.student_id = ?
            ORDER BY r.created_at DESC
        `, [studentId]);

        console.log(`✅ Found ${ratings.length} ratings for student ${studentId}`);

        res.json({
            success: true,
            data: ratings
        });

    } catch (error) {
        console.error('Get ratings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching ratings'
        });
    }
});

// 🔥 SIMPLE WORKING VERSION - Based on debug script
router.put('/:id/feedback', [
    protect,
    body('prl_feedback').notEmpty().withMessage('Feedback is required')
], async (req, res) => {
    try {
        console.log('=== PRL FEEDBACK REQUEST START ===');
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const { id } = req.params;
        const { prl_feedback } = req.body;

        console.log('📝 Feedback request:', {
            reportId: id,
            feedbackLength: prl_feedback.length,
            user: `${req.user.id} (${req.user.role}, ${req.user.faculty})`
        });

        // Check if user is principal_lecturer
        if (req.user.role !== 'principal_lecturer') {
            return res.status(403).json({
                success: false,
                message: 'Only principal lecturers can add feedback'
            });
        }

        // Check if report exists
        const [reports] = await pool.execute(
            `SELECT lr.*, c.faculty as course_faculty
             FROM lecture_reports lr 
             LEFT JOIN courses c ON lr.course_id = c.id 
             WHERE lr.id = ?`,
            [id]
        );

        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Report not found'
            });
        }

        const report = reports[0];

        // Check faculty access - use faculty_name from report
        if (report.faculty_name !== req.user.faculty) {
            return res.status(403).json({
                success: false,
                message: `You can only provide feedback for reports in your faculty (${req.user.faculty}). This report is from ${report.faculty_name}.`
            });
        }

        // 🔥 EXACT SAME QUERY THAT WORKED IN DEBUG SCRIPT
        console.log('🔄 Executing update query...');
        const [result] = await pool.execute(
            'UPDATE lecture_reports SET prl_feedback = ? WHERE id = ?',
            [prl_feedback, id]  // No type conversion needed - let MySQL handle it
        );

        console.log('✅ Update successful:', {
            affectedRows: result.affectedRows,
            changedRows: result.changedRows
        });

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Report not found or no changes made'
            });
        }

        res.json({
            success: true,
            message: 'Feedback added successfully',
            affectedRows: result.affectedRows
        });

    } catch (error) {
        console.error('❌ PRL Feedback error:', error);
        console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage
        });
        
        res.status(500).json({
            success: false,
            message: 'Error adding feedback: ' + (error.sqlMessage || error.message)
        });
    } finally {
        console.log('=== PRL FEEDBACK REQUEST END ===');
    }
});

// 🔥 ADD ENDPOINT TO GET RATINGS FOR A SPECIFIC REPORT
router.get('/:id/ratings', protect, async (req, res) => {
    try {
        const { id } = req.params;

        console.log('📊 Fetching ratings for report:', id);

        const [ratings] = await pool.execute(`
            SELECT r.*, 
                   u.first_name, 
                   u.last_name,
                   u.role
            FROM ratings r
            JOIN users u ON r.student_id = u.id
            WHERE r.report_id = ?
            ORDER BY r.created_at DESC
        `, [id]);

        console.log(`✅ Found ${ratings.length} ratings for report ${id}`);

        res.json({
            success: true,
            data: ratings
        });

    } catch (error) {
        console.error('Get report ratings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching report ratings'
        });
    }
});

module.exports = router;