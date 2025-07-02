import React, { useState, useRef } from 'react';
import {
  Button, Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Paper, Checkbox, FormControlLabel, IconButton, Typography,
  Autocomplete, TextField
} from '@mui/material';
import UploadIcon from '@mui/icons-material/Upload';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import Loader from './Loader';
import { toast } from 'react-toastify';

function AudioUpload({ loading, result }) {
  const [audioFile, setAudioFile] = useState(null);
  const [open, setOpen] = useState(false);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [userOptions, setUserOptions] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const inputRef = useRef();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file);
    } else {
      toast.error('Please upload a valid audio file.');
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    const file = event.dataTransfer.files?.[0];
    if (file?.type.startsWith('audio/')) {
      setAudioFile(file);
    } else {
      toast.error('Please upload a valid audio file.');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleRemoveFile = () => {
    setAudioFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleExistingUserChange = async (e) => {
    const checked = e.target.checked;
    setIsExistingUser(checked);
    if (checked) {
      try {
        const response = await axios.get('http://localhost:8000/getAllInterviewUserDetails');
        setUserOptions(response.data || []);
      } catch (error) {
        setUserOptions([]);
      }
    } else {
      setSelectedUser(null);
    }
  };

  const handleUpload = async () => {
    if (!audioFile) {
      toast.error('No audio file selected!');
      return;
    }
    loading(true);
    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('isExistingUser', isExistingUser);
    if (isExistingUser && selectedUser) {
      formData.append('userId', selectedUser.id || 0);
      formData.append('userName', selectedUser.user_name || '');
    } else if (!isExistingUser && selectedUser) {
      formData.append('userId', 0);
      formData.append('userName', selectedUser.value || '');
    }

    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data?.detail || response.data?.error) {
        const backendMsg = response.data.detail || response.data.error;
        toast.error(typeof backendMsg === 'string' ? backendMsg : JSON.stringify(backendMsg));
        loading(false);
        return;
      }
      toast.success('File uploaded successfully');
      if (response.data.length > 0) result(response.data);
      setOpen(false);
      setAudioFile(null);
      setSelectedUser(null);
    } catch (error) {
      let errorMsg = 'Failed to upload file.';
      if (error.response?.data) {
        errorMsg = typeof error.response.data === 'string'
          ? error.response.data
          : error.response.data.detail || error.response.data.error || errorMsg;
      } else if (error.message) {
        errorMsg = error.message;
      }
      toast.error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      loading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<UploadIcon />}
        onClick={() => setOpen(true)}
        className="upload-audio-btn"
      >
        Upload Audio
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Upload Audio File</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              mt: 2,
              mb: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Paper
              elevation={dragActive ? 6 : 2}
              sx={{
                width: '100%',
                minHeight: 120,
                border: dragActive ? '2px solid #1976d2' : '2px dashed #aaa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                position: 'relative',
                background: dragActive ? '#f0f7ff' : '#fafafa',
                transition: 'border 0.2s, background 0.2s',
              }}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current && inputRef.current.click()}
            >
              {!audioFile ? (
                <Typography color="textSecondary" align="center">
                  Drag & drop audio file here, or click to select
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between', px: 2 }}>
                  <Typography>{audioFile.name}</Typography>
                  <IconButton size="small" onClick={handleRemoveFile} aria-label="Remove file">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="audio/*"
                hidden
                onChange={handleFileChange}
              />
            </Paper>

            {isExistingUser ? (
              <Autocomplete
                sx={{ mt: 2, width: '100%' }}
                options={userOptions}
                getOptionLabel={(option) => option.user_name || option.label || ''}
                value={selectedUser}
                onChange={(_, value) => setSelectedUser(value)}
                renderInput={(params) => <TextField {...params} label="Select User" variant="outlined" />}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={userOptions.length === 0}
              />
            ) : (
              <TextField
                sx={{ mt: 2, width: '100%' }}
                label="Enter Username"
                variant="outlined"
                value={selectedUser ? selectedUser.value || '' : ''}
                onChange={e => setSelectedUser({ value: e.target.value })}
              />
            )}

            <FormControlLabel
              control={<Checkbox checked={isExistingUser} onChange={handleExistingUserChange} />}
              label="Existing User"
              sx={{ mt: 1 }}
            />

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} color="secondary">Cancel</Button>
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={!audioFile}
            className="upload-btn"
          >
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AudioUpload;
