import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import './Landing.css';

const Landing = () => {
  const { user } = useAuth();

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                 Reporting & Management System
              </h1>
              <p className="hero-subtitle">
                Streamline your academic reporting, feedback, and course management 
                with our comprehensive educational platform.
              </p>
              <div className="hero-buttons">
                {user ? (
                  <Link to="/dashboard" className="btn btn-primary btn-lg">
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="btn btn-primary btn-lg">
                      Get Started
                    </Link>
                    <Link to="/register" className="btn btn-outline-primary btn-lg">
                      Create Account
                    </Link>
                  </>
                )}
              </div>
            </div>
            <div className="hero-image">
              <div className="floating-card card-1">
                <i className="fas fa-chalkboard-teacher"></i>
                <span>Lecture Reports</span>
              </div>
              <div className="floating-card card-2">
                <i className="fas fa-star"></i>
                <span>Ratings & Feedback</span>
              </div>
              <div className="floating-card card-3">
                <i className="fas fa-users"></i>
                <span>Class Management</span>
              </div>
              <div className="floating-card card-4">
                <i className="fas fa-chart-line"></i>
                <span>Analytics</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Powerful Features for Academic Excellence</h2>
            <p>Everything you need to manage lectures, courses, and academic feedback in one place</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-file-alt"></i>
              </div>
              <h3>Lecture Reporting</h3>
              <p>Easily create and submit detailed lecture reports with attendance, topics covered, and learning outcomes.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-star-half-alt"></i>
              </div>
              <h3>PRL Feedback</h3>
              <p>Principal Lecturers can provide valuable feedback and guidance on lecture reports.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-chart-bar"></i>
              </div>
              <h3>Student Ratings</h3>
              <p>Students can rate lectures and provide comments for continuous improvement.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-book"></i>
              </div>
              <h3>Course Management</h3>
              <p>Program Leaders can manage courses and assign lecturers efficiently.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-users-cog"></i>
              </div>
              <h3>Class Assignment</h3>
              <p>Assign classes to lecturers and manage academic resources effectively.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <h3>Role-Based Access</h3>
              <p>Secure access control with different permissions for students, lecturers, and administrators.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <h2>How It Works</h2>
            <p>Simple and efficient workflow for all users</p>
          </div>
          
          <div className="steps-container">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h3>Lecturers Create Reports</h3>
                <p>Submit detailed lecture reports including attendance, topics taught, and learning outcomes.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h3>Students Provide Feedback</h3>
                <p>Rate lectures and share feedback to help improve teaching quality.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h3>PRL Review & Guidance</h3>
                <p>Principal Lecturers review reports and provide professional feedback.</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h3>Program Leaders Manage</h3>
                <p>Oversee courses, assign classes, and ensure academic standards.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Benefits Section */}
      <section className="roles-section">
        <div className="container">
          <div className="section-header">
            <h2>Designed for Everyone</h2>
            <p>Tailored experiences for different academic roles</p>
          </div>
          
          <div className="roles-grid">
            <div className="role-card">
              <div className="role-header">
                <i className="fas fa-user-graduate"></i>
                <h3>Students</h3>
              </div>
              <ul className="role-features">
                <li>✓ Rate and review lectures</li>
                <li>✓ View lecture reports</li>
                <li>✓ Track your feedback</li>
                <li>✓ Monitor academic progress</li>
              </ul>
            </div>

            <div className="role-card">
              <div className="role-header">
                <i className="fas fa-chalkboard-teacher"></i>
                <h3>Lecturers</h3>
              </div>
              <ul className="role-features">
                <li>✓ Create lecture reports</li>
                <li>✓ Receive PRL feedback</li>
                <li>✓ View student ratings</li>
                <li>✓ Manage assigned classes</li>
              </ul>
            </div>

            <div className="role-card">
              <div className="role-header">
                <i className="fas fa-user-tie"></i>
                <h3>Principal Lecturers</h3>
              </div>
              <ul className="role-features">
                <li>✓ Review lecture reports</li>
                <li>✓ Provide expert feedback</li>
                <li>✓ Monitor faculty performance</li>
                <li>✓ Ensure quality standards</li>
              </ul>
            </div>

            <div className="role-card">
              <div className="role-header">
                <i className="fas fa-user-cog"></i>
                <h3>Program Leaders</h3>
              </div>
              <ul className="role-features">
                <li>✓ Manage courses and classes</li>
                <li>✓ Assign lecturers</li>
                <li>✓ Oversee academic operations</li>
                <li>✓ Generate reports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Academic Management?</h2>
            <p>Join hundreds of educational institutions using our platform to enhance teaching and learning experiences.</p>
            {user ? (
              <Link to="/dashboard" className="btn btn-light btn-lg">
                Go to Dashboard
              </Link>
            ) : (
              <div className="cta-buttons">
                <Link to="/register" className="btn btn-light btn-lg">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg">
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>Reporting System</h3>
              <p>Empowering educational institutions with efficient academic management tools.</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Platform</h4>
                <a href="#features">Features</a>
                <a href="#how-it-works">How It Works</a>
                <a href="#roles">For Roles</a>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <a href="#help">Help Center</a>
                <a href="#contact">Contact Us</a>
                <a href="#docs">Documentation</a>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <a href="#privacy">Privacy Policy</a>
                <a href="#terms">Terms of Service</a>
                <a href="#cookies">Cookie Policy</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Lecture Reporting System. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;