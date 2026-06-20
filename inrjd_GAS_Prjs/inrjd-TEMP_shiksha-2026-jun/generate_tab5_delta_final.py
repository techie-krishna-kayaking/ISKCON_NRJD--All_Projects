"""
Generate TAB5 delta CSV with specific columns and transformations.

This script:
1. Compares backup and latest Excel files using SCD Type 2 logic (ACTIVE_FLG = Y)
2. Extracts delta rows with columns: SIKSHA CODE, PROGRAM KEY, NAME, SIKSHA STATUS
3. For "shardhavan" status rows, transforms SIKSHA CODE to: DDMM (from DATE OF BIRTH) + last 4 digits of AADHAR

Usage:
    python generate_tab5_delta_final.py
"""

import pandas as pd
from pathlib import Path
from datetime import datetime


def active_only(df: pd.DataFrame) -> pd.DataFrame:
    """Filter DataFrame to only active rows where ACTIVE_FLG = 'Y'."""
    mask = df['ACTIVE_FLG'].astype(str).str.strip().str.lower().eq('y')
    return df.loc[mask].copy()


def normalize_for_compare(df: pd.DataFrame, cols: list[str]) -> pd.DataFrame:
    """Normalize values for stable row comparison."""
    out = df[cols].copy()
    out = out.fillna('')
    for col in cols:
        out[col] = out[col].astype(str).str.strip()
    return out


def extract_aadhar_last4(aadhar):
    """Extract last 4 digits from aadhar number."""
    if pd.isna(aadhar):
        return ''
    # Convert to string and remove any decimals/spaces
    aadhar_str = str(aadhar).split('.')[0].strip()
    if len(aadhar_str) >= 4:
        return aadhar_str[-4:]
    return aadhar_str


def extract_ddmm_from_dob(dob):
    """Extract DDMM from date of birth."""
    if pd.isna(dob):
        return ''
    try:
        if isinstance(dob, str):
            # Try parsing different formats
            for fmt in ['%d-%m-%Y', '%d/%m/%Y', '%Y-%m-%d', '%Y/%m/%d', '%d-%b-%Y']:
                try:
                    dt = datetime.strptime(dob.strip(), fmt)
                    return dt.strftime('%d%m')
                except ValueError:
                    continue
            return ''
        else:
            # Assume it's a datetime object
            return dob.strftime('%d%m')
    except Exception as e:
        print(f"Warning: Could not parse DOB '{dob}': {e}")
        return ''


def is_shraddhavan_status(value) -> bool:
    """Match shardhavan status with common spelling variants."""
    status = str(value).lower().strip()
    return any(token in status for token in ('shardhavan', 'sharadhavan', 'shraddhavan'))


def transform_siksha_code(row):
    """Transform SIKSHA CODE for shardhavan status."""
    if is_shraddhavan_status(row.get('SIKSHA STATUS', '')):
        ddmm = extract_ddmm_from_dob(row.get('DATE OF BIRTH'))
        aadhar_last4 = extract_aadhar_last4(row.get('AADHAR_NO'))
        
        if ddmm and aadhar_last4:
            return f"{ddmm}{aadhar_last4}"
    
    # Return original code if not shardhavan
    return row.get('SIKSHA CODE', '')


def generate_delta_csv(
    backup_file: Path,
    latest_file: Path,
    output_file: Path,
    sheet_name: str = 'tab5'
) -> dict:
    """
    Generate delta CSV comparing backup and latest data.
    
    Args:
        backup_file: Path to backup Excel file
        latest_file: Path to latest Excel file
        output_file: Path to output CSV file
        sheet_name: Sheet name to compare (default: 'tab5')
    
    Returns:
        Dictionary with statistics
    """
    
    # Read both Excel files
    backup = pd.read_excel(backup_file, sheet_name=sheet_name)
    latest = pd.read_excel(latest_file, sheet_name=sheet_name)
    
    # Keep only active rows (SCD2 latest state)
    backup_active = active_only(backup)
    latest_active = active_only(latest)
    
    # Compare on common columns to avoid false deltas from schema drift
    common_cols = [c for c in latest_active.columns if c in backup_active.columns]
    
    # Create normalized versions for comparison
    backup_cmp = normalize_for_compare(backup_active, common_cols)
    latest_cmp = normalize_for_compare(latest_active, common_cols)
    
    # Create row signatures for comparison
    sep = '\x1f'  # Use unprintable character as separator
    backup_sig = set(backup_cmp.agg(sep.join, axis=1).tolist())
    latest_sig = latest_cmp.agg(sep.join, axis=1)
    
    # Identify delta rows (in latest but not in backup)
    is_delta = ~latest_sig.isin(backup_sig)
    delta = latest_active.loc[is_delta].copy()
    
    # Select only required columns
    required_cols = ['SIKSHA CODE', 'PROGRAM KEY', 'NAME', 'SIKSHA STATUS']
    output_df = delta[required_cols].copy()
    
    # Apply transformation for shardhavan status
    output_df['SIKSHA CODE'] = delta.apply(transform_siksha_code, axis=1)
    
    # Output to CSV
    output_df.to_csv(output_file, index=False)
    
    stats = {
        'backup_active': len(backup_active),
        'latest_active': len(latest_active),
        'delta_rows': len(delta),
        'output_file': str(output_file),
        'required_columns': required_cols
    }
    
    return stats


def main():
    """Main entry point."""
    base = Path(__file__).parent
    backup_file = base / 'attendance-db-2026-Apr-23.xlsx'
    latest_file = base / 'attendance-db.xlsx'
    output_file = base / 'tab5_delta_final.csv'
    
    if not backup_file.exists():
        print(f"Error: Backup file not found: {backup_file}")
        return
    
    if not latest_file.exists():
        print(f"Error: Latest file not found: {latest_file}")
        return
    
    print(f"Generating delta from TAB5 sheet...")
    print(f"Backup file: {backup_file.name}")
    print(f"Latest file: {latest_file.name}")
    
    stats = generate_delta_csv(backup_file, latest_file, output_file)
    
    print(f"\nResults:")
    print(f"  Backup active rows: {stats['backup_active']}")
    print(f"  Latest active rows: {stats['latest_active']}")
    print(f"  Delta rows written: {stats['delta_rows']}")
    print(f"  Output columns: {', '.join(stats['required_columns'])}")
    print(f"  Output file: {stats['output_file']}")
    print(f"\nNote: SIKSHA CODE transformed to DDMM+last4Aadhar for shardhavan status")


if __name__ == '__main__':
    main()
