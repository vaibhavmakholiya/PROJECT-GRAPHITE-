# Sanchay Backend
**Offline-First Community Savings-Group Ledger (Backend Only)**

Sanchay is a production-grade, offline-first backend ledger engineered for community savings groups (Self-Help Groups / Chit Funds / Village Lending Circles). It strictly adheres to append-only double-entry accounting principles, integer paise monetary arithmetic, multi-tenant Firebase security rules, and zero Personally Identifiable Information (PII) leakage.

---

## 1. Architecture & Non-Negotiable Invariants

1. **Strict Integer Paise**:
   - Money is stored and calculated strictly in integer **paise** ($1\text{ INR} = 100\text{ paise}$).
   - Floating-point representations and decimal division are forbidden.
2. **Append-Only Ledger**:
   - Documents in `transactions` and `receipts` are **NEVER** updated or deleted.
   - Enforced by Firestore Security Rules (`allow update, delete: if false;`).
   - Balances are never stored as static doc fields; they are always computed on-the-fly from active transactions.
3. **Reversal-Based Corrections**:
   - Corrections are enacted via an explicit `reversal` entry (`type: "reversal"`, `reversesId`, required `reason`, admin only) followed by a new entry.
4. **Offline-First Resilience**:
   - Client writes are single document writes or `writeBatch` (no `runTransaction` on client paths).
   - Document IDs are client-generated UUIDs guaranteeing idempotency across network retries.
   - Server-side triggers **FLAG** anomalies into `conflicts/{id}` rather than rejecting or silently overwriting synced data.
5. **Aadhaar Protection & Zero-PII Logging**:
   - Verhoeff checksum algorithm validates 12-digit Aadhaar input.
   - Stored as HMAC-SHA256 hash using Secret Manager secret, alongside only the last 4 digits (`XXXX-XXXX-1234`).
   - Raw Aadhaar numbers are immediately discarded from memory.
   - Cloud Functions logs are scrubbed via a safe logger wrapper; names, phone numbers, and Aadhaar numbers/fragments are never logged.

---

## 2. Monorepo Organization

```
/sanchay
├── apps/
│   └── member-app/               # React + Vite + TypeScript Member-Only PWA
│       ├── public/logo.png       # Sanchay community savings pot logo
│       ├── src/routes/           # Lazy-loaded screens (Splash, Passbook, Loans, Receipts)
│       └── tests/                # Vitest unit test suite
│
├── packages/
│   └── core/                     # Pure TypeScript business & math logic (Zero Firebase dependencies)
│       ├── src/types.ts          # Domain models, transaction types, role enums
│       ├── src/verhoeff.ts       # Verhoeff D5 checksum algorithm for Aadhaar
│       ├── src/masking.ts        # Masking and receipt number formatter
│       ├── src/balance.ts        # Dynamic balance engine with reversal negation
│       ├── src/schedule.ts       # Flat and reducing balance schedule generator
│       ├── src/loan.ts           # Loan tracking and active balance resolution
│       ├── src/eligibility.ts    # Loan eligibility evaluation & limits
│       └── tests/                # 24 Vitest unit tests (100% passing)
│
├── firestore/
│   ├── firestore.rules           # Multi-tenant, role-scoped, append-only security rules
│   ├── firestore.indexes.json    # Composite query indexes
│   └── tests/
│       └── rules.test.ts         # 16 security rules tests against Firestore Emulator
│
├── functions/                    # Cloud Functions (2nd Gen, TypeScript)
│   ├── src/config.ts             # Firebase Admin & Secret Manager integration
│   ├── src/logger.ts             # PII-sanitized safe logging wrapper
│   ├── src/callables/            # registerMember, approveMember, removeMember,
│   │                             # decideLoan, resolveConflict, recomputeBalances
│   ├── src/triggers/             # onTransactionCreated, onLoanRequestCreated,
│   │                             # onAnnouncementCreated, onReceiptCreated
│   └── tests/
│       └── triggers.test.ts      # Integration tests against emulator
│
├── scripts/
│   └── src/seed.ts               # Emulator seed script (1 group, 1 admin, 6 members, etc.)
│
├── firebase.json                 # Firebase Emulator configuration
├── .firebaserc                   # Project configuration (demo-sanchay)
└── README.md
```

---

## 3. Prerequisites & Environment Setup

- **Node.js**: v20+ (tested on v24.19.0)
- **npm**: v10+ (tested on v11.17.0)
- **Java Runtime**: OpenJDK 21+ (required for Firebase Emulator Suite)
  - Portable OpenJDK 21 is pre-configured at `C:\Users\vcmak\.jdk\jdk-21.0.5+11`.
- **Firebase CLI**: `firebase-tools` (v15.34+)

---

## 4. Running the Test Suites

The backend includes comprehensive test suites across pure domain math, security rules, and Cloud Function triggers:

### 4.1 Core Domain Logic Unit Tests
Runs 24 tests covering integer arithmetic, cascading reversals, flat and reducing amortization, rounding remainder absorption, and Verhoeff validation:
```powershell
npm run test:core
```

### 4.2 Security Rules Unit Tests
Runs 16 security rules tests against the Firestore Emulator verifying tenant isolation, member-scoping, role permissions, and append-only immutability:
```powershell
npm run test:rules
```

### 4.3 Cloud Functions Trigger Tests
Runs integration tests verifying duplicate detection across offline devices, negative balance alerts, and notification fanouts:
```powershell
npm run test:functions
```

### 4.4 Run All Tests
```powershell
npm run test:all
```

---

## 5. Running the Firebase Emulator Suite

To launch the local Firebase Emulator Suite:
```powershell
# Set Java environment (if not already in global PATH)
$env:JAVA_HOME = 'C:\Users\vcmak\.jdk\jdk-21.0.5+11'
$env:Path = "C:\Users\vcmak\.jdk\jdk-21.0.5+11\bin;$env:Path"

# Start emulators
npx firebase-tools emulators:start
```

### Configured Emulator Ports:
- **Firestore Emulator**: `127.0.0.1:8088` *(configured to port 8088 to avoid conflicts with local system services on 8080)*
- **Auth Emulator**: `127.0.0.1:9099`
- **Cloud Functions**: `127.0.0.1:5001`
- **Emulator UI**: `http://127.0.0.1:4000`

---

## 6. Seeding the Database with Fake Data

The repository includes an automated seed script that populates realistic fictitious data:
- **1 Group**: "Pragati Mahila Bachat Gat" (`group-pragati-001`).
- **Group Settings**: ₹500/month contribution, 12% reducing interest, 3x max loan multiple, 12 max installments, due on 5th of each month.
- **1 Admin**: Sunita Sharma (`admin-sunita-001`) with admin custom claims.
- **6 Active Members**: With phone numbers, fake last-4 Aadhaar, and HMAC hashes.
- **3 Months of Contributions**: 18 batch transactions and corresponding receipts across Aug, Sep, Oct 2026.
- **1 Active Loan**: Loan of ₹3,000 (300,000 paise) with 6-month reducing balance schedule and 1 repayment logged.
- **1 Pending Loan Request**: Member requesting ₹1,000 (100,000 paise) for review.
- **1 Conflict Record**: A duplicate contribution synced from two separate offline devices.

To execute the seed script against the running emulator:
```powershell
npm run seed
```

---

## 7. Explicit List of Assumptions Made

| # | Domain / Feature | Assumption Made | Rationale / Invariant |
|---|---|---|---|
| 1 | **Monetary Precision** | All monetary amounts are non-negative safe integers representing paise ($1 = 100\text{ paise}$). | Eliminates IEEE 754 floating-point inaccuracies entirely. |
| 2 | **Ledger Immutability** | Documents in `transactions` and `receipts` are strictly write-once. | Updates and deletes are blocked by security rules even for administrators. |
| 3 | **Ledger Corrections** | An erroneous transaction must be corrected by creating a `reversal` entry referencing `reversesId` and providing a required `reason`, followed by a separate entry with the correct amount. | Guarantees auditability and preserves tamper-evident transaction history. |
| 4 | **Dynamic Balances** | Balances are never cached or written as doc fields in Firestore. | Computing balances from transactions avoids offline split-brain balance races. |
| 5 | **Offline Idempotency** | Clients generate random UUIDs for all transaction and receipt documents before initiating sync. | Allows offline clients to retry writes safely without generating duplicate documents. |
| 6 | **Receipt Numbering Format** | Receipt numbers follow `{groupCode}-{yyyymm}-{deviceShort}-{perDeviceCounter}` (e.g. `PRAG-202610-DEV1-0042`). | Does not rely on a centralized atomic counter, enabling offline receipt issuance. |
| 7 | **Conflict Detection vs. Rejection** | Server triggers flag anomalies (`possible_duplicate`, `negative_balance`, `receipt_mismatch`) into `conflicts/{id}` rather than rejecting or overwriting writes. | In offline-first workflows, data synced after the fact must not be lost silently; admins resolve conflicts explicitly. |
| 8 | **Loan Eligibility Schedule** | Contributory dues are computed based on `dueDayOfMonth` from member creation month up to reference date. Outstanding loan balance is checked against all non-closed loans. | Guarantees members are in good standing before applying for fresh credit. |
| 9 | **Schedule Rounding Absorption** | The last installment absorbs all fractional rounding remainder in paise for both flat and reducing balance schedules. | Guarantees $\sum \text{principal} == \text{Principal}$ and $\sum \text{installments} == \text{Total Payable}$ down to the exact paisa. |
| 10 | **Aadhaar Privacy** | Raw 12-digit Aadhaar numbers are validated via Verhoeff, pseudonymized using HMAC-SHA256 with Secret Manager key, and immediately wiped from memory. Only the last 4 digits are retained for human verification. | Full compliance with Indian Aadhaar data protection regulations. Photos and OCR are strictly excluded. |
| 11 | **Zero PII Logging** | Cloud Functions log messages are sanitized through `safeLogger` to scrub names, phone numbers, and Aadhaar numbers/fragments. | Prevents accidental PII leakage into Google Cloud Logging. |
| 12 | **Firestore Emulator Port** | Firestore emulator port is set to `8088` instead of default `8080`. | Prevents port collisions with local Windows system background processes on port 8080. |
