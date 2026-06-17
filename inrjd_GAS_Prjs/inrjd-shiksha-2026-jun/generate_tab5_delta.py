"""
Generate TAB5 delta CSV using SCD Type 2 logic.

This script compares the backup and latest Excel files, extracts TAB5 sheet,
filters only active records (ACTIVE_FLG = Y), and outputs new/changed rows
to a CSV file with all columns.

Usage:
    python generate_tab5_delta.py
"""

import pandas as pd
from pathlib import Path


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
        Dictionary with statistics (backup_active, latest_active, delta_rows, columns)
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
    
    # Output all columns from latest
    delta.to_csv(output_file, index=False)
    
    stats = {
        'backup_active': len(backup_active),
        'latest_active': len(latest_active),
        'delta_rows': len(delta),
        'columns': len(delta.columns),
        'output_file': str(output_file)
    }
    
    return stats


def main():
    """Main entry point."""
    base = Path(__file__).parent
    backup_file = base / 'attendance-db-2026-Apr-23.xlsx'
    latest_file = base / 'attendance-db.xlsx'
    output_file = base / 'tab5_delta_latest.csv'
    
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
    print(f"  Columns in output: {stats['columns']}")
    print(f"  Output file: {stats['output_file']}")


if __name__ == '__main__':
    main()
