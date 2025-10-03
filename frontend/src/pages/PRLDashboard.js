import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { reportService, courseService, classService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PRLDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [reports, setReports] = useState([]);
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPRLData();
  }, [user]);

  const fetchPRLData = async () => {
    try {
      setLoading(true);
      
      const reportsResponse = await reportService.getAll();
      const coursesResponse = await courseService.getAll();
      const classesResponse = await classService.getAll().catch(() => ({ data: { data: [] } }));

      // Filter data by PRL's faculty
      const facultyReports = reportsResponse.data.data?.filter(report => 
        report.faculty_name === user.faculty
      ) || [];
      
      const facultyCourses = coursesResponse.data.data?.filter(course => 
        course.faculty === user.faculty
      ) || [];
      
      const facultyClasses = classesResponse.data.data?.filter(classItem => 
        classItem.faculty === user.faculty
      ) || [];

      setReports(facultyReports);
      setCourses(facultyCourses);
      setClasses(facultyClasses);

      // Calculate statistics
      const facultyStats = {
        totalCourses: facultyCourses.length,
        totalReports: facultyReports.length,
        totalClasses: facultyClasses.length,
        reviewedReports: facultyReports.filter(r => r.prl_feedback).length,
        pendingReports: facultyReports.filter(r => !r.prl_feedback).length,
        averageAttendance: facultyReports.length > 0 ? 
          facultyReports.reduce((sum, report) => sum + (report.actual_students_present / report.total_registered_students), 0) / facultyReports.length * 100 : 0
      };

      setStats(facultyStats);
      
    } catch (error) {
      console.error('Error fetching PRL data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFeedback = async (reportId, feedback) => {
    try {
      await reportService.addFeedback(reportId, { feedback });
      alert('Feedback added successfully!');
      fetchPRLData(); // Refresh data
    } catch (error) {
      alert('Error adding feedback: ' + error.response?.data?.message);
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
          <h1>Principal Lecturer Dashboard</h1>
          <p style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>
            {user.faculty} Faculty - Monitoring & Review System
          </p>
          <p>Welcome, <strong>{user.first_name} {user.last_name}</strong></p>
        </div>
      </div>

      {/* Statistics */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <div className="stat-number">{stats.totalCourses || 0}</div>
          <div className="stat-label">Courses in Faculty</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalReports || 0}</div>
          <div className="stat-label">Lecture Reports</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.totalClasses || 0}</div>
          <div className="stat-label">Classes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.reviewedReports || 0}</div>
          <div className="stat-label">Reviewed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.pendingReports || 0}</div>
          <div className="stat-label">Pending Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.averageAttendance ? stats.averageAttendance.toFixed(1) + '%' : '0%'}</div>
          <div className="stat-label">Avg Attendance</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <button 
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Faculty Overview
            </button>
            <button 
              className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Review Reports ({reports.length})
            </button>
            <button 
              className={`nav-link ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              Faculty Courses ({courses.length})
            </button>
            <button 
              className={`nav-link ${activeTab === 'classes' ? 'active' : ''}`}
              onClick={() => setActiveTab('classes')}
            >
              Faculty Classes ({classes.length})
            </button>
            <button 
              className={`nav-link ${activeTab === 'monitoring' ? 'active' : ''}`}
              onClick={() => setActiveTab('monitoring')}
            >
              Monitoring
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <h3>Faculty Overview - {user.faculty}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                
                {/* Recent Reports */}
                <div className="card">
                  <div className="card-header">
                    <h4 style={{ margin: 0, color: 'white' }}>Recent Reports</h4>
                  </div>
                  <div className="card-body">
                    {reports.slice(0, 5).map(report => (
                      <div key={report.id} style={{ 
                        padding: '1rem', 
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <strong>{report.course_name}</strong>
                          <br />
                          <small>{report.class_name} - {new Date(report.date_of_lecture).toLocaleDateString()}</small>
                        </div>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          background: report.prl_feedback ? '#27ae60' : '#e67e22',
                          color: 'white'
                        }}>
                          {report.prl_feedback ? 'Reviewed' : 'Pending'}
                        </span>
                      </div>
                    ))}
                    {reports.length === 0 && (
                      <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
                        No reports found for {user.faculty} faculty.
                      </p>
                    )}
                  </div>
                </div>

                {/* Faculty Courses */}
                <div className="card">
                  <div className="card-header">
                    <h4 style={{ margin: 0, color: 'white' }}>Faculty Courses</h4>
                  </div>
                  <div className="card-body">
                    {courses.slice(0, 5).map(course => (
                      <div key={course.id} style={{ 
                        padding: '1rem', 
                        borderBottom: '1px solid #eee'
                      }}>
                        <strong>{course.course_code}</strong>
                        <br />
                        <small>{course.course_name}</small>
                        <br />
                        <small style={{ color: '#3498db' }}>
                          Lecturer: {course.lecturer_name || 'Not Assigned'}
                        </small>
                      </div>
                    ))}
                    {courses.length === 0 && (
                      <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
                        No courses found for {user.faculty} faculty.
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="card">
                  <div className="card-header">
                    <h4 style={{ margin: 0, color: 'white' }}>Quick Actions</h4>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <button 
                        className="btn btn-primary"
                        onClick={() => setActiveTab('reports')}
                      >
                        Review Pending Reports ({stats.pendingReports || 0})
                      </button>
                      <button 
                        className="btn btn-info"
                        onClick={() => setActiveTab('courses')}
                      >
                        View Faculty Courses
                      </button>
                      <button 
                        className="btn btn-success"
                        onClick={() => setActiveTab('classes')}
                      >
                        Monitor Classes
                      </button>
                      <button 
                        className="btn btn-warning"
                        onClick={() => setActiveTab('monitoring')}
                      >
                        System Monitoring
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab - For Reviewing and Adding Feedback */}
          {activeTab === 'reports' && (
            <div>
              <h3>Review Lecture Reports - {user.faculty} Faculty</h3>
              <p>Add feedback to lecture reports from your faculty lecturers.</p>
              
              {reports.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Class</th>
                        <th>Date</th>
                        <th>Lecturer</th>
                        <th>Attendance</th>
                        <th>Topic</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(report => (
                        <ReportRow 
                          key={report.id} 
                          report={report} 
                          onAddFeedback={handleAddFeedback}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
                  No reports found for {user.faculty} faculty.
                </p>
              )}
            </div>
          )}

          {/* Courses Tab */}
          {activeTab === 'courses' && (
            <div>
              <h3>Faculty Courses - {user.faculty}</h3>
              {courses.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Course Code</th>
                        <th>Course Name</th>
                        <th>Assigned Lecturer</th>
                        <th>Status</th>
                        <th>Recent Reports</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map(course => {
                        const courseReports = reports.filter(r => r.course_id === course.id);
                        return (
                          <tr key={course.id}>
                            <td><strong>{course.course_code}</strong></td>
                            <td>{course.course_name}</td>
                            <td>
                              {course.lecturer_name ? (
                                course.lecturer_name
                              ) : (
                                <span style={{ color: '#e67e22' }}>Not Assigned</span>
                              )}
                            </td>
                            <td>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                background: course.active ? '#27ae60' : '#e74c3c',
                                color: 'white'
                              }}>
                                {course.active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td>
                              {courseReports.length > 0 ? (
                                <span style={{ color: '#27ae60', fontWeight: '600' }}>
                                  {courseReports.length} reports
                                </span>
                              ) : (
                                <span style={{ color: '#e67e22' }}>No reports</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
                  No courses found for {user.faculty} faculty.
                </p>
              )}
            </div>
          )}

          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <div>
              <h3>Faculty Classes - {user.faculty}</h3>
              {classes.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Class Name</th>
                        <th>Lecturer</th>
                        <th>Registered Students</th>
                        <th>Recent Reports</th>
                        <th>Average Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classes.map(classItem => {
                        const classReports = reports.filter(r => r.class_name === classItem.class_name);
                        const avgAttendance = classReports.length > 0 ? 
                          classReports.reduce((sum, report) => sum + (report.actual_students_present / report.total_registered_students), 0) / classReports.length * 100 : 0;
                        
                        return (
                          <tr key={classItem.id}>
                            <td><strong>{classItem.class_name}</strong></td>
                            <td>
                              {classItem.lecturer_first_name ? 
                                `${classItem.lecturer_first_name} ${classItem.lecturer_last_name}` : 
                                'Not Assigned'
                              }
                            </td>
                            <td>{classItem.total_registered_students}</td>
                            <td>
                              {classReports.length > 0 ? (
                                <span style={{ color: '#27ae60', fontWeight: '600' }}>
                                  {classReports.length} reports
                                </span>
                              ) : (
                                <span style={{ color: '#e67e22' }}>No reports</span>
                              )}
                            </td>
                            <td>
                              {classReports.length > 0 ? (
                                <span style={{ 
                                  color: avgAttendance >= 70 ? '#27ae60' : avgAttendance >= 50 ? '#e67e22' : '#e74c3c',
                                  fontWeight: '600'
                                }}>
                                  {avgAttendance.toFixed(1)}%
                                </span>
                              ) : (
                                <span style={{ color: '#7f8c8d' }}>N/A</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#7f8c8d', padding: '2rem' }}>
                  No classes found for {user.faculty} faculty.
                </p>
              )}
            </div>
          )}

          {/* Monitoring Tab */}
          {activeTab === 'monitoring' && (
            <div>
              <h3>Faculty Monitoring - {user.faculty}</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                <div className="card text-center">
                  <div className="card-body">
                    <h4 style={{ color: '#3498db' }}>{stats.totalReports || 0}</h4>
                    <p>Total Reports</p>
                  </div>
                </div>
                <div className="card text-center">
                  <div className="card-body">
                    <h4 style={{ color: '#27ae60' }}>{stats.reviewedReports || 0}</h4>
                    <p>Reviewed Reports</p>
                  </div>
                </div>
                <div className="card text-center">
                  <div className="card-body">
                    <h4 style={{ color: '#e67e22' }}>{stats.pendingReports || 0}</h4>
                    <p>Pending Review</p>
                  </div>
                </div>
                <div className="card text-center">
                  <div className="card-body">
                    <h4 style={{ color: '#9b59b6' }}>{stats.averageAttendance ? stats.averageAttendance.toFixed(1) + '%' : '0%'}</h4>
                    <p>Average Attendance</p>
                  </div>
                </div>
              </div>

              {/* Attendance Overview */}
              <div className="card">
                <div className="card-header">
                  <h4 style={{ margin: 0, color: 'white' }}>Attendance Overview</h4>
                </div>
                <div className="card-body">
                  {reports.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Course</th>
                            <th>Class</th>
                            <th>Date</th>
                            <th>Expected</th>
                            <th>Present</th>
                            <th>Attendance %</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.map(report => {
                            const attendancePercent = (report.actual_students_present / report.total_registered_students) * 100;
                            return (
                              <tr key={report.id}>
                                <td>{report.course_name}</td>
                                <td>{report.class_name}</td>
                                <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                                <td>{report.total_registered_students}</td>
                                <td>{report.actual_students_present}</td>
                                <td>
                                  <span style={{
                                    color: attendancePercent >= 70 ? '#27ae60' : 
                                           attendancePercent >= 50 ? '#e67e22' : '#e74c3c',
                                    fontWeight: '600'
                                  }}>
                                    {attendancePercent.toFixed(1)}%
                                  </span>
                                </td>
                                <td>
                                  <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.8rem',
                                    background: report.prl_feedback ? '#27ae60' : '#e67e22',
                                    color: 'white'
                                  }}>
                                    {report.prl_feedback ? 'Reviewed' : 'Pending'}
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
                      No reports available for monitoring.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Report Row Component with Feedback
const ReportRow = ({ report, onAddFeedback }) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState(report.prl_feedback || '');

  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (feedback.trim()) {
      onAddFeedback(report.id, feedback);
      setShowFeedbackForm(false);
    }
  };

  const attendancePercent = (report.actual_students_present / report.total_registered_students) * 100;

  return (
    <tr>
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
        <small style={{
          color: attendancePercent >= 70 ? '#27ae60' : 
                 attendancePercent >= 50 ? '#e67e22' : '#e74c3c'
        }}>
          {attendancePercent.toFixed(1)}%
        </small>
      </td>
      <td>{report.topic_taught?.substring(0, 50)}...</td>
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
      <td>
        {!report.prl_feedback ? (
          showFeedbackForm ? (
            <form onSubmit={handleSubmitFeedback} style={{ minWidth: '200px' }}>
              <textarea
                className="form-control"
                rows="3"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your feedback..."
                required
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" className="btn btn-success btn-sm">
                  Submit
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowFeedbackForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => setShowFeedbackForm(true)}
            >
              Add Feedback
            </button>
          )
        ) : (
          <button 
            className="btn btn-outline-primary btn-sm"
            onClick={() => {
              setFeedback(report.prl_feedback);
              setShowFeedbackForm(true);
            }}
          >
            View Feedback
          </button>
        )}
      </td>
    </tr>
  );
};

export default PRLDashboard;