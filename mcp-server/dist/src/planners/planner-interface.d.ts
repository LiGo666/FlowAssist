/**
 * Interface for all planners in the system
 * This provides a common contract that all planning strategies must implement
 */
export interface Planner {
    /**
     * Generate a plan for handling a user request
     *
     * @param request The user's request text
     * @param userId The user's ID
     * @param context Additional context for planning
     * @returns A plan object with steps to execute
     */
    generatePlan(request: string, userId: string, context?: Record<string, any>): Promise<Plan>;
    /**
     * Update an existing plan based on new information
     *
     * @param plan The existing plan to update
     * @param newInfo New information to incorporate
     * @returns Updated plan
     */
    updatePlan(plan: Plan, newInfo: any): Promise<Plan>;
}
/**
 * Represents a single step in a plan
 */
export interface PlanStep {
    id: string;
    type: 'tool' | 'llm' | 'function' | 'human';
    name: string;
    description: string;
    parameters?: Record<string, any>;
    dependsOn?: string[];
    isCompleted: boolean;
    result?: any;
    error?: string;
}
/**
 * Represents a complete execution plan
 */
export interface Plan {
    id: string;
    userId: string;
    request: string;
    steps: PlanStep[];
    currentStepIndex: number;
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, any>;
}
