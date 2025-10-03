const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');
const { protect } = require('../middleware/auth');

const router = express.Router();

// TEST ENDPOINT
router.get('/test', (req, res) => {
    console.log('✅ /api/reports/test endpoint was hit!');
    res.json({
        success: true,
        message: 'Reports API is working!',
        timestamp: new Date().toISOString()
    });
});

// Get all reports with role-based filtering
router.get('/', protect, async (req, res) => {
    try {
        console.log('📋 Fetching reports for user:', { 
            id: req.user.id, 
            role: req.user.role,
            faculty: req.user.faculty 
        });
        
        let query = `
            SELECT lr.*, 
                   c.course_code, 
                   c.course_name,
                   u_lecturer.first_name as lecturer_first_name, 
                   u_lecturer.last_name as lecturer_last_name,
                   u_student.first_name as student_first_name,
                   u_student.last_name as student_last_name
            FROM lecture_reports lr
            LEFT JOIN courses c ON lr.course_id = c.id
            LEFT JOIN users u_lecturer ON lr.lecturer_id = u_lecturer.id
            LEFT JOIN users u_student ON lr.student_id = u_student.id
            WHERE 1=1
        `;
        let params = [];

        // Role-based filtering
        if (req.user.role === 'student') {
            query += ' AND lr.student_id = ?';
            params.push(req.user.id);
        } else if (req.user.role === 'lecturer') {
            query += ' AND lr.lecturer_id = ? AND lr.reporter_type = "lecturer"';
            params.push(req.user.id);
        } else if (req.user.role === 'principal_lecturer') {
            query += ' AND (lr.faculty_name = ? OR lr.faculty_name IS NULL)';
            params.push(req.user.faculty);
        }
        // Program leaders see all reports

        query += ' ORDER BY lr.date_of_lecture DESC';

        console.log('🔍 Executing query:', query);
        console.log('📊 With params:', params);

        const [reports] = await pool.execute(query, params);
        
        console.log(`✅ Found ${reports.length} reports for user ${req.user.id}`);
        
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

// Create new report (Lecturers AND Students)
router.post('/', [
    protect,
    body('class_name').notEmpty().withMessage('Class name is required'),
    body('date_of_lecture').isDate().withMessage('Valid date is required'),
    body('topic_taught').notEmpty().withMessage('Topic taught is required'),
    body('learning_outcomes').notEmpty().withMessage('Learning outcomes are required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false,
                errors: errors.array() 
            });
        }

        const {
            faculty_name = 'ICT',
            class_name,
            week_of_reporting = 1,
            date_of_lecture,
            course_id,
            actual_students_present = 0,
            total_registered_students = 0,
            venue,
            scheduled_lecture_time = '09:00:00',
            topic_taught,
            learning_outcomes,
            recommendations = ''
        } = req.body;

        console.log('📝 Creating report for user:', { 
            id: req.user.id, 
            role: req.user.role,
            data: req.body 
        });

        // Determine reporter type and set appropriate fields
        let lecturer_id = null;
        let student_id = null;
        let reporter_type = 'lecturer';
        let final_faculty_name = faculty_name;

        if (req.user.role === 'lecturer') {
            lecturer_id = req.user.id;
            reporter_type = 'lecturer';
        } else if (req.user.role === 'student') {
            student_id = req.user.id;
            reporter_type = 'student';
            
            // For student reports, get the lecturer_id and faculty from the class
            try {
                const [classes] = await pool.execute(
                    `SELECT c.lecturer_id, c.faculty 
                     FROM classes c 
                     WHERE c.class_name = ?`,
                    [class_name]
                );
                if (classes.length > 0) {
                    lecturer_id = classes[0].lecturer_id;
                    final_faculty_name = classes[0].faculty || faculty_name;
                    console.log(`👨‍🏫 Assigned lecturer ${lecturer_id} and faculty ${final_faculty_name} to student report`);
                }
            } catch (error) {
                console.log('⚠️ Could not assign lecturer/faculty to student report:', error.message);
            }
        } else {
            return res.status(403).json({
                success: false,
                message: 'Only lecturers and students can create reports'
            });
        }

        // Insert the report
        const [result] = await pool.execute(
            `INSERT INTO lecture_reports 
             (faculty_name, class_name, week_of_reporting, date_of_lecture, course_id, 
              lecturer_id, student_id, reporter_type,
              actual_students_present, total_registered_students, venue, scheduled_lecture_time, 
              topic_taught, learning_outcomes, recommendations) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                final_faculty_name,
                class_name,
                week_of_reporting,
                date_of_lecture,
                course_id || null,
                lecturer_id,
                student_id,
                reporter_type,
                actual_students_present,
                total_registered_students,
                venue,
                scheduled_lecture_time,
                topic_taught,
                learning_outcomes,
                recommendations
            ]
        );

        console.log('✅ Report created with ID:', result.insertId, 'Type:', reporter_type);

        // Fetch the complete report with joined data
        const [newReports] = await pool.execute(`
            SELECT lr.*, 
                   c.course_code, 
                   c.course_name,
                   u_lecturer.first_name as lecturer_first_name, 
                   u_lecturer.last_name as lecturer_last_name,
                   u_student.first_name as student_first_name,
                   u_student.last_name as student_last_name
            FROM lecture_reports lr
            LEFT JOIN courses c ON lr.course_id = c.id
            LEFT JOIN users u_lecturer ON lr.lecturer_id = u_lecturer.id
            LEFT JOIN users u_student ON lr.student_id = u_student.id
            WHERE lr.id = ?
        `, [result.insertId]);

        res.json({
            success: true,
            message: `Report submitted successfully as ${reporter_type}!`,
            data: newReports[0]
        });

    } catch (error) {
        console.error('❌ Report creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating report: ' + error.message
        });
    }
});

// Get available lectures for students to report on
router.get('/available-lectures', protect, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can access this endpoint'
            });
        }

        console.log('📚 Fetching available lectures for student:', req.user.id);

        // Get lecturer reports that students can provide feedback on
        const [lectures] = await pool.execute(`
            SELECT 
                lr.id,
                lr.class_name,
                lr.date_of_lecture,
                lr.topic_taught,
                lr.venue,
                c.course_code,
                c.course_name,
                u.first_name as lecturer_first_name,
                u.last_name as lecturer_last_name,
                c.faculty,
                EXISTS(
                    SELECT 1 FROM lecture_reports lr2 
                    WHERE lr2.student_id = ? AND lr2.class_name = lr.class_name 
                    AND DATE(lr2.date_of_lecture) = DATE(lr.date_of_lecture)
                ) as already_reported
            FROM lecture_reports lr
            JOIN courses c ON lr.course_id = c.id
            JOIN users u ON lr.lecturer_id = u.id
            WHERE lr.reporter_type = 'lecturer'
            AND lr.date_of_lecture <= CURDATE()
            ORDER BY lr.date_of_lecture DESC
            LIMIT 50
        `, [req.user.id]);

        console.log(`✅ Found ${lectures.length} available lectures for student`);

        res.json({
            success: true,
            data: lectures
        });

    } catch (error) {
        console.error('Get available lectures error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching available lectures'
        });
    }
});

// 🔥 RATING ENDPOINT FOR STUDENTS
router.post('/:id/rate', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const studentId = req.user.id;

        console.log('🎯 RATING ENDPOINT CALLED - Report ID:', id);
        console.log('📊 Rating data:', { rating, comment, studentId });

        // Check if user is student
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can rate lectures'
            });
        }

        // Check if report exists and is a lecturer report
        const [reports] = await pool.execute(
            'SELECT id, reporter_type FROM lecture_reports WHERE id = ?',
            [id]
        );

        if (reports.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Lecture report not found'
            });
        }

        if (reports[0].reporter_type !== 'lecturer') {
            return res.status(400).json({
                success: false,
                message: 'You can only rate lectures conducted by lecturers'
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
                   c.course_code,
                   u.first_name as lecturer_first_name,
                   u.last_name as lecturer_last_name
            FROM ratings r
            JOIN lecture_reports lr ON r.report_id = lr.id
            LEFT JOIN courses c ON lr.course_id = c.id
            LEFT JOIN users u ON lr.lecturer_id = u.id
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

// Get available lectures for rating (lectures that student hasn't rated yet)
router.get('/rateable-lectures', protect, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({
                success: false,
                message: 'Only students can access this endpoint'
            });
        }

        console.log('📚 Fetching rateable lectures for student:', req.user.id);

        const [lectures] = await pool.execute(`
            SELECT 
                lr.id,
                lr.class_name,
                lr.date_of_lecture,
                lr.topic_taught,
                lr.venue,
                c.course_code,
                c.course_name,
                u.first_name as lecturer_first_name,
                u.last_name as lecturer_last_name,
                c.faculty,
                EXISTS(
                    SELECT 1 FROM ratings r 
                    WHERE r.report_id = lr.id AND r.student_id = ?
                ) as already_rated
            FROM lecture_reports lr
            JOIN courses c ON lr.course_id = c.id
            JOIN users u ON lr.lecturer_id = u.id
            WHERE lr.reporter_type = 'lecturer'
            AND lr.date_of_lecture <= CURDATE()
            ORDER BY lr.date_of_lecture DESC
            LIMIT 50
        `, [req.user.id]);

        console.log(`✅ Found ${lectures.length} rateable lectures for student`);

        res.json({
            success: true,
            data: lectures
        });

    } catch (error) {
        console.error('Get rateable lectures error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching rateable lectures'
        });
    }
});

// PRL Feedback endpoint
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
            `SELECT lr.*
             FROM lecture_reports lr 
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

        // Check faculty access
        if (report.faculty_name && report.faculty_name !== req.user.faculty) {
            return res.status(403).json({
                success: false,
                message: `You can only provide feedback for reports in your faculty (${req.user.faculty}). This report is from ${report.faculty_name}.`
            });
        }

        // Update the report with feedback
        console.log('🔄 Executing update query...');
        const [result] = await pool.execute(
            'UPDATE lecture_reports SET prl_feedback = ? WHERE id = ?',
            [prl_feedback, id]
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

module.exports = router;