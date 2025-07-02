import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import AudioUpload from './uploadbutton';
import Loader from './Loader';
import axios from 'axios';
import './AudioAnalysis.css'
import FeedbackReferenceModal from './FeedbackReference';
import { useFiles } from '../context/FileContext';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate, useParams } from 'react-router-dom';

// const files = [
//   {
//     name: 'File 1',
//     rating: 3,
//     strengths: [
//       "Demonstrates a good understanding of SQL, including joins, set operators, window functions (rank, dense_rank), and subqueries.",
//       "Displays familiarity with data manipulation and visualization tools like Excel and Tableau.",
//       "Clearly articulates her experience with ETL processes, although the specifics could be improved.",
//     ],
//     areasOfImprovement: [
//       "Could improve the structure and clarity of some answers, particularly those involving complex SQL queries.",
//       "Needs to provide more quantitative details about projects (e.g., exact data volumes, specific KPIs used)."
//     ]
//   },
//   {
//     name: 'File 2',
//     rating: 5,
//     strengths: ["Excellent understanding of data visualization."],
//     areasOfImprovement: ["Should work on communication skills."]
//   },
//   {
//     name: 'File 3',
//     rating: 2,
//     strengths: [],
//     areasOfImprovement: []
//   },
//   {
//     name: 'File 4',
//     rating: 4,
//     strengths: ["Strong in ETL process."],
//     areasOfImprovement: ["Basic understanding of normalization."]
//   },
//   {
//     name: 'File 5',
//     rating: 3,
//     strengths: ["Confident and articulate."],
//     areasOfImprovement: ["Lacks clarity in SQL subqueries."]
//   },
// ];

const StarRating = ({ count }) => (
  <div className="star-rating">
    {Array.from({ length: count }).map((_, i) => (
      <span key={i} className="star filled">★</span>
    ))}
    {Array.from({ length: 10 - count }).map((_, i) => (
      <span key={i} className="star">★</span>
    ))}
  </div>
);

export default function Dashboard() {
  const { fileName } = useParams();
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('strengths');
  const { files, setFiles } = useFiles();
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // // Redirect to KPI Dashboard on mount if not already there
  // useEffect(() => {
  //   if (window.location.pathname === '/dashboard') {
  //     navigate('/dashboard/kpi', { replace: true });
  //   }
  // }, [navigate]);

  const getTabData = () => {
    if (!selectedFile) return [];
    return activeTab === 'strengths'
      ? selectedFile.result_data[0].strengths
      : selectedFile.result_data[0].areas_of_improvement;
  };
  const audioUploadedResult = (data) => {
        setFiles(data); //This will now update KPI dashboard too
      };
  const getAudioDetails = async() => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/getAllAudioFileDetails', {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if(response.data.length > 0) {
        setFiles(response.data)
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    getAudioDetails();
  }, []);

  // Select file by fileName from URL if present
  useEffect(() => {
    if (fileName && files.length > 0) {
      // Try to match by file_name, then by id (for robust navigation)
      let found = files.find(f => f.file_name === fileName);
      if (!found) {
        found = files.find(f => String(f.id) === String(fileName));
      }
      if (found) {
        setSelectedFile(found);
      }
    }
  }, [fileName, files]);

  // Filter files by search term
  const filteredFiles = files.filter(f =>
    f.file_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group files by interview_user_id
  const userFilesMap = files.reduce((acc, file) => {
    if (!acc[file.interview_user_id]) acc[file.interview_user_id] = [];
    acc[file.interview_user_id].push(file);
    return acc;
  }, {});

  // Helper: get average rating for a user
  function getAvgUserRating(userId) {
    const userFiles = userFilesMap[userId] || [];
    const ratings = userFiles.map(f => f.result_data && Array.isArray(f.result_data) && f.result_data[0] && f.result_data[0].rating ? Number(f.result_data[0].rating) : null).filter(r => r !== null);
    if (!ratings.length) return null;
    return ratings.reduce((a, b) => a + b, 0) / ratings.length;
  }

  // Helper: get rating drop for a file
  function getRatingDrop(file) {
    const avg = getAvgUserRating(file.interview_user_id);
    const rating = file.result_data && Array.isArray(file.result_data) && file.result_data[0] && file.result_data[0].rating ? Number(file.result_data[0].rating) : null;
    if (avg === null || rating === null) return null;
    return avg - rating;
  }

  // Threshold for significant drop
  const SIGNIFICANT_DROP = 2.0;

  if (loading) return <Loader />;

  return (
    <div
      className="dashboard"
      style={{
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      <aside className="sidebar" style={{width : '300px'}}>
        <div className="sidebar-header">Select a file</div>
        <input
          type="text"
          placeholder="Search files..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ width: '100%', marginBottom: 10, padding: 5, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <ul className="file-list">
          {filteredFiles.map((val, idx) => {
            const avgUserRating = getAvgUserRating(val.interview_user_id);
            const rating = val.result_data && Array.isArray(val.result_data) && val.result_data[0] && val.result_data[0].rating ? Number(val.result_data[0].rating) : 0;
            // Remove warning icon from sidebar, but keep stars
            return (
              <li
                key={idx}
                onClick={() => {
                  setSelectedFile(val);
                  setActiveTab('strengths');
                }}
                className={`file-item ${selectedFile && selectedFile.file_name === val.file_name ? 'active' : ''}`}
              >
                <span className="file-name">{val.file_name}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}>
                  <StarRating count={rating} />
                </span>
              </li>
            );
          })}
        </ul>
        <AudioUpload loading = {(load) => setLoading(load)} result = {(data) => audioUploadedResult(data)}/>
        {/* <button
          style={{
            marginTop: '12px',
            backgroundColor: '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '10px 18px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '15px',
            transition: 'background-color 0.3s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.10)'
          }}
          onClick={() => navigate('/interview-test')}
        >
          Start Interview
        </button> */}

      </aside>

      <main
        className="main-content"
        style={{
          flex: 1,
          height: '100%',
          width: '100%',
          maxWidth: '1150px',
          // overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end', 
          // padding: '10px 20px' 
          }}>
          <div style={{ width: '100%', maxWidth: '700px', textAlign: 'center', fontWeight: 800, fontSize: '2rem', color: '#334155', letterSpacing: '2px', marginBottom: '2rem',textTransform: 'uppercase', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", borderBottom: '4px solid #3b82f6', paddingBottom: '0.5rem', 
           margin: '0 auto 2rem auto',
            }}>
          Sales Pitch Analysis
        </div>
          <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '0.5rem'
              }}>
                {/* Logout Button with Icon */}
                {/* <button
                  style={{
                    // backgroundColor: 'rgb(130 133 164)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    height: '30px'
                  }}
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = '/';
                  }}
                  title="Logout"
                >
                  <LogoutIcon style={{ color: '#ff4d4f', fontSize: '24px' }} />
                </button> */}

                {/* KPI Dashboard Button Below */}
                {/* <button
                  style={{
                    backgroundColor: '#2563eb',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 18px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    transition: 'background-color 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  }}
                  onClick={() => window.location.href = '/dashboard/kpi'}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1e40af')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#2563eb')}
                  title="View your overall KPI analytics"
                >
                  View KPI Dashboard
                </button> */}
              </div>
        </div>

        
        
        <div className="tabs-container">
          <div
            className={`tab strengths ${activeTab === 'strengths' ? 'active' : ''}`}
            onClick={() => setActiveTab('strengths')}
          >
            Winning Moves
          </div>
          <div
            className={`tab improve ${activeTab === 'improve' ? 'active' : ''}`}
            onClick={() => setActiveTab('improve')}
          >
            Refinement Areas
          </div>
        </div>

        <div className="content-area">
          <div className="placeholder">
            {selectedFile ? (
              <>
                {/* Show strengths or areas of improvement as Q&A list if available */}
                <p className="placeholder-title">
                  {selectedFile.file_name}
                  {selectedFile.audio_length !== undefined && selectedFile.audio_length !== null &&
                    ` (${selectedFile.audio_length} min)`
                  }
                  {selectedFile.uploaded_at &&
                    ` - ${selectedFile.uploaded_at}`
                  }
                </p>
                <div className="rating-warning">
                  <span>
                    <strong>Rating:</strong> {selectedFile.result_data[0].rating} / 10
                  </span>
                  {(() => {
                    const avgUserRating = getAvgUserRating(selectedFile.interview_user_id);
                    const rating = selectedFile.result_data && Array.isArray(selectedFile.result_data) && selectedFile.result_data[0] && selectedFile.result_data[0].rating ? Number(selectedFile.result_data[0].rating) : 0;
                    const ratingDrop = avgUserRating !== null ? avgUserRating - rating : 0;
                    const showWarning = ratingDrop >= SIGNIFICANT_DROP;
                    const hoverMessage = showWarning
                      ? `Significant rating drop detected! Your score is ${ratingDrop.toFixed(1)} points below your average (${avgUserRating?.toFixed(1)}). Click to view detailed comparative analysis.`
                      : '';
                    return showWarning ? (
                      <span
                        className="warning-icon"
                        title={hoverMessage}
                        onClick={() =>
                          navigate(`/comparative-analysis?userId=${selectedFile.interview_user_id}`, {
                            state: {
                              data: files,
                              user_id: selectedFile.interview_user_id,
                              warning_file_id: selectedFile.id
                            }
                          })
                        }
                      >
                        ⚠️
                      </span>
                    ) : null;
                  })()}
                </div>

                {getTabData().length > 0 ? (
                  <ul className="placeholder-text">
                    {getTabData().map((item, index) => (
                      <li key={index} style={{ marginBottom: '1.2em' }}>
                        <div className="qa-group">
                          {item.remarks && (
                            <div className="remark-line">
                              <strong>{activeTab === 'strengths' ? `Remark` : `Remark`} {index + 1}:</strong> {item.remarks}
                            </div>
                          )}
                          <div className="question-line">
                            <strong>Concept:</strong> {item.concept}
                          </div>
                          {/* <div className="answer-line">
                            <strong>A:</strong> {item.answer}
                          </div> */}
                        </div>
                      </li>
                    ))}
                  </ul>

                ) : (
                  <p className="placeholder-text">No data available for this tab.</p>
                )}
                <div className="audio-analysis-container">
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <FeedbackReferenceModal />
                    </div>
                  <div className="metrics-wrapper">
                    <div className="metric-section pauses-section">
                      <div className="section-title">Pauses Metrics</div>
                      <p className="metric-label">Total Pauses:<span className="metric-value">{JSON.parse(selectedFile.pauses).total_pauses}</span></p>
                      <p className="metric-label">Long Pauses:<span className="metric-value">{JSON.parse(selectedFile.pauses).long_pauses}</span></p>
                      <p className="metric-label">Average Pauses:<span className="metric-value">{JSON.parse(selectedFile.pauses).average_pause_duration}</span></p>
                      <div className="comment-text">{JSON.parse(selectedFile.pauses).pause_comment}</div>
                    </div>
                    <div className="metric-section tempo-section">
                      <div className="section-title">Tempo & Pitch Metrics</div>
                      <p className="metric-label">Tempo Value:<span className="metric-value">{JSON.parse(selectedFile.speaking_rate_and_tone).tempo_value}</span></p>
                      <p className="metric-label">Tempo Description:<span className="metric-value">{JSON.parse(selectedFile.speaking_rate_and_tone).tempo_description}</span></p>
                      <p className="metric-label">Average Pitch:<span className="metric-value">{JSON.parse(selectedFile.speaking_rate_and_tone).average_pitch}</span></p>
                      <p className="metric-label">Pitch Description:<span className="metric-value">{JSON.parse(selectedFile.speaking_rate_and_tone).pitch_description}</span></p>
                      <div className="overall-comment-box-resultspage">
                        <span className="overall-comment-resultspage">{JSON.parse(selectedFile.speaking_rate_and_tone).overall_comment}</span>
                      </div>
                    </div>
                  </div>
                </div>




              </>
            ) : (
              <p className="placeholder-text">Select a file to view its data.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
