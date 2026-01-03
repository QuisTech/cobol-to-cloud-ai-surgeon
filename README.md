# CloudModern.AI: Autonomous COBOL-to-Cloud Migration System

CloudModern.AI is a world-class, autonomous migration agent designed to bridge the 50-year gap between legacy mainframe systems and modern cloud-native architectures. By leveraging the **Gemini 3 Pro** and **Gemini 2.5** neural pipelines, this system automates the ingestion, analysis, synthesis, and deployment of mission-critical COBOL programs into Spring Boot 3 / Java 21 microservices.

## 🚀 The Neural Pipeline

Unlike traditional transpilers, CloudModern.AI uses a multi-modal "Neural Ingest" strategy to capture not just code, but the tribal knowledge and UI context often lost in legacy transitions.

### 1. Multi-Modal Ingestion
*   **Source Core:** Direct analysis of `.CBL` source code with deep semantic understanding.
*   **Vision Link:** Upload mainframe screenshots to automatically discover data schemas and `DATA DIVISION` structures via OCR and layout inference.
*   **Behavioral Scan:** Analyze screen recordings of legacy system walkthroughs to map UI state transitions and navigation patterns.
*   **Neural Interview:** A real-time, low-latency voice agent (**Gemini Live API**) that interviews stakeholders to elicit requirements and generate Agile User Stories.

### 2. Logic Extraction & Bug Detection
*   Calculates cyclomatic complexity of legacy paragraphs.
*   Identifies critical legacy risks: Array overflows, Y2K date logic issues, and unhandled file statuses.
*   Generates a "Neural Reasoning" report explaining the transformation strategy.

### 3. Modern Synthesis
*   **Target:** Spring Boot 3.x and Java 21 (utilizing Records, Virtual Threads, and Pattern Matching).
*   **Data Mapping:** Automatically converts COBOL `OCCURS` clauses to modern Java Collections and `PIC` clauses to appropriate JPA types.
*   **Architecture:** Generates a full source tree including Controllers, Services, Repositories, and DTOs.

### 4. Cloud Orchestration
*   Automatically generates multi-stage **Dockerfiles** optimized for high-performance JREs.
*   Produces **Kubernetes** manifests and Helm chart descriptions for immediate cluster deployment.

## 🛠 Technical Stack

*   **Frontend:** React 19, TypeScript, Tailwind CSS
*   **AI Engine:** `@google/genai` (Gemini 3 Pro, Gemini 3 Flash, Gemini 2.5 Flash Native Audio)
*   **Visualizations:** Recharts (Complexity & Risk profiling)
*   **Icons:** Lucide React
*   **Infrastructure:** Multi-stage Docker with Nginx SPA routing and dynamic port binding.

## 📦 Getting Started

### Prerequisites
*   A Google Cloud Project with the Gemini API enabled.
*   An API Key (provided via `process.env.API_KEY` in the execution environment).

### Installation
1.  Clone the repository.
2.  Install dependencies: `npm install`.
3.  Launch the development server: `npm run dev`.

## 🧠 Architectural Philosophy

CloudModern.AI follows the **"Clean Modernization"** principle:
1.  **De-couple Logic:** Separate ancient business rules from archaic I/O.
2.  **Safety First:** Use AI to detect bugs *before* porting them to the cloud.
3.  **Human-in-the-loop:** Provide clear reasoning and metadata so architects can validate neural decisions.

---
*Built for the future of Enterprise Modernization.*