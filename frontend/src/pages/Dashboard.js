import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { reportService, courseService, userService, classService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data based on user role
      const reportsResponse = await reportService.getAll();
      const coursesResponse = await courseService.getAll();
      const usersResponse = await userService.getAll();
      const classesResponse = await classService.getAll().catch(() => ({ data: { data: [] } })); // Handle if classes endpoint doesn't exist

      const reports = reportsResponse.data.data || [];
      const courses = coursesResponse.data.data || [];
      const users = usersResponse.data.data || [];
      const classes = classesResponse.data.data || [];

      // Calculate statistics based on role
      let roleStats = {};
      
      if (user.role === 'program_leader') {
        roleStats = {
          totalCourses: courses.length,
          totalReports: reports.length,
          totalUsers: users.length,
          totalClasses: classes.length,
          reviewedReports: reports.filter(r => r.prl_feedback).length,
          pendingReports: reports.filter(r => !r.prl_feedback).length
        };
      } else if (user.role === 'principal_lecturer') {
        const facultyReports = reports.filter(r => r.faculty_name === user.faculty);
        roleStats = {
          facultyCourses: courses.filter(c => c.faculty === user.faculty).length,
          facultyReports: facultyReports.length,
          reviewedReports: facultyReports.filter(r => r.prl_feedback).length,
          pendingReview: facultyReports.filter(r => !r.prl_feedback).length
        };
      } else if (user.role === 'lecturer') {
        const myReports = reports.filter(r => r.lecturer_id === user.id);
        roleStats = {
          myReports: myReports.length,
          myCourses: courses.filter(c => c.lecturer_id === user.id).length,
          reviewedReports: myReports.filter(r => r.prl_feedback).length,
          totalRatings: 0 // Would need to calculate from ratings table
        };
      }

      setStats(roleStats);
      setRecentReports(reports.slice(0, 5)); // Show 5 most recent reports
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBasedTitle = () => {
    const titles = {
      program_leader: 'Program Leader Dashboard',
      principal_lecturer: 'Principal Lecturer Dashboard',
      lecturer: 'Lecturer Dashboard',
      student: 'Student Dashboard'
    };
    return titles[user.role] || 'Dashboard';
  };

  const getRoleBasedDescription = () => {
    const descriptions = {
      program_leader: 'Manage courses, view reports, and monitor system performance',
      principal_lecturer: `Review ${user.faculty} faculty reports and provide feedback`,
      lecturer: 'Create reports and track your class performance',
      student: 'Monitor lectures and provide ratings'
    };
    return descriptions[user.role] || 'Welcome to your dashboard';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <h1>{getRoleBasedTitle()}</h1>
          <p style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>
            {getRoleBasedDescription()}
          </p>
          <p>Welcome, <strong>{user.first_name} {user.last_name}</strong></p>
        </div>
      </div>

      {/* Statistics */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        {user.role === 'program_leader' && (
          <>
            <div className="stat-card">
              <div className="stat-number">{stats.totalCourses || 0}</div>
              <div className="stat-label">Total Courses</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalReports || 0}</div>
              <div className="stat-label">Lecture Reports</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalUsers || 0}</div>
              <div className="stat-label">System Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.reviewedReports || 0}</div>
              <div className="stat-label">Reviewed Reports</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.pendingReports || 0}</div>
              <div className="stat-label">Pending Review</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalClasses || 0}</div>
              <div className="stat-label">Classes</div>
            </div>
          </>
        )}

        {user.role === 'principal_lecturer' && (
          <>
            <div className="stat-card">
              <div className="stat-number">{stats.facultyCourses || 0}</div>
              <div className="stat-label">Faculty Courses</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.facultyReports || 0}</div>
              <div className="stat-label">Faculty Reports</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.reviewedReports || 0}</div>
              <div className="stat-label">Reviewed</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.pendingReview || 0}</div>
              <div className="stat-label">Pending Review</div>
            </div>
          </>
        )}

        {user.role === 'lecturer' && (
          <>
            <div className="stat-card">
              <div className="stat-number">{stats.myReports || 0}</div>
              <div className="stat-label">My Reports</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.myCourses || 0}</div>
              <div className="stat-label">My Courses</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.reviewedReports || 0}</div>
              <div className="stat-label">Reviewed</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalRatings || 0}</div>
              <div className="stat-label">Student Ratings</div>
            </div>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0, color: 'white' }}>Recent Lecture Reports</h3>
        </div>
        <div className="card-body">
          {recentReports.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Class</th>
                    <th>Date</th>
                    <th>Lecturer</th>
                    <th>Attendance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map(report => (
                    <tr key={report.id}>
                      <td>
                        <strong>{report.course_code || 'N/A'}</strong>
                        <br />
                        <small>{report.course_name || 'No Course'}</small>
                      </td>
                      <td>{report.class_name}</td>
                      <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                      <td>{report.lecturer_first_name} {report.lecturer_last_name}</td>
                      <td>
                        {report.actual_students_present}/{report.total_registered_students}
                        <br />
                        <small>{((report.actual_students_present/report.total_registered_students)*100).toFixed(1)}%</small>
                      </td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          background: report.prl_feedback ? '#27ae60' : '#e67e22',
                          color: 'white'
                        }}>
                          {report.prl_feedback ? 'Reviewed' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
              No recent reports found.
            </p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {user.role === 'program_leader' && (
        <div className="card" style={{ marginTop: '2rem', background: '#e8f4fd' }}>
          <div className="card-body">
            <h4>Quick Actions</h4>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a href="/courses" className="btn btn-primary">Manage Courses</a>
              <a href="/users" className="btn btn-success">Manage Users</a>
              <a href="/reports" className="btn btn-info">View Reports</a>
              <a href="/classes" className="btn btn-warning">Manage Classes</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;