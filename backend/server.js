const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const reportRoutes = require('./routes/reports');
const courseRoutes = require('./routes/courses');
const userRoutes = require('./routes/users');
const classRoutes = require('./routes/classes'); // Add this line

// Remove classes routes for now since the file doesn't exist
// const classRoutes = require('./routes/classes');

const app = express();

// SIMPLE CORS configuration - Remove the problematic options handler
app.use(cors({
    origin: true, // Allow all origins
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Welcome route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'LUCT Reporting System API',
        version: '1.0.0',
        system: 'Faculty Reporting Application',
        faculty: 'Information Communication Technology',
        endpoints: {
            auth: '/api/auth',
            reports: '/api/reports',
            courses: '/api/courses',
            users: '/api/users'
            // Remove classes for now
        },
        timestamp: new Date().toISOString()
    });
});

// API Routes - Only use the routes that exist
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes); // Add this line
// app.use('/api/classes', classRoutes); // Remove this line

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found',
        requestedPath: req.path
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Contact system administrator'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log('🚀 LUCT Reporting System Backend Server Started');
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    console.log('🔌 Server Port:', PORT);
    console.log('🌐 URL: http://localhost:' + PORT);
    console.log('🗄️ Database:', process.env.DB_NAME || 'luct_reporting_system');
});