# Nandotsav 2026 Letters Generator

Automatically generate personalized Nandotsav 2026 letters (PDF + PNG images) for all schools using a Word template and a multi-sheet Excel file.

## Features

✅ **Automated Letter Generation** - Generate personalized letters for all schools from a single template  
✅ **PDF & PNG Output** - Get both PDF files (for printing) and PNG images (for emails/web)  
✅ **YAML Configuration** - Configure file names and settings in `config.yaml`  
✅ **Cross-Platform** - Works on macOS, Windows, and Linux  
✅ **Flexible Template Support** - Finds the last "Annexure" heading regardless of formatting  
✅ **Organized Folders** - Input files in `input/` folder, output in `output/` folder  

---

## Quick Start

### 1. Setup (2 minutes)

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Windows:**
```cmd
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Prepare Files (1 minute)

Create an `input/` folder and place your files there:
```
inrjd_Nandotsav2026_Letters/
├── input/
│   ├── Nandotsav 2026.xlsx            ← Your data (multiple sheets)
│   └── Nandotsav 2026 Finals.docx     ← Your template
├── config.yaml
├── generate_final_letters_v2.py
└── requirements.txt
```

### 3. Generate (5-15 minutes)

```bash
python3 generate_final_letters_v2.py
```

Check the `output/` folder for your generated PDFs and PNG images!

---

## Excel File Format

Use one Excel file with these two sheets:

1. `top3` sheet: finalists data (used for ANNEXURE - 3 FINALISTS)
2. `fancydress` sheet: fancy dress participants (used for ANNEXURE - 4 FANCY DRESS COMPETITION PARTICIPANTS)

### `top3` sheet format

The `top3` sheet should contain these columns:

| Column | Description | Example |
|--------|-------------|---------|
| `SchoolCode` | School identifier | `AVN` |
| `SchoolName` | Full school name | `AGASTHYA VIDYANIKETHAN NAGARBHAVI` |
| `Group` | Competition group | `G1`, `G2`, `G3`, `G4` |
| `Competition` | Event type | `COLORING`, `PAINTING`, `QUIZ` |
| `Rank` | Student's rank | `1`, `2`, `3` |
| `StudentName` | Full student name | `MOKSHITH GOWDA` |
| `Class` | Student's class/grade | `3`, `UKG`, `M3` |
| `Sec` | Section/section letter | `A`, `B`, `DAISY`, `ASTER` |
| `PhoneNo` | Phone number (optional) | `9448517156` |
| `Token` | Token info (optional) | Empty OK |
| `Attendance1` | Attendance data (optional) | Empty OK |
| `Attendance2` | Attendance data (optional) | Empty OK |

### Example `top3` sheet row data:

```
SchoolCode,SchoolName,Group,Competition,Rank,StudentName,Class,Sec,PhoneNo,Token,Attendance1,Attendance2
AVN,AGASTHYA VIDYANIKETHAN NAGARBHAVI,G1,COLORING,1,MOKSHITH GOWDA,M3,B,,,,
AVN,AGASTHYA VIDYANIKETHAN NAGARBHAVI,G1,COLORING,2,THIRUMALESH M,UKG,A,,,,
BMN,BMN PUBLIC SCHOOL,G1,COLORING,3,ADITI M,UKG,,,,,
```

### `fancydress` sheet format

The `fancydress` sheet should contain at least:
- `SchoolName`
- `StudentName` (or `Name` / `Participant`)
- `Class` (optional)
- `Sec` or `Section` (optional)

**Key Points:**
- ✅ First row must be the header in both sheets
- ✅ Sheet names are configurable in `config.yaml`
- ✅ Column names are matched flexibly for common variants (like `StudentName`/`Student Name`)

---

## Word Template Format

Your template should contain:

1. **Placeholder:** `{School Name}` - will be replaced with actual school name
2. **Annexure 3 Heading:** Must contain "ANNEXURE", "3", and "FINAL" text
3. **Annexure 4 Heading:** Must contain "ANNEXURE", "4", "FANCY", and "DRESS" text

Example:
```
Date: July 31, 2026

To,
The Principal
{School Name}, Bangalore

Dear Sir/Madam,

...letter content...

ANNEXURE – 3 FINALISTS
[Table will be inserted here]

ANNEXURE - 4 FANCY DRESS COMPETITION PARTICIPANTS
[Table will be inserted here]
```

---

## Configuration (config.yaml)

Customize file names and settings in `config.yaml`:

```yaml
# Input file names (files should be in the 'input' folder)
excel_file: "Nandotsav 2026.xlsx"
finalists_sheet: "top3"
fancydress_sheet: "fancydress"
template_file: "Nandotsav 2026 Finals.docx"

# Output folder
output_folder: "output"

# PDF Converter: 'word' (auto-detect), 'libreoffice'
pdf_converter: "word"

# Show detailed progress
verbose: false

# Delete output folder before generating
clean: false
```

### Configuration Options:

| Option | Default | Description |
|--------|---------|-------------|
| `excel_file` | `Nandotsav 2026.xlsx` | Excel filename in `input/` folder |
| `finalists_sheet` | `top3` | Sheet for finalists data |
| `fancydress_sheet` | `fancydress` | Sheet for fancy dress participants |
| `template_file` | `Nandotsav 2026 Finals.docx` | DOCX filename in `input/` folder |
| `output_folder` | `output` | Folder for generated PDFs/PNGs |
| `pdf_converter` | `word` | `word` (auto-detect) or `libreoffice` |
| `verbose` | `false` | Show detailed progress |
| `clean` | `false` | Delete old output before generating |

---

## 📁 Input Files

### 1. Excel Data File
**File name:** `Nandotsav 2026.xlsx`

### 2. Word Template
**File name:** `Nandotsav 2026 Finals.docx`

**Requirements:**
- Contains `{School Name}` placeholder (will be replaced with actual school name)
- Contains a heading with text including both "Annexure" and "3" and "Finalist" (e.g., "Annexure - 3 Finalists")
- Below this heading, a table will be inserted with finalist details

**Template structure example:**
```
NANDOTSAV 2026 FINALIST LETTER

Dear Principal,

Congratulations! The following students from {School Name} have been selected 
as finalists in the Nandotsav 2026 competition.

Annexure - 3 Finalists
[Table will be inserted here with: GROUP | COMPETITION | NAME | CLASS | SECTION]

Regards,
ISKCON NRJD
```

---

## Usage

### Basic Usage

```bash
# Generate letters using config.yaml settings
python3 generate_final_letters_v2.py
```

### Command-Line Options

Override config.yaml settings:

```bash
# Show detailed progress
python3 generate_final_letters_v2.py --verbose

# Delete old output and regenerate
python3 generate_final_letters_v2.py --clean

# Use custom Excel file
python3 generate_final_letters_v2.py --excel "Snana_Yatra.xlsx"

# Use custom sheet names
python3 generate_final_letters_v2.py --finalists-sheet "top3" --fancydress-sheet "fancydress"

# Use custom template
python3 generate_final_letters_v2.py --template "Snana_Yatra_Template.docx"

# Use LibreOffice instead of Word
python3 generate_final_letters_v2.py --use-libreoffice

# Custom output folder
python3 generate_final_letters_v2.py --output "results"

# Use custom config file
python3 generate_final_letters_v2.py --config "my_config.yaml"

# Combine options
python3 generate_final_letters_v2.py --clean --verbose --use-libreoffice
```

### Help

```bash
python3 generate_final_letters_v2.py --help
```

---

## Output

After running, check the `output/` folder:

```
output/
├── agasthya_vidyanikethan_nagarbhavi.pdf
├── agasthya_vidyanikethan_nagarbhavi_page_1.png
├── agasthya_vidyanikethan_nagarbhavi_page_2.png
├── agasthya_vidyanikethan_nagarbhavi_page_3.png
├── bmn_public_school.pdf
├── bmn_public_school_page_1.png
├── bmn_public_school_page_2.png
└── ... (one PDF + images per school)
```

**Files Generated:**
- **PDF:** Personalized letter for printing/distribution
- **PNG:** Individual page images (one per page)

---

## Platform Support

This tool is fully compatible with **macOS**, **Windows**, and **Linux**.

### Platform Details

#### macOS ✅
- **Supported Python Versions:** 3.8+
- **PDF Converters:**
  - ✅ Microsoft Word (recommended, auto-detected)
  - ✅ LibreOffice (fallback)
- **Installation:**
  ```bash
  # Using Homebrew
  brew install python3 libreoffice
  
  # Or download Word from Microsoft 365 or Mac App Store
  ```
- **Note:** Script uses AppleScript to control Word, so Word must be installed (free with Microsoft 365 or Mac App Store)

#### Windows 10/11 ✅
- **Supported Python Versions:** 3.8+
- **PDF Converters:**
  - ✅ Microsoft Word (recommended, auto-detected)
  - ✅ LibreOffice (fallback)
- **Installation:**
  1. Download Python from https://www.python.org (check "Add Python to PATH")
  2. Install **one** of:
     - Microsoft Word (from Microsoft 365): https://www.microsoft.com/microsoft-365
     - LibreOffice: https://www.libreoffice.org/download
- **Note:** Script uses Windows COM interface to control Word

#### Linux (Ubuntu/Debian) ✅
- **Supported Python Versions:** 3.8+
- **PDF Converter:**
  - ✅ LibreOffice (required)
- **Installation:**
  ```bash
  # Ubuntu/Debian
  sudo apt update && sudo apt install python3 python3-pip libreoffice
  
  # Fedora
  sudo dnf install python3 libreoffice
  
  # Arch
  sudo pacman -S python libreoffice-still
  
  # Snap (all distributions)
  sudo snap install libreoffice
  ```

---

## System Requirements

- **Python:** 3.8 or higher
- **OS:** macOS, Windows, or Linux  
- **PDF Converter:** Microsoft Word OR LibreOffice
- **Disk Space:** ~500MB for dependencies, varies for output files

### Quick Installation

**macOS:**
```bash
# Using Homebrew
brew install python3 libreoffice

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Windows (Command Prompt):**
```cmd
# Ensure Python is installed and in PATH
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install python3 python3-pip libreoffice

# Create virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Troubleshooting by Platform

### macOS

**"Word not found"**
- Install Microsoft Word from Mac App Store or Microsoft 365
- Or use LibreOffice: `brew install libreoffice`

**"LibreOffice not found"**
```bash
brew install libreoffice
```

### Windows

**"Word COM interface failed"**
- Ensure Microsoft Word is properly installed
- Close any open Word windows before running the script
- Or use LibreOffice instead: `python generate_final_letters_v2.py --use-libreoffice`

**"LibreOffice not found"**
- Download and install from https://www.libreoffice.org
- Restart the terminal after installation for PATH update

**Path issues with spaces**
- All paths with spaces should work automatically
- If issues persist, use the short (8.3) path format in config.yaml

### Linux

**"LibreOffice not found"**
```bash
# Ubuntu/Debian
sudo apt install libreoffice

# Fedora  
sudo dnf install libreoffice

# Check installation
which soffice
```

**Snap LibreOffice** (if installed via snap)
- Snap paths are automatically detected
- If not found, try: `sudo snap install libreoffice`

---

## System Requirements

- **Python:** 3.8 or higher
- **OS:** macOS, Windows, or Linux
- **PDF Converter:** Microsoft Word OR LibreOffice

### Installation

**macOS:**
```bash
# Install Python
brew install python3

# Optional: Install LibreOffice
brew install libreoffice
```

**Windows:**
- Download Python 3.8+ from https://www.python.org
  - ✅ Check "Add Python to PATH" during installation
- Install Microsoft Word or LibreOffice:
  - Word: https://www.microsoft.com/en-us/microsoft-365
  - LibreOffice: https://www.libreoffice.org/download

**Linux:**
```bash
# Install Python and LibreOffice
sudo apt install python3 python3-pip libreoffice
```

---

## Troubleshooting

### "Input directory not found"
```
❌ Please create an 'input' folder and add your CSV and DOCX files there
```
**Fix:** Create an `input/` folder and move your CSV and DOCX files there

### "CSV file not found"
**Check:**
1. File is in `input/` folder (not project root)
2. Filename exactly matches `config.yaml` (including spaces): `Nandotsav 2026 - Top3.csv`

### "Template file not found"
**Check:**
1. File is in `input/` folder (not project root)
2. Filename exactly matches `config.yaml` (including spaces): `Nandotsav 2026 Finals.docx`

### "No PDF converter found"
**Install one:**
- **macOS:** Already have Word? Run: `brew install libreoffice`
- **Windows:** Install LibreOffice from https://www.libreoffice.org
- **Linux:** Run: `sudo apt install libreoffice`

**Or use:**
```bash
python3 generate_final_letters_v2.py --use-libreoffice
```

### "Could not find Annexure heading in template"
**Fix:** Your template must have a heading containing "ANNEXURE" (e.g., "ANNEXURE – 3 FINALISTS")

### "Could not find {School Name} placeholder"
**Fix:** Add `{School Name}` (with curly braces) to your template where the school name should appear

### CSV column mismatch errors
**Check:**
1. CSV has all required columns
2. Columns are in the correct order (see CSV Format section)
3. Column names are exactly correct (case-sensitive)
4. First row is the header row

### Slow performance
- Processing speed: ~5-10 seconds per school
- 100 schools ≈ 10-15 minutes (normal)
- If slower: Close other applications to free up resources

---

## Common Workflows

### Generate for a New Event

1. **Edit config.yaml:**
```yaml
csv_file: "Snana_Yatra_Top3.csv"
template_file: "Snana_Yatra_Template.docx"
```

2. **Place files in input/ folder**

3. **Generate:**
```bash
python3 generate_final_letters_v2.py --verbose
```

### Generate Multiple Events

```bash
# Event 1
cp config.yaml config_event1.yaml
# Edit config_event1.yaml...
python3 generate_final_letters_v2.py --config config_event1.yaml

# Event 2
cp config.yaml config_event2.yaml
# Edit config_event2.yaml...
python3 generate_final_letters_v2.py --config config_event2.yaml
```

### Fresh Generation

```bash
# Delete old output and regenerate
python3 generate_final_letters_v2.py --clean --verbose
```

---

## Cross-Platform Compatibility Notes

### File Paths
- ✅ All file paths work with both `/` and `\` separators (platform-agnostic)
- ✅ Spaces and special characters in filenames are handled automatically
- ✅ Unicode filenames (e.g., non-English characters) are fully supported

### PDF Conversion
- **macOS:** Uses Microsoft Word (via AppleScript) or LibreOffice
- **Windows:** Uses Microsoft Word (via COM/OLE) or LibreOffice  
- **Linux:** Uses LibreOffice only (Word not available)

| Platform | Word | LibreOffice | Auto-Detect | CLI Override |
|----------|------|-------------|-------------|--------------|
| macOS | ✅ AppleScript | ✅ Yes | ✅ Prefers Word | `--use-libreoffice` |
| Windows | ✅ COM/OLE | ✅ Yes | ✅ Prefers Word | `--use-libreoffice` |
| Linux | ❌ N/A | ✅ Yes | ✅ LibreOffice only | N/A |

### Temporary Files
- All temporary DOCX files are automatically cleaned up after processing
- Temp directory: System default (TMPDIR on Unix-like, %TEMP% on Windows)
- Safe even if interrupted - cleanup runs on exit

### Environment Variables
The script respects these environment variables (if needed):
- `TMPDIR` (Unix-like systems) - Temporary directory location
- `TEMP` / `TMP` (Windows) - Temporary directory location

### Virtual Environments
Recommended for all platforms to avoid dependency conflicts:

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Windows (CMD):**
```cmd
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Windows (PowerShell):**
```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### CI/CD & Automation
- ✅ No interactive prompts - fully automatable
- ✅ Exit codes: `0` (success), `1` (setup error), `2` (processing error)
- ✅ All output can be captured: redirect stdout/stderr safely
- ✅ Safe for parallel runs with different output folders

---

## Project Structure

```
inrjd_Nandotsav2026_Letters/
├── README.md                      (this file)
├── config.yaml                    (configuration)
├── requirements.txt               (Python dependencies)
├── generate_final_letters_v2.py   (main script)
├── input/                         (your input files)
│   ├── Nandotsav 2026 - Top3.csv
│   └── Nandotsav 2026 Finals.docx
└── output/                        (generated files)
    ├── school_1.pdf
    ├── school_1_page_1.png
    └── ... (one PDF + images per school)
```

---

## Frequently Asked Questions

**Q: Can I change the CSV filename?**  
A: Yes! Edit `config.yaml` or use: `python3 generate_final_letters_v2.py --csv "MyData.csv"`

**Q: Can I change the template filename?**  
A: Yes! Edit `config.yaml` or use: `python3 generate_final_letters_v2.py --template "MyTemplate.docx"`

**Q: Can I change the output folder?**  
A: Yes! Edit `config.yaml` or use: `python3 generate_final_letters_v2.py --output "results"`

**Q: How do I know if it's working?**  
A: Run with `--verbose`: `python3 generate_final_letters_v2.py --verbose`

**Q: Can I use LibreOffice instead of Word?**  
A: Yes! Use: `python3 generate_final_letters_v2.py --use-libreoffice`

**Q: How long does it take?**  
A: ~5-10 seconds per school. 100 schools ≈ 10-15 minutes.

**Q: Can I process multiple schools at once?**  
A: Not in parallel, but you can run the script multiple times with different CSV files.

---

## Support

For issues:
1. Check the **Troubleshooting** section above
2. Verify all files are in `input/` folder
3. Run with `--verbose` to see detailed output
4. Check error messages carefully - they usually indicate the exact problem

---

## Requirements

- Python 3.8+
- python-docx
- PyMuPDF
- PyYAML
- Microsoft Word or LibreOffice (for PDF conversion)
- pywin32 (Windows only, for Word support)

Install all with:
```bash
pip install -r requirements.txt
```

---

**Last Updated:** 2026-07-31  
**Version:** 2.1 (YAML Configuration + Folder Structure)  
**Status:** Production Ready
