import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { reportService, classService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

// Rating Form Component
const RatingForm = ({ reportId, onRate, onCancel }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await onRate(reportId, rating, comment);
      setRating(0);
      setComment('');
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ minWidth: '250px', background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
      <div className="form-group">
        <label className="form-label">Rating *</label>
        <select
          className="form-select"
          value={rating}
          onChange={(e) => setRating(parseInt(e.target.value))}
          required
          disabled={submitting}
        >
          <option value={0}>Select rating (1-5 stars)</option>
          <option value={1}>⭐ (1) - Poor</option>
          <option value={2}>⭐⭐ (2) - Fair</option>
          <option value={3}>⭐⭐⭐ (3) - Good</option>
          <option value={4}>⭐⭐⭐⭐ (4) - Very Good</option>
          <option value={5}>⭐⭐⭐⭐⭐ (5) - Excellent</option>
        </select>
      </div>
      
      <div className="form-group">
        <label className="form-label">Comment (Optional)</label>
        <textarea
          className="form-control"
          rows="3"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your feedback about this lecture..."
          disabled={submitting}
        />
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <button 
          type="submit" 
          className="btn btn-success"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Rating'}
        </button>
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [ratingReportId, setRatingReportId] = useState(null);

  useEffect(() => {
    fetchStudentData();
  }, [user]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Fetching student data...');
      
      // Fetch reports for monitoring
      const reportsResponse = await reportService.getAll();
      console.log('📋 Reports response:', reportsResponse.data);
      setReports(reportsResponse.data.data || []);
      
      const classesResponse = await classService.getAll();
      console.log('🏫 Classes response:', classesResponse.data);
      setEnrolledClasses(classesResponse.data.data || []);
      
      // Fetch user's ratings
      try {
        const ratingsResponse = await reportService.getMyRatings();
        console.log('⭐ Ratings response:', ratingsResponse.data);
        setMyRatings(ratingsResponse.data.data || []);
      } catch (error) {
        console.log('❌ No ratings found:', error.response?.data?.message || error.message);
        setMyRatings([]);
      }
      
    } catch (error) {
      console.error('❌ Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRateLecture = async (reportId, rating, comment) => {
    try {
      console.log('🎯 Submitting rating for report:', reportId, { rating, comment });
      
      // Call the API to submit rating
      const response = await reportService.addRating(reportId, {
        rating,
        comment: comment || ''
      });

      console.log('✅ Rating response:', response.data);

      if (response.data.success) {
        alert('Rating submitted successfully!');
        
        // Refresh ratings
        try {
          const ratingsResponse = await reportService.getMyRatings();
          setMyRatings(ratingsResponse.data.data || []);
        } catch (error) {
          console.log('Could not refresh ratings:', error);
        }
        
        // Close rating form
        setRatingReportId(null);
        
        // Refresh the data
        fetchStudentData();
      } else {
        throw new Error(response.data.message);
      }
      
    } catch (error) {
      console.error('❌ Error rating lecture:', error);
      console.log('Error response:', error.response?.data);
      alert('Error submitting rating: ' + (error.response?.data?.message || error.message));
    }
  };

  const startRating = (reportId) => {
    setRatingReportId(reportId);
  };

  const cancelRating = () => {
    setRatingReportId(null);
  };

  const getUserRatingForReport = (reportId) => {
    return myRatings.find(rating => rating.report_id === reportId);
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <h1>Student Dashboard</h1>
          <p style={{ fontSize: '1.2rem', color: '#7f8c8d' }}>
            Welcome, {user.first_name} {user.last_name}
          </p>
          
          <div className="dashboard-grid">
            <div className="stat-card">
              <div className="stat-number">{enrolledClasses.length}</div>
              <div className="stat-label">Enrolled Classes</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{reports.length}</div>
              <div className="stat-label">Available Reports</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{myRatings.length}</div>
              <div className="stat-label">Your Ratings</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <button 
              className={`nav-link ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              Monitor Reports ({reports.length})
            </button>
            <button 
              className={`nav-link ${activeTab === 'rating' ? 'active' : ''}`}
              onClick={() => setActiveTab('rating')}
            >
              Rate Lectures ({reports.length})
            </button>
            <button 
              className={`nav-link ${activeTab === 'classes' ? 'active' : ''}`}
              onClick={() => setActiveTab('classes')}
            >
              My Classes ({enrolledClasses.length})
            </button>
            <button 
              className={`nav-link ${activeTab === 'my-ratings' ? 'active' : ''}`}
              onClick={() => setActiveTab('my-ratings')}
            >
              My Ratings ({myRatings.length})
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Monitor Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <h3>Lecture Reports Monitoring</h3>
              <p>View all lecture reports and provide ratings</p>
              
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
                        <th>Your Rating</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map(report => {
                        const userRating = getUserRatingForReport(report.id);
                        return (
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
                            <td>{report.topic_taught?.substring(0, 60) || 'No topic'}...</td>
                            <td>
                              {userRating ? (
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#3498db' }}>
                                    {'⭐'.repeat(userRating.rating)}
                                  </div>
                                  <small>{userRating.rating}/5</small>
                                </div>
                              ) : (
                                <span style={{ color: '#e67e22' }}>Not Rated</span>
                              )}
                            </td>
                            <td>
                              {userRating ? (
                                <button className="btn btn-outline-primary" disabled>
                                  Already Rated
                                </button>
                              ) : (
                                <button 
                                  className="btn btn-primary"
                                  onClick={() => startRating(report.id)}
                                >
                                  Rate Lecture
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <h4 style={{ color: '#7f8c8d' }}>No Reports Available</h4>
                  <p>There are no lecture reports available for rating yet.</p>
                  <p><small>Ask your lecturers to submit some lecture reports.</small></p>
                </div>
              )}
            </div>
          )}

          {/* Rate Lectures Tab */}
          {activeTab === 'rating' && (
            <div>
              <h3>Rate Lectures</h3>
              <p>Provide feedback on lectures you've attended. Click on any lecture to rate it.</p>
              
              {reports.length > 0 ? (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {reports.map(report => {
                    const userRating = getUserRatingForReport(report.id);
                    const isRatingThis = ratingReportId === report.id;

                    return (
                      <div key={report.id} className="card">
                        <div className="card-body">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '1rem' }}>
                            <div style={{ flex: 1 }}>
                              <h4>{report.course_name || 'No Course'} - {report.class_name}</h4>
                              <p><strong>Topic:</strong> {report.topic_taught || 'No topic specified'}</p>
                              <p><strong>Date:</strong> {new Date(report.date_of_lecture).toLocaleDateString()}</p>
                              <p><strong>Lecturer:</strong> {report.lecturer_first_name} {report.lecturer_last_name}</p>
                              <p><strong>Attendance:</strong> {report.actual_students_present}/{report.total_registered_students} students</p>
                            </div>
                            
                            <div style={{ minWidth: '250px' }}>
                              {userRating ? (
                                <div style={{ textAlign: 'center', padding: '1rem', background: '#d4edda', borderRadius: '8px' }}>
                                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#155724' }}>
                                    {'⭐'.repeat(userRating.rating)}
                                  </div>
                                  <div style={{ fontWeight: 'bold', color: '#155724' }}>
                                    {userRating.rating}/5 - Rated
                                  </div>
                                  {userRating.comment && (
                                    <div style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
                                      "{userRating.comment}"
                                    </div>
                                  )}
                                </div>
                              ) : isRatingThis ? (
                                <RatingForm 
                                  reportId={report.id} 
                                  onRate={handleRateLecture}
                                  onCancel={cancelRating}
                                />
                              ) : (
                                <button 
                                  className="btn btn-primary"
                                  onClick={() => startRating(report.id)}
                                  style={{ width: '100%' }}
                                >
                                  Rate This Lecture
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <h4 style={{ color: '#7f8c8d' }}>No Lectures Available for Rating</h4>
                  <p>There are no lecture reports available for rating at the moment.</p>
                  <p><small>This could mean:</small></p>
                  <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                    <li>No lecturers have submitted reports yet</li>
                    <li>There's an issue fetching the reports</li>
                    <li>All available reports have already been rated</li>
                  </ul>
                  <button 
                    onClick={fetchStudentData}
                    className="btn btn-primary"
                    style={{ marginTop: '1rem' }}
                  >
                    Refresh Data
                  </button>
                </div>
              )}
            </div>
          )}

          {/* My Classes Tab */}
          {activeTab === 'classes' && (
            <div>
              <h3>My Enrolled Classes</h3>
              {enrolledClasses.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Class Name</th>
                        <th>Faculty</th>
                        <th>Lecturer</th>
                        <th>Registered Students</th>
                        <th>Recent Reports</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrolledClasses.map(classItem => {
                        const classReports = reports.filter(r => r.class_name === classItem.class_name);
                        return (
                          <tr key={classItem.id}>
                            <td><strong>{classItem.class_name}</strong></td>
                            <td>{classItem.faculty}</td>
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
                                <span style={{ color: '#e67e22' }}>No reports yet</span>
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
                  You are not enrolled in any classes yet.
                </p>
              )}
            </div>
          )}

          {/* My Ratings Tab */}
          {activeTab === 'my-ratings' && (
            <div>
              <h3>My Ratings</h3>
              {myRatings.length > 0 ? (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {myRatings.map(rating => (
                    <div key={rating.id} className="card">
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <h5>Lecture Report #{rating.report_id}</h5>
                            <p><strong>Your Rating:</strong> {'⭐'.repeat(rating.rating)} ({rating.rating}/5)</p>
                            {rating.comment && (
                              <p><strong>Your Comment:</strong> "{rating.comment}"</p>
                            )}
                            <p><strong>Rated on:</strong> {new Date(rating.created_at).toLocaleDateString()}</p>
                          </div>
                          <div style={{ textAlign: 'center', padding: '1rem', background: '#d4edda', borderRadius: '8px', minWidth: '120px' }}>
                            <div style={{ fontSize: '2rem' }}>
                              {'⭐'.repeat(rating.rating)}
                            </div>
                            <div style={{ fontWeight: 'bold', color: '#155724' }}>
                              {rating.rating}/5
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <h4 style={{ color: '#7f8c8d' }}>No Ratings Yet</h4>
                  <p>You haven't rated any lectures yet.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setActiveTab('rating')}
                  >
                    Start Rating Lectures
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;