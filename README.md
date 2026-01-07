# CloudModern.AI: Autonomous Legacy Modernization Agent

## Inspiration

The world runs on legacy code. Over 800 billion lines of COBOL still power the global financial, insurance, and government infrastructure. Yet, the experts who maintain these systems are retiring, creating a critical "skills gap" crisis. Manual migration is slow, error-prone, and often fails because documentation is missing or outdated. We were inspired to build CloudModern.AI to solve this not just by translating syntax, but by capturing the intent and context of legacy systems using the multi-modal capabilities of the Gemini era.

## What it does

CloudModern.AI is an end-to-end autonomous agent that facilitates the migration of Mainframe COBOL systems to Cloud-Native Java architectures. Unlike simple transpilers, it uses a multi-modal "Neural Cycle" approach:

### Multi-Modal Ingestion

- **Source Code**: Reads raw COBOL copybooks and programs.
- **Vision (OCR)**: Analyzes screenshots of green-screen terminals (3270/5250) to reconstruct Data Division schemas automatically.
- **Behavior (Video)**: Watches video recordings of user workflows to map state transitions and UI navigation logic.
- **Interview (Audio)**: Conducts real-time, voice-based interviews with domain experts to capture tribal knowledge and functional requirements.

### Neural Reasoning

- Uses **Gemini 3 Pro** to perform deep semantic decomposition, identifying critical bugs (like Array Overflows and Y2K logic), calculating cyclomatic complexity, and mapping dependencies.

### Synthesis & Orchestration

- **Synthesis**: Generates clean, object-oriented Spring Boot 3.4 code using modern Java 21 features (Records, Pattern Matching, Virtual Threads), moving away from 1:1 procedural translation.
- **Orchestration**: Automatically creates Dockerfiles, Kubernetes manifests, and Helm charts to deploy the modernized service immediately.

## How we built it

We built CloudModern.AI as a high-performance React application powered by the Google GenAI SDK.

- **Frontend**: React 19, Tailwind CSS, and Lucide React for a futuristic, command-center UI.
- **AI Core**:
  - **Gemini 3 Pro**: Used for the heavy lifting of logic analysis and code synthesis (Thinking Config enabled).
  - **Gemini 3 Flash**: Used for high-speed multi-modal tasks (Video analysis and Screen OCR).
  - **Gemini 2.5 Flash Native Audio**: Powering the live "Interview Node", enabling low-latency, bidirectional voice conversations with the AI analyst.
- **Audio Processing**: Implemented custom PCM audio encoding/decoding pipelines using the Web Audio API to communicate directly with the Gemini Live WebSocket.
- **Visualization**: Recharts for visualizing code complexity and risk metrics.

## Challenges we ran into

- **Handling Raw Audio Streams**: Integrating the Gemini Native Audio API required building a robust PCM stream processor in the browser to handle bidirectional audio without latency or clipping.
- **COBOL's Lack of Structure**: Mapping COBOL's GO TO and PERFORM logic to modern Java classes was difficult. We had to tune our system prompts to prioritize refactoring over transliteration.
- **Prompt Engineering for JSON**: Getting the models to return strict, valid JSON for complex nested structures (like ASTs or Kubernetes YAMLs) required extensive trial and error with schema definitions.
- **Context Window Management**: Balancing the token load when analyzing massive legacy programs alongside video and audio context.

## Accomplishments that we're proud of

- **The "Neural Cycle" Workflow**: Successfully integrating Text, Image, Video, and Audio into a single cohesive modernization pipeline.
- **Real-Time Analyst**: The Live Interview feature feels like magic—it actually "understands" technical mainframe jargon and asks relevant follow-up questions.
- **Bug Detection**: The agent successfully identified a subtle "Array Overflow" bug in our sample CBL0106 program that a human reviewer might have missed.
- **Modern Output**: The generated Java code uses record types and Repository patterns, resulting in code that looks written by a senior Java engineer, not a machine.

## What we learned

- **Gemini 3 Pro is a Logic Beast**: Its ability to reason through obscure procedural logic and suggest architectural improvements is far superior to previous generation models.
- **Multi-Modal is Mandatory**: You cannot modernize a system just by looking at the code. The screen layouts (Vision) and user workflows (Video) contain 50% of the business logic.
- **Native Audio Changes Everything**: Removing the text-to-speech lag creates a fluid conversational interface that encourages users to share more deep context.

## What's next for CloudModern.AI

- **IDE Integration**: Building a VS Code extension to run "Neural Scans" directly in the editor.
- **Database Migration**: Automating the conversion of VSAM/DB2 definitions to PostgreSQL/Spanner schemas.
- **Automated Testing**: Generating JUnit and Selenium test suites based on the "Behavioral Video" analysis.
- **Bi-Directional Sync**: Allowing the agent to patch the original COBOL code while simultaneously generating the Java version.
