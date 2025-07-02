import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Button, Typography, LinearProgress, Paper, TextField,
  Autocomplete, CircularProgress, Chip
} from '@mui/material';
import './InterviewTest.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  PlayCircleOutline, Replay, ArrowBack, ArrowForward, CheckCircle,
  Mic, Stop, Search
} from '@mui/icons-material';
import AudioRecorderPolyfill from 'audio-recorder-polyfill';

// Polyfill MediaRecorder if not available
if (typeof window !== 'undefined' && typeof window.MediaRecorder === 'undefined') {
  window.MediaRecorder = AudioRecorderPolyfill;
}

const InterviewTest = () => {
  // State
  const [skills, setSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [recordings, setRecordings] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isReview, setIsReview] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [username, setUsername] = useState('');
  const [userOptions, setUserOptions] = useState([]);

  // Refs for recording
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const streamRef = useRef(null);
  const timerRef = useRef(null);

  const MAX_DURATION = 120;

  // Fetch skills on mount
  useEffect(() => {
    setLoadingSkills(true);
    axios.get('http://localhost:8000/skills')
      .then(res => setSkills(res.data))
      .catch(() => toast.error('Failed to fetch skills.'))
      .finally(() => setLoadingSkills(false));
  }, []);

  // Fetch questions when skill is selected
  useEffect(() => {
    if (selectedSkill) {
      setLoadingQuestions(true);
      axios.get(`http://localhost:8000/questions?skill_id=${selectedSkill.id}`)
        .then(res => {
          const shuffled = res.data.sort(() => 0.5 - Math.random());
          setQuestions(shuffled.slice(0, 10));
        })
        .catch(() => toast.error('Failed to fetch questions.'))
        .finally(() => setLoadingQuestions(false));
    } else {
      setQuestions([]);
    }
  }, [selectedSkill]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => {
          if (prev >= MAX_DURATION) {
            stopRecording();
            return MAX_DURATION;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording]);

  useEffect(() => {
    if (isExistingUser) {
      axios.get('http://localhost:8000/getAllInterviewUserDetails')
        .then(res => {
          const users = res.data.map(user => ({ user_name: user.user_name }));
          setUserOptions(users);
        })
        .catch(() => {
          setUserOptions([]);
          toast.error('Failed to fetch existing users.');
        });
    }
  }, [isExistingUser]);

  // Username validation
  const validateUsername = async () => {
    if (!username) {
      toast.error('Please enter a username.');
      return false;
    }
    if (!isExistingUser) {
      try {
        const res = await axios.get(`http://localhost:8000/validate-username?username=${username}`);
        if (res.data.exists) {
          toast.error('Username already exists. Please use a different one.');
          return false;
        }
      } catch {
        toast.error('Username validation failed.');
        return false;
      }
    }
    return true;
  };

  // Recording functions
  const startRecording = async () => {
    const valid = await validateUsername();
    if (!valid) return;
    if (!selectedSkill || questions.length === 0) {
      toast.error('Please select a skill and wait for questions to load.');
      return;
    }
    
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      toast.error('Microphone access denied or not available. Please check your browser settings.');
      return;
    }
    
    streamRef.current = stream;
    recordedChunksRef.current = [];
    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
    } catch {
      try {
        recorder = new MediaRecorder(stream);
      } catch (err) {
        toast.error('Your browser does not support audio recording.');
        stream.getTracks().forEach(track => track.stop());
        return;
      }
    }
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };
    
    recorder.onstop = () => {
      if (!recordedChunksRef.current.length) {
        toast.error('No audio data was recorded. Please try again.');
        setRecordings(prev => {
          const updated = [...prev];
          updated[currentQuestion] = null;
          return updated;
        });
        return;
      }
      const blob = new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      setRecordings(prev => {
        const updated = [...prev];
        updated[currentQuestion] = {
          questionId: questions[currentQuestion].id,
          audioBlob: blob,
          duration: elapsedSeconds,
          blobUrl: URL.createObjectURL(blob)
        };
        return updated;
      });
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };

    try {
      recorder.start();
      setElapsedSeconds(0);
      setIsRecording(true);
    } catch (err) {
      toast.error('Failed to start recording: ' + (err.message || err));
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const retryRecording = () => {
    stopRecording();
    setElapsedSeconds(0);
    startRecording();
  };

  // Navigation functions
  const goToNextQuestion = () => {
    stopRecording();
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    stopRecording();
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  // Review functions
  const handleReview = () => {
    setIsReview(true);
  };

  const handleBackToQuestions = () => {
    setIsReview(false);
  };

  const handleSubmit = async () => {
    const userid = localStorage.getItem('user_id')
    if (!username) {
      toast.error('User not selected!');
      return;
    }
    if (!recordings.length) {
      toast.error('No recordings to submit!');
      return;
    }
    const formData = new FormData();
    recordings.forEach((rec, idx) => {
      formData.append('files', rec.audioBlob, `audio_${idx}.webm`);
      formData.append('durations', rec.duration);
      formData.append('questionids', rec.questionId);
    });
    formData.append('userid', userid); // assuming username is user id or change accordingly
    try {
      const response = await fetch('http://localhost:8000/uploadResponse', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        toast.success('All audio responses uploaded successfully!');
      } else {
        toast.error(data.error || 'Upload failed!');
      }
    } catch (error) {
      toast.error('Network error!');
    }
  }

  // Skill Selection UI
  if (!selectedSkill || loadingQuestions) {
    return (
      <Box className="test-container">
        <Box className="test-skill-selection-wrapper">
          <Paper className="test-skill-selection-paper" elevation={3}>
            <Box className="test-skill-selection-content">
              <Typography variant="h4" className="test-title">
                Select Interview Skill
              </Typography>
              <Typography variant="subtitle1" className="test-subtitle">
                Choose the skill you want to practice
              </Typography>
              
              {loadingQuestions ? (
                <Box className="test-loading-state">
                  <CircularProgress size={60} />
                  <Typography>Loading questions...</Typography>
                </Box>
              ) : (
                <>
                  <Autocomplete
                    options={skills}
                    getOptionLabel={option => option.skillname || ''}
                    onChange={(e, value) => setSelectedSkill(value)}
                    renderInput={params => (
                      <TextField 
                        {...params} 
                        label="Search or select a skill" 
                        variant="outlined"
                        fullWidth
                        className="test-input"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <Search style={{ color: '#7f8c8d', marginRight: 8 }} />
                          )
                        }}
                      />
                    )}
                  />
                  
                  {skills.length > 0 && (
                    <Box className="test-popular-skills-section">
                      <Typography variant="subtitle2" className="test-popular-skills-title">
                        Popular Skills:
                      </Typography>
                      <Box className="test-popular-skills-chips">
                        {skills.slice(0, 4).map(skill => (
                          <Chip
                            key={skill.id}
                            label={skill.skillname}
                            onClick={() => setSelectedSkill(skill)}
                            className="test-skill-chip"
                            variant={selectedSkill?.id === skill.id ? "filled" : "outlined"}
                            color={selectedSkill?.id === skill.id ? "primary" : "default"}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  }

  // No Questions Found
  if (questions.length === 0) {
    return (
      <Box className="test-container">
        <Paper className="test-no-questions-paper" elevation={3}>
          <Typography variant="h6" className="test-no-questions-title">
            No questions found for {selectedSkill.skillname}
          </Typography>
          <Button 
            onClick={() => setSelectedSkill(null)} 
            variant="contained"
            className="test-choose-another-btn"
          >
            Choose Another Skill
          </Button>
        </Paper>
      </Box>
    );
  }

  // Review Mode
  if (isReview) {
    return (
      <Box className="test-container">
        <Paper className="test-review-paper" elevation={3}>
          <Typography variant="h5" className="test-review-title">
            Review Your Answers
          </Typography>
          
          <Box className="test-review-list">
            {questions.map((q, index) => {
              const rec = recordings[index];
              return rec ? (
                <Box key={index} className="test-review-item test-answered">
                  <Typography className="test-review-question">
                    Q{index + 1}: {rec.question}
                  </Typography>
                  <audio controls src={rec.blobUrl} className="test-audio-player" />
                  <Typography variant="caption" className="test-duration-text">
                    Duration: {rec.duration}s
                  </Typography>
                </Box>
              ) : (
                <Box key={index} className="test-review-item test-unanswered">
                  <Typography className="test-review-question">
                    Q{index + 1}: {q?.question}
                  </Typography>
                  <Typography color="error" className="test-no-answer-text">
                    No answer recorded
                  </Typography>
                </Box>
              );
            })}
          </Box>
          
          <Box className="test-review-actions">
            <Button
              variant="contained"
              color="primary"
              onClick={handleBackToQuestions}
              className="test-back-btn"
              fullWidth
            >
              Back to Questions
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              className="test-back-btn"
              fullWidth
            >
              Submit
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Main Interview UI
  return (
    <Box className="test-container">
      <Paper className="test-interview-paper" elevation={3}>
        <Box className="test-interview-header">
          <Typography variant="h5" className="test-interview-title">
            Interview Test - {selectedSkill.skillname}
          </Typography>
          
          <Box className="test-user-section">
            {isExistingUser ? (
              <Autocomplete
                options={userOptions}
                getOptionLabel={(option) => option.user_name || ''}
                isOptionEqualToValue={(option, value) => option.user_name === value?.user_name}
                onChange={(event, newValue) => setUsername(newValue ? newValue.user_name : '')}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Select Existing User" 
                    variant="outlined"
                    fullWidth
                    required
                    className="test-username-input"
                  />
                )}
              />
            ) : (
              <TextField
                fullWidth
                label="Enter Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                variant="outlined"
                required
                className="test-username-input"
              />
            )}
            <Box className="test-user-actions">
              <Button
                variant="text"
                size="small"
                onClick={() => setIsExistingUser(!isExistingUser)}
                className="test-user-toggle"
              >
                {isExistingUser ? "New User?" : "Existing User?"}
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setSelectedSkill(null)}
                className="test-change-skill-btn"
              >
                Change Skill
              </Button>
            </Box>
          </Box>
        </Box>

        <Box className="test-progress-container">
          <LinearProgress
            variant="determinate"
            value={((currentQuestion + 1) / questions.length) * 100}
            className="test-progress-bar"
          />
          <Typography variant="caption" className="test-progress-text">
            Question {currentQuestion + 1} of {questions.length}
          </Typography>
        </Box>

        <Box className="test-question-container">
          <Typography variant="h6" className="test-question-text">
            Q{currentQuestion + 1}: {questions[currentQuestion]?.question}
          </Typography>
          
          <Box className="test-recording-controls">
            {!isRecording ? (
              <Button
                variant="contained"
                color="primary"
                onClick={startRecording}
                startIcon={<Mic />}
                disabled={!!recordings[currentQuestion]}
                className="test-record-btn"
                fullWidth
              >
                {recordings[currentQuestion] ? 'Answer Recorded' : 'Start Recording'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="secondary"
                onClick={stopRecording}
                startIcon={<Stop />}
                className="test-stop-btn"
                fullWidth
              >
                Stop Recording ({elapsedSeconds}s)
              </Button>
            )}
          </Box>

          {recordings[currentQuestion] && (
            <Box className="test-audio-preview">
              <audio controls src={recordings[currentQuestion].blobUrl} className="test-audio-player" />
              <Button
                variant="outlined"
                onClick={retryRecording}
                startIcon={<Replay />}
                className="test-retry-btn"
                fullWidth
              >
                Re-record Answer
              </Button>
            </Box>
          )}
        </Box>

        <Box className="test-navigation-controls">
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={goToPreviousQuestion}
            disabled={currentQuestion === 0}
            className="test-nav-btn"
          >
            Previous
          </Button>
          <Button
            variant="outlined"
            endIcon={<ArrowForward />}
            onClick={goToNextQuestion}
            disabled={currentQuestion === questions.length - 1}
            className="test-nav-btn"
          >
            Next
          </Button>
        </Box>

        <Box className="test-preview-section">
          <Button
            variant="contained"
            color="primary"
            onClick={handleReview}
            className="test-review-btn"
            fullWidth
          >
            Preview & Submit
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default InterviewTest;