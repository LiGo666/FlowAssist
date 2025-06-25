'use client';

import React, { useState } from 'react';
import { Box, Container, Typography, TextField, Button } from '@mui/material';
import TraceViewer from '@/components/telemetry/TraceViewer';

export default function TraceViewPage() {
  const [traceId, setTraceId] = useState<string>('');
  const [activeTraceId, setActiveTraceId] = useState<string | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveTraceId(traceId);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Trace Viewer
      </Typography>
      
      <Box component="form" onSubmit={handleSubmit} sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <TextField
          label="Trace ID"
          value={traceId}
          onChange={(e) => setTraceId(e.target.value)}
          variant="outlined"
          size="small"
          fullWidth
        />
        <Button 
          type="submit" 
          variant="contained" 
          disabled={!traceId}
        >
          View Trace
        </Button>
      </Box>

      {activeTraceId && <TraceViewer traceId={activeTraceId} />}
    </Container>
  );
}
