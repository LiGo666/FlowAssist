import { Client } from 'langsmith';
import { v4 as uuidv4 } from 'uuid';
/**
 * LangSmith tracer for LLM call observability
 */
export class LangSmithTracer {
    constructor() {
        // Check if LangSmith is enabled via environment variables
        this.isEnabled = !!process.env.LANGSMITH_API_KEY;
        this.projectName = process.env.LANGSMITH_PROJECT || 'flowassist';
        if (this.isEnabled) {
            this.client = new Client({
                apiKey: process.env.LANGSMITH_API_KEY,
                apiUrl: process.env.LANGSMITH_API_URL || 'https://api.smith.langchain.com',
            });
            console.log('LangSmith tracer initialized');
        }
        else {
            console.log('LangSmith tracer disabled (no API key provided)');
        }
    }
    /**
     * Start a new trace for an LLM run
     *
     * @param name Name of the run
     * @param inputs Input data for the LLM call
     * @param metadata Additional metadata
     * @returns Run ID and trace functions
     */
    startTrace(name, inputs, metadata = {}) {
        if (!this.isEnabled) {
            // Return no-op functions if LangSmith is disabled
            return {
                runId: uuidv4(),
                endTrace: () => { },
                addEvent: () => { },
                setError: () => { },
            };
        }
        // Create a new run
        const runId = uuidv4();
        // Start the run in LangSmith
        this.client.createRun({
            id: runId,
            name,
            run_type: 'llm',
            inputs,
            start_time: Date.now(),
            extra: {
                metadata: {
                    ...metadata,
                    userId: metadata.userId || 'anonymous',
                    sessionId: metadata.sessionId || uuidv4(),
                }
            },
            project_name: this.projectName,
        }).catch(err => {
            console.error('Error creating LangSmith run:', err);
        });
        // Return functions to update the trace
        return {
            runId,
            // End the trace with outputs
            endTrace: (outputs) => {
                this.client.updateRun(runId, {
                    end_time: Date.now(),
                    outputs,
                    // Remove status property as it's not in RunUpdate type
                }).catch(err => {
                    console.error('Error updating LangSmith run:', err);
                });
            },
            // Add an event to the trace
            addEvent: (name, data) => {
                this.client.createEvent({
                    id: uuidv4(),
                    run_id: runId,
                    name,
                    data,
                    timestamp: Date.now(),
                }).catch(err => {
                    console.error('Error creating LangSmith event:', err);
                });
            },
            // Set error on the trace
            setError: (error) => {
                this.client.updateRun(runId, {
                    end_time: Date.now(),
                    error: error.message,
                    // Remove status property as it's not in RunUpdate type
                }).catch(err => {
                    console.error('Error updating LangSmith run with error:', err);
                });
            }
        };
    }
    /**
     * Create a child run within a parent trace
     *
     * @param parentRunId Parent run ID
     * @param name Name of the child run
     * @param inputs Input data for the child run
     * @param runType Type of run (tool, chain, etc.)
     * @returns Child run ID and trace functions
     */
    createChildRun(parentRunId, name, inputs, runType = 'tool') {
        if (!this.isEnabled) {
            // Return no-op functions if LangSmith is disabled
            return {
                runId: uuidv4(),
                endRun: () => { },
                setError: () => { },
            };
        }
        // Create a new child run
        const runId = uuidv4();
        // Start the child run in LangSmith
        this.client.createRun({
            id: runId,
            name,
            run_type: runType,
            inputs,
            parent_run_id: parentRunId,
            start_time: Date.now(),
            project_name: this.projectName,
        }).catch(err => {
            console.error('Error creating LangSmith child run:', err);
        });
        // Return functions to update the child run
        return {
            runId,
            // End the child run with outputs
            endRun: (outputs) => {
                this.client.updateRun(runId, {
                    end_time: Date.now(),
                    outputs,
                    // Remove status property as it's not in RunUpdate type
                }).catch(err => {
                    console.error('Error updating LangSmith child run:', err);
                });
            },
            // Set error on the child run
            setError: (error) => {
                this.client.updateRun(runId, {
                    end_time: Date.now(),
                    error: error.message,
                    // Remove status property as it's not in RunUpdate type
                }).catch(err => {
                    console.error('Error updating LangSmith child run with error:', err);
                });
            }
        };
    }
}
// Export a singleton instance
export const langSmithTracer = new LangSmithTracer();
