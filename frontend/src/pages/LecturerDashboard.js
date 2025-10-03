import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { reportService, classService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const LecturerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [recentReports, setRecentReports] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLecturerData();
  }, [user]);

  const fetchLecturerData = async () => {
    try {
      setLoading(true);
      
      // Fetch lecturer's reports
      const reportsResponse = await reportService.getAll();
      const classesResponse = await classService.getAll();
      
      const allReports = reportsResponse.data.data || [];
      const allClasses = classesResponse.data.data || [];
      
      // Filter lecturer's own data
      const myReports = allReports.filter(report => report.lecturer_id === user.id);
      const myClassList = allClasses.filter(classItem => classItem.lecturer_id === user.id);
      
      // Calculate statistics
      const lecturerStats = {
        totalClasses: myClassList.length,
        totalReports: myReports.length,
        reviewedReports: myReports.filter(r => r.prl_feedback).length,
        pendingReview: myReports.filter(r => !r.prl_feedback).length,
        averageAttendance: myReports.length > 0 ? 
          myReports.reduce((sum, report) => sum + (report.actual_students_present / report.total_registered_students), 0) / myReports.length * 100 : 0
      };
      
      setStats(lecturerStats);
      setRecentReports(myReports.slice(0, 5));
      setMyClasses(myClassList);
      
    } catch (error) {
      console.error('Error fetching lecturer data:', error);
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
          <h1>Lecturer Dashboard</h1>
          <p style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>
            Welcome, {user.first_name} {user.last_name}
          </p>
          <p>Manage your classes, create reports, and track student performance</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-number">{stats.totalClasses || 0}</div>
          <div className="stat-label">My Classes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalReports || 0}</div>
          <div className="stat-label">Reports Submitted</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.reviewedReports || 0}</div>
          <div className="stat-label">Reviewed Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pendingReview || 0}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.averageAttendance ? stats.averageAttendance.toFixed(1) : 0}%</div>
          <div className="stat-label">Avg Attendance</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginBottom: '2rem', background: '#e8f4fd' }}>
        <div className="card-body">
          <h4>Quick Actions</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <a href="/reports" className="btn btn-primary">Create New Report</a>
            <a href="/classes" className="btn btn-success">View My Classes</a>
            <a href="/reports" className="btn btn-info">View My Reports</a>
          </div>
        </div>
      </div>

      {/* My Classes */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 style={{ margin: 0, color: 'white' }}>My Classes ({myClasses.length})</h3>
        </div>
        <div className="card-body">
          {myClasses.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Class Name</th>
                    <th>Faculty</th>
                    <th>Registered Students</th>
                    <th>Recent Reports</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {myClasses.map(classItem => {
                    const classReports = recentReports.filter(report => report.class_name === classItem.class_name);
                    return (
                      <tr key={classItem.id}>
                        <td><strong>{classItem.class_name}</strong></td>
                        <td>{classItem.faculty}</td>
                        <td>{classItem.total_registered_students}</td>
                        <td>
                          {classReports.length > 0 ? (
                            <span style={{ color: '#27ae60', fontWeight: '600' }}>
                              {classReports.length} reports
                            </span>
                          ) : (
                            <span style={{ color: '#e67e22' }}>No reports yet</span>
                          )}
                        </td>
                        <td>
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            background: classItem.active ? '#27ae60' : '#e74c3c',
                            color: 'white'
                          }}>
                            {classItem.active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
              No classes assigned to you yet.
            </p>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0, color: 'white' }}>Recent Reports ({recentReports.length})</h3>
        </div>
        <div className="card-body">
          {recentReports.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Date</th>
                    <th>Course</th>
                    <th>Attendance</th>
                    <th>Topic</th>
                    <th>PRL Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {recentReports.map(report => (
                    <tr key={report.id}>
                      <td>{report.class_name}</td>
                      <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                      <td>
                        <strong>{report.course_code || 'N/A'}</strong>
                        <br />
                        <small>{report.course_name || 'No Course'}</small>
                      </td>
                      <td>
                        {report.actual_students_present}/{report.total_registered_students}
                        <br />
                        <small>{((report.actual_students_present/report.total_registered_students)*100).toFixed(1)}%</small>
                      </td>
                      <td>{report.topic_taught?.substring(0, 50)}...</td>
                      <td>
                        {report.prl_feedback ? (
                          <span style={{ color: '#27ae60', fontWeight: '600' }}>✓ Reviewed</span>
                        ) : (
                          <span style={{ color: '#e67e22' }}>Pending</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
              No reports submitted yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;