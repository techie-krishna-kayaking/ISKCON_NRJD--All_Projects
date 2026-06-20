"""
Create full TAB5 CSV while preserving historical rows.

Rules:
1. Delta detection uses SCD2 active rows only (ACTIVE_FLG = Y).
2. Output includes all rows from latest tab5 (ACTIVE_FLG = Y and N).
3. DATE is updated only for delta active rows.
4. SIKSHA CODE is transformed only for delta active rows with
   sharadhavan/shardhavan/shraddhavan status.
"""

from __future__ import annotations

from datetime import datetime
from pathlib import Path

import pandas as pd


def active_only(df: pd.DataFrame) -> pd.DataFrame:
    mask = df["ACTIVE_FLG"].astype(str).str.strip().str.lower().eq("y")
    return df.loc[mask].copy()


def normalize_for_compare(df: pd.DataFrame, cols: list[str]) -> pd.DataFrame:
    out = df[cols].copy().fillna("")
    for col in cols:
        out[col] = out[col].astype(str).str.strip()
    return out


def is_shraddhavan_status(value) -> bool:
    status = str(value).lower().strip()
    return any(token in status for token in ("shardhavan", "sharadhavan", "shraddhavan"))


def extract_aadhar_last4(aadhar) -> str:
    if pd.isna(aadhar):
        return ""
    aadhar_str = str(aadhar).split(".")[0].strip()
    return aadhar_str[-4:] if len(aadhar_str) >= 4 else aadhar_str


def extract_ddmm_from_dob(dob) -> str:
    if pd.isna(dob):
        return ""
    try:
        if isinstance(dob, str):
            for fmt in ("%d-%m-%Y", "%d/%m/%Y", "%Y-%m-%d", "%Y/%m/%d", "%d-%b-%Y"):
                try:
                    return datetime.strptime(dob.strip(), fmt).strftime("%d%m")
                except ValueError:
                    continue
            return ""
        return dob.strftime("%d%m")
    except Exception:
        return ""


def make_signatures(df: pd.DataFrame, cols: list[str]) -> pd.Series:
    sep = "\x1f"
    cmp_df = normalize_for_compare(df, cols)
    return cmp_df.agg(sep.join, axis=1)


def build_full_with_history(
    backup_file: Path,
    latest_file: Path,
    output_file: Path,
    sheet_name: str = "tab5",
    new_date: str = "2026-06-21",
) -> dict:
    backup = pd.read_excel(backup_file, sheet_name=sheet_name)
    latest = pd.read_excel(latest_file, sheet_name=sheet_name)

    backup_active = active_only(backup).reset_index(drop=True)
    latest_active = active_only(latest).reset_index(drop=True)
    latest_all = latest.reset_index(drop=True)

    common_cols = [c for c in latest_active.columns if c in backup_active.columns]

    backup_sig = set(make_signatures(backup_active, common_cols).tolist())
    latest_active_sig = make_signatures(latest_active, common_cols)

    is_delta_active = ~latest_active_sig.isin(backup_sig)
    delta_active_sigs = set(latest_active_sig[is_delta_active].tolist())

    latest_all_sig = make_signatures(latest_all, common_cols)
    active_mask_all = latest_all["ACTIVE_FLG"].astype(str).str.strip().str.lower().eq("y")
    apply_mask = active_mask_all & latest_all_sig.isin(delta_active_sigs)

    out = latest_all.copy()

    if "DATE" in out.columns:
        out.loc[apply_mask, "DATE"] = new_date

    status_mask = out["SIKSHA STATUS"].apply(is_shraddhavan_status)
    code_mask = apply_mask & status_mask

    for idx in out.index[code_mask]:
        ddmm = extract_ddmm_from_dob(out.at[idx, "DATE OF BIRTH"])
        aadhar_last4 = extract_aadhar_last4(out.at[idx, "AADHAR_NO"])
        if ddmm and aadhar_last4:
            out.at[idx, "SIKSHA CODE"] = f"{ddmm}{aadhar_last4}"

    out.to_csv(output_file, index=False)

    return {
        "total_rows": len(out),
        "active_rows": int(active_mask_all.sum()),
        "inactive_rows": int((~active_mask_all).sum()),
        "delta_active_rows": int(apply_mask.sum()),
        "delta_shraddhavan_rows": int(code_mask.sum()),
        "output_file": str(output_file),
    }


def main() -> None:
    base = Path(__file__).parent
    backup_file = base / "attendance-db-2026-Apr-23.xlsx"
    latest_file = base / "attendance-db.xlsx"
    output_file = base / "tab5_full_merged_with_history.csv"

    stats = build_full_with_history(
        backup_file=backup_file,
        latest_file=latest_file,
        output_file=output_file,
        sheet_name="tab5",
        new_date="2026-06-21",
    )

    print("Full TAB5 with history generated")
    print(f"Total rows: {stats['total_rows']}")
    print(f"Active rows: {stats['active_rows']}")
    print(f"Inactive rows: {stats['inactive_rows']}")
    print(f"Delta active rows updated: {stats['delta_active_rows']}")
    print(f"Delta sharadhavan code updates: {stats['delta_shraddhavan_rows']}")
    print(f"Output: {stats['output_file']}")


if __name__ == "__main__":
    main()
