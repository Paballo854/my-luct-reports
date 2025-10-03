import React, { useState } from 'react';
import { reportService } from '../services/api';

const PRLFeedback = ({ reportId, currentFeedback, onFeedbackAdded }) => {
  const [feedback, setFeedback] = useState(currentFeedback || '');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      setMessage({ type: 'error', text: 'Please enter feedback' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('🔄 Submitting feedback for report:', reportId);
      const response = await reportService.addFeedback(reportId, feedback);
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Feedback added successfully!' });
        setShowForm(false);
        if (onFeedbackAdded) {
          onFeedbackAdded(feedback);
        }
      }
    } catch (error) {
      console.error('❌ Error adding feedback:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          'Error adding feedback';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: '1rem' }}>
      {currentFeedback ? (
        <div>
          <strong>Your Feedback:</strong>
          <p style={{ 
            background: '#e8f4fd', 
            padding: '1rem', 
            borderRadius: '4px',
            margin: '0.5rem 0',
            fontSize: '0.9rem'
          }}>
            {currentFeedback}
          </p>
          <button 
            className="btn btn-sm btn-info"
            onClick={() => setShowForm(!showForm)}
            disabled={loading}
          >
            Edit Feedback
          </button>
        </div>
      ) : (
        <button 
          className="btn btn-sm btn-primary"
          onClick={() => setShowForm(!showForm)}
          disabled={loading}
        >
          Add Feedback
        </button>
      )}

      {showForm && (
        <div style={{ 
          marginTop: '1rem', 
          padding: '1rem', 
          border: '1px solid #ddd', 
          borderRadius: '4px',
          background: '#f8f9fa'
        }}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                <strong>PRL Feedback:</strong>
              </label>
              <textarea
                className="form-control"
                rows="4"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your feedback for this lecture report..."
                disabled={loading}
                style={{ fontSize: '0.9rem' }}
              />
            </div>

            {message.text && (
              <div className={`alert ${message.type === 'error' ? 'alert-danger' : 'alert-success'} py-2`}>
                {message.text}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button 
                type="submit" 
                className="btn btn-success btn-sm"
                disabled={loading || !feedback.trim()}
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setShowForm(false);
                  setFeedback(currentFeedback || '');
                  setMessage({ type: '', text: '' });
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PRLFeedback;