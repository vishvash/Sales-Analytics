import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useFiles } from '../context/FileContext';
import { Typography, TextField, MenuItem } from '@mui/material';
import './KPIDashboard.css';
import { useNavigate } from 'react-router-dom';

const KPIDashboard = () => {
  const { files } = useFiles();
  const [selectedUser, setSelectedUser] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const navigate = useNavigate()

  // Helper to get YYYY-MM-DD from a date string
  const getDateString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d)) return '';
    return d.toISOString().slice(0, 10);
  };

  // Filter files by date range (compare only date part, using uploaded_at)
  const filteredFiles = files.filter(file => {
    if (!file.uploaded_at) return true; // If no uploaded_at, include by default
    const fileDateStr = getDateString(file.uploaded_at);
    const afterStart = !startDate || fileDateStr >= startDate;
    const beforeEnd = !endDate || fileDateStr <= endDate;
    return afterStart && beforeEnd;
  });

  const userMap = {};
  filteredFiles.forEach((file) => {
    const user = file.username || file.file_name?.split('_')[0] || 'Unknown';
    if (!userMap[user]) userMap[user] = [];
    userMap[user].push(file);
  });

  const totalInterviews = filteredFiles.length;

  // Dynamically filter files by selected user as well
  const userFilteredFiles = selectedUser
    ? filteredFiles.filter(file => {
        const user = file.username || file.file_name?.split('_')[0] || 'Unknown';
        return user === selectedUser;
      })
    : filteredFiles;

  // Calculate average rating using all ratings in all result_data arrays
  const allRatings = userFilteredFiles.flatMap(f => {
    if (Array.isArray(f.result_data)) {
      return f.result_data.map(r => (r && typeof r.rating === 'number' ? r.rating : 0));
    }
    return [];
  }).filter(r => typeof r === 'number' && !isNaN(r));
  const averageRating = allRatings.length > 0 ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2) : 0;

  const totalPauses = filteredFiles.reduce((sum, f) => {
    const pauses = JSON.parse(f.pauses || '{}');
    return sum + (pauses.total_pauses || 0);
  }, 0);

  const averageLongPauses = (
    filteredFiles.reduce((sum, f) => {
      const pauses = JSON.parse(f.pauses || '{}');
      return sum + (pauses.long_pauses || 0);
    }, 0) / filteredFiles.length
  ).toFixed(2);

  const averageTempo = (
    filteredFiles.reduce((sum, f) => {
      const tone = JSON.parse(f.speaking_rate_and_tone || '{}');
      return sum + (tone.tempo_value || 0);
    }, 0) / filteredFiles.length
  ).toFixed(2);

  const averagePitch = (
    filteredFiles.reduce((sum, f) => {
      const tone = JSON.parse(f.speaking_rate_and_tone || '{}');
      return sum + (tone.average_pitch || 0);
    }, 0) / filteredFiles.length
  ).toFixed(2);

  // Audio Length Metrics
  const totalAudioLength = userFilteredFiles.reduce((sum, f) => sum + (Number(f.audio_length) || 0), 0).toFixed(2);
  const averageAudioLength = (userFilteredFiles.length > 0 ? (totalAudioLength / userFilteredFiles.length).toFixed(2) : '0');

  const kpiCards = [
    { label: 'Total Calls', value: userFilteredFiles.length },
    {
      label: 'Average Rating',
      value: averageRating
    },
    {
      label: 'Total Pauses',
      value: userFilteredFiles.reduce((acc, f) => {
        const pauses = JSON.parse(f.pauses || '{}');
        return acc + (pauses.total_pauses || 0);
      }, 0)
    },
    {
      label: 'Avg. Long Pauses',
      value: userFilteredFiles.length > 0
        ? (
            userFilteredFiles.reduce((acc, f) => {
              const pauses = JSON.parse(f.pauses || '{}');
              return acc + (pauses.long_pauses || 0);
            }, 0) / userFilteredFiles.length
          ).toFixed(2)
        : 0
    },
    {
      label: 'Avg. Tempo',
      value: userFilteredFiles.length > 0
        ? (
            userFilteredFiles.reduce((acc, f) => {
              const tone = JSON.parse(f.speaking_rate_and_tone || '{}');
              return acc + (tone.tempo_value || 0);
            }, 0) / userFilteredFiles.length
          ).toFixed(2)
        : 0
    },
    {
      label: 'Avg. Pitch',
      value: userFilteredFiles.length > 0
        ? (
            userFilteredFiles.reduce((acc, f) => {
              const tone = JSON.parse(f.speaking_rate_and_tone || '{}');
              return acc + (tone.average_pitch || 0);
            }, 0) / userFilteredFiles.length
          ).toFixed(2)
        : 0
    },
    // New audio length metrics
    {
      label: 'Total Audio Length (min)',
      value: totalAudioLength
    },
    {
      label: 'Avg. Audio Length (min)',
      value: averageAudioLength
    }
  ];

  const userCharts = Object.entries(userMap).map(([user, userFiles]) => {
    const data = userFiles.map((file, i) => ({
      name: file.file_name || `Mock ${i + 1}`,
      rating: Array.isArray(file.result_data) && file.result_data[0] ? file.result_data[0].rating || 0 : 0,
    }));
    return { user, data };
  });

  const multiInterviewUsers = userCharts.filter(chart => chart.data.length > 1);

  // Only show users with at least one file (not just multi-interview users)
  const allUsers = Object.keys(userMap);

  return (
    <div className="dashboard-container" style={{
      width: '100vw',
      minHeight: '100vh',
      maxWidth: '100vw',
      overflow: 'hidden',
      background: '#f8fafc',
      fontFamily: 'Segoe UI, sans-serif',
      color: '#374151',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch', // changed from flex-start to stretch
      boxSizing: 'border-box',
      padding: 0,
      margin: 0
    }}>
      {/* Title at the very top */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 0, padding: 0 }}>
        {/* Filters Row: interviewer search, date filters, and button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.7rem', // reduced gap
          flexWrap: 'wrap',
          margin: '1rem 0 0.5rem 0', // reduced top margin
          width: '100%',
          maxWidth: 900, // reduced maxWidth for more left alignment
          justifyContent: 'flex-start',
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          padding: '0.5rem 1.2rem', // reduced padding
          position: 'relative',
          left: '-314px'
        }}>
          <TextField
            select
            label="Select Agent"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            sx={{ minWidth: 180, maxWidth: 220, height: 40 }}
            size="small"
            SelectProps={{
              native: false,
              MenuProps: {
                PaperProps: {
                  style: { maxHeight: 300, maxWidth: 220, overflowX: 'auto' }
                }
              }
            }}
            InputProps={{
              style: { height: 40, background: '#f5f6fa', borderRadius: 8 },
              startAdornment: (
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ marginRight: 8, padding: 4, border: 'none', outline: 'none', background: 'transparent', fontSize: '1rem', width: 80 }}
                />
              )
            }}
            inputProps={{
              style: { textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', height: 40, padding: 0 }
            }}
          >
            <MenuItem value="">All Agents</MenuItem>
            {allUsers
              .filter(user => user.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(user => (
                <MenuItem key={user} value={user} style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: 180 }}>
                  {user}
                </MenuItem>
              ))}
          </TextField>
          <TextField
            label="Start Date"
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 140, maxWidth: 180, height: 40 }}
            InputProps={{ style: { height: 40, background: '#f5f6fa', borderRadius: 8 } }}
            inputProps={{ style: { height: 40, padding: '0 8px' } }}
          />
          <TextField
            label="End Date"
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
            sx={{ minWidth: 140, maxWidth: 180, height: 40 }}
            InputProps={{ style: { height: 40, background: '#f5f6fa', borderRadius: 8 } }}
            inputProps={{ style: { height: 40, padding: '0 8px' } }}
          />
          {/* <button
            style={{ backgroundColor: '#3b82f6', color: '#fff', padding: '10px 20px', borderRadius: '8px', border: 'none', fontWeight: 'bold', marginLeft: 'auto' }}
            onClick={() => navigate('/results')}
          >
            View Results Dashboard
          </button> */}
        </div>
      </div>
      {/* Remove grid from dashboard-grid, use flex column for stacking */}
      <div className="dashboard-grid" style={{
        marginTop: '0.5rem',
        width: '100%',
        maxWidth: '96%', // changed from 1200 to 100%
        marginLeft: 0, // changed from auto to 0
        marginRight: 0, // changed from auto to 0
        background: '#fff',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        padding: '1.5rem',
        overflowY: 'auto',
        maxHeight: 'calc(100vh - 120px)',
        minHeight: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        <div className="kpi-cards kpi-cards-row" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'stretch', width: '100%', margin: '2rem 0 1rem 0', gap: '0.5rem' }}>
          {kpiCards.map((card, i) => (
            <div key={i} className="kpi-card" style={{ flex: 1, minWidth: 0 }}>
              <div className="kpi-card-title">{card.label}</div>
              <div className="kpi-card-value">{card.value}</div>
            </div>
          ))}
        </div>
        {/* Charts grid: 4 charts per row, full width */}
        {/* First: Move the bottom 4 charts UP */}
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', width: '100%' }}>
          {/* Bar Chart: Calls vs Agents */}
          <div className="chart-card">
            <h4>Calls vs Agents</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                layout="vertical"
                data={allUsers.map(user => ({
                  agent: user,
                  calls: userMap[user]?.length || 0
                }))}
                margin={{ left: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" dataKey="calls" />
                <YAxis type="category" dataKey="agent" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="calls" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Day Wise Calls */}
          <div className="chart-card">
            <h4>Day Wise Calls</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={(() => {
                  const dayMap = {};
                  userFilteredFiles.forEach(f => {
                    const day = getDateString(f.uploaded_at);
                    if (!dayMap[day]) dayMap[day] = 0;
                    dayMap[day]++;
                  });
                  return Object.entries(dayMap).map(([day, count]) => ({ day, calls: count }));
                })()}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="calls" fill="#f59e42" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Top 20 Audio Length Calls */}
          <div className="chart-card">
              <h4 style={{ textAlign: 'center', marginBottom: 12 }}>Top 10 Audio Length Calls</h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={userFilteredFiles
                    .map(f => ({
                      name: f.username || f.file_name?.split('_')[0] || 'Unknown',
                      audio_length: Number(f.audio_length) || 0
                    }))
                    .sort((a, b) => b.audio_length - a.audio_length)
                    .slice(0, 10)
                  }
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tickFormatter={val => `${val} min`} />
                  <Tooltip formatter={value => `${value.toFixed(2)} min`} />
                  <Bar dataKey="audio_length" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          {/* Pie Chart: First Call vs Follow Up */}
          <div className="chart-card">
            <h4>First Call vs Follow Up</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={(() => {
                    let first = 0, follow = 0;
                    userFilteredFiles.forEach(f => {
                      const user = f.username || f.file_name?.split('_')[0] || 'Unknown';
                      if (userMap[user]?.length === 1) first++;
                      else follow++;
                    });
                    return [
                      { name: 'First Call', value: first },
                      { name: 'Follow Up', value: follow }
                    ];
                  })()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  <Cell fill="#6366f1" />
                  <Cell fill="#f59e42" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Second: Move the top 4 charts DOWN */}
        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', width: '100%' }}>
          {/* Combined Line Chart: Pitch and Tempo */}
          <div className="chart-card">
            <h4>Pitch & Tempo per call</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={userFilteredFiles.map((file, i) => ({
                name: file.file_name || `Mock ${i + 1}`,
                pitch: (() => {
                  try {
                    return JSON.parse(file.speaking_rate_and_tone || '{}').average_pitch || 0;
                  } catch {
                    return 0;
                  }
                })(),
                tempo: (() => {
                  try {
                    return JSON.parse(file.speaking_rate_and_tone || '{}').tempo_value || 0;
                  } catch {
                    return 0;
                  }
                })(),
              }))}>
                <CartesianGrid stroke="#eee" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="pitch" stroke="#6366f1" strokeWidth={2} name="Pitch" />
                <Line type="monotone" dataKey="tempo" stroke="#f59e42" strokeWidth={2} name="Tempo" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart: Rating Distribution */}
          <div className="chart-card">
            <h4>Rating Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={(() => {
                    const buckets = [
                      { name: '6', value: 0 },
                      { name: '7', value: 0 },
                      { name: '8', value: 0 },
                      { name: '9-10', value: 0 },
                    ];
                    userFilteredFiles.forEach(f => {
                      const rating = Array.isArray(f.result_data) && f.result_data[0] ? f.result_data[0].rating || 0 : 0;
                      if (rating === 6) buckets[0].value++;
                      else if (rating === 7) buckets[1].value++;
                      else if (rating === 8) buckets[2].value++;
                      else if (rating >= 9 && rating <= 10) buckets[3].value++;
                    });
                    return buckets;
                  })()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  <Cell fill="#f87171" />
                  <Cell fill="#fbbf24" />
                  <Cell fill="#34d399" />
                  <Cell fill="#60a5fa" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Pauses per Interview */}
          <div className="chart-card">
            <h4>Pauses per Call</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userFilteredFiles.map((file, i) => ({
                name: file.file_name || `Mock ${i + 1}`,
                pauses: (() => {
                  try {
                    return JSON.parse(file.pauses || '{}').total_pauses || 0;
                  } catch {
                    return 0;
                  }
                })(),
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="pauses" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Bar Chart: Audio Length per Interview */}
          <div className="chart-card">
            <h4>Audio Length per Call</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={userFilteredFiles.map((file, i) => ({
                name: file.file_name || `Mock ${i + 1}`,
                audio_length: Number(file.audio_length) || 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="audio_length" fill="#f59e42" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default KPIDashboard;
