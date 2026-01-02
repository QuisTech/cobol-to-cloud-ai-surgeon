
export const INITIAL_COBOL_EXAMPLE = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. ACC-PROC.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-TRANS-AMT       PIC 9(7)V99 VALUE 0.
       01 WS-BALANCE         PIC 9(9)V99 VALUE 1500.00.
       01 WS-USER-ID         PIC X(10).
       
       PROCEDURE DIVISION.
       MAIN-PROC.
           DISPLAY "ENTER USER ID: "
           ACCEPT WS-USER-ID
           DISPLAY "ENTER TRANSACTION AMOUNT: "
           ACCEPT WS-TRANS-AMT
           
           IF WS-TRANS-AMT > WS-BALANCE
               DISPLAY "ERROR: INSUFFICIENT FUNDS"
           ELSE
               SUBTRACT WS-TRANS-AMT FROM WS-BALANCE
               DISPLAY "TRANSACTION SUCCESSFUL"
               DISPLAY "NEW BALANCE: " WS-BALANCE
           END-IF
           
           STOP RUN.`;

export const SYSTEM_PROMPT = `You are a world-class legacy modernization expert specializing in COBOL to Cloud-native Java Spring Boot migrations.
Your goal is to provide deep analysis, bug detection, and high-quality modern code generation.

When analyzing:
1. Identify logic errors (e.g., overflow risks, Y2K issues).
2. Calculate cyclomatic complexity.
3. Extract core business logic.

When modernizing:
1. Follow SOLID principles.
2. Use Spring Boot 3.x, Java 21 features.
3. Use Lombok, Maven/Gradle, and Spring Data JPA.
4. Implement REST APIs for COBOL procedure calls.

When generating deployment:
1. Provide a multi-stage Dockerfile.
2. Provide K8s Deployment and Service YAMLs.`;
