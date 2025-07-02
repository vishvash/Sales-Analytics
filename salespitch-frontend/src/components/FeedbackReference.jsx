import React, { useState } from 'react';
import { Modal, Box, Typography, IconButton } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { Tooltip } from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 800,
  bgcolor: 'background.paper',
  border: '2px solid #0070f3',
  boxShadow: 24,
  p: 4,
  borderRadius: '10px',
  maxHeight: '90vh',
  overflowY: 'auto',
};

export default function FeedbackReferenceModal() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <Tooltip title="View Feedback Logic">
        <IconButton onClick={() => setOpen(true)}>
            <VisibilityIcon style={{ color: '#3b82f6', fontSize: '20px' }} />
        </IconButton>
      </Tooltip>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={style}>
          <Typography variant="h6" gutterBottom>
            🧠 Tempo & Pitch Feedback Logic
          </Typography>

          <table width="100%" style={{ marginBottom: '1rem' }}>
            <thead>
              <tr style={{ background: '#e2e8f0' }}>
                <th>Tempo</th><th>Pitch</th><th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Moderate</td><td>Natural</td><td>Great — clear, crisp, engaging.</td></tr>
              <tr><td>Slow</td><td>Low/Natural</td><td>Calm — could slightly speed up.</td></tr>
              <tr><td>Fast</td><td>Natural/High</td><td>Energetic — avoid sounding rushed.</td></tr>
              <tr><td>Any</td><td>High</td><td>Try to lower pitch for clarity.</td></tr>
              <tr><td>Others</td><td>Any</td><td>Good effort — keep refining pace & tone.</td></tr>
            </tbody>
          </table>

          <Typography variant="h6" gutterBottom>
            🎤 Pitch (Hz) Interpretation
          </Typography>
          <table width="100%" style={{ marginBottom: '1rem' }}>
            <thead>
              <tr style={{ background: '#e2e8f0' }}>
                <th>Pitch (Hz)</th><th>Description</th><th>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>&lt; 120</td><td>Low</td><td>Calm, possibly monotonous.</td></tr>
              <tr><td>120 - 200</td><td>Natural</td><td>Pleasant, clear, and natural. Ideal.</td></tr>
              <tr><td>&gt; 200</td><td>High</td><td>Energetic or possibly sharp/strained.</td></tr>
            </tbody>
          </table>

          <Typography variant="h6" gutterBottom>
            ⏱️ Tempo (BPM) Interpretation
          </Typography>
          <table width="100%">
            <thead>
              <tr style={{ background: '#e2e8f0' }}>
                <th>BPM</th><th>Description</th><th>Interpretation</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>&lt; 80</td><td>Slow</td><td>Calm but may feel sluggish or dull.</td></tr>
              <tr><td>80 - 120</td><td>Moderate</td><td>Natural and engaging. Ideal.</td></tr>
              <tr><td>&gt; 120</td><td>Fast</td><td>Energetic, but can become rushed.</td></tr>
            </tbody>
          </table>
        </Box>
      </Modal>
    </div>
  );
}
