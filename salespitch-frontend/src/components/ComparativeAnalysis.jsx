import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Loader from './Loader';
import './ComparativeAnalysis.css';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import MetricReference from './MetricReference';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';

const ComparativeAnalysis = () => {
  const location = useLocation(); 
  const files = location.state?.data || location.state?.files || [];
  const user_id = location.state?.user_id || new URLSearchParams(location.search).get('userId');
  const warning_file_id = location.state?.warning_file_id || 0;

  const userFiles = (files || []).filter(f => String(f.interview_user_id) === String(user_id));
  if (!userFiles.length) return <div className="no-data-message">No data found for this user.</div>;

  const ratings = userFiles.map(f => f.result_data?.[0]?.rating ? Number(f.result_data[0].rating) : null).filter(r => r !== null);
  const avgRating = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2) : 'N/A';

  let warningFile = userFiles.find(f => f.id === warning_file_id);

  let compareMetrics = [];
  if (warningFile) {
    const otherFiles = userFiles.filter(f => f !== warningFile);
    const getAvgMetric = (arr, key) => {
      const vals = arr.map(obj => (obj && typeof obj === 'object' && key in obj) ? Number(obj[key]) : 0);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    let warningPauses = {}, warningTempo = {};
    try { warningPauses = JSON.parse(warningFile.pauses || '{}'); } catch {}
    try { warningTempo = JSON.parse(warningFile.speaking_rate_and_tone || '{}'); } catch {}

    const otherPauses = otherFiles.map(f => { try { return JSON.parse(f.pauses || '{}'); } catch { return {}; } });
    const otherTempo = otherFiles.map(f => { try { return JSON.parse(f.speaking_rate_and_tone || '{}'); } catch { return {}; } });

    compareMetrics = [
      { key: 'total_pauses', label: 'Total Pauses', other: getAvgMetric(otherPauses, 'total_pauses'), warning: warningPauses.total_pauses ?? 0 },
      { key: 'long_pauses', label: 'Long Pauses', other: getAvgMetric(otherPauses, 'long_pauses'), warning: warningPauses.long_pauses ?? 0 },
      { key: 'tempo_value', label: 'Tempo Value', other: getAvgMetric(otherTempo, 'tempo_value'), warning: warningTempo.tempo_value ?? 0 },
      { key: 'average_pitch', label: 'Average Pitch', other: getAvgMetric(otherTempo, 'average_pitch'), warning: warningTempo.average_pitch ?? 0 }
    ];
  }

  // Metric interpretation function
  const generateInterpretation = (metric) => {
    const diff = metric.warning - metric.other;
    const diffRatio = Math.abs(diff) / (metric.other || 1); // prevent division by zero

    if (metric.key === 'total_pauses' || metric.key === 'long_pauses') {
      if (diffRatio > 0.25 && diff > 0) {
        return `${metric.label} is significantly higher than average. This might indicate the participant was unsure, took more time to think, or faced difficulty during the interview.`;
      } else if (diffRatio > 0.25 && diff < 0) {
        return `${metric.label} is lower than average. This may suggest a more confident or fluent response.`;
      }
    }

    if (metric.key === 'tempo_value') {
      if (diffRatio > 0.2 && diff > 0) {
        return `Higher ${metric.label} than average. The participant may have been rushing, possibly due to nervousness or uncertainty.`;
      } else if (diffRatio > 0.2 && diff < 0) {
        return `Lower ${metric.label} than average. Could indicate calmness or careful articulation.`;
      }
    }

    if (metric.key === 'average_pitch') {
      if (diffRatio > 0.15 && diff > 0) {
        return `${metric.label} is noticeably higher than usual. This might be a sign of tension or anxiety.`;
      } else if (diffRatio > 0.15 && diff < 0) {
        return `${metric.label} is lower than average, possibly indicating a more relaxed tone.`;
      }
    }

    return null;
  };

  // Interview analysis function (replaces generateOverallInterpretation)
  const getInterviewAnalysis = (metrics) => {
    let pauseIssues = 0, tempoIssues = 0, pitchIssues = 0;

    metrics.forEach(metric => {
      const diff = metric.warning - metric.other;
      const ratio = Math.abs(diff) / (metric.other || 1);

      if ((metric.key === 'total_pauses' || metric.key === 'long_pauses') && diff > 0 && ratio > 0.25) {
        pauseIssues++;
      }

      if (metric.key === 'tempo_value' && diff > 0 && ratio > 0.2) {
        tempoIssues++;
      }

      if (metric.key === 'average_pitch' && diff > 0 && ratio > 0.15) {
        pitchIssues++;
      }
    });

    const totalIssues = pauseIssues + tempoIssues + pitchIssues;
    let interpretation = '';
    let difficultyLevel = '';

    if (totalIssues >= 3) {
      interpretation = `The participant showed signs of hesitation and possible nervousness, with higher pauses, faster speech, and elevated pitch — suggesting difficulty during the interview.`;
      difficultyLevel = 'Difficult';
    } else if (totalIssues === 2) {
      interpretation = `The participant showed noticeable signs of strain or pressure, possibly indicating a moderately difficult interview.`;
      difficultyLevel = 'Moderate';
    } else if (totalIssues === 1) {
      interpretation = `Minor signs of hesitation or tension observed, but the participant handled the interview relatively well.`;
      difficultyLevel = 'Easy';
    } else {
      interpretation = `The participant's speech metrics appear balanced, suggesting calm and composed communication throughout.`;
      difficultyLevel = 'Easy';
    }

    return { interpretation, difficultyLevel };
  };

  const [showMetricReference, setShowMetricReference] = useState(false);

  return (
    <div className="comparative-container">
      <div className="comparative-header">
        <h2>Comparative Analysis</h2>
        <div className="header-actions">
          <button className="back-btn" onClick={() => window.history.back()}>Back</button>
        </div>
      </div>
      <div className="user-meta">
        <span><strong>User ID:</strong> {user_id}</span>
        <span><strong>Average Rating:</strong> {avgRating} / 10</span>
      </div>
      <div className="comparative-content">
        <div className="left-panel">
          <table className="comparative-table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Rating</th>
                <th>Uploaded At</th>
              </tr>
            </thead>
            <tbody>
              {userFiles.map((file, idx) => (
                <tr key={idx}>
                  <td>{file.file_name}</td>
                  <td>{file.result_data?.[0]?.rating ?? 'N/A'} / 10</td>
                  <td>{file.uploaded_at ? new Date(file.uploaded_at).toLocaleString() : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="right-panel">
          {compareMetrics.map(metric => (
            <div key={metric.key} className="chart-box">
              <h4>{metric.label}</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Other Files', value: metric.other },
                  { name: warningFile?.file_name || 'File', value: metric.warning }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ))}
          {/* Overall interpretation and difficulty level with metric reference icon */}
          {compareMetrics.length > 0 && (() => {
            const { interpretation, difficultyLevel } = getInterviewAnalysis(compareMetrics);
            return (
              <div className="overall-interpretation-wrapper">
                <div className="overall-interpretation-header">
                  <div className="difficulty-badge">Interview Difficulty: <span className={`difficulty-${difficultyLevel.toLowerCase()}`}>{difficultyLevel}</span></div>
                  <button
                    className="metric-eye-icon"
                    title="Show metric reference"
                    onClick={() => setShowMetricReference(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', float: 'right', marginLeft: 10 }}
                  >
                    <VisibilityOutlinedIcon style={{ color: '#1976d2', fontSize: 22 }} />
                  </button>
                </div>
                <div className="overall-comment">{interpretation}</div>
                {showMetricReference && <MetricReference onClose={() => setShowMetricReference(false)} />}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default ComparativeAnalysis;
