# CSV Import Feature - Technical Specification

## Overview
Bulk import feature for entertainers to eliminate onboarding bottleneck.

**Priority**: HIGH - Critical for scaling customer acquisition
**Estimated Time**: 4-6 hours
**Impact**: 2-3x faster onboarding, 2x higher trial conversion

---

## User Story
As a club manager, I want to bulk import my existing entertainer roster from a spreadsheet, so that I can start using ClubFlow without manual data entry.

---

## Feature Requirements

### Functional Requirements

1. **Upload CSV File**
   - Accept .csv and .xlsx files
   - Max file size: 5MB (supports 1000+ entertainers)
   - Drag-and-drop or file picker

2. **Auto-Map Columns**
   - Detect common column names automatically
   - Support variations: "Stage Name" = "Stage" = "Stagename" = "Name"
   - Allow manual column mapping if auto-detect fails

3. **Validate Data**
   - Required fields: Stage Name, First Name, Last Name, Phone
   - Phone format: Accept (555) 123-4567, 555-123-4567, 5551234567
   - Date format: Accept MM/DD/YYYY, M/D/YYYY, YYYY-MM-DD
   - Email format: Validate if provided
   - Duplicate detection: Flag duplicate stage names

4. **Preview Before Import**
   - Show first 10 rows in table format
   - Highlight errors in red
   - Show warning count: "3 errors found"
   - Allow user to cancel or proceed

5. **Error Handling**
   - Clear error messages: "Row 5: Invalid phone number"
   - Allow corrections without re-uploading
   - Skip rows with errors (optional)
   - Download error report (CSV of failed rows)

6. **Bulk Create**
   - Import all valid rows in single transaction
   - Show progress bar for large imports
   - Handle failures gracefully (rollback if needed)

7. **Post-Import Summary**
   - "Successfully imported 28 entertainers"
   - "3 rows skipped due to errors"
   - Link to view imported entertainers

---

## UI/UX Mockup

### Page: `/dashboard/settings/import-entertainers`

```
┌─────────────────────────────────────────────────────┐
│  Import Entertainers                                │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │                                               │  │
│  │    📄 Drag & drop CSV file here              │  │
│  │       or click to browse                     │  │
│  │                                               │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  Supported formats: .csv, .xlsx                     │
│  Max file size: 5MB                                 │
│                                                      │
│  📥 Download Template                               │
│  📖 View Instructions                               │
└─────────────────────────────────────────────────────┘
```

### After Upload (Column Mapping):

```
┌─────────────────────────────────────────────────────┐
│  Step 1: Map Columns                                │
│                                                      │
│  CSV Column          →  ClubFlow Field              │
│  ───────────────────    ──────────────────          │
│  Name                →  [Stage Name ▼]              │
│  FirstName           →  [First Name ▼]              │
│  LastName            →  [Last Name ▼]               │
│  Phone               →  [Phone ▼]                   │
│  Email               →  [Email ▼]                   │
│  DOB                 →  [Date of Birth ▼]           │
│  License             →  [License Number ▼]          │
│  State               →  [License State ▼]           │
│                                                      │
│  [Cancel]  [Next: Preview Data →]                   │
└─────────────────────────────────────────────────────┘
```

### Preview & Validate:

```
┌─────────────────────────────────────────────────────┐
│  Step 2: Preview & Validate                         │
│                                                      │
│  ⚠️ 2 errors found                                  │
│                                                      │
│  Showing first 10 of 32 rows:                       │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Stage Name │ First │ Last │ Phone │ Status  │  │
│  ├────────────┼───────┼──────┼───────┼─────────┤  │
│  │ Diamond    │ Sarah │ Joh..│ (555) │ ✅ Valid│  │
│  │ Sasha      │ Jessi │ Mar..│ 555-2 │ ✅ Valid│  │
│  │ Angel      │ Emily │ Dav..│ 55534 │ ❌ Error│  │
│  │            │       │      │       │   Invalid│  │
│  │            │       │      │       │   phone  │  │
│  │ Candy      │ Miche │ Lee  │ (555) │ ✅ Valid│  │
│  │ Diamond    │ Lisa  │ Smi..│ (555) │ ⚠️ Warn │  │
│  │            │       │      │       │   Dupl.  │  │
│  │            │       │      │       │   stage  │  │
│  └────────────┴───────┴──────┴───────┴─────────┘  │
│                                                      │
│  Options:                                           │
│  ☑️ Skip rows with errors (2 rows)                  │
│  ☐ Auto-rename duplicates (Diamond → Diamond 2)     │
│                                                      │
│  [← Back]  [Download Error Report]  [Import 30 →]  │
└─────────────────────────────────────────────────────┘
```

### Success Screen:

```
┌─────────────────────────────────────────────────────┐
│  ✅ Import Successful!                              │
│                                                      │
│  📊 Imported 30 entertainers                        │
│  ⏭️  Skipped 2 rows (errors)                        │
│                                                      │
│  What's next?                                       │
│  • View imported entertainers                       │
│  • Start checking in dancers                        │
│  • Upload photos (optional)                         │
│                                                      │
│  [View Entertainers]  [Import More]                 │
└─────────────────────────────────────────────────────┘
```

---

## Technical Implementation

### Backend API Endpoint

**Route**: `POST /api/entertainers/import`

**Request**:
```json
{
  "file": "<base64 encoded CSV or multipart form data>",
  "clubId": "club_123",
  "mapping": {
    "Name": "stageName",
    "FirstName": "legalFirstName",
    "LastName": "legalLastName",
    "Phone": "phone",
    "Email": "email",
    "DOB": "dateOfBirth",
    "License": "licenseNumber",
    "State": "licenseState"
  },
  "options": {
    "skipErrors": true,
    "autoRenameDuplicates": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "imported": 30,
  "skipped": 2,
  "errors": [
    {
      "row": 3,
      "field": "phone",
      "value": "55534",
      "error": "Invalid phone number format"
    },
    {
      "row": 5,
      "field": "stageName",
      "value": "Diamond",
      "error": "Duplicate stage name"
    }
  ],
  "entertainers": [
    { "id": "ent_001", "stageName": "Diamond", ... },
    { "id": "ent_002", "stageName": "Sasha", ... }
  ]
}
```

### Data Validation Logic

```typescript
// backend/services/entertainerImportService.ts

interface ImportRow {
  stageName: string;
  legalFirstName: string;
  legalLastName: string;
  phone: string;
  email?: string;
  dateOfBirth?: string;
  licenseNumber?: string;
  licenseState?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateRow(row: ImportRow, existingStageNames: string[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!row.stageName?.trim()) errors.push('Stage name is required');
  if (!row.legalFirstName?.trim()) errors.push('First name is required');
  if (!row.legalLastName?.trim()) errors.push('Last name is required');
  if (!row.phone?.trim()) errors.push('Phone is required');

  // Phone validation
  if (row.phone) {
    const cleaned = row.phone.replace(/\D/g, '');
    if (cleaned.length !== 10) {
      errors.push('Phone must be 10 digits');
    }
  }

  // Email validation
  if (row.email && !isValidEmail(row.email)) {
    errors.push('Invalid email format');
  }

  // Date validation
  if (row.dateOfBirth && !isValidDate(row.dateOfBirth)) {
    errors.push('Invalid date format (use MM/DD/YYYY)');
  }

  // Duplicate check
  if (existingStageNames.includes(row.stageName)) {
    warnings.push('Stage name already exists');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

function normalizePhone(phone: string): string {
  // Convert any format to E.164: +15551234567
  const cleaned = phone.replace(/\D/g, '');
  return `+1${cleaned}`;
}

function normalizeDate(date: string): Date | null {
  // Accept MM/DD/YYYY, M/D/YYYY, YYYY-MM-DD
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // MM/DD/YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/          // YYYY-MM-DD
  ];

  for (const format of formats) {
    const match = date.match(format);
    if (match) {
      // Parse and return Date object
      // ... implementation
    }
  }

  return null;
}
```

### Database Transaction

```typescript
async function bulkImportEntertainers(
  clubId: string,
  rows: ImportRow[],
  options: ImportOptions
): Promise<ImportResult> {

  // Start transaction
  return await prisma.$transaction(async (tx) => {
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as ImportError[]
    };

    // Get existing stage names to check duplicates
    const existing = await tx.entertainer.findMany({
      where: { clubId },
      select: { stageName: true }
    });
    const existingNames = existing.map(e => e.stageName);

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const validation = validateRow(row, existingNames);

      if (!validation.valid) {
        if (options.skipErrors) {
          results.skipped++;
          results.errors.push({
            row: i + 1,
            errors: validation.errors
          });
          continue;
        } else {
          // Abort entire import
          throw new Error(`Row ${i + 1}: ${validation.errors.join(', ')}`);
        }
      }

      // Handle duplicate stage names
      let finalStageName = row.stageName;
      if (validation.warnings.includes('Stage name already exists')) {
        if (options.autoRenameDuplicates) {
          finalStageName = `${row.stageName} ${i + 1}`;
        } else {
          results.skipped++;
          results.errors.push({
            row: i + 1,
            errors: ['Duplicate stage name']
          });
          continue;
        }
      }

      // Create entertainer
      await tx.entertainer.create({
        data: {
          clubId,
          stageName: finalStageName,
          legalFirstName: row.legalFirstName,
          legalLastName: row.legalLastName,
          phone: normalizePhone(row.phone),
          email: row.email || null,
          dateOfBirth: row.dateOfBirth ? normalizeDate(row.dateOfBirth) : null,
          licenseNumber: row.licenseNumber || null,
          licenseState: row.licenseState || null,
          emergencyContactName: row.emergencyContactName || null,
          emergencyContactPhone: row.emergencyContactPhone ? normalizePhone(row.emergencyContactPhone) : null,
          notes: row.notes || null,
          status: 'ACTIVE'
        }
      });

      results.imported++;
      existingNames.push(finalStageName); // Track for next iteration
    }

    return results;
  });
}
```

---

## Frontend Implementation

### React Component Structure

```typescript
// frontend/src/components/entertainers/ImportEntertainers.tsx

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse'; // CSV parser

type ImportStep = 'upload' | 'mapping' | 'preview' | 'success';

export function ImportEntertainers() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<any[]>([]);

  const onDrop = async (files: File[]) => {
    const file = files[0];

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setCsvData(results.data);
        setHeaders(Object.keys(results.data[0] || {}));

        // Auto-detect column mapping
        const autoMapping = detectColumnMapping(Object.keys(results.data[0] || {}));
        setMapping(autoMapping);

        setStep('mapping');
      },
      error: (error) => {
        alert('Error parsing CSV: ' + error.message);
      }
    });
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xlsx']
    },
    maxSize: 5 * 1024 * 1024 // 5MB
  });

  // ... rest of component
}

function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};

  const patterns = {
    stageName: /^(stage ?name|name|stage|dancer)$/i,
    legalFirstName: /^(first ?name|first|fname|legal ?first)$/i,
    legalLastName: /^(last ?name|last|lname|legal ?last|surname)$/i,
    phone: /^(phone|mobile|cell|number|contact)$/i,
    email: /^(email|e-mail|mail)$/i,
    dateOfBirth: /^(dob|date ?of ?birth|birth ?date|birthday)$/i,
    licenseNumber: /^(license|lic|permit|card)$/i,
    licenseState: /^(state|lic ?state|license ?state)$/i
  };

  for (const header of headers) {
    for (const [field, pattern] of Object.entries(patterns)) {
      if (pattern.test(header)) {
        mapping[header] = field;
        break;
      }
    }
  }

  return mapping;
}
```

---

## Testing Checklist

### Unit Tests
- [ ] Phone normalization (all formats)
- [ ] Date parsing (all formats)
- [ ] Email validation
- [ ] Duplicate detection
- [ ] Error message generation

### Integration Tests
- [ ] CSV upload and parsing
- [ ] Column auto-mapping
- [ ] Bulk entertainer creation
- [ ] Transaction rollback on error
- [ ] Error report generation

### E2E Tests
- [ ] Upload valid CSV → Success
- [ ] Upload CSV with errors → Preview errors
- [ ] Skip errors → Partial import
- [ ] Auto-rename duplicates → Works
- [ ] Large file (500 rows) → Imports

### Edge Cases
- [ ] Empty file
- [ ] File with only headers
- [ ] File with special characters in names
- [ ] File with international phone numbers
- [ ] File > 5MB (should reject)
- [ ] Malformed CSV (missing quotes, etc.)

---

## Success Metrics

### Before Feature:
- Onboarding time: 2.5-5 hours per customer
- Trial→Paid conversion: 15-20%
- Your bottleneck: Data entry

### After Feature:
- Onboarding time: 15-45 minutes per customer
- Trial→Paid conversion: 30-40% (target)
- Your bottleneck: Demo calls (good problem!)

---

## Future Enhancements

### V2 Features (if needed):
- [ ] Excel (.xlsx) support (not just CSV)
- [ ] Entertainer photo bulk upload (ZIP of images)
- [ ] Update existing entertainers (not just create)
- [ ] Schedule import (cron job for regular updates)
- [ ] API endpoint for POS integration partners

### Nice-to-Haves:
- [ ] Sample data generator (demo mode)
- [ ] Import history/audit log
- [ ] Undo import feature
- [ ] Export entertainers to CSV (reverse operation)

---

## Implementation Priority

**Week 1** (Now):
- Basic CSV upload
- Manual column mapping
- Simple validation
- Bulk create

**Week 2**:
- Auto-detect columns
- Error preview
- Skip errors option
- Success screen

**Week 3**:
- Polish UI/UX
- Add progress bar
- Error report download
- Testing & fixes

**Total**: ~12-15 hours for full feature

**MVP** (4-6 hours): Basic upload + validation + bulk create

---

This feature will 3x your onboarding speed and 2x your trial conversion rate. Build it ASAP!
