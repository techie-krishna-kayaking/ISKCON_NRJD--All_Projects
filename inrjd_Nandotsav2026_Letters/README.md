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
- Adds page 2 with heading **Inter-School Winners - ** and a table using uppercase headers:
  - `GROUP | COMPETITION | STUDENT NAME | CLASS | SEC`
- Generates files **only for schools present in the `Overall` sheet**.
- Generates one school-wise PDF.

Output location:
- [output/medalist/](/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/inrjd_Nandotsav2026_Letters/output/medalist)

Default input files:
- Excel: `TMPLT_Certificate_Nandotsav2026.xlsx`
- Word template: `TMPLT_Medalist_Nandotsav2026.docx`

---

## Input Folder Structure

Keep all input files in [input/](/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/inrjd_Nandotsav2026_Letters/input):

```text
inrjd_Nandotsav2026_Letters/
├── input/
│   ├── TMPLT_FInalist_Nandotsav2026.xlsx
│   ├── TMPLT_Finalist_Nandotsav2026.docx
│   ├── TMPLT_Certificate_Nandotsav2026.xlsx
│   └── TMPLT_Medalist_Nandotsav2026.docx
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

Required sheet:
- `Overall`

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

---

## Word Template Name Structure

Template files are intentionally prefixed with `TMPLT_` to mark them as base templates:
- `TMPLT_Finalist_Nandotsav2026.docx`
- `TMPLT_Medalist_Nandotsav2026.docx`

Excel base files are also prefixed similarly:
- `TMPLT_FInalist_Nandotsav2026.xlsx`
- `TMPLT_Certificate_Nandotsav2026.xlsx`

Template requirements:
- Must contain `{School Name}` placeholder.
- Finalist template must contain headings for Annexure-3 and Annexure-4 sections.
- Medalist template uses page-1 body from template and appends only the Inter-School Winners table on page 2.

---

## Config Example

```yaml
workflow: "finalist"   # finalist or medalist

finalist_excel_file: "TMPLT_FInalist_Nandotsav2026.xlsx"
finalist_template_file: "TMPLT_Finalist_Nandotsav2026.docx"
finalists_sheet: "Top3"
fancydress_sheet: "fancydress"

medalist_excel_file: "TMPLT_Certificate_Nandotsav2026.xlsx"
medalist_template_file: "TMPLT_Medalist_Nandotsav2026.docx"
overall_sheet: "Overall"

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
```

Output goes to workflow-specific folders:
- Finalist: [output/finalist/](/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/inrjd_Nandotsav2026_Letters/output/finalist)
- Medalist: [output/medalist/](/Users/kkrishna/Downloads/pp/VSCode_Projects/ISKCON_NRJD--All_Projects/inrjd_Nandotsav2026_Letters/output/medalist)

Each folder contains:
- `<school_slug>.pdf`
- `<school_slug>_page_1.png`, `<school_slug>_page_2.png`, ...
