-- LUCT Reporting System Database Schema
CREATE DATABASE IF NOT EXISTS luct_reporting_system;
USE luct_reporting_system;

-- Users table for all system roles
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role ENUM('student', 'lecturer', 'principal_lecturer', 'program_leader') NOT NULL,
    faculty VARCHAR(100),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_faculty (faculty)
);

-- Courses table
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_code VARCHAR(20) UNIQUE NOT NULL,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    faculty VARCHAR(100) NOT NULL,
    program_leader_id INT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (program_leader_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_course_code (course_code),
    INDEX idx_faculty (faculty)
);

-- Classes table
CREATE TABLE classes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_name VARCHAR(100) NOT NULL,
    faculty VARCHAR(100) NOT NULL,
    total_registered_students INT DEFAULT 0,
    lecturer_id INT,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_class_name (class_name),
    INDEX idx_faculty (faculty)
);

-- Lecture reports table
CREATE TABLE lecture_reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    faculty_name VARCHAR(100) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    week_of_reporting INT NOT NULL CHECK (week_of_reporting BETWEEN 1 AND 52),
    date_of_lecture DATE NOT NULL,
    course_id INT NOT NULL,
    lecturer_id INT NOT NULL,
    actual_students_present INT NOT NULL CHECK (actual_students_present >= 0),
    total_registered_students INT NOT NULL CHECK (total_registered_students >= 0),
    venue VARCHAR(100) NOT NULL,
    scheduled_lecture_time TIME NOT NULL,
    topic_taught TEXT NOT NULL,
    learning_outcomes TEXT NOT NULL,
    recommendations TEXT,
    status ENUM('draft', 'submitted', 'reviewed') DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_lecturer_id (lecturer_id),
    INDEX idx_week (week_of_reporting),
    INDEX idx_date (date_of_lecture),
    INDEX idx_status (status)
);

-- Feedback table for Principal Lecturers
CREATE TABLE report_feedback (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    principal_lecturer_id INT NOT NULL,
    feedback TEXT NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    status ENUM('pending', 'completed') DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES lecture_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (principal_lecturer_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_feedback (report_id, principal_lecturer_id),
    INDEX idx_report_id (report_id)
);

-- Student ratings table
CREATE TABLE ratings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    report_id INT NOT NULL,
    student_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (report_id) REFERENCES lecture_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_rating (report_id, student_id),
    INDEX idx_report_id (report_id),
    INDEX idx_student_id (student_id)
);

-- Course assignments table
CREATE TABLE course_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    lecturer_id INT NOT NULL,
    assigned_by INT NOT NULL,
    academic_year YEAR NOT NULL,
    semester INT CHECK (semester IN (1, 2)),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (lecturer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_assignment (course_id, lecturer_id, academic_year, semester),
    INDEX idx_lecturer_id (lecturer_id),
    INDEX idx_academic_year (academic_year)
);

-- Class enrollments table
CREATE TABLE class_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (class_id, student_id),
    INDEX idx_class_id (class_id),
    INDEX idx_student_id (student_id)
);

-- Insert initial admin user (Program Leader)
INSERT INTO users (email, password, first_name, last_name, role, faculty) 
VALUES ('admin@luct.ac.ls', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System', 'Administrator', 'program_leader', 'ICT');

-- Insert sample lecturers
INSERT INTO users (email, password, first_name, last_name, role, faculty) VALUES
('lecturer1@luct.ac.ls', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'John', 'Smith', 'lecturer', 'ICT'),
('lecturer2@luct.ac.ls', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sarah', 'Johnson', 'lecturer', 'ICT'),
('prl@luct.ac.ls', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Michael', 'Brown', 'principal_lecturer', 'ICT');

-- Insert sample students
INSERT INTO users (email, password, first_name, last_name, role, faculty) VALUES
('student1@luct.ac.ls', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Alice', 'Davis', 'student', 'ICT'),
('student2@luct.ac.ls', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Bob', 'Wilson', 'student', 'ICT'),
('student3@luct.ac.ls', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Carol', 'Miller', 'student', 'ICT');

-- Insert sample courses
INSERT INTO courses (course_code, course_name, faculty, program_leader_id) VALUES
('DIWA2110', 'Web Application Development', 'ICT', 1),
('DIPR2110', 'Programming Fundamentals', 'ICT', 1),
('DIMT2110', 'Mathematics for IT', 'ICT', 1),
('DIDB2110', 'Database Management Systems', 'ICT', 1),
('DISS2110', 'System Analysis and Design', 'ICT', 1);

-- Insert sample classes
INSERT INTO classes (class_name, faculty, total_registered_students, lecturer_id) VALUES
('IT-1A', 'ICT', 25, 2),
('IT-1B', 'ICT', 30, 3),
('BIT-1A', 'ICT', 28, 2),
('BIT-1B', 'ICT', 32, 3);

-- Insert sample class enrollments
INSERT INTO class_enrollments (class_id, student_id) VALUES
(1, 4), (1, 5), (1, 6),  -- IT-1A students
(2, 4), (2, 5), (2, 6);  -- IT-1B students

-- Insert sample course assignments
INSERT INTO course_assignments (course_id, lecturer_id, assigned_by, academic_year, semester) VALUES
(1, 2, 1, 2024, 1),  -- John Smith assigned to Web Development
(2, 3, 1, 2024, 1),  -- Sarah Johnson assigned to Programming
(3, 2, 1, 2024, 1);  -- John Smith assigned to Mathematics

-- Insert sample lecture reports
INSERT INTO lecture_reports (faculty_name, class_name, week_of_reporting, date_of_lecture, course_id, lecturer_id, actual_students_present, total_registered_students, venue, scheduled_lecture_time, topic_taught, learning_outcomes, recommendations) VALUES
('ICT', 'IT-1A', 6, '2024-03-15', 1, 2, 22, 25, 'Lab 101', '09:00:00', 'React Components and Props', 'Students should understand React component structure and prop passing', 'More practical examples needed for next lecture'),
('ICT', 'IT-1B', 6, '2024-03-16', 2, 3, 28, 30, 'Room 201', '11:00:00', 'Python Data Structures', 'Students should master lists, tuples, and dictionaries in Python', 'Good participation, continue with more exercises');

-- Insert sample feedback
INSERT INTO report_feedback (report_id, principal_lecturer_id, feedback, rating) VALUES
(1, 4, 'Excellent report. Well structured with clear learning outcomes.', 5),
(2, 4, 'Good content coverage. Consider adding more real-world examples.', 4);

-- Insert sample ratings
INSERT INTO ratings (report_id, student_id, rating, comment) VALUES
(1, 4, 5, 'Very clear explanation of React components'),
(1, 5, 4, 'Good lecture but needed more examples'),
(2, 6, 5, 'Python data structures were well explained');