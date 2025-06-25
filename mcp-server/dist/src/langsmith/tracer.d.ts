/**
 * LangSmith tracer for LLM call observability
 */
export declare class LangSmithTracer {
    private client;
    private isEnabled;
    private projectName;
    constructor();
    /**
     * Start a new trace for an LLM run
     *
     * @param name Name of the run
     * @param inputs Input data for the LLM call
     * @param metadata Additional metadata
     * @returns Run ID and trace functions
     */
    startTrace(name: string, inputs: any, metadata?: any): {
        runId: string;
        endTrace: (outputs: any) => void;
        addEvent: (name: string, data: any) => void;
        setError: (error: Error) => void;
    };
    /**
     * Create a child run within a parent trace
     *
     * @param parentRunId Parent run ID
     * @param name Name of the child run
     * @param inputs Input data for the child run
     * @param runType Type of run (tool, chain, etc.)
     * @returns Child run ID and trace functions
     */
    createChildRun(parentRunId: string, name: string, inputs: any, runType?: string): {
        runId: string;
        endRun: (outputs: any) => void;
        setError: (error: Error) => void;
    };
}
export declare const langSmithTracer: LangSmithTracer;
