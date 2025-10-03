const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // REMOVED "AND active = 1" since the column doesn't exist
            const [users] = await pool.execute(
                `SELECT id, email, first_name, last_name, role, faculty, created_at 
                 FROM users WHERE id = ?`,
                [decoded.id]
            );
            
            if (users.length === 0) {
                return res.status(401).json({ 
                    success: false,
                    message: 'User account not found' 
                });
            }
            
            req.user = users[0];
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return res.status(401).json({ 
                success: false,
                message: 'Invalid authentication token' 
            });
        }
    } else {
        return res.status(401).json({ 
            success: false,
            message: 'Authentication required' 
        });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${roles.join(', ')}`
            });
        }
        next();
    };
};

const optionalAuth = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // REMOVED "AND active = 1" since the column doesn't exist
            const [users] = await pool.execute(
                `SELECT id, email, first_name, last_name, role, faculty 
                 FROM users WHERE id = ?`,
                [decoded.id]
            );
            
            if (users.length > 0) {
                req.user = users[0];
            }
        } catch (error) {
            // Continue without user info for optional auth
        }
    }
    next();
};

module.exports = { protect, authorize, optionalAuth };