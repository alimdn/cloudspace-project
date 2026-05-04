#!/usr/bin/env python3
"""
Batch Fix - Fix common file issues across multiple files in a directory.
"""

import sys
import os
import re
import argparse
from pathlib import Path


def fix_encoding(directory, to_encoding='utf-8', pattern='*', dry_run=False):
    """Fix encoding for all matching files in a directory."""
    directory = Path(directory)
    fixed = []
    errors = []

    for filepath in directory.rglob(pattern):
        if not filepath.is_file():
            continue

        # Detect current encoding
        try:
            import subprocess
            result = subprocess.run(['file', '-bi', str(filepath)],
                                    capture_output=True, text=True, timeout=5)
            output = result.stdout.strip()
            current_enc = 'unknown'
            if 'charset=' in output:
                current_enc = output.split('charset=')[1].strip().rstrip(';')

            if current_enc.upper() in ('UTF-8', 'ASCII', 'US-ASCII', 'UNKNOWN'):
                continue

            if dry_run:
                print(f"[DRY RUN] Would convert: {filepath} ({current_enc} -> {to_encoding})")
                fixed.append(str(filepath))
            else:
                try:
                    with open(filepath, 'r', encoding=current_enc, errors='replace') as f:
                        content = f.read()
                    with open(filepath, 'w', encoding=to_encoding) as f:
                        f.write(content)
                    print(f"[Fixed] {filepath} ({current_enc} -> {to_encoding})")
                    fixed.append(str(filepath))
                except Exception as e:
                    errors.append(f"{filepath}: {e}")
                    print(f"[Error] {filepath}: {e}")
        except Exception as e:
            errors.append(f"{filepath}: detection failed: {e}")

    print(f"\n{'Would fix' if dry_run else 'Fixed'}: {len(fixed)} files")
    if errors:
        print(f"Errors: {len(errors)}")


def fix_endings(directory, to='lf', pattern='*', dry_run=False):
    """Fix line endings for all matching files in a directory."""
    directory = Path(directory)
    fixed = []
    errors = []

    for filepath in directory.rglob(pattern):
        if not filepath.is_file():
            continue

        try:
            with open(filepath, 'rb') as f:
                content = f.read()

            if to == 'lf':
                if b'\r\n' not in content:
                    continue
                new_content = content.replace(b'\r\n', b'\n')
                label = 'CRLF -> LF'
            elif to == 'crlf':
                # First normalize to LF, then convert to CRLF
                normalized = content.replace(b'\r\n', b'\n')
                new_content = normalized.replace(b'\n', b'\r\n')
                label = 'LF -> CRLF'
            else:
                continue

            if new_content == content:
                continue

            if dry_run:
                print(f"[DRY RUN] Would convert: {filepath} ({label})")
                fixed.append(str(filepath))
            else:
                with open(filepath, 'wb') as f:
                    f.write(new_content)
                print(f"[Fixed] {filepath} ({label})")
                fixed.append(str(filepath))
        except Exception as e:
            errors.append(f"{filepath}: {e}")
            print(f"[Error] {filepath}: {e}")

    print(f"\n{'Would fix' if dry_run else 'Fixed'}: {len(fixed)} files")
    if errors:
        print(f"Errors: {len(errors)}")


def remove_bom(directory, pattern='*', dry_run=False):
    """Remove UTF-8 BOM from all matching files."""
    directory = Path(directory)
    fixed = []
    errors = []

    for filepath in directory.rglob(pattern):
        if not filepath.is_file():
            continue

        try:
            with open(filepath, 'rb') as f:
                content = f.read()

            if not content.startswith(b'\xef\xbb\xbf'):
                continue

            new_content = content[3:]

            if dry_run:
                print(f"[DRY RUN] Would remove BOM from: {filepath}")
                fixed.append(str(filepath))
            else:
                with open(filepath, 'wb') as f:
                    f.write(new_content)
                print(f"[Fixed] Removed BOM from: {filepath}")
                fixed.append(str(filepath))
        except Exception as e:
            errors.append(f"{filepath}: {e}")
            print(f"[Error] {filepath}: {e}")

    print(f"\n{'Would fix' if dry_run else 'Fixed'}: {len(fixed)} files")
    if errors:
        print(f"Errors: {len(errors)}")


def main():
    parser = argparse.ArgumentParser(description='Batch Fix - Fix file issues across multiple files')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # encoding
    enc_parser = subparsers.add_parser('encoding', help='Fix file encoding')
    enc_parser.add_argument('directory', help='Directory to process')
    enc_parser.add_argument('--to', default='utf-8', help='Target encoding (default: utf-8)')
    enc_parser.add_argument('--pattern', default='*', help='File pattern to match (default: *)')
    enc_parser.add_argument('--dry-run', action='store_true', help='Preview changes')

    # endings
    end_parser = subparsers.add_parser('endings', help='Fix line endings')
    end_parser.add_argument('directory', help='Directory to process')
    end_parser.add_argument('--to', default='lf', choices=['lf', 'crlf'],
                           help='Target line ending (default: lf)')
    end_parser.add_argument('--pattern', default='*', help='File pattern to match (default: *)')
    end_parser.add_argument('--dry-run', action='store_true', help='Preview changes')

    # remove-bom
    bom_parser = subparsers.add_parser('remove-bom', help='Remove UTF-8 BOM')
    bom_parser.add_argument('directory', help='Directory to process')
    bom_parser.add_argument('--pattern', default='*', help='File pattern to match (default: *)')
    bom_parser.add_argument('--dry-run', action='store_true', help='Preview changes')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    if args.command == 'encoding':
        fix_encoding(args.directory, args.to, args.pattern, args.dry_run)
    elif args.command == 'endings':
        fix_endings(args.directory, args.to, args.pattern, args.dry_run)
    elif args.command == 'remove-bom':
        remove_bom(args.directory, args.pattern, args.dry_run)


if __name__ == '__main__':
    main()
