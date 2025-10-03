import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { reportService, courseService, userService, classService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PLDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentReports, setRecentReports] = useState([]);
  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPLData();
  }, [user]);

  const fetchPLData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data for Program Leader
      const reportsResponse = await reportService.getAll();
      const coursesResponse = await courseService.getAll();
      const usersResponse = await userService.getAll();
      const classesResponse = await classService.getAll();
      
      const reports = reportsResponse.data.data || [];
      const courses = coursesResponse.data.data || [];
      const users = usersResponse.data.data || [];
      const classes = classesResponse.data.data || [];

      // Calculate PL-specific statistics
      const plStats = {
        totalCourses: courses.length,
        totalReports: reports.length,
        totalUsers: users.length,
        totalClasses: classes.length,
        totalLecturers: users.filter(u => u.role === 'lecturer').length,
        totalStudents: users.filter(u => u.role === 'student').length,
        reviewedReports: reports.filter(r => r.prl_feedback).length,
        pendingReports: reports.filter(r => !r.prl_feedback).length,
        assignedCourses: courses.filter(c => c.lecturer_id).length,
        unassignedCourses: courses.filter(c => !c.lecturer_id).length
      };
      
      setStats(plStats);
      setRecentReports(reports.slice(0, 5));
      setRecentCourses(courses.slice(0, 5));
      
    } catch (error) {
      console.error('Error fetching PL data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <h1>Program Leader Dashboard</h1>
          <p style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>
            Welcome, {user.first_name} {user.last_name}
          </p>
          <p>Manage courses, users, classes, and monitor system performance</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
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
          <div className="stat-number">{stats.totalClasses || 0}</div>
          <div className="stat-label">Classes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalLecturers || 0}</div>
          <div className="stat-label">Lecturers</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalStudents || 0}</div>
          <div className="stat-label">Students</div>
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
          <div className="stat-number">{stats.assignedCourses || 0}</div>
          <div className="stat-label">Assigned Courses</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.unassignedCourses || 0}</div>
          <div className="stat-label">Unassigned Courses</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '2rem', background: '#e8f4fd' }}>
        <div className="card-body">
          <h4>Quick Actions</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="/courses" className="btn btn-primary">Manage Courses</a>
            <a href="/users" className="btn btn-success">Manage Users</a>
            <a href="/classes" className="btn btn-info">Manage Classes</a>
            <a href="/reports" className="btn btn-warning">View Reports</a>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Recent Reports */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, color: 'white' }}>Recent Reports</h3>
          </div>
          <div className="card-body">
            {recentReports.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {recentReports.map(report => (
                  <div key={report.id} style={{ 
                    padding: '1rem', 
                    border: '1px solid #e9ecef', 
                    borderRadius: '8px',
                    background: report.prl_feedback ? '#d4edda' : '#fff3cd'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h6 style={{ margin: '0 0 0.5rem 0' }}>
                          {report.course_name} - {report.class_name}
                        </h6>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#6c757d' }}>
                          {new Date(report.date_of_lecture).toLocaleDateString()} • 
                          {report.lecturer_first_name} {report.lecturer_last_name}
                        </p>
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>
                          {report.topic_taught?.substring(0, 80)}...
                        </p>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        background: report.prl_feedback ? '#28a745' : '#ffc107',
                        color: 'white'
                      }}>
                        {report.prl_feedback ? 'Reviewed' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
                No reports found.
              </p>
            )}
          </div>
        </div>

        {/* Recent Courses */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ margin: 0, color: 'white' }}>Recent Courses</h3>
          </div>
          <div className="card-body">
            {recentCourses.length > 0 ? (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {recentCourses.map(course => (
                  <div key={course.id} style={{ 
                    padding: '1rem', 
                    border: '1px solid #e9ecef', 
                    borderRadius: '8px',
                    background: course.lecturer_id ? '#d4edda' : '#fff3cd'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h6 style={{ margin: '0 0 0.5rem 0' }}>
                          {course.course_code} - {course.course_name}
                        </h6>
                        <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#6c757d' }}>
                          {course.faculty} • {course.lecturer_name || 'No Lecturer'}
                        </p>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                        background: course.active ? '#28a745' : '#dc3545',
                        color: 'white'
                      }}>
                        {course.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
                No courses found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PLDashboard;