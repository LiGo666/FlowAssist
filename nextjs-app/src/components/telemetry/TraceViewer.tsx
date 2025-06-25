import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Chip,
  LinearProgress,
  Tooltip,
  Stack,
  Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CodeIcon from '@mui/icons-material/Code';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import MemoryIcon from '@mui/icons-material/Memory';

interface ToolSpan {
  id: string;
  name: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'success' | 'error' | 'in_progress';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
}

interface Trace {
  id: string;
  userId: string;
  sessionId: string;
  requestText: string;
  responseText?: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'success' | 'error' | 'in_progress';
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  toolSpans: ToolSpan[];
}

/**
 * TraceViewer component for displaying telemetry traces
 * Shows request/response details, tool calls, and performance metrics
 */
const TraceViewer: React.FC<{ traceId?: string }> = ({ traceId }) => {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);

  useEffect(() => {
    if (traceId) {
      fetchTrace(traceId);
    }
  }, [traceId]);

  const fetchTrace = async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/telemetry/traces/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch trace: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTrace(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error fetching trace:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToolAccordionChange = (toolId: string) => {
    setExpandedToolId(expandedToolId === toolId ? null : toolId);
  };

  const formatDuration = (ms?: number): string => {
    if (!ms) return 'N/A';
    
    if (ms < 1000) {
      return `${ms.toFixed(0)}ms`;
    } else {
      return `${(ms / 1000).toFixed(2)}s`;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'in_progress':
        return '#2196f3';
      default:
        return '#9e9e9e';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon sx={{ color: getStatusColor(status) }} />;
      case 'error':
        return <ErrorIcon sx={{ color: getStatusColor(status) }} />;
      case 'in_progress':
        return <AccessTimeIcon sx={{ color: getStatusColor(status) }} />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 2 }}>
        <Typography variant="body1" gutterBottom>
          Loading trace data...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ width: '100%', p: 2 }}>
        <Typography variant="body1" color="error">
          Error: {error}
        </Typography>
      </Box>
    );
  }

  if (!trace) {
    return (
      <Box sx={{ width: '100%', p: 2 }}>
        <Typography variant="body1">
          {traceId ? 'Trace not found' : 'No trace selected'}
        </Typography>
      </Box>
    );
  }

  return (
    <Card variant="outlined" sx={{ width: '100%', mb: 2 }}>
      <CardContent>
        {/* Trace Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="div">
            Trace: {trace.id.substring(0, 8)}...
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {getStatusIcon(trace.status)}
            <Chip 
              label={trace.status.toUpperCase()} 
              size="small" 
              sx={{ 
                ml: 1, 
                bgcolor: getStatusColor(trace.status),
                color: 'white'
              }} 
            />
          </Box>
        </Box>

        {/* Trace Metadata */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Tooltip title="Duration">
            <Chip 
              icon={<AccessTimeIcon />} 
              label={formatDuration(trace.duration)} 
              variant="outlined" 
              size="small" 
            />
          </Tooltip>
          
          {trace.model && (
            <Tooltip title="Model">
              <Chip 
                icon={<MemoryIcon />} 
                label={trace.model} 
                variant="outlined" 
                size="small" 
              />
            </Tooltip>
          )}
          
          {trace.totalTokens && (
            <Tooltip title={`Prompt: ${trace.promptTokens} | Completion: ${trace.completionTokens}`}>
              <Chip 
                icon={<CodeIcon />} 
                label={`${trace.totalTokens} tokens`} 
                variant="outlined" 
                size="small" 
              />
            </Tooltip>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Request/Response */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Request
          </Typography>
          <Card variant="outlined" sx={{ mb: 2, bgcolor: '#f5f5f5' }}>
            <CardContent>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {trace.requestText}
              </Typography>
            </CardContent>
          </Card>

          {trace.responseText && (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Response
              </Typography>
              <Card variant="outlined" sx={{ bgcolor: '#f5f5f5' }}>
                <CardContent>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {trace.responseText}
                  </Typography>
                </CardContent>
              </Card>
            </>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Tool Spans */}
        <Typography variant="subtitle1" gutterBottom>
          Tool Calls ({trace.toolSpans.length})
        </Typography>
        
        {trace.toolSpans.length === 0 ? (
          <Typography variant="body2" color="textSecondary">
            No tool calls in this trace
          </Typography>
        ) : (
          <Stack spacing={1}>
            {trace.toolSpans.map((tool) => (
              <Accordion 
                key={tool.id}
                expanded={expandedToolId === tool.id}
                onChange={() => handleToolAccordionChange(tool.id)}
                sx={{ 
                  border: `1px solid ${getStatusColor(tool.status)}`,
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getStatusIcon(tool.status)}
                      <Typography sx={{ ml: 1 }}>{tool.name}</Typography>
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      {formatDuration(tool.duration)}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Input
                    </Typography>
                    <Card variant="outlined" sx={{ mb: 2, bgcolor: '#f5f5f5' }}>
                      <CardContent>
                        <Typography variant="body2" component="pre" sx={{ 
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace'
                        }}>
                          {tool.input ? JSON.stringify(tool.input, null, 2) : 'No input data'}
                        </Typography>
                      </CardContent>
                    </Card>

                    <Typography variant="subtitle2" gutterBottom>
                      {tool.status === 'error' ? 'Error' : 'Output'}
                    </Typography>
                    <Card variant="outlined" sx={{ 
                      bgcolor: tool.status === 'error' ? '#ffebee' : '#f5f5f5'
                    }}>
                      <CardContent>
                        <Typography variant="body2" component="pre" sx={{ 
                          whiteSpace: 'pre-wrap',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace',
                          color: tool.status === 'error' ? '#d32f2f' : 'inherit'
                        }}>
                          {tool.status === 'error' 
                            ? tool.error || 'Unknown error' 
                            : tool.output 
                              ? JSON.stringify(tool.output, null, 2) 
                              : 'No output data'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
};

export default TraceViewer;
