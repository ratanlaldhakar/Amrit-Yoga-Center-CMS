# Amrit Yoga Center ERP — Student Bulk Import Format Specification
> **For Developers, Studio Staff, and AI Assistants (ChatGPT, Claude, Gemini, DeepSeek, Cursor, Copilot)**
> 
> Use this document whenever you need to convert raw data (paper registers, WhatsApp chat lists, Excel sheets, Google Forms) into the exact bulk-import CSV/Excel format recognized by the Amrit Yoga Center ERP.

---

## 1. Quick Rules Summary

- **Compulsory (Required) Fields**: ONLY **`Full Name`** and **`Mobile Number`**.
- **All other 10 fields are completely optional** and will automatically take sensible defaults if omitted or left blank.
- **Accepted File Extensions**: `.xlsx`, `.xls`, `.csv`, `.txt` (tab-separated or comma-separated clipboard paste).
- **Header Matching**: Case-insensitive and space-insensitive (e.g. `full_name`, `Full Name`, `fullname`, `student name` all match).

---

## 2. Master Columns & Specification Table

| # | Standard Column Header | Accepted Aliases (Case-Insensitive) | Required? | Data Type | Example Value | Default Value If Blank |
|---|---|---|---|---|---|---|
| **1** | **`Full Name`** | `name`, `fullname`, `studentname`, `student`, `studentfullname`, `naam` | **YES** | Text (min 2 letters) | `Rahul Sharma` | *Fails row validation if empty* |
| **2** | **`Mobile Number`** | `mobile`, `mobilenumber`, `phone`, `phonenumber`, `contact`, `contactnumber`, `cell` | **YES** | 10-digit Indian Number | `9829012345` | *Fails row validation if not 10 digits* |
| **3** | `Batch` | `batch`, `batchname`, `class`, `group` | *Optional* | Text (Batch Name) | `General Hatha` | Takes Modal's "Default Batch" or `Unassigned` |
| **4** | `Fee Plan` | `feeplan`, `plan`, `packagename`, `package` | *Optional* | Text | `Monthly Regular` | `Monthly Regular` |
| **5** | `Monthly Fee` | `monthlyfee`, `fee`, `amount`, `payablefee`, `basefee` | *Optional* | Numeric (₹) | `1800` | Matched Batch's monthly fee or `1800` |
| **6** | `Joining Date` | `joiningdate`, `joindate`, `date`, `admissiondate` | *Optional* | Date (ISO or Indian) | `2026-09-15` or `15-09-2026` | Current Date (`Today`) |
| **7** | `Gender` | `gender`, `sex` | *Optional* | `Male` / `Female` / `Other` | `Male` or `Female` | `Male` |
| **8** | `Parent Name` | `parentname`, `fathername`, `guardian`, `father` | *Optional* | Text | `Ramesh Sharma` | `""` (Empty) |
| **9** | `WhatsApp Number` | `whatsappnumber`, `whatsapp`, `wanumber` | *Optional* | 10-digit Number | `9829012345` | Automatically copies `Mobile Number` |
| **10** | `Address` | `address`, `city`, `location`, `area` | *Optional* | Text | `Subhash Nagar, Bhilwara` | `""` (Empty) |
| **11** | `Status` | `status` | *Optional* | `Active`, `Trial`, `On Hold`, `Inactive`, `Left` | `Active` | `Active` |
| **12** | `Notes` | `notes`, `remarks`, `comment` | *Optional* | Text | `Referred by Dr. Jain` | `Bulk imported on [Date]` |

---

## 3. Data Cleaning & Auto-Correction Rules

The ERP importer includes smart auto-cleaning:

1. **Phone Numbers**:
   - `+91 98290 12345` ➔ auto-cleaned to `9829012345`.
   - `09829012345` (with leading zero) ➔ auto-cleaned to `9829012345`.
   - `919829012345` (12 digits with 91) ➔ auto-cleaned to `9829012345`.

2. **Dates**:
   - `2026-09-15` (ISO `YYYY-MM-DD`) ➔ recognized directly.
   - `15-09-2026` or `15/09/2026` (`DD-MM-YYYY`) ➔ converted to `2026-09-15`.
   - Excel serial numbers (e.g. `45552`) ➔ auto-converted to calendar date.

3. **Batch Matching**:
   - Matches batch names flexibly: e.g. `Hatha`, `General Hatha`, `morning hatha` will all match the existing batch `General Hatha`.
   - If empty or unmatched, it will either use the dropdown fallback selected in the UI or set to `Unassigned` so the studio director can allocate batch slots later.

4. **Gender**:
   - `F`, `Female`, `female`, `mahila` ➔ `Female`.
   - `M`, `Male`, `male`, `purush` ➔ `Male`.
   - `Other` ➔ `Other`.

---

## 4. Sample CSV Content (Ready to Copy)

```csv
Full Name,Mobile Number,Batch,Fee Plan,Monthly Fee,Joining Date,Gender,Parent Name,WhatsApp Number,Address,Status,Notes
Rahul Sharma,9829012345,General Hatha,Monthly Regular,1800,2026-09-15,Male,Ramesh Sharma,9829012345,Subhash Nagar Bhilwara,Active,Morning batch regular
Pooja Verma,9414056789,,Monthly Regular,1800,2026-09-17,Female,,,Shastri Nagar Bhilwara,Active,Batch to be assigned
Amit Choudhary,9828123456,Beginner Yoga,Quarterly (3 Months),5500,2026-09-10,Male,,,Gandhi Nagar Bhilwara,Active,Quarterly concession applied
Sunita Jain,9414112233,Evening Flow,Monthly Regular,1800,2026-09-16,Female,Suresh Jain,9414112233,Bapunagar Bhilwara,Active,Health issues: Back pain
Vikram Singh,9782334455,General Hatha,Monthly Regular,1800,2026-09-12,Male,,,Rajendra Marg Bhilwara,Active,
```

---

## 5. Ready-To-Use Prompt for ANY AI Assistant

> **Copy and paste this prompt into ChatGPT, Claude, Gemini, or DeepSeek along with your raw list:**

```text
Act as a data formatting assistant. I have raw student/member records from my yoga center. 
Please clean and convert my raw data into a CSV format compatible with Amrit Yoga Center ERP bulk import.

CSV Headers must be exactly:
Full Name,Mobile Number,Batch,Fee Plan,Monthly Fee,Joining Date,Gender,Parent Name,WhatsApp Number,Address,Status,Notes

Formatting Rules:
1. "Full Name" and "Mobile Number" (10 digits) are compulsory.
2. If phone has +91 or leading 0, clean it to exactly 10 digits (e.g., 9829012345).
3. Dates should be in YYYY-MM-DD format (e.g., 2026-09-15). If date is not provided, use today's date.
4. "Fee Plan" defaults to "Monthly Regular" if unspecified.
5. "Monthly Fee" defaults to 1800 if unspecified.
6. "Gender" should be "Male" or "Female".
7. "Status" should be "Active".
8. If WhatsApp number is not specified, copy the Mobile Number.
9. Leave optional fields blank (,,) if not available in my raw data.

Here is my raw student data:
[PASTE YOUR RAW NAMES, PHONE NUMBERS, OR SPREADSHEET COPY HERE]
```

---

## 6. Minimal 2-Column Format (Quickest Import)

If you only have names and phone numbers, you only need this minimal CSV:

```csv
Full Name,Mobile Number
Rahul Sharma,9829012345
Pooja Verma,9414056789
Amit Choudhary,9828123456
Sunita Jain,9414112233
```
*All other 10 fields will be automatically filled with smart studio defaults!*
