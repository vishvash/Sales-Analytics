import React from 'react';
import './MetricReference.css';

const MetricReference = ({ onClose }) => {
  return (
    <div className="metric-reference-modal">
      <div className="metric-reference-content">
        <div className="metric-reference-header">
          <h2>Metric Reference</h2>
          <button className="close-button" onClick={onClose}>✖</button>
        </div>

        <h3>📊 Metric Interpretation Rules</h3>
        <table className="reference-table">
          <thead>
            <tr>
              <th>Metric</th>
              <th>Label</th>
              <th>Threshold</th>
              <th>Warning &gt; Other</th>
              <th>Warning &lt; Other</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>total_pauses</td>
              <td>Total Pauses</td>
              <td>&gt; 25%</td>
              <td>Significantly higher than average. Indicates hesitation or difficulty.</td>
              <td>Lower than average. Indicates fluency/confidence.</td>
            </tr>
            <tr>
              <td>long_pauses</td>
              <td>Long Pauses</td>
              <td>&gt; 25%</td>
              <td>Significantly higher than average. Indicates hesitation or difficulty.</td>
              <td>Lower than average. Indicates fluency/confidence.</td>
            </tr>
            <tr>
              <td>tempo_value</td>
              <td>Tempo Value</td>
              <td>&gt; 20%</td>
              <td>Higher than average. May suggest nervousness or rushing.</td>
              <td>Lower than average. Suggests calm, careful speech.</td>
            </tr>
            <tr>
              <td>average_pitch</td>
              <td>Average Pitch</td>
              <td>&gt; 15%</td>
              <td>Higher than average. Indicates tension or anxiety.</td>
              <td>Lower than average. Suggests relaxed tone.</td>
            </tr>
          </tbody>
        </table>

        <h3>🧠 Overall Interview Difficulty Logic</h3>
        <table className="reference-table">
          <thead>
            <tr>
              <th># of Issues</th>
              <th>Difficulty</th>
              <th>Interpretation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>3 or more</td>
              <td>Difficult</td>
              <td>Signs of hesitation, faster speech, and high pitch. Interview likely difficult.</td>
            </tr>
            <tr>
              <td>2</td>
              <td>Moderate</td>
              <td>Noticeable signs of strain or pressure.</td>
            </tr>
            <tr>
              <td>1</td>
              <td>Easy</td>
              <td>Minor hesitation or tension, handled interview relatively well.</td>
            </tr>
            <tr>
              <td>0</td>
              <td>Easy</td>
              <td>Balanced speech metrics. Calm and composed communication.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MetricReference;
