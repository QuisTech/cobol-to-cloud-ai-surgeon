
export const CBL0106_CODE = `       IDENTIFICATION DIVISION.
       PROGRAM-ID.    CBL0106
       AUTHOR.        Otto B. Boolean.
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT PRINT-LINE ASSIGN TO PRTLINE.
           SELECT ACCT-REC   ASSIGN TO ACCTREC.
       DATA DIVISION.
       FILE SECTION.
       FD  PRINT-LINE RECORDING MODE F.
       01  PRINT-REC.
           05  ACCT-NO-O      PIC X(8).
           05  FILLER         PIC X(02) VALUE SPACES.
           05  LAST-NAME-O    PIC X(20).
           05  FILLER         PIC X(02) VALUE SPACES.
           05  ACCT-LIMIT-O   PIC $$,$$$,$$9.99.
           05  FILLER         PIC X(02) VALUE SPACES.
           05  ACCT-BALANCE-O PIC $$,$$$,$$9.99.
           05  FILLER         PIC X(02) VALUE SPACES.
       FD  ACCT-REC RECORDING MODE F.
       01  ACCT-FIELDS.
           05  ACCT-NO            PIC X(8).
           05  ACCT-LIMIT         PIC S9(7)V99 COMP-3.
           05  ACCT-BALANCE       PIC S9(7)V99 COMP-3.
           05  LAST-NAME          PIC X(20).
           05  FIRST-NAME         PIC X(15).
           05  CLIENT-ADDR.
               10  STREET-ADDR    PIC X(25).
               10  CITY-COUNTY    PIC X(20).
               10  USA-STATE      PIC X(15).
           05  RESERVED           PIC X(7).
           05  COMMENTS           PIC X(50).
       WORKING-STORAGE SECTION.
       01  Filler.
           05 LASTREC          PIC X VALUE SPACE.
           05 DISP-SUB1        PIC 9999.
           05 SUB1             PIC 99.
         01 OVERLIMIT.
           03 FILLER OCCURS 5  TIMES.
               05  OL-ACCT-NO            PIC X(8).
               05  OL-ACCT-LIMIT         PIC S9(7)V99 COMP-3.
               05  OL-ACCT-BALANCE       PIC S9(7)V99 COMP-3.
               05  OL-LASTNAME           PIC X(20).
               05  OL-FIRSTNAME          PIC X(15).
       01  CLIENTS-PER-STATE.
           05 FILLER              PIC X(19) VALUE 'Virginia Clients = '.
           05 VIRGINIA-CLIENTS    PIC 9(3) VALUE ZERO.
           05 FILLER              PIC X(59) VALUE SPACES.
       01  OVERLIMIT-STATUS.
           05 OLS-STATUS          PIC X(30) VALUE 'No Accounts Overlimit '.
           05 OLS-ACCTNUM         PIC XXXX VALUE SPACES.
           05 FILLER              PIC X(45) VALUE SPACES.
       01  HEADER-1.
           05  FILLER         PIC X(20) VALUE 'Financial Report for'.
           05  FILLER         PIC X(60) VALUE SPACES.
       01  HEADER-2.
           05  FILLER         PIC X(05) VALUE 'Year '.
           05  HDR-YR         PIC 9(04).
           05  FILLER         PIC X(02) VALUE SPACES.
           05  FILLER         PIC X(06) VALUE 'Month '.
           05  HDR-MO         PIC X(02).
           05  FILLER         PIC X(02) VALUE SPACES.
           05  FILLER         PIC X(04) VALUE 'Day '.
           05  HDR-DAY        PIC X(02).
           05  FILLER         PIC X(56) VALUE SPACES.
       01  HEADER-3.
           05  FILLER         PIC X(08) VALUE 'Account '.
           05  FILLER         PIC X(02) VALUE SPACES.
           05  FILLER         PIC X(10) VALUE 'Last Name '.
           05  FILLER         PIC X(15) VALUE SPACES.
           05  FILLER         PIC X(06) VALUE 'Limit '.
           05  FILLER         PIC X(06) VALUE SPACES.
           05  FILLER         PIC X(08) VALUE 'Balance '.
           05  FILLER         PIC X(40) VALUE SPACES.
       01  HEADER-4.
           05  FILLER         PIC X(08) VALUE '--------'.
           05  FILLER         PIC X(02) VALUE SPACES.
           05  FILLER         PIC X(10) VALUE '----------'.
           05  FILLER         PIC X(15) VALUE SPACES.
           05  FILLER         PIC X(10) VALUE '----------'.
           05  FILLER         PIC X(02) VALUE SPACES.
           05  FILLER         PIC X(13) VALUE '-------------'.
           05  FILLER         PIC X(40) VALUE SPACES.
       01 WS-CURRENT-DATE-DATA.
           05  WS-CURRENT-DATE.
               10  WS-CURRENT-YEAR         PIC 9(04).
               10  WS-CURRENT-MONTH        PIC 9(02).
               10  WS-CURRENT-DAY          PIC 9(02).
           05  WS-CURRENT-TIME.
               10  WS-CURRENT-HOURS        PIC 9(02).
               10  WS-CURRENT-MINUTE       PIC 9(02).
               10  WS-CURRENT-SECOND       PIC 9(02).
               10  WS-CURRENT-MILLISECONDS PIC 9(02).
       PROCEDURE DIVISION.
       OPEN-FILES.
           OPEN INPUT  ACCT-REC.
           OPEN OUTPUT PRINT-LINE.
       WRITE-HEADERS.
           MOVE FUNCTION CURRENT-DATE TO WS-CURRENT-DATE-DATA.
           MOVE WS-CURRENT-YEAR  TO HDR-YR.
           MOVE WS-CURRENT-MONTH TO HDR-MO.
           MOVE WS-CURRENT-DAY   TO HDR-DAY.
           WRITE PRINT-REC FROM HEADER-1.
           WRITE PRINT-REC FROM HEADER-2.
           MOVE SPACES TO PRINT-REC.
           WRITE PRINT-REC AFTER ADVANCING 1 LINES.
           WRITE PRINT-REC FROM HEADER-3.
           WRITE PRINT-REC FROM HEADER-4.
           MOVE SPACES TO PRINT-REC.
           MOVE 1 TO SUB1.
       READ-NEXT-RECORD.
           PERFORM READ-RECORD
           PERFORM UNTIL LASTREC = 'Y'
               PERFORM IS-STATE-VIRGINIA
               PERFORM IS-OVERLIMIT
               PERFORM WRITE-RECORD
               PERFORM READ-RECORD
           END-PERFORM.
       CLOSE-STOP.
           WRITE PRINT-REC FROM CLIENTS-PER-STATE.
           PERFORM WRITE-OVERLIMIT.
           CLOSE ACCT-REC.
           CLOSE PRINT-LINE.
           GOBACK.
       READ-RECORD.
           READ ACCT-REC
               AT END MOVE 'Y' TO LASTREC
           END-READ.
       IS-OVERLIMIT.
           IF ACCT-LIMIT < ACCT-BALANCE THEN
               MOVE ACCT-LIMIT TO OL-ACCT-LIMIT(SUB1)
               MOVE ACCT-BALANCE TO OL-ACCT-BALANCE(SUB1)
               MOVE LAST-NAME TO OL-LASTNAME(SUB1)
               MOVE FIRST-NAME TO OL-FIRSTNAME(SUB1)
            END-IF.
            ADD 1 TO SUB1.
       IS-STATE-VIRGINIA.
           IF USA-STATE = 'Virginia' THEN
              ADD 1 TO VIRGINIA-CLIENTS
           END-IF.
       WRITE-OVERLIMIT.
           IF SUB1 = 1 THEN
               MOVE OVERLIMIT-STATUS TO PRINT-REC
               WRITE PRINT-REC
           ELSE
               MOVE 'ACCOUNTS OVERLIMIT' TO OLS-STATUS
               MOVE SUB1 TO  DISP-SUB1
               MOVE DISP-SUB1 TO OLS-ACCTNUM
               MOVE OVERLIMIT-STATUS TO PRINT-REC
               WRITE PRINT-REC
           END-IF.
       WRITE-RECORD.
           MOVE ACCT-NO      TO  ACCT-NO-O.
           MOVE ACCT-LIMIT   TO  ACCT-LIMIT-O.
           MOVE ACCT-BALANCE TO  ACCT-BALANCE-O.
           MOVE LAST-NAME    TO  LAST-NAME-O.
           WRITE PRINT-REC.`;

export const CBL0106C_CODE = `       IDENTIFICATION DIVISION.
       PROGRAM-ID.    CBL0106C
       AUTHOR.        Otto B. Boolean.
       ENVIRONMENT DIVISION.
       INPUT-OUTPUT SECTION.
       FILE-CONTROL.
           SELECT PRINT-LINE ASSIGN TO PRTLINE.
           SELECT ACCT-REC   ASSIGN TO ACCTREC.
       DATA DIVISION.
       FILE SECTION.
       FD  PRINT-LINE RECORDING MODE F.
       01  PRINT-REC.
           05  ACCT-NO-O      PIC X(8).
           05  FILLER         PIC X(02) VALUE SPACES.
           05  LAST-NAME-O    PIC X(20).
           05  FILLER         PIC X(02) VALUE SPACES.
           05  ACCT-LIMIT-O   PIC $$,$$$,$$9.99.
           05  FILLER         PIC X(02) VALUE SPACES.
           05  ACCT-BALANCE-O PIC $$,$$$,$$9.99.
           05  FILLER         PIC X(02) VALUE SPACES.
       FD  ACCT-REC RECORDING MODE F.
       01  ACCT-FIELDS.
           05  ACCT-NO            PIC X(8).
           05  ACCT-LIMIT         PIC S9(7)V99 COMP-3.
           05  ACCT-BALANCE       PIC S9(7)V99 COMP-3.
           05  LAST-NAME          PIC X(20).
           05  FIRST-NAME         PIC X(15).
           05  CLIENT-ADDR.
               10  STREET-ADDR    PIC X(25).
               10  CITY-COUNTY    PIC X(20).
               10  USA-STATE      PIC X(15).
           05  RESERVED           PIC X(7).
           05  COMMENTS           PIC X(50).
       WORKING-STORAGE SECTION.
       01  Filler.
           05 LASTREC          PIC X          VALUE SPACE.
           05 DISP-SUB1        PIC 9999.
           05 SUB1             PIC 99.
           05 OVERLIMIT-MAX    PIC S9(4) COMP VALUE 20.
         01 OVERLIMIT.
           03 FILLER OCCURS 20 TIMES.
               05  OL-ACCT-NO            PIC X(8).
               05  OL-ACCT-LIMIT         PIC S9(7)V99 COMP-3.
               05  OL-ACCT-BALANCE       PIC S9(7)V99 COMP-3.
               05  OL-LASTNAME           PIC X(20).
               05  OL-FIRSTNAME          PIC X(15).
       01  CLIENTS-PER-STATE.
           05 FILLER              PIC X(19) VALUE 'Virginia Clients = '.
           05 VIRGINIA-CLIENTS    PIC 9(3) VALUE ZERO.
           05 FILLER              PIC X(59) VALUE SPACES.
       01  OVERLIMIT-STATUS.
           05 OLS-STATUS          PIC X(30) VALUE 'No Accounts Overlimit '.
           05 OLS-ACCTNUM         PIC XXXX VALUE SPACES.
           05 FILLER              PIC X(45) VALUE SPACES.
       01  HEADER-1.
           05  FILLER         PIC X(20) VALUE 'Financial Report for'.
           05  FILLER         PIC X(60) VALUE SPACES.
       01  HEADER-2.
           05  FILLER         PIC X(05) VALUE 'Year '.
           05  HDR-YR         PIC 9(04).
           05  FILLER         PIC X(02) VALUE SPACES.
           05  FILLER         PIC X(06) VALUE 'Month '.
           05  HDR-MO         PIC X(02).
           05  FILLER         PIC X(02) VALUE SPACES.
           05  FILLER         PIC X(04) VALUE 'Day '.
           05  HDR-DAY        PIC X(02).
           05  FILLER         PIC X(56) VALUE SPACES.
       01  HEADER-3.
           05  FILLER         PIC X(08) VALUE 'Account '.
           05  FILLER         PIC X(02) VALUE SPACES.
           05  FILLER         PIC X(10) VALUE 'Last Name '.
           05  FILLER         PIC X(15) VALUE SPACES.
           05  FILLER         PIC X(06) VALUE 'Limit '.
           05  FILLER         PIC X(06) VALUE SPACES.
           05  FILLER         PIC X(08) VALUE 'Balance '.
           05  FILLER         PIC X(40) VALUE SPACES.
       01  HEADER-4.
           05  FILLER         PIC X(08) VALUE '--------'.
           05  FILLER         PIC X(02) VALUE SPACES.
           05  FILLER         PIC X(10) VALUE '----------'.
           05  FILLER         PIC X(15) VALUE SPACES.
           05  FILLER         PIC X(10) VALUE '----------'.
           05  FILLER         PIC X(02) VALUE SPACES.
           05  FILLER         PIC X(13) VALUE '-------------'.
           05  FILLER         PIC X(40) VALUE SPACES.
       01 WS-CURRENT-DATE-DATA.
           05  WS-CURRENT-DATE.
               10  WS-CURRENT-YEAR         PIC 9(04).
               10  WS-CURRENT-MONTH        PIC 9(02).
               10  WS-CURRENT-DAY          PIC 9(02).
           05  WS-CURRENT-TIME.
               10  WS-CURRENT-HOURS        PIC 9(02).
               10  WS-CURRENT-MINUTE       PIC 9(02).
               10  WS-CURRENT-SECOND       PIC 9(02).
               10  WS-CURRENT-MILLISECONDS PIC 9(02).
       PROCEDURE DIVISION.
       OPEN-FILES.
           OPEN INPUT  ACCT-REC.
           OPEN OUTPUT PRINT-LINE.
       WRITE-HEADERS.
           MOVE FUNCTION CURRENT-DATE TO WS-CURRENT-DATE-DATA.
           MOVE WS-CURRENT-YEAR  TO HDR-YR.
           MOVE WS-CURRENT-MONTH TO HDR-MO.
           MOVE WS-CURRENT-DAY   TO HDR-DAY.
           WRITE PRINT-REC FROM HEADER-1.
           WRITE PRINT-REC FROM HEADER-2.
           MOVE SPACES TO PRINT-REC.
           WRITE PRINT-REC AFTER ADVANCING 1 LINES.
           WRITE PRINT-REC FROM HEADER-3.
           WRITE PRINT-REC FROM HEADER-4.
           MOVE SPACES TO PRINT-REC.
           MOVE 0 TO SUB1.
       READ-NEXT-RECORD.
           PERFORM READ-RECORD
           PERFORM UNTIL LASTREC = 'Y'
               PERFORM IS-STATE-VIRGINIA
               PERFORM IS-OVERLIMIT
               PERFORM WRITE-RECORD
               PERFORM READ-RECORD
           END-PERFORM.
       CLOSE-STOP.
           WRITE PRINT-REC FROM CLIENTS-PER-STATE.
           PERFORM WRITE-OVERLIMIT.
           CLOSE ACCT-REC.
           CLOSE PRINT-LINE.
           GOBACK.
       READ-RECORD.
           READ ACCT-REC
               AT END MOVE 'Y' TO LASTREC
           END-READ.
       IS-OVERLIMIT.
           IF ACCT-LIMIT < ACCT-BALANCE THEN
               ADD 1 TO SUB1
               IF SUB1 > OVERLIMIT-MAX THEN
                   DISPLAY 'OVERFLOW TABLE OVERLIMIT'
                   MOVE 1000 TO RETURN-CODE
                   STOP RUN
               END-IF
               MOVE ACCT-LIMIT TO OL-ACCT-LIMIT(SUB1)
               MOVE ACCT-BALANCE TO OL-ACCT-BALANCE(SUB1)
               MOVE LAST-NAME TO OL-LASTNAME(SUB1)
               MOVE FIRST-NAME TO OL-FIRSTNAME(SUB1)
            END-IF.
       IS-STATE-VIRGINIA.
           IF USA-STATE = 'Virginia' THEN
              ADD 1 TO VIRGINIA-CLIENTS
           END-IF.
       WRITE-OVERLIMIT.
           IF SUB1 = 0 THEN
               MOVE OVERLIMIT-STATUS TO PRINT-REC
               WRITE PRINT-REC
           ELSE
               MOVE 'ACCOUNTS OVERLIMIT' TO OLS-STATUS
               MOVE SUB1 TO  DISP-SUB1
               MOVE DISP-SUB1 TO OLS-ACCTNUM
               MOVE OVERLIMIT-STATUS TO PRINT-REC
               WRITE PRINT-REC
           END-IF.
       WRITE-RECORD.
           MOVE ACCT-NO      TO  ACCT-NO-O.
           MOVE ACCT-LIMIT   TO  ACCT-LIMIT-O.
           MOVE ACCT-BALANCE TO  ACCT-BALANCE-O.
           MOVE LAST-NAME    TO  LAST-NAME-O.
           WRITE PRINT-REC.`;

export const CBLDB21_CODE = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. CBLDB21.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       EXEC SQL INCLUDE SQLCA END-EXEC.
       EXEC SQL DECLARE EMP_CURSOR CURSOR FOR
           SELECT EMPNO, LASTNAME, SALARY
           FROM EMPLOYEE
           WHERE DEPTNO = :WS-DEPT-ID
       END-EXEC.
       01 WS-DEPT-ID PIC X(3) VALUE 'D11'.
       01 WS-EMP-REC.
           05 EMP-NO PIC X(6).
           05 EMP-NAME PIC X(15).
           05 EMP-SAL PIC S9(7)V99 COMP-3.
       PROCEDURE DIVISION.
           EXEC SQL OPEN EMP_CURSOR END-EXEC.
           PERFORM UNTIL SQLCODE NOT = 0
               EXEC SQL FETCH EMP_CURSOR INTO :EMP-NO, :EMP-NAME, :EMP-SAL END-EXEC
               IF SQLCODE = 0
                  DISPLAY "EMP: " EMP-NO " NAME: " EMP-NAME " SAL: " EMP-SAL
               END-IF
           END-PERFORM.
           EXEC SQL CLOSE EMP_CURSOR END-EXEC.
           GOBACK.`;

export const DEPTPAY_CODE = `       IDENTIFICATION DIVISION.
       PROGRAM-ID. DEPTPAY.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-PAY-DATA.
           05 WS-EMP-ID PIC X(5).
           05 WS-HOURS  PIC 9(2)V99.
           05 WS-RATE   PIC 9(3)V99.
           05 WS-GROSS  PIC 9(5)V99.
       PROCEDURE DIVISION.
           DISPLAY "ENTER EMP ID: ".
           ACCEPT WS-EMP-ID.
           DISPLAY "ENTER HOURS WORKED: ".
           ACCEPT WS-HOURS.
           DISPLAY "ENTER HOURLY RATE: ".
           ACCEPT WS-RATE.
           COMPUTE WS-GROSS = WS-HOURS * WS-RATE.
           DISPLAY "EMPLOYEE " WS-EMP-ID " GROSS PAY: " WS-GROSS.
           GOBACK.`;

export const ACC_PROC_CODE = `       IDENTIFICATION DIVISION.
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

export interface SampleProgram {
  id: string;
  name: string;
  code: string;
  lines: number;
  feature: string;
  purpose: string;
  complexity: 'Low' | 'Medium' | 'High';
  bugNote?: string;
}

export const SAMPLE_PROGRAMS: SampleProgram[] = [
  {
    id: 'acc-proc',
    name: 'ACC-PROC',
    code: ACC_PROC_CODE,
    lines: 24,
    feature: 'Simple Conditional Logic',
    purpose: 'Banking transaction demo',
    complexity: 'Low'
  },
  {
    id: 'cbl0106',
    name: 'CBL0106.cbl',
    code: CBL0106_CODE,
    lines: 154,
    feature: 'ARRAY OVERFLOW BUG',
    purpose: 'Financial report with overlimit detection',
    complexity: 'Medium',
    bugNote: 'BUG DETECTED: SUB1 increments unconditionally in IS-OVERLIMIT paragraph. If there are more than 5 overlimit accounts, it will overflow the OVERLIMIT array (OCCURS 5).'
  },
  {
    id: 'cbl0106c',
    name: 'CBL0106C.cbl',
    code: CBL0106C_CODE,
    lines: 165,
    feature: 'Bounds Checking',
    purpose: 'Corrected version of CBL0106',
    complexity: 'Medium'
  },
  {
    id: 'cbldb21',
    name: 'CBLDB21.cbl',
    code: CBLDB21_CODE,
    lines: 24,
    feature: 'SQL Integration',
    purpose: 'SQL database cursor iteration example',
    complexity: 'Medium'
  },
  {
    id: 'deptpay',
    name: 'DEPTPAY.CBL',
    code: DEPTPAY_CODE,
    lines: 18,
    feature: 'Arithmetic & I/O',
    purpose: 'Simple departmental payroll calculation',
    complexity: 'Low'
  },
  {
    id: 'custom',
    name: 'Custom Input',
    code: '',
    lines: 0,
    feature: 'N/A',
    purpose: 'Manual code entry',
    complexity: 'Low'
  }
];

export const INITIAL_COBOL_EXAMPLE = ACC_PROC_CODE;

export const SYSTEM_PROMPT = `You are a world-class legacy modernization expert specializing in COBOL to Cloud-native Java Spring Boot migrations.
Your goal is to provide deep analysis, bug detection, and high-quality modern code generation.

When analyzing:
1. Identify logic errors (e.g., overflow risks, Y2K issues, array bounds violations).
2. Calculate cyclomatic complexity.
3. Extract core business logic and data structures (OCCURS, PIC clauses).
4. Identify external dependencies (Files, SQL, CICS).

When modernizing:
1. Follow SOLID principles and Clean Code.
2. Use Spring Boot 3.x, Java 21 features (Records, Pattern Matching).
3. Map COBOL OCCURS to Java Collections (List/Set).
4. Map File FD to Spring Data JPA/Repository patterns.
5. Provide REST APIs that mirror COBOL procedure call entries.

When generating deployment:
1. Provide a multi-stage Dockerfile optimized for Java 21.
2. Provide K8s Deployment and Service YAMLs.`;
