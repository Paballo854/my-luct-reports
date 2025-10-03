import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { classService, reportService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const LecturerClasses = () => {
  const { user } = useAuth();
  const [myClasses, setMyClasses] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const classesResponse = await classService.getAll();
      const reportsResponse = await reportService.getAll();
      
      const allClasses = classesResponse.data.data || [];
      const allReports = reportsResponse.data.data || [];
      
      // Filter lecturer's classes and reports
      const lecturerClasses = allClasses.filter(classItem => classItem.lecturer_id === user.id);
      const lecturerReports = allReports.filter(report => report.lecturer_id === user.id);
      
      setMyClasses(lecturerClasses);
      setReports(lecturerReports);
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getClassReports = (className) => {
    return reports.filter(report => report.class_name === className);
  };

  const getClassAttendance = (className) => {
    const classReports = getClassReports(className);
    if (classReports.length === 0) return 0;
    
    const totalAttendance = classReports.reduce((sum, report) => {
      return sum + (report.actual_students_present / report.total_registered_students);
    }, 0);
    
    return (totalAttendance / classReports.length * 100).toFixed(1);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <h1>My Classes</h1>
          <p>Manage and monitor your assigned classes</p>
        </div>
      </div>

      {/* Classes List */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ margin: 0, color: 'white' }}>Assigned Classes ({myClasses.length})</h3>
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
                    <th>Total Reports</th>
                    <th>Average Attendance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myClasses.map(classItem => {
                    const classReports = getClassReports(classItem.class_name);
                    const attendance = getClassAttendance(classItem.class_name);
                    
                    return (
                      <tr key={classItem.id}>
                        <td><strong>{classItem.class_name}</strong></td>
                        <td>{classItem.faculty}</td>
                        <td>{classItem.total_registered_students}</td>
                        <td>
                          <span style={{ 
                            color: classReports.length > 0 ? '#27ae60' : '#e67e22',
                            fontWeight: '600'
                          }}>
                            {classReports.length} reports
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            color: attendance > 70 ? '#27ae60' : attendance > 50 ? '#e67e22' : '#e74c3c',
                            fontWeight: '600'
                          }}>
                            {attendance}%
                          </span>
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
                        <td>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => setSelectedClass(selectedClass === classItem.id ? null : classItem.id)}
                          >
                            {selectedClass === classItem.id ? 'Hide Details' : 'View Details'}
                          </button>
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

      {/* Class Details */}
      {selectedClass && myClasses.map(classItem => {
        if (classItem.id === selectedClass) {
          const classReports = getClassReports(classItem.class_name);
          
          return (
            <div key={classItem.id} className="card" style={{ marginTop: '2rem' }}>
              <div className="card-header">
                <h4 style={{ margin: 0, color: 'white' }}>
                  Class Details: {classItem.class_name}
                </h4>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <div className="stat-card">
                    <div className="stat-number">{classItem.total_registered_students}</div>
                    <div className="stat-label">Registered Students</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{classReports.length}</div>
                    <div className="stat-label">Total Reports</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{getClassAttendance(classItem.class_name)}%</div>
                    <div className="stat-label">Average Attendance</div>
                  </div>
                </div>

                <h5>Recent Reports for {classItem.class_name}</h5>
                {classReports.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Course</th>
                          <th>Attendance</th>
                          <th>Topic</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classReports.slice(0, 5).map(report => (
                          <tr key={report.id}>
                            <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                            <td>{report.course_name}</td>
                            <td>
                              {report.actual_students_present}/{report.total_registered_students}
                              <br />
                              <small>{((report.actual_students_present/report.total_registered_students)*100).toFixed(1)}%</small>
                            </td>
                            <td>{report.topic_taught?.substring(0, 50)}...</td>
                            <td>
                              {report.prl_feedback ? (
                                <span style={{ color: '#27ae60' }}>✓ Reviewed</span>
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
                    No reports submitted for this class yet.
                  </p>
                )}
              </div>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

export default LecturerClasses;