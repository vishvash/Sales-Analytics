import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper } from '@mui/material';
import { checkUser, loginUser, registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [step, setStep] = useState('username');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleUsername = async () => {
    const res = await checkUser(username);
    setStep(res.data.exists ? 'signin' : 'signup');
  };
  const handleSignin = async () => {
    const res = await loginUser(username, password);
    console.log(res)
    localStorage.setItem('token',res.data.access_token)
    login(res.data.access_token);
    navigate('/dashboard');
  };
  const handleSignup = async () => {
    if (password !== confirm) return alert('Passwords must match');
    await registerUser(username, password);
    const res = await loginUser(username, password);
    localStorage.setItem('token',res.data.access_token)

    login(res.data.token);
    navigate('/dashboard');
  };

  return (
  <Box
    sx={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f5f5f5', // ensure consistent background
    }}
  >
    <Box sx={{ width: 400 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h5" gutterBottom textAlign="center">
          {step === 'username' ? 'Enter Username' : (step === 'signin' ? 'Sign In' : 'Sign Up')}
        </Typography>

        {step === 'username' && (
          <>
            <TextField
              fullWidth margin="normal" label="Username" value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <Button fullWidth variant="contained" onClick={handleUsername}>Next</Button>
          </>
        )}

        {step === 'signin' && (
          <>
            <TextField
              fullWidth margin="normal" label="Password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Button fullWidth variant="contained" onClick={handleSignin}>Sign In</Button>
          </>
        )}

        {step === 'signup' && (
          <>
            <TextField
              fullWidth margin="normal" label="Password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <TextField
              fullWidth margin="normal" label="Confirm Password" type="password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
            <Button fullWidth variant="contained" onClick={handleSignup}>Sign Up</Button>
          </>
        )}
      </Paper>
    </Box>
  </Box>
);

}