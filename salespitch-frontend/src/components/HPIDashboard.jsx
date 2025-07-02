import React, { useState } from 'react';
import { useFiles } from '../context/FileContext';
import { TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Button, IconButton, Autocomplete } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { StaticDateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CallIcon from '@mui/icons-material/Call';
import CallMissedOutgoingIcon from '@mui/icons-material/CallMissedOutgoing';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AvTimerIcon from '@mui/icons-material/AvTimer';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import SpeedIcon from '@mui/icons-material/Speed';
import GraphicEqIcon2 from '@mui/icons-material/GraphicEq';
import { useNavigate } from 'react-router-dom';

import './HomeDashboard.css';

const HPIDashboard = () => {
  const navigate = useNavigate();
  const { files } = useFiles();
  const [selectedUser, setSelectedUser] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [tempStartDateTime, setTempStartDateTime] = useState(startDate ? new Date(startDate) : null);
  const [tempEndDateTime, setTempEndDateTime] = useState(endDate ? new Date(endDate) : null);
  const [dropdownOpen, setDropdownOpen] = useState(null);
  const [qnaDialogOpen, setQnaDialogOpen] = useState(false);
  const [qnaDialogData, setQnaDialogData] = useState([]);
  const [qnaDialogFile, setQnaDialogFile] = useState(null);

  const getDateString = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d)) return '';
    return d.toISOString().slice(0, 10);
  };

  const filteredFiles = files.filter(file => {
    if (!file.uploaded_at) return true;
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

  const userFilteredFiles = selectedUser
    ? filteredFiles.filter(file => {
        const user = file.username || file.file_name?.split('_')[0] || 'Unknown';
        return user === selectedUser;
      })
    : filteredFiles;

  const totalAudioLength = userFilteredFiles.reduce((sum, f) => sum + (Number(f.audio_length) || 0), 0).toFixed(2);
  const averageAudioLength = (userFilteredFiles.length > 0 ? (totalAudioLength / userFilteredFiles.length).toFixed(2) : '0');
  const unansweredCalls = userFilteredFiles.filter(f => Number(f.audio_length) * 60 < 10).length;

  const kpiCards = [
    {
      label: 'Total Calls',
      icon: <CallIcon style={{ fontSize: 44, color: '#6366f1', marginBottom: 6 }} />,
      value: userFilteredFiles.length,
      sub: `${userFilteredFiles.length} calls`
    },
    {
      label: 'Unanswered',
      icon: <CallMissedOutgoingIcon style={{ fontSize: 44, color: '#f87171', marginBottom: 6 }} />,
      value: unansweredCalls,
      sub: `${unansweredCalls} calls`
    },
    {
      label: 'Total Audio Duration (min)',
      icon: <AccessTimeIcon style={{ fontSize: 44, color: '#0ea5e9', marginBottom: 6 }} />,
      value: totalAudioLength
    },
    {
      label: 'Average Audio Length (min)',
      icon: <AvTimerIcon style={{ fontSize: 44, color: '#6366f1', marginBottom: 6 }} />,
      value: averageAudioLength
    },
    {
      label: 'Total Pauses',
      icon: <PauseCircleIcon style={{ fontSize: 44, color: '#6366f1', marginBottom: 6 }} />,
      value: userFilteredFiles.reduce((acc, f) => {
        const pauses = JSON.parse(f.pauses || '{}');
        return acc + (pauses.total_pauses || 0);
      }, 0)
    },
    {
      label: 'Avg. Tempo',
      icon: <SpeedIcon style={{ fontSize: 44, color: '#0ea5e9', marginBottom: 6 }} />,
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
      icon: <GraphicEqIcon2 style={{ fontSize: 44, color: '#6366f1', marginBottom: 6 }} />,
      value: userFilteredFiles.length > 0
        ? (
            userFilteredFiles.reduce((acc, f) => {
              const tone = JSON.parse(f.speaking_rate_and_tone || '{}');
              return acc + (tone.average_pitch || 0);
            }, 0) / userFilteredFiles.length
          ).toFixed(2)
        : 0
    }
  ];

  const allUsers = Object.keys(userMap);
  const agentCount = allUsers.length;

  const quickActions = [
    { label: 'Today', action: () => {
      const now = new Date();
      setTempStartDateTime(new Date(now.setHours(0,0,0,0)));
      setTempEndDateTime(new Date());
    }},
    { label: 'This Week', action: () => {
      const now = new Date();
      const first = now.getDate() - now.getDay();
      setTempStartDateTime(new Date(now.setDate(first)));
      setTempEndDateTime(new Date());
    }},
    { label: 'Last 7 Days', action: () => {
      const now = new Date();
      setTempStartDateTime(new Date(now.getTime() - 6*24*60*60*1000));
      setTempEndDateTime(new Date());
    }},
    { label: 'This Month', action: () => {
      const now = new Date();
      setTempStartDateTime(new Date(now.getFullYear(), now.getMonth(), 1));
      setTempEndDateTime(new Date());
    }},
    { label: 'Last Month', action: () => {
      const now = new Date();
      setTempStartDateTime(new Date(now.getFullYear(), now.getMonth()-1, 1));
      setTempEndDateTime(new Date(now.getFullYear(), now.getMonth(), 0));
    }},
  ];

  const navigateToDetails = (file) => {
    // Navigate to the resultspage for the selected file
    const fileId = file.id || file.file_name;
    navigate(`/results/${encodeURIComponent(fileId)}`);
  };

  // Sort userFilteredFiles by uploaded_at descending (most recent first)
  const sortedUserFilteredFiles = [...userFilteredFiles].sort((a, b) => {
    const dateA = a.uploaded_at ? new Date(a.uploaded_at) : new Date(0);
    const dateB = b.uploaded_at ? new Date(b.uploaded_at) : new Date(0);
    return dateB - dateA;
  });

  return (
    <div className="home-dashboard-container" style={{
      width: '100vw',
      minHeight: '100vh',
      maxWidth: '100vw',
      overflowX: 'hidden',
      overflowY: 'auto',
      background: '#f8fafc',
      fontFamily: 'Segoe UI, sans-serif',
      color: '#374151',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      boxSizing: 'border-box',
      padding: 0,
      margin: 0  
    }}>
      <style>{`.home-dashboard-container::-webkit-scrollbar { display: none; }`}</style>

      <div className="home-dashboard-title-row" style={{ alignItems: 'stretch', display: 'flex', gap: '0.7rem', margin: '1rem 0 0.5rem 0', maxWidth: 900, padding: '0.5rem 1.2rem', background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', position: 'relative', left: '28px'}}>
        {/* Filter Bar */}
        <TextField
          select
          label={<span>
            Select Agent
            <span style={{ color: '#888', fontWeight: 400, fontSize: 14, marginLeft: 8 }}>
              ({agentCount})
            </span>
          </span>}
          InputLabelProps={{ shrink: true }}
          value={selectedUser}
          onChange={e => {
            setSelectedUser(e.target.value);
            setSearchTerm("");
          }}
          sx={{ minWidth: 260, maxWidth: 340, height: 40 }}
          size="small"
          SelectProps={{
            native: false,
            MenuProps: {
              PaperProps: {
                style: {
                  maxHeight: 320,
                  borderRadius: 14,
                  boxShadow: '0 6px 24px rgba(99,102,241,0.13)',
                  background: '#fff',
                  marginTop: 6,
                  padding: 0,
                  fontSize: 17,
                  color: '#232946',
                }
              },
              MenuListProps: {
                style: { paddingTop: 0, paddingBottom: 0 }
              }
            },
            displayEmpty: true,
            renderValue: (value) => {
              if (!value) return <span style={{ color: '#6366f1', fontWeight: 700 }}>All Agents</span>;
              return <span style={{ color: '#232946', fontWeight: 700 }}>{value}</span>;
            }
          }}
          InputProps={{
            style: { height: 40, background: '#f5f6fa', borderRadius: 8, fontSize: 17, paddingLeft: 8 },
          }}
          inputProps={{
            style: { textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', height: 40, fontSize: 17, padding: 0 }
          }}
        >
          <MenuItem disabled style={{ padding: 0, background: '#fff', cursor: 'default' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '95%',
                margin: 8,
                padding: 6,
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: 15,
                outline: 'none',
                background: '#f5f6fa',
                color: '#232946',
                boxSizing: 'border-box',
              }}
              onClick={e => e.stopPropagation()}
            />
          </MenuItem>
          <MenuItem value="" style={{ color: '#6366f1', fontWeight: 700, fontSize: 17 }}>All Agents</MenuItem>
          {allUsers
            .filter(user => user.toLowerCase().includes(searchTerm.toLowerCase()))
            .map(user => (
              <MenuItem key={user} value={user} style={{ fontSize: 17, color: '#232946', fontWeight: 500 }}>{user}</MenuItem>
            ))}
        </TextField>
        <span style={{ display: 'flex', alignItems: 'center', fontWeight: 500, color: '#888', fontSize: 16, background: '#f5f6fa', borderRadius: 8, padding: '0 16px', minWidth: 170, height: 40, border: '1.5px solid #d1d5db', boxSizing: 'border-box' }}>
          <CalendarMonthIcon style={{ marginRight: 8, color: '#6366f1' }} />
          {startDate ? startDate : 'yyyy-mm-dd'}
          {startDate && endDate ? ' - ' : ''}
          {endDate ? endDate : 'yyyy-mm-dd'}
        </span>
        <IconButton onClick={() => { setFilterOpen(true); }} style={{ background: '#6366f1', color: '#fff', borderRadius: 8, padding: '0 18px', height: 40, minWidth: 90, display: 'flex', alignItems: 'center' }} size="large">
          <FilterListIcon />
          <span style={{ marginLeft: 6, fontWeight: 600, fontSize: 16 }}>FILTER</span>
        </IconButton>
        <Dialog open={filterOpen} onClose={() => setFilterOpen(false)} maxWidth="md" PaperProps={{
          style: {
            borderRadius: 18,
            boxShadow: '0 4px 24px rgba(99,102,241,0.10)',
            padding: 0,
            minWidth: 800,
            maxWidth: 1000,
            width: '100%',
            background: '#fff',
            overflow: 'visible',
          }
        }}>
          <DialogTitle style={{
            fontWeight: 700,
            fontSize: 22,
            color: '#232946',
            padding: '24px 32px 10px 32px',
            letterSpacing: 0.2,
            background: 'transparent',
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
          }}>Filter by Date & Time</DialogTitle>
          <DialogContent style={{
            padding: 0,
            background: 'transparent',
            borderBottomLeftRadius: 18,
            borderBottomRightRadius: 18,
            display: 'flex',
            flexDirection: 'row',
            minWidth: 700,
            minHeight: 480,
            width: '100%',
            boxSizing: 'border-box',
            justifyContent: 'center',
            alignItems: 'stretch',
            overflow: 'visible',
          }}>
            {/* Quick Actions Panel */}
            <div style={{
              width: '30%',
              minWidth: 180,
              maxWidth: 240,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              padding: '36px 0 36px 36px',
              boxSizing: 'border-box',
              gap: 18,
              borderRight: '1.5px solid #e5e7eb',
              background: 'transparent',
            }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#232946', marginBottom: 10 }}>Quick Actions</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18, width: '100%' }}>
                {quickActions.map((q, i) => (
                  <Button
                    key={i}
                    onClick={q.action}
                    variant="outlined"
                    style={{
                      borderRadius: 24,
                      padding: '12px 0',
                      color: '#f7931e',
                      border: '2px solid #f7931e',
                      fontWeight: 700,
                      fontSize: 15,
                      background: '#fff',
                      transition: 'background 0.2s, color 0.2s',
                      boxShadow: '0 1px 4px #f59e4222',
                      width: '100%',
                      minWidth: 120,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                    onMouseOver={e => {
                      e.target.style.background = '#f7931e';
                      e.target.style.color = '#fff';
                    }}
                    onMouseOut={e => {
                      e.target.style.background = '#fff';
                      e.target.style.color = '#f7931e';
                    }}
                  >{q.label}</Button>
                ))}
              </div>
            </div>
            {/* Date-Time Selection Panel */}
            <div style={{
              width: '70%',
              minWidth: 400,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              padding: '36px 36px 24px 36px',
              boxSizing: 'border-box',
              gap: 24,
              position: 'relative',
              overflow: 'visible',
            }}>
              <div style={{ display: 'flex', flexDirection: 'row', gap: 32, width: '100%', justifyContent: 'center', alignItems: 'flex-start' }}>
                {/* From Picker */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 260, maxWidth: 340 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2', marginBottom: 8 }}>From</div>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <StaticDateTimePicker
                      value={tempStartDateTime}
                      onChange={setTempStartDateTime}
                      ampm={false}
                      displayStaticWrapperAs="desktop"
                      slotProps={{
                        textField: { style: { display: 'none' } },
                        layout: { sx: { minWidth: 260, maxWidth: 340, background: '#f5f6fa', borderRadius: 2 } }
                      }}
                    />
                  </LocalizationProvider>
                </div>
                {/* To Picker */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 260, maxWidth: 340 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#1976d2', marginBottom: 8 }}>To</div>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <StaticDateTimePicker
                      value={tempEndDateTime}
                      onChange={setTempEndDateTime}
                      ampm={false}
                      displayStaticWrapperAs="desktop"
                      slotProps={{
                        textField: { style: { display: 'none' } },
                        layout: { sx: { minWidth: 260, maxWidth: 340, background: '#f5f6fa', borderRadius: 2 } }
                      }}
                    />
                  </LocalizationProvider>
                </div>
              </div>
              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 18,
                width: '100%',
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
                marginTop: 12,
              }}>
                <Button onClick={() => setFilterOpen(false)} color="secondary" style={{ borderRadius: 8, fontWeight: 600, fontSize: 16, padding: '7px 32px', background: '#e5e7eb', color: '#232946', minWidth: 120 }}>Cancel</Button>
                <Button onClick={() => {
                  setStartDate(tempStartDateTime ? tempStartDateTime.toISOString().slice(0, 10) : '');
                  setEndDate(tempEndDateTime ? tempEndDateTime.toISOString().slice(0, 10) : '');
                  setFilterOpen(false);
                }} style={{ background: '#f7931e', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '7px 32px', fontSize: 16, minWidth: 120, boxShadow: '0 2px 8px #f59e4233' }} variant="contained">Apply</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="home-kpi-cards" style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1.2rem',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
        width: '100%',
        margin: '1.2rem 0 0.7rem 0',
        marginTop: '5px',
        paddingBottom: 8,
        paddingLeft: 30
      }}>
        {kpiCards.map((card, i) => (
          <div key={i} className="home-kpi-card" style={{ flex: '1 1 180px', minWidth: 140, maxWidth: 180, padding: '1rem 0', fontSize: 17 }}>
            <div className="home-kpi-card-title">{card.label}</div>
            {card.icon && <div style={{ margin: '0 auto 8px auto' }}>{card.icon}</div>}
            <div className="home-kpi-card-value">{card.value}</div>
            {card.sub && <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>{card.sub}</div>}
          </div>
        ))}
      </div>

      {/* Audio Volume Section */}
      {false && (
      <div style={{
        width: '100%',
        maxWidth: 700,
        margin: '2rem auto 1rem 2rem',
        background: '#f8fafc',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
        padding: 18
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8, marginTop: '5px' }}>
          <GraphicEqIcon style={{ color: '#6366f1', fontSize: 28 }} />
          <span style={{ fontWeight: 600, fontSize: 20 }}>Audio Volume by Call</span>
        </div>
        <div style={{ color: '#888', fontSize: 15, marginBottom: 4}}>
          The bar below shows the relative audio length (as a proxy for volume) for each call. (For real volume, use per-call dB data if available.)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {userFilteredFiles.slice(0, 10).map((f, i) => {
            const maxAudioLength = Math.max(...userFilteredFiles.map(f2 => Number(f2.audio_length) || 1));
            const barWidth = maxAudioLength > 0 ? Math.min(100, (Number(f.audio_length) / maxAudioLength) * 100) : 0;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ minWidth: 90, fontSize: 13, color: '#6366f1', fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{f.file_name || f.id || `Call ${i+1}`}</span>
                <div style={{ flex: 1, height: 14, background: '#e0e7ff', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                  <div style={{ width: `${barWidth}%`, height: '100%', background: '#6366f1', borderRadius: 8, transition: 'width 0.3s' }}></div>
                </div>
                <span style={{ minWidth: 40, textAlign: 'right', fontSize: 13, color: '#374151' }}>{Number(f.audio_length).toFixed(2)} min</span>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Results Table */}
      <div style={{
        width: '75%',
        maxWidth: '100vw',
        margin: '2rem 0',
        padding: '0 30px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          background: '#fff',
          borderRadius: 12,
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          overflow: 'hidden',
          width: '100%'
        }}>
          <div style={{
            maxHeight: '260px',
            overflowY: 'auto',
            overflowX: 'hidden',
            width: '100%'
          }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              tableLayout: 'fixed',
              fontSize: '14px'
            }}>
              <colgroup>
                <col style={{ width: '60px' }} />
                <col style={{ width: '320px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '180px' }} />
                <col style={{ width: '100px' }} />
              </colgroup>
              <thead>
                <tr style={{ 
                  background: '#f8f9fa', 
                  position: 'sticky', 
                  top: 0, 
                  zIndex: 2,
                  height: '36px'
                }}>
                  <th style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#374151'
                  }}>Sl. No</th>
                  <th style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'center',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#374151'
                  }}>Filename</th>
                  <th style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#374151'
                  }}>Audio Length</th>
                  <th style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#374151'
                  }}>Uploaded At</th>
                  <th style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #e5e7eb',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#374151'
                  }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {sortedUserFilteredFiles.map((file, idx) => (
                  <tr key={file.id || file.file_name || idx} style={{ 
                    borderBottom: '1px solid #f1f1f1',
                    height: '40px'
                  }}>
                    <td style={{ 
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#6b7280'
                    }}>{idx + 1}</td>
                    <td style={{
                      padding: '8px 12px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '13px',
                      color: '#374151'
                    }}>
                      {file.file_name || file.id || '-'}
                    </td>
                    <td style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#374151',
                      whiteSpace: 'nowrap',
                      textAlign: 'left'
                    }}>{file.audio_length ? Number(file.audio_length).toFixed(2) + ' min' : '-'}</td>
                    <td style={{
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#374151',
                      whiteSpace: 'nowrap',
                      textAlign: 'left'
                    }}>{file.uploaded_at ? new Date(file.uploaded_at).toLocaleString() : '-'}</td>
                    <td style={{
                      padding: '8px 12px',
                      position: 'relative'
                    }}>
                      <div style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                          onClick={() => setDropdownOpen(dropdownOpen === idx ? null : idx)}
                          style={{
                            padding: '4px 12px',
                            background: '#6366f1',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer',
                            fontWeight: 500,
                            fontSize: '12px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          Details
                          <span style={{ 
                            fontSize: '10px',
                            transform: dropdownOpen === idx ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.2s'
                          }}>▼</span>
                        </button>
                        {dropdownOpen === idx && (
                          <>
                            <div 
                              style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                zIndex: 9
                              }}
                              onClick={() => setDropdownOpen(null)}
                            />
                            <div style={{
                              position: 'absolute',
                              top: '100%',
                              right: 0,
                              background: '#fff',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                              borderRadius: 6,
                              zIndex: 10,
                              minWidth: 220,
                              marginTop: '2px',
                              border: '1px solid #e5e7eb',
                              paddingBottom: 8
                            }}>
                              {/* Confidence Score Display */}
                              <div style={{
                                padding: '10px 14px 0 14px',
                                color: '#374151',
                                fontWeight: 500,
                                fontSize: '13px',
                                borderRadius: '6px',
                                marginBottom: 0
                              }}>
                                Confidence Score: <span style={{ color: '#6366f1', fontWeight: 700 }}>
                                  {file.confidence_score !== undefined && file.confidence_score !== null ? Number(file.confidence_score).toFixed(2) : 'N/A'}
                                </span>
                              </div>
                              {/* Divider */}
                              <div style={{ height: 1, background: '#e5e7eb', margin: '8px 0 4px 0', width: '95%', marginLeft: '2.5%' }} />
                              <div
                                style={{
                                  padding: '10px 14px',
                                  cursor: 'pointer',
                                  color: '#6366f1',
                                  fontWeight: 500,
                                  fontSize: '13px',
                                  borderRadius: '6px',
                                  transition: 'background-color 0.2s'
                                }}
                                onClick={() => {
                                  navigateToDetails(file);
                                  setDropdownOpen(null);
                                }}
                                onMouseEnter={e => e.target.style.backgroundColor = '#f3f4f6'}
                                onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                              >
                                View Detailed Report
                              </div>
                              <div
                                style={{
                                  padding: '10px 14px',
                                  cursor: 'pointer',
                                  color: '#0ea5e9',
                                  fontWeight: 500,
                                  fontSize: '13px',
                                  borderRadius: '6px',
                                  transition: 'background-color 0.2s',
                                  marginTop: 2
                                }}
                                onClick={() => {
                                  // Parse Q&A data robustly
                                  let qnaList = [];
                                  try {
                                    if (file.list_qna_ans) {
                                      let raw = file.list_qna_ans;
                                      if (typeof raw === 'string') {
                                        try { raw = JSON.parse(raw); } catch (e) {
                                          if (raw.includes('\n')) {
                                            qnaList = raw.split(/\n+/).filter(Boolean).map((line, i) => ({ question: `Q${i+1}`, answer: line }));
                                          } else if (raw.includes(';')) {
                                            qnaList = raw.split(';').filter(Boolean).map((line, i) => ({ question: `Q${i+1}`, answer: line }));
                                          } else {
                                            qnaList = [{ question: 'Q1', answer: raw }];
                                          }
                                        }
                                      }
                                      if (Array.isArray(raw)) {
                                        qnaList = raw;
                                      } else if (typeof raw === 'object' && raw !== null) {
                                        qnaList = Object.entries(raw).map(([q, a], i) => ({ question: q, answer: a }));
                                      }
                                    }
                                  } catch (e) { qnaList = []; }
                                  setQnaDialogData(qnaList);
                                  setQnaDialogFile(file);
                                  setQnaDialogOpen(true);
                                  setDropdownOpen(null);
                                }}
                                onMouseEnter={e => e.target.style.backgroundColor = '#f0f9ff'}
                                onMouseLeave={e => e.target.style.backgroundColor = 'transparent'}
                              >
                                View Transcript (Q&amp;A)
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Q&A Dialog */}
      <Dialog open={qnaDialogOpen} onClose={() => setQnaDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{
    style: {
      borderRadius: 18,
      padding: 0,
      background: 'linear-gradient(135deg, #f8fafc 60%, #e0e7ff 100%)',
      boxShadow: '0 8px 32px rgba(99,102,241,0.12)',
      minHeight: 200
    }
  }}>
    <DialogTitle style={{
      background: 'linear-gradient(90deg, #6366f1 60%, #0ea5e9 100%)',
      color: '#fff',
      fontWeight: 700,
      fontSize: 20,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      padding: '18px 28px 12px 28px',
      letterSpacing: 0.5
    }}>
      Transcript (Q&A) {qnaDialogFile ? <span style={{ fontWeight: 400, fontSize: 15, marginLeft: 10, color: '#e0e7ff' }}>{qnaDialogFile.file_name || qnaDialogFile.id}</span> : ''}
    </DialogTitle>
    <DialogContent style={{ padding: '24px 32px 12px 32px', minHeight: 120, maxHeight: 400, overflowY: 'auto', background: 'linear-gradient(120deg, #f8fafc 80%, #e0e7ff 100%)', borderBottomLeftRadius: 18, borderBottomRightRadius: 18 }}>
      {qnaDialogFile && qnaDialogFile.list_qna_ans ? (
        <div style={{
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 16,
          boxShadow: '0 4px 16px #e0e7ff',
          padding: '28px 24px',
          color: '#232946',
          fontSize: 17,
          fontFamily: 'Segoe UI, Arial, sans-serif',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          margin: 0,
          lineHeight: 1.7,
          letterSpacing: 0.1
        }}>{typeof qnaDialogFile.list_qna_ans === 'string' ? qnaDialogFile.list_qna_ans : JSON.stringify(qnaDialogFile.list_qna_ans, null, 2)}</div>
      ) : (
        <div style={{ color: '#888', fontSize: 15, textAlign: 'center', marginTop: 30 }}>No Q&amp;A available.</div>
      )}
    </DialogContent>
    <DialogActions style={{ justifyContent: 'center', padding: '0 0 18px 0' }}>
      <Button onClick={() => setQnaDialogOpen(false)} style={{ background: '#6366f1', color: '#fff', fontWeight: 600, borderRadius: 8, padding: '6px 28px', fontSize: 16 }}>Close</Button>
    </DialogActions>
  </Dialog>
    </div>
  );
};

export default HPIDashboard;