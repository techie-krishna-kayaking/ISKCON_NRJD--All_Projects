# Nandotsav 2026 Letters Generator

Generates **one PDF per school** (and page PNGs) from Word templates + Excel sheets, with separate output folders per workflow.

Script: [generate_final_letters_v2.py](/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/inrjd_Nandotsav2026_Letters/generate_final_letters_v2.py)  
Config: [config.yaml](/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/inrjd_Nandotsav2026_Letters/config.yaml)

---

## Workflows

## 1) Finalist workflow (`workflow: finalist`)

What it does:
- Replaces `{School Name}` in the finalist letter template.
- Builds **Annexure-3** table from finalists sheet.
- Builds **Annexure-4** table from fancy dress sheet.
- Generates one school-wise PDF.

Output location:
- [output/finalist/](/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/inrjd_Nandotsav2026_Letters/output/finalist)

Default input files:
- Excel: `TMPLT_FInalist_Nandotsav2026.xlsx`
- Word template: `TMPLT_Finalist_Nandotsav2026.docx`

## 2) Medalist workflow (`workflow: medalist`)

What it does:
- Replaces `{School Name}` in the medalist letter template.
- Keeps original template content as page 1.
- Adds page 2 with heading **Inter-School Winners -** and a table using uppercase headers:
  - `GROUP | COMPETITION | STUDENT NAME | CLASS | SEC`
- Generates files **only for schools present in the `Overall` sheet** (inter-school winners only).
- Generates one school-wise PDF (2 pages).

Output location:
- [output/medalist/](/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/inrjd_Nandotsav2026_Letters/output/medalist)

Default input files:
- Excel: `TMPLT_Certificate_Nandotsav2026.xlsx`
- Word template: `TMPLT_Medalist_Nandotsav2026.docx`

## 3) Medalist Exception workflow (`workflow: medalist_exception`)

What it does:
- Replaces `{School Name}` in the medalist exception letter template.
- Keeps original template content as page 1.
- Adds page 2 with heading **Inter-School Winners -** (from the `Overall` sheet) and a table using uppercase headers:
  - `GROUP | COMPETITION | STUDENT NAME | CLASS | SEC`
- Adds page 3 with heading **School Level Winners -** (from the `Schoolwise` sheet) and the same table format.
- Generates files for **all schools that appear in either the `Overall` or `Schoolwise` sheet** (union of both).
- Generates one school-wise PDF (3 pages).

Output location:
- [output/medalist_exception/](/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/inrjd_Nandotsav2026_Letters/output/medalist_exception)

Default input files:
- Excel: `TMPLT_Certificate_Nandotsav2026.xlsx`
- Word template: `TMPLT_Medalist_Exception_Nandotsav2026.docx`

---

## Input Folder Structure

Keep all input files in [input/](/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/inrjd_Nandotsav2026_Letters/input):

```text
inrjd_Nandotsav2026_Letters/
├── input/
│   ├── TMPLT_FInalist_Nandotsav2026.xlsx
│   ├── TMPLT_Finalist_Nandotsav2026.docx
│   ├── TMPLT_Certificate_Nandotsav2026.xlsx
│   ├── TMPLT_Medalist_Nandotsav2026.docx
│   └── TMPLT_Medalist_Exception_Nandotsav2026.docx
├── config.yaml
└── generate_final_letters_v2.py
```

---

## Excel Structure

## Finalist Excel: `TMPLT_FInalist_Nandotsav2026.xlsx`

Required sheets:
- `Top3`
- `fancydress`

### Sheet: `Top3`

Expected columns (first row must be header):

| Column | Required | Notes |
|---|---|---|
| `SchoolCode` | Optional | Not used for grouping; useful for reference |
| `SchoolName` | Yes | School-wise grouping key |
| `Group` | Yes | e.g., `G1`, `G2`, `G3`, `G4` |
| `Competition` | Yes | Event name |
| `Rank` | Optional | Used for sorting |
| `StudentName` | Yes | Student name |
| `Class` | Optional | Student class |
| `Sec` | Optional | Student section |

### Sheet: `fancydress`

Expected columns:

| Column | Required | Notes |
|---|---|---|
| `SchoolName` | Yes | School-wise grouping key |
| `StudentName` | Yes | (aliases supported: `Student Name`, `Name`, `Participant`) |
| `Class` | Optional | Student class |
| `Sec` / `Section` | Optional | Student section |

---

## Medalist Excel: `TMPLT_Certificate_Nandotsav2026.xlsx`

Used by both **Medalist** and **Medalist Exception** workflows.

Required sheets:
- `Overall` — inter-school winners (used by both workflows)
- `Schoolwise` — school-level winners (used by Medalist Exception only)

### Sheet: `Overall` (Inter-school winners)

Expected columns:

| Column | Required | Notes |
|---|---|---|
| `Schoolname` / `SchoolName` | Yes | School-wise grouping key |
| `GROUP` / `Group` | Yes | Group value |
| `Competition` | Yes | Event name |
| `Student Name` / `StudentName` | Yes | Student name |
| `Class` | Optional | Student class |
| `Sec` / `Section` | Optional | Student section |

### Sheet: `Schoolwise` (School-level winners)

Expected columns:

| Column | Required | Notes |
|---|---|---|
| `Schoolname` / `SchoolName` | Yes | School-wise grouping key |
| `Group` | Yes | Group value |
| `Competition` | Yes | Event name |
| `Student Name` / `StudentName` | Yes | Student name |
| `Class` | Optional | Student class |
| `Sec` / `Section` | Optional | Student section |

---

## Word Template Name Structure

Template files are intentionally prefixed with `TMPLT_` to mark them as base templates:
- `TMPLT_Finalist_Nandotsav2026.docx`
- `TMPLT_Medalist_Nandotsav2026.docx`
- `TMPLT_Medalist_Exception_Nandotsav2026.docx`

Excel base files are also prefixed similarly:
- `TMPLT_FInalist_Nandotsav2026.xlsx`
- `TMPLT_Certificate_Nandotsav2026.xlsx`

Template requirements:
- Must contain `{School Name}` placeholder.
- Finalist template must contain headings for Annexure-3 and Annexure-4 sections.
- Medalist template: page 1 = letter body, page 2 = Inter-School Winners table appended.
- Medalist Exception template: page 1 = letter body, page 2 = Inter-School Winners, page 3 = School Level Winners.

---

## Config Example

```yaml
workflow: "finalist"   # finalist | medalist | medalist_exception

finalist_excel_file: "TMPLT_FInalist_Nandotsav2026.xlsx"
finalist_template_file: "TMPLT_Finalist_Nandotsav2026.docx"
finalists_sheet: "Top3"
fancydress_sheet: "fancydress"

medalist_excel_file: "TMPLT_Certificate_Nandotsav2026.xlsx"
medalist_template_file: "TMPLT_Medalist_Nandotsav2026.docx"
overall_sheet: "Overall"

medalist_exception_excel_file: "TMPLT_Certificate_Nandotsav2026.xlsx"
medalist_exception_template_file: "TMPLT_Medalist_Exception_Nandotsav2026.docx"
medalist_exception_overall_sheet: "Overall"
medalist_exception_schoolwise_sheet: "Schoolwise"

output_folder: "output"
pdf_converter: "word"
verbose: false
clean: false
```

---

## Usage

```bash
# Uses workflow and files from config.yaml
python3 generate_final_letters_v2.py

# Run finalist workflow explicitly
python3 generate_final_letters_v2.py --workflow finalist

# Run medalist workflow explicitly
python3 generate_final_letters_v2.py --workflow medalist

# Run medalist exception workflow explicitly
python3 generate_final_letters_v2.py --workflow medalist_exception
```

Output goes to workflow-specific folders:
- Finalist: [output/finalist/](/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/inrjd_Nandotsav2026_Letters/output/finalist)
- Medalist: [output/medalist/](/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/inrjd_Nandotsav2026_Letters/output/medalist)
- Medalist Exception: [output/medalist_exception/](/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/inrjd_Nandotsav2026_Letters/output/medalist_exception)

Each folder contains:
- `<school_slug>.pdf`
- `<school_slug>_page_1.png`, `<school_slug>_page_2.png`, ...
