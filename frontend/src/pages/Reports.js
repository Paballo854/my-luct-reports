import React, { useState, useEffect } from 'react';
import { useAuth } from '../utils/AuthContext';
import { reportService, courseService, classService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [availableLectures, setAvailableLectures] = useState([]);
  const [courses, setCourses] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('my-reports');

  const [newReport, setNewReport] = useState({
    faculty_name: user.faculty || 'ICT',
    class_name: '',
    week_of_reporting: 1,
    date_of_lecture: new Date().toISOString().split('T')[0],
    course_id: '',
    course_name: '',
    course_code: '',
    actual_students_present: 0,
    total_registered_students: 0,
    venue: '',
    scheduled_lecture_time: '09:00',
    topic_taught: '',
    learning_outcomes: '',
    recommendations: ''
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const reportsResponse = await reportService.getAll();
      const coursesResponse = await courseService.getAll();
      const classesResponse = await classService.getAll();
      
      const allReports = reportsResponse.data.data || [];
      const allClasses = classesResponse.data.data || [];
      
      // Filter reports based on role (now handled by backend)
      setReports(allReports);
      setCourses(coursesResponse.data.data || []);
      setAvailableClasses(allClasses);

      // If student, fetch available lectures to report on
      if (user.role === 'student') {
        try {
          const lecturesResponse = await reportService.getAvailableLectures();
          setAvailableLectures(lecturesResponse.data.data || []);
        } catch (error) {
          console.log('No available lectures endpoint or error:', error);
        }
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Error loading data' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    if (!newReport.class_name) {
      setMessage({ type: 'error', text: 'Please select a class' });
      setSubmitting(false);
      return;
    }

    if (user.role === 'student' && !newReport.topic_taught) {
      setMessage({ type: 'error', text: 'Please describe what was taught' });
      setSubmitting(false);
      return;
    }

    try {
      const response = await reportService.create(newReport);
      
      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: user.role === 'student' 
            ? 'Feedback submitted successfully! Your report is only visible to principal lecturers and program leaders.' 
            : 'Report submitted successfully!' 
        });
        setShowCreateForm(false);
        resetForm();
        fetchData();
      }
    } catch (error) {
      console.error('Error creating report:', error);
      const errorMessage = error.response?.data?.message || 
                          'Failed to submit report';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewReport({
      faculty_name: user.faculty || 'ICT',
      class_name: '',
      week_of_reporting: 1,
      date_of_lecture: new Date().toISOString().split('T')[0],
      course_id: '',
      course_name: '',
      course_code: '',
      actual_students_present: 0,
      total_registered_students: 0,
      venue: '',
      scheduled_lecture_time: '09:00',
      topic_taught: '',
      learning_outcomes: '',
      recommendations: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewReport(prev => ({
      ...prev,
      [name]: name.includes('students') || name.includes('week') ? parseInt(value) || 0 : value
    }));
  };

  const handleCourseSelect = (e) => {
    const courseId = e.target.value;
    const selectedCourse = courses.find(course => course.id == courseId);
    
    if (selectedCourse) {
      setNewReport(prev => ({
        ...prev,
        course_id: courseId,
        course_name: selectedCourse.course_name,
        course_code: selectedCourse.course_code
      }));
    }
  };

  const handleClassChange = (e) => {
    const className = e.target.value;
    const selectedClass = availableClasses.find(cls => cls.class_name === className);
    
    setNewReport(prev => ({
      ...prev,
      class_name: className,
      total_registered_students: selectedClass ? selectedClass.total_registered_students : 0
    }));
  };

  // For students: Pre-fill form with lecture data
  const handleLectureSelect = (lecture) => {
    setNewReport(prev => ({
      ...prev,
      class_name: lecture.class_name,
      date_of_lecture: lecture.date_of_lecture.split('T')[0],
      course_id: lecture.course_id,
      course_name: lecture.course_name,
      course_code: lecture.course_code,
      venue: lecture.venue,
      topic_taught: lecture.topic_taught,
      faculty_name: lecture.faculty || user.faculty || 'ICT'
    }));
  };

  // PRL Feedback Component
  const PRLFeedback = ({ reportId, currentFeedback, onFeedbackAdded }) => {
    const [feedback, setFeedback] = useState(currentFeedback || '');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
      if (!feedback.trim()) {
        alert('Please enter feedback');
        return;
      }

      setSubmitting(true);
      try {
        await reportService.addFeedback(reportId, feedback);
        setMessage({ type: 'success', text: 'Feedback added successfully!' });
        onFeedbackAdded();
        setFeedback('');
      } catch (error) {
        console.error('Error adding feedback:', error);
        setMessage({ type: 'error', text: 'Error adding feedback' });
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <div>
        <textarea
          className="form-control"
          rows="3"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Enter your feedback for this report..."
        />
        <button 
          className="btn btn-sm btn-success mt-1"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>
          {user.role === 'student' ? 'My Lecture Feedback' : 
           user.role === 'lecturer' ? 'Lecture Reports' : 'All Lecture Reports'}
        </h1>
        
        {/* Show create button for lecturers and students */}
        {(user.role === 'lecturer' || user.role === 'student') && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={submitting}
          >
            {showCreateForm ? 'Cancel' : 
             user.role === 'student' ? 'Submit New Feedback' : 'Create New Report'}
          </button>
        )}
      </div>

      {message.text && (
        <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'}`}>
          {message.text}
        </div>
      )}

      {/* CREATE REPORT/FEEDBACK FORM */}
      {showCreateForm && (user.role === 'lecturer' || user.role === 'student') && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <h3 style={{ margin: 0, color: 'white' }}>
              {user.role === 'student' ? 'Submit Lecture Feedback' : 'Create Lecture Report'}
              {user.role === 'student' && (
                <small style={{ display: 'block', fontSize: '0.8rem', opacity: 0.9 }}>
                  Your feedback will only be visible to principal lecturers and program leaders
                </small>
              )}
            </h3>
          </div>
          <div className="card-body">
            
            {/* FOR STUDENTS: Available Lectures to Report On */}
            {user.role === 'student' && availableLectures.length > 0 && (
              <div className="mb-4 p-3 border rounded bg-light">
                <h5>Select a Lecture to Provide Feedback On:</h5>
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {availableLectures.map(lecture => (
                    <div 
                      key={lecture.report_id}
                      className={`p-2 border-bottom cursor-pointer ${newReport.class_name === lecture.class_name ? 'bg-primary text-white' : ''}`}
                      onClick={() => handleLectureSelect(lecture)}
                      style={{ cursor: 'pointer' }}
                    >
                      <strong>{lecture.class_name}</strong> - {lecture.course_code}
                      <br />
                      <small>
                        {new Date(lecture.date_of_lecture).toLocaleDateString()} | 
                        {lecture.topic_taught?.substring(0, 50)}... | 
                        Lecturer: {lecture.lecturer_first_name} {lecture.lecturer_last_name}
                      </small>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateReport}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                
                <div className="form-group">
                  <label className="form-label">Faculty *</label>
                  <select
                    name="faculty_name"
                    className="form-control"
                    value={newReport.faculty_name}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="ICT">ICT</option>
                    <option value="Business">Business</option>
                    <option value="Engineering">Engineering</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Class *</label>
                  <select
                    name="class_name"
                    className="form-control"
                    value={newReport.class_name}
                    onChange={handleClassChange}
                    required
                    disabled={user.role === 'student'} // Students select from available lectures
                  >
                    <option value="">Select Class</option>
                    {availableClasses.map(classItem => (
                      <option key={classItem.id} value={classItem.class_name}>
                        {classItem.class_name} ({classItem.faculty})
                      </option>
                    ))}
                  </select>
                  {user.role === 'student' && (
                    <small className="text-muted">Select from available lectures above</small>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input
                    type="date"
                    name="date_of_lecture"
                    className="form-control"
                    value={newReport.date_of_lecture}
                    onChange={handleInputChange}
                    required
                    disabled={user.role === 'student'} // Auto-filled for students
                  />
                </div>

                {/* Course selection for lecturers only */}
                {user.role === 'lecturer' && (
                  <div className="form-group">
                    <label className="form-label">Course *</label>
                    <select
                      name="course_id"
                      className="form-control"
                      value={newReport.course_id}
                      onChange={handleCourseSelect}
                      required
                    >
                      <option value="">Select Course</option>
                      {courses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.course_code} - {course.course_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Attendance fields only for lecturers */}
                {user.role === 'lecturer' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Students Present *</label>
                      <input
                        type="number"
                        name="actual_students_present"
                        className="form-control"
                        value={newReport.actual_students_present}
                        onChange={handleInputChange}
                        min="0"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Total Students *</label>
                      <input
                        type="number"
                        name="total_registered_students"
                        className="form-control"
                        value={newReport.total_registered_students}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">Venue *</label>
                  <input
                    type="text"
                    name="venue"
                    className="form-control"
                    value={newReport.venue}
                    onChange={handleInputChange}
                    required
                    placeholder="Room 101, Lab A, etc."
                  />
                </div>

              </div>

              {/* Teaching Content */}
              <div className="form-group">
                <label className="form-label">
                  {user.role === 'student' ? 'What was taught in this lecture? *' : 'Topic Taught *'}
                </label>
                <textarea
                  name="topic_taught"
                  className="form-control"
                  rows="3"
                  value={newReport.topic_taught}
                  onChange={handleInputChange}
                  required
                  placeholder={
                    user.role === 'student' 
                      ? "Describe the topics and content covered in this lecture..." 
                      : "What topic did you teach in this lecture?"
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {user.role === 'student' ? 'What did you learn? *' : 'Learning Outcomes *'}
                </label>
                <textarea
                  name="learning_outcomes"
                  className="form-control"
                  rows="3"
                  value={newReport.learning_outcomes}
                  onChange={handleInputChange}
                  required
                  placeholder={
                    user.role === 'student'
                      ? "What were the main concepts you understood? What skills did you develop?"
                      : "What should students be able to do after this lecture?"
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {user.role === 'student' ? 'Your Feedback & Suggestions' : 'Recommendations'}
                </label>
                <textarea
                  name="recommendations"
                  className="form-control"
                  rows="2"
                  value={newReport.recommendations}
                  onChange={handleInputChange}
                  placeholder={
                    user.role === 'student'
                      ? "Any feedback about the teaching style, pace, materials, or suggestions for improvement..."
                      : "Any recommendations for follow-up or improvements..."
                  }
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="btn btn-success" disabled={submitting}>
                  {submitting ? 'Submitting...' : 
                   user.role === 'student' ? 'Submit Feedback' : 'Submit Report'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Reset
                </button>
                <button type="button" className="btn btn-outline-danger" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORTS LIST */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, color: 'white' }}>
              {user.role === 'student' ? 'My Feedback Reports' : 
               user.role === 'lecturer' ? 'My Lecture Reports' : 'All Reports'} 
              ({reports.length})
            </h3>
            
            {/* Info badge for students */}
            {user.role === 'student' && (
              <span className="badge bg-info">
                📢 Only visible to principal lecturers and program leaders
              </span>
            )}
          </div>
        </div>
        <div className="card-body">
          {reports.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Date</th>
                    <th>Course</th>
                    {user.role !== 'student' && <th>Reported By</th>}
                    {user.role === 'lecturer' && <th>Attendance</th>}
                    <th>Topic</th>
                    <th>Outcomes</th>
                    {user.role !== 'student' && <th>PRL Feedback</th>}
                    {user.role === 'principal_lecturer' && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id}>
                      <td>
                        <strong>{report.class_name}</strong>
                        {report.reporter_type === 'student' && (
                          <div>
                            <span className="badge bg-info">Student Feedback</span>
                          </div>
                        )}
                      </td>
                      <td>{new Date(report.date_of_lecture).toLocaleDateString()}</td>
                      <td>
                        <strong>{report.course_code || 'N/A'}</strong>
                        <br />
                        <small>{report.course_name || 'No Course'}</small>
                      </td>
                      
                      {/* Reporter information (hidden from students) */}
                      {user.role !== 'student' && (
                        <td>
                          {report.reporter_type === 'student' ? (
                            <span>
                              <span className="badge bg-info">Student</span>
                              <br />
                              {report.student_first_name} {report.student_last_name}
                              <br />
                              <small className="text-muted">Feedback Report</small>
                            </span>
                          ) : (
                            <span>
                              <span className="badge bg-primary">Lecturer</span>
                              <br />
                              {report.lecturer_first_name} {report.lecturer_last_name}
                            </span>
                          )}
                        </td>
                      )}
                      
                      {/* Attendance (only for lecturers viewing their own reports) */}
                      {user.role === 'lecturer' && report.reporter_type === 'lecturer' && (
                        <td>
                          {report.actual_students_present}/{report.total_registered_students}
                          <br />
                          <small>
                            {((report.actual_students_present/report.total_registered_students)*100).toFixed(1)}%
                          </small>
                        </td>
                      )}
                      {user.role === 'lecturer' && report.reporter_type === 'student' && (
                        <td>
                          <span className="text-muted">N/A</span>
                        </td>
                      )}
                      
                      <td>
                        <div style={{ maxWidth: '200px' }}>
                          {report.topic_taught?.substring(0, 60)}
                          {report.topic_taught?.length > 60 && '...'}
                        </div>
                      </td>
                      
                      <td>
                        <div style={{ maxWidth: '200px' }}>
                          {report.learning_outcomes?.substring(0, 60)}
                          {report.learning_outcomes?.length > 60 && '...'}
                        </div>
                      </td>
                      
                      {/* PRL Feedback Status */}
                      {user.role !== 'student' && (
                        <td>
                          {report.prl_feedback ? (
                            <div>
                              <span className="badge bg-success">Reviewed</span>
                              <br />
                              <small title={report.prl_feedback}>
                                {report.prl_feedback.substring(0, 50)}...
                              </small>
                            </div>
                          ) : (
                            <span className="badge bg-warning">Pending Review</span>
                          )}
                        </td>
                      )}

                      {/* PRL Feedback Action */}
                      {user.role === 'principal_lecturer' && (
                        <td style={{ minWidth: '250px' }}>
                          <PRLFeedback 
                            reportId={report.id}
                            currentFeedback={report.prl_feedback}
                            onFeedbackAdded={fetchData}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#7f8c8d', padding: '3rem' }}>
              {user.role === 'student' ? (
                <div>
                  <h4>No Feedback Reports Yet</h4>
                  <p>You haven't submitted any lecture feedback yet.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setShowCreateForm(true)}
                  >
                    Submit Your First Feedback
                  </button>
                </div>
              ) : (
                <p>No reports found.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;