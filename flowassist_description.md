# FlowAssist Framework

## Overview

FlowAssist is a context-aware, user-centric AI control system designed specifically for Allianz employees. It serves as an intelligent copilot that resolves workplace tasks and problems through natural interaction, structured reasoning, dynamic tool usage, and transparent system guidance. Operating as the cognitive backbone of the platform, FlowAssist is extensible by tools, agents, and memory modules.

## Core Architecture: The Orchestrator

The orchestrator is the central intelligence of FlowAssist that coordinates all interactions, tools, and knowledge sources to provide seamless assistance to Allianz employees.

### 🧩 Input Channels & User Expression

FlowAssist accepts rich, multimodal input from users [Next.js Frontend]:

- **Text**: Written natural language queries in formal or informal style [MCP Server processes]
- **Voice**: Spoken requests transcribed to text in real-time using ASR [MCP Server ASR integration]
- **Attachments**: Document uploads including PDFs, logs, and reports [Analytics Service processes]
- **Images**: Screenshots or photos, parsed by OCR or vision models [MCP Server vision processing]

Each of these inputs is indexed, structured, and fed into context + planning logic [Qdrant vector database].

### 💬 Conversational Understanding & Clarification

Before executing any task, FlowAssist ensures shared understanding with the user [MCP Server]:

- **Summarization**: Restates what was understood from the input [LLM via MCP Server]
- **Proactive Clarification**: Asks questions when ambiguity exists through:
  - Yes/No confirmations [Next.js UI components]
  - Multiple-choice follow-ups [Next.js UI components]
  - Free-text refinement prompts [Next.js UI components]
- **Confirmation Loop**: Never proceeds without explicit or inferred user approval [TraceViewer logs decision points]

### 🧠 Persona & Preference Context (User Modeling)

For high-quality, tailored responses, FlowAssist loads or generates a user persona context [Qdrant + PostgreSQL]:

- **User Identity**: Role, department, technical familiarity (IT vs. non-IT language) [Entra ID integration via MCP Server]
- **Communication Style**: Preferred tone (formal, friendly, concise, exploratory) [stored in Qdrant]
- **Interaction Preferences**: Language and verbosity style [stored in Qdrant]
- **Response Format**: Communication preference (direct vs. explanatory) [applied by MCP Server]

This context is:
- Derived from Entra ID and ServiceNow data [MCP Server API integrations]
- Visible and editable by the user via "Who I Am" functionality [Next.js UI]
- Used to determine LLM response style, tool behavior, and explanation depth [MCP Server prompt engineering]

### 🔍 Contextual Tool/Agent Discovery

FlowAssist can query a global capability index to [Qdrant vector search]:

- Discover relevant tools, APIs, or agents based on the current task [MCP Server capability matching]
- Evaluate whether they add value to solution-finding [Analytics Service provides success metrics]
- Dynamically expand the action space for the LLM planner [MCP Server] or rule-based router [n8n workflows]

## Core Capabilities

### 1. Input & Intent Understanding

- **Multi-modal Parsing**: Processes text, voice, image, and file inputs [MCP Server]
- **Intent Recognition**: Identifies user goals and classifies request types [MCP Server + Qdrant]
- **Disambiguation**: Resolves unclear requests through clarification [MCP Server + Next.js UI]
- **Persona Injection**: Incorporates user context into understanding [MCP Server + Qdrant]

### 2. Conversation & Clarification

- **Natural Dialogue**: Maintains coherent, contextual conversations [MCP Server + Redis cache]
- **Step Confirmation**: Validates understanding before proceeding [Next.js UI + TraceViewer]
- **Refinement Decisions**: Involves users in clarifying ambiguous requests [Next.js UI components]
- **Context Continuity**: Maintains conversation history for reference [Redis + PostgreSQL]

### 3. Contextual Reasoning

- **Memory Systems**: Utilizes short-term [Redis] and long-term memory [Qdrant]
- **Temporal Awareness**: Understands time-sensitive information and history [PostgreSQL]
- **Goal Tracking**: Maintains structured representation of user objectives [MCP Server + TraceViewer]
- **Knowledge Integration**: Unifies information from disparate organizational sources [Qdrant + MCP Server]

### 4. Tool & Agent Planning

- **Intelligent Planning**: Uses LLM-based [MCP Server] or rule-based planning [n8n]
- **Tool Registry**: Maintains capabilities and metadata for available tools [Qdrant]
- **Discovery Mechanism**: Finds new tools via index-based search [Qdrant vector search]
- **Orchestration Logic**: Determines optimal tool sequence for complex tasks [MCP Server + TraceViewer]

### 5. Execution Control

- **Plan Simulation**: Performs dry runs of task plans before execution [TraceViewer]
- **Traced Execution**: Records all tool operations with detailed logs [TraceViewer + Analytics Service]
- **Agent Delegation**: Hands off specialized tasks to purpose-built agents [MCP Server]
- **Stateful Follow-up**: Maintains context across multiple execution steps [Redis + PostgreSQL]

### 6. Feedback, Oversight, and Improvement

- **Decision Traceability**: Records reasoning behind all system decisions [TraceViewer]
- **Feedback Collection**: Gathers user input on assistance quality [Next.js UI components]
- **Continuous Learning**: Improves from usage patterns and errors [Analytics Service]
- **Approval Gates**: Optional human-in-the-loop verification for critical actions [Next.js UI + n8n workflows]

## Functional Capabilities

### 🌐 Interpret & Structure Complex Input

- Accepts diverse input types: text, voice, screenshots, files [Next.js Frontend + MCP Server]
- Derives intent, ambiguity, emotion, and priority from inputs [MCP Server NLP capabilities]
- Extracts goals and classifies issue types for appropriate handling [MCP Server + Qdrant]
- Structures unstructured information for systematic processing [MCP Server + Analytics Service]

### 🧭 Construct Context-Aware Plans

- Builds execution paths incorporating memory, tools, and agents [MCP Server + TraceViewer]
- Simulates and confirms steps before executing [TraceViewer dry run capability]
- Prioritizes relevant resources based on user role, preferences, and history [MCP Server + Qdrant]
- Adapts plans dynamically as new information emerges [MCP Server + TraceViewer]

### 🤝 Interact Transparently with the User

- Ensures mutual understanding via confirmation prompts [Next.js UI]
- Explains reasoning steps in user-friendly or technical language [MCP Server + user preferences]
- Allows manual override or refinement of suggestions [Next.js UI components]
- Provides clear indication of information sources and confidence [MCP Server + Next.js UI]

### ⚙️ Execute and Adapt with Modular Capabilities

- Orchestrates internal and external tools (e.g., n8n, REST, shell, LangChain) [MCP Server]
- Delegates to autonomous agents when appropriate [MCP Server agent delegation]
- Incorporates additional resources discovered via indexing [Qdrant discovery]
- Handles failures gracefully with fallback mechanisms [MCP Server + n8n error handling]

### 📈 Learn from Use, Improve Itself

- Collects feedback and trace data from all interactions [Analytics Service + TraceViewer]
- Adjusts tool preference weights and prompt strategies based on outcomes [Analytics Service]
- Updates user personas and context enrichment models over time [Qdrant + PostgreSQL]
- Identifies patterns in successful interactions to improve future assistance [Analytics Service]

## User Interface Components

### Main Chat Interface [Next.js Frontend]

- Clean, professional design aligned with Allianz brand guidelines
- Conversation history with clear delineation between user and assistant
- Message input field with support for attachments and voice input
- Response formatting for various content types (text, tables, links)

### User Identity Panel [Next.js UI]

- "Who I Am" button to display current user context
- Visual indicators showing active context parameters
- Options to temporarily modify context for specific queries
- Transparency about what information is being used to personalize responses

### Tool Execution Panel [Next.js UI + TraceViewer]

- Visual representation of the current execution plan
- Real-time progress indicators for multi-step processes
- Option to view detailed reasoning via TraceViewer
- Controls for pausing, modifying, or canceling operations

## Security and Compliance

- Role-based access control for sensitive information [Entra ID + MCP Server]
- Compliance with Allianz data protection standards [All components]
- Transparent handling of personally identifiable information [MCP Server + PostgreSQL]
- Auditability of AI assistant interactions [TraceViewer + Analytics Service]
- Clear indication when information provided has restrictions [Next.js UI]

## Technical Implementation

FlowAssist is built on a modern, containerized architecture with the following key components:

- **Next.js Frontend**: User interface and interaction layer
- **MCP Server**: Core orchestration and LLM integration
- **TraceViewer**: Visualization of AI decision processes
- **Analytics Service**: Metrics, patterns, and improvement data
- **n8n**: Workflow automation and integration
- **Ollama**: Local LLM capabilities
- **Qdrant**: Vector database for semantic search and context
- **PostgreSQL**: Structured data storage
- **Redpanda**: Event streaming between components
- **Grafana**: Metrics visualization and monitoring
