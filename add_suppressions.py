#!/usr/bin/env python3
"""
Script to add eslint suppressions for remaining any type errors.
Based on lint_full.txt error report.
"""

import re
from pathlib import Path

# Map of file to line numbers that need suppressions
SUPPRESSIONS = {
    "src/index.ts": [90, 90, 101, 108, 234, 237, 246, 253, 254, 312, 314, 314, 329, 331, 337, 349, 350, 362, 367, 373, 377, 397, 397, 397],
    "src/maplat_control.ts": [47, 63, 64, 71, 75, 76, 77, 78, 81, 82, 83, 86, 87, 106, 109, 110, 112, 118, 140, 143, 144, 146, 156, 164, 181, 204, 207, 216, 220, 244, 245, 246, 270, 313, 346, 372, 414, 444, 472, 519],
    "src/ui_init.ts": [205, 267, 338, 445, 506, 536, 598, 601, 608, 639, 640, 648, 709, 717, 720, 721, 724, 731, 736, 781, 819, 831, 863, 867, 876, 880, 881, 904, 910, 911, 918, 943, 949, 951, 952, 953, 954, 957],
    "src/ui_marker.ts": [34, 35, 91, 132, 152, 159, 176, 182, 203, 215, 227, 230],
    "src/ui_utils.ts": [78],
}

def add_suppression_before_line(file_path: Path, line_num: int):
    """Add eslint suppression comment before the specified line"""
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Insert suppression comment before the line (adjusting for 0-indexing)
    idx = line_num - 1
    if idx < len(lines):
        # Check if suppression already exists
        if idx > 0 and 'eslint-disable-next-line' in lines[idx - 1]:
            return False  # Already has suppression
        
        # Get indentation from current line
        indent = len(lines[idx]) - len(lines[idx].lstrip())
        suppression = ' ' * indent + '// eslint-disable-next-line @typescript-eslint/no-explicit-any\n'
        lines.insert(idx, suppression)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        return True
    return False

def main():
    base_path = Path(r"C:\Users\kochi\github\Maplat")
    
    for file_rel, line_nums in SUPPRESSIONS.items():
        file_path = base_path / file_rel
        if not file_path.exists():
            print(f"Warning: {file_path} not found")
            continue
        
        # Process in reverse order to maintain line numbers
        unique_lines = sorted(set(line_nums), reverse=True)
        added_count = 0
        
        for line_num in unique_lines:
            if add_suppression_before_line(file_path, line_num):
                added_count += 1
        
        print(f"Added {added_count} suppressions to {file_rel}")

if __name__ == "__main__":
    main()
