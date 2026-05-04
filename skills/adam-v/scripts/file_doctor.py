#!/usr/bin/env python3
"""
File Doctor - Automated file diagnostics and repair tool.
Supports multiple file types: code, config, data, and text files.
"""

import sys
import os
import json
import csv
import re
import argparse
import subprocess
from pathlib import Path
from datetime import datetime


class FileDoctor:
    """Diagnoses and fixes common file errors."""

    def __init__(self):
        self.errors = []
        self.warnings = []
        self.info = []

    def diagnose(self, filepath):
        """Run full diagnostic on a file."""
        filepath = Path(filepath)
        if not filepath.exists():
            print(f"Error: File not found: {filepath}")
            return None

        print(f"\n--- File Doctor Report ---")
        print(f"File: {filepath}")
        print(f"Size: {self._human_size(filepath.stat().st_size)}")
        print(f"Modified: {datetime.fromtimestamp(filepath.stat().st_mtime).isoformat()}")

        # Detect encoding
        encoding = self._detect_encoding(filepath)
        print(f"Encoding: {encoding}")

        # Detect line endings
        line_endings = self._detect_line_endings(filepath)
        print(f"Line Endings: {line_endings}")

        # Check for BOM
        has_bom = self._check_bom(filepath)
        if has_bom:
            self.warnings.append(("BOM", "File starts with UTF-8 BOM (EF BB BF). "
                                  "This can cause parsing errors in some tools."))

        # Detect file type and run specific checks
        ext = filepath.suffix.lower()
        file_type = self._get_file_type(ext)

        print(f"Type: {file_type}")

        # Read file content
        try:
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
        except Exception as e:
            self.errors.append(("Read", f"Cannot read file: {e}"))
            self._print_report()
            return self._build_result(filepath, encoding, line_endings, content if 'content' in dir() else "")

        lines = content.split('\n')
        print(f"Lines: {len(lines)}")

        # Run type-specific checks
        if ext in ('.json',):
            self._check_json(filepath, content)
        elif ext in ('.yaml', '.yml'):
            self._check_yaml(filepath, content)
        elif ext in ('.xml',):
            self._check_xml(filepath)
        elif ext in ('.csv',):
            self._check_csv(filepath, content)
        elif ext in ('.py',):
            self._check_python(filepath, content)
        elif ext in ('.js', '.jsx', '.ts', '.tsx'):
            self._check_javascript(filepath, ext)
        elif ext in ('.html', '.htm'):
            self._check_html(content)
        elif ext in ('.css', '.scss', '.less'):
            self._check_css(content)
        elif ext in ('.sh', '.bash'):
            self._check_shell(filepath)
        elif ext in ('.log',):
            self._check_log(content)
        elif ext in ('.ini', '.cfg', '.conf'):
            self._check_ini(content)
        elif ext in ('.env',):
            self._check_env(content)
        elif ext in ('.toml',):
            self._check_toml(filepath, content)
        elif ext in ('.md',):
            self._check_markdown(content)

        # General checks
        self._check_general(filepath, content, lines)

        # Print report
        self._print_report()

        return self._build_result(filepath, encoding, line_endings, content)

    def fix(self, filepath, dry_run=False):
        """Auto-fix common issues in a file."""
        filepath = Path(filepath)
        if not filepath.exists():
            print(f"Error: File not found: {filepath}")
            return

        if dry_run:
            print(f"\n--- Dry Run: Fix Preview for {filepath} ---")
        else:
            print(f"\n--- Fixing {filepath} ---")

        fixes_applied = []

        # Fix encoding to UTF-8
        encoding = self._detect_encoding(filepath)
        if encoding and encoding.upper() not in ('UTF-8', 'ASCII', 'US-ASCII'):
            if not dry_run:
                self._fix_encoding(filepath, 'utf-8')
            fixes_applied.append(f"Convert encoding from {encoding} to UTF-8")

        # Fix BOM
        if self._check_bom(filepath):
            if not dry_run:
                self._remove_bom(filepath)
            fixes_applied.append("Remove UTF-8 BOM")

        # Fix line endings to LF
        line_endings = self._detect_line_endings(filepath)
        if line_endings == 'CRLF':
            if not dry_run:
                self._fix_line_endings(filepath, 'lf')
            fixes_applied.append("Convert line endings from CRLF to LF")

        # Fix trailing whitespace
        try:
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            original = content
            content = re.sub(r'[ \t]+$', '', content, flags=re.MULTILINE)
            # Remove multiple trailing blank lines
            content = re.sub(r'\n{3,}', '\n\n', content)
            if content != original:
                if not dry_run:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                fixes_applied.append("Remove trailing whitespace")
        except Exception:
            pass

        # JSON-specific fix
        if filepath.suffix.lower() == '.json':
            result = self._try_fix_json(filepath, content if 'content' in dir() else None, dry_run)
            if result:
                fixes_applied.append(result)

        # YAML-specific fix
        if filepath.suffix.lower() in ('.yaml', '.yml'):
            result = self._try_fix_yaml(filepath, content if 'content' in dir() else None, dry_run)
            if result:
                fixes_applied.append(result)

        if not fixes_applied:
            print("No issues found that can be auto-fixed.")
        else:
            for i, fix in enumerate(fixes_applied, 1):
                prefix = "[Would fix]" if dry_run else "[Fixed]"
                print(f"  {i}. {prefix} {fix}")

        if not dry_run and fixes_applied:
            # Verify the fix
            print("\nVerification:")
            result = self.diagnose(filepath)

    def scan(self, directory):
        """Scan a directory for potentially problematic files."""
        directory = Path(directory)
        if not directory.is_dir():
            print(f"Error: Not a directory: {directory}")
            return

        print(f"\n--- Scanning {directory} for issues ---\n")

        issues_found = {}
        total_files = 0

        for filepath in sorted(directory.rglob('*')):
            if not filepath.is_file():
                continue

            # Skip binary and very large files
            if filepath.stat().st_size > 10 * 1024 * 1024:  # 10MB
                continue

            # Skip common binary extensions
            binary_exts = {'.png', '.jpg', '.jpeg', '.gif', '.bmp', '.ico', '.zip', '.tar',
                          '.gz', '.rar', '.7z', '.exe', '.dll', '.so', '.dylib', '.bin',
                          '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
                          '.woff', '.woff2', '.ttf', '.eot', '.mp3', '.mp4', '.avi', '.mov'}
            if filepath.suffix.lower() in binary_exts:
                continue

            total_files += 1
            file_issues = []

            # Quick checks
            encoding = self._detect_encoding(filepath)
            if encoding and encoding.upper() not in ('UTF-8', 'ASCII', 'US-ASCII'):
                file_issues.append(f"Non-UTF-8 encoding: {encoding}")

            if self._check_bom(filepath):
                file_issues.append("Has BOM")

            line_endings = self._detect_line_endings(filepath)
            if line_endings == 'Mixed':
                file_issues.append("Mixed line endings (CRLF + LF)")

            # Type-specific quick check
            ext = filepath.suffix.lower()
            if ext == '.json':
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        json.load(f)
                except Exception as e:
                    file_issues.append(f"JSON parse error: {e}")
            elif ext in ('.yaml', '.yml'):
                try:
                    import yaml
                    with open(filepath, 'r', encoding='utf-8') as f:
                        yaml.safe_load(f)
                except Exception as e:
                    file_issues.append(f"YAML parse error: {e}")
            elif ext == '.py':
                try:
                    result = subprocess.run(
                        ['python3', '-c', f'import ast; ast.parse(open("{filepath}").read())'],
                        capture_output=True, text=True, timeout=10
                    )
                    if result.returncode != 0:
                        file_issues.append(f"Python syntax error")
                except Exception:
                    pass
            elif ext in ('.js', '.jsx', '.ts', '.tsx'):
                try:
                    result = subprocess.run(
                        ['node', '--check', str(filepath)],
                        capture_output=True, text=True, timeout=10
                    )
                    if result.returncode != 0:
                        file_issues.append(f"JavaScript syntax error")
                except Exception:
                    pass
            elif ext == '.sh' or filepath.name.endswith('.bash'):
                try:
                    result = subprocess.run(
                        ['bash', '-n', str(filepath)],
                        capture_output=True, text=True, timeout=10
                    )
                    if result.returncode != 0:
                        file_issues.append(f"Shell syntax error")
                except Exception:
                    pass

            if file_issues:
                issues_found[str(filepath)] = file_issues

        print(f"Scanned: {total_files} files")
        print(f"Files with issues: {len(issues_found)}")

        if issues_found:
            print("\n--- Issues Found ---")
            for fpath, issues in sorted(issues_found.items()):
                print(f"\n  {fpath}")
                for issue in issues:
                    print(f"    - {issue}")

    def fix_encoding(self, filepath, to_encoding='utf-8'):
        """Convert file encoding."""
        filepath = Path(filepath)
        from_enc = self._detect_encoding(filepath)
        if not from_enc or from_enc.upper() in ('UTF-8', 'ASCII', 'US-ASCII'):
            print(f"File is already {from_enc or 'UTF-8'}. No conversion needed.")
            return

        print(f"Converting {filepath} from {from_enc} to {to_encoding}...")
        try:
            with open(filepath, 'r', encoding=from_enc, errors='replace') as f:
                content = f.read()
            with open(filepath, 'w', encoding=to_encoding) as f:
                f.write(content)
            print(f"Done. Encoding converted successfully.")
        except Exception as e:
            print(f"Error: Failed to convert encoding: {e}")

    def fix_endings(self, filepath, to='lf'):
        """Convert line endings."""
        filepath = Path(filepath)
        current = self._detect_line_endings(filepath)
        if current == to.upper():
            print(f"File already uses {to.upper()} line endings.")
            return

        print(f"Converting line endings from {current} to {to.upper()}...")
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            if to == 'lf':
                content = content.replace(b'\r\n', b'\n')
            elif to == 'crlf':
                content = content.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n')
            with open(filepath, 'wb') as f:
                f.write(content)
            print(f"Done. Line endings converted to {to.upper()}.")
        except Exception as e:
            print(f"Error: Failed to convert line endings: {e}")

    def validate(self, filepath):
        """Validate file format."""
        filepath = Path(filepath)
        ext = filepath.suffix.lower()

        validators = {
            '.json': self._validate_json,
            '.yaml': self._validate_yaml,
            '.yml': self._validate_yaml,
            '.xml': self._validate_xml,
            '.csv': self._validate_csv,
            '.py': self._validate_python,
            '.html': self._validate_html,
            '.css': self._validate_css,
            '.sh': self._validate_shell,
            '.toml': self._validate_toml,
        }

        validator = validators.get(ext)
        if validator:
            is_valid, message = validator(filepath)
            status = "VALID" if is_valid else "INVALID"
            print(f"{filepath}: {status} - {message}")
            return is_valid
        else:
            print(f"No validator available for {ext} files.")
            return None

    # --- File type specific checks ---

    def _check_json(self, filepath, content):
        """Check JSON file for errors."""
        try:
            json.loads(content)
        except json.JSONDecodeError as e:
            self.errors.append(("JSON Syntax", f"Line {e.lineno}, Column {e.colno}: {e.msg}"))

            # Provide helpful hints
            if 'Expecting property name' in e.msg:
                self.info.append(("JSON Hint", "Check for trailing commas before closing braces/brackets."))
            if 'Expecting \',\'' in e.msg or 'Expecting \'}\'' in e.msg:
                self.info.append(("JSON Hint", "Check for missing commas between key-value pairs."))

        # Additional checks
        if "'" in content:
            count = content.count("'")
            if count > 0 and count % 2 == 0:
                # Might be using single quotes
                self.warnings.append(("JSON Style", "File contains single quotes. JSON requires double quotes."))

    def _check_yaml(self, filepath, content):
        """Check YAML file for errors."""
        try:
            import yaml
            yaml.safe_load(content)
        except ImportError:
            self.info.append(("YAML", "PyYAML not installed. Install with: pip install pyyaml"))
            return
        except yaml.YAMLError as e:
            if hasattr(e, 'problem_mark'):
                mark = e.problem_mark
                self.errors.append(("YAML Syntax",
                                    f"Line {mark.line + 1}, Column {mark.column + 1}: {e.problem}"))
            else:
                self.errors.append(("YAML Syntax", str(e)))

        # Check for tabs (YAML doesn't allow tabs)
        if '\t' in content:
            line_num = content[:content.index('\t')].count('\n') + 1
            self.errors.append(("YAML Tabs", f"Line {line_num}: Tab character found. "
                                "YAML does not allow tabs for indentation. Use spaces only."))

    def _check_xml(self, filepath):
        """Check XML file for errors."""
        try:
            import xml.etree.ElementTree as ET
            ET.parse(filepath)
        except xml.etree.ElementTree.ParseError as e:
            self.errors.append(("XML Syntax", str(e)))

    def _check_csv(self, filepath, content):
        """Check CSV file for errors."""
        try:
            reader = csv.reader(content.split('\n'))
            row_lengths = [len(row) for row in reader if row]
            if len(set(row_lengths)) > 1:
                self.warnings.append(("CSV Inconsistent",
                                     f"Inconsistent column count. "
                                     f"Found row lengths: {set(row_lengths)}"))
        except Exception as e:
            self.errors.append(("CSV Parse", str(e)))

    def _check_python(self, filepath, content):
        """Check Python file for errors."""
        # Syntax check
        result = subprocess.run(
            ['python3', '-c', f'import ast; ast.parse(open("{filepath}").read())'],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode != 0:
            stderr = result.stderr.strip()
            # Extract line number from error
            match = re.search(r'line (\d+)', stderr)
            line_num = match.group(1) if match else "?"
            error_msg = stderr.split('\n')[-1] if stderr else "Unknown syntax error"
            self.errors.append(("Python Syntax", f"Line {line_num}: {error_msg}"))

        # Check for mixed indentation
        lines = content.split('\n')
        has_tabs = any('\t' in line for line in lines)
        has_spaces = any(line.startswith('    ') for line in lines)
        if has_tabs and has_spaces:
            self.warnings.append(("Python Indentation",
                                 "File uses both tabs and spaces for indentation. "
                                 "This can cause IndentationError."))

        # Check for encoding declaration
        if content and not content.startswith('#') and not any(
            keyword in content[:200] for keyword in ['# -*- coding', '# coding:', '#!']
        ):
            if any(ord(c) > 127 for c in content):
                self.info.append(("Python Encoding",
                                 "File contains non-ASCII characters but no encoding declaration. "
                                 "Consider adding: # -*- coding: utf-8 -*-"))

    def _check_javascript(self, filepath, ext):
        """Check JavaScript/TypeScript file for errors."""
        if ext in ('.ts', '.tsx'):
            # Try TypeScript check
            result = subprocess.run(
                ['npx', 'tsc', '--noEmit', '--strict', str(filepath)],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode != 0:
                stderr = result.stderr.strip()
                # Parse TypeScript errors
                for line in stderr.split('\n'):
                    match = re.search(r'\((\d+),(\d+)\):\s*(.+)', line)
                    if match:
                        self.errors.append(("TypeScript", f"Line {match.group(1)}, "
                                            f"Col {match.group(2)}: {match.group(3)}"))
                if not self.errors:
                    self.warnings.append(("TypeScript", f"Type check issues found: {stderr[:200]}"))
            return

        # JavaScript check
        result = subprocess.run(
            ['node', '--check', str(filepath)],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode != 0:
            stderr = result.stderr.strip()
            match = re.search(r'\((\d+):(\d+)\)', stderr)
            if match:
                self.errors.append(("JavaScript", f"Line {match.group(1)}, "
                                    f"Col {match.group(2)}: {stderr}"))
            else:
                self.errors.append(("JavaScript", stderr))

    def _check_html(self, content):
        """Check HTML file for common errors."""
        # Check for unclosed tags
        open_tags = re.findall(r'<(\w+)[^>]*>(?!.*</\1>)', content, re.DOTALL)
        # Simple check - just look for basic structural issues
        if '<html' in content.lower() and '</html>' not in content.lower():
            self.errors.append(("HTML Structure", "Missing closing </html> tag"))
        if '<head' in content.lower() and '</head>' not in content.lower():
            self.errors.append(("HTML Structure", "Missing closing </head> tag"))
        if '<body' in content.lower() and '</body>' not in content.lower():
            self.errors.append(("HTML Structure", "Missing closing </body> tag"))

        # Check for unclosed script/style tags
        for tag in ['script', 'style']:
            opens = len(re.findall(rf'<{tag}', content, re.IGNORECASE))
            closes = len(re.findall(rf'</{tag}', content, re.IGNORECASE))
            if opens != closes:
                self.errors.append(("HTML Structure",
                                    f"Mismatched <{tag}> tags: {opens} opening, {closes} closing"))

    def _check_css(self, content):
        """Check CSS file for common errors."""
        # Count braces
        open_braces = content.count('{')
        close_braces = content.count('}')
        if open_braces != close_braces:
            self.errors.append(("CSS Structure",
                                f"Mismatched braces: {open_braces} opening '{{', "
                                f"{close_braces} closing '}}'"))

        # Check for missing semicolons (basic heuristic)
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if stripped and not stripped.endswith('{') and not stripped.endswith('}') \
               and not stripped.endswith(';') and not stripped.endswith(',') \
               and not stripped.startswith('/*') and not stripped.startswith('*') \
               and not stripped.startswith('//') and ':' in stripped:
                self.warnings.append(("CSS Semicolon",
                                     f"Line {i}: Possible missing semicolon at end of declaration"))

    def _check_shell(self, filepath):
        """Check shell script for errors."""
        result = subprocess.run(
            ['bash', '-n', str(filepath)],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode != 0:
            stderr = result.stderr.strip()
            self.errors.append(("Shell Syntax", stderr))

        # Check for shebang
        try:
            with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
                first_line = f.readline()
            if not first_line.startswith('#!'):
                self.info.append(("Shell Shebang", "Missing shebang line. "
                                 "Consider adding: #!/bin/bash or #!/bin/sh"))
        except Exception:
            pass

        # Check for Windows line endings (common issue)
        line_endings = self._detect_line_endings(filepath)
        if line_endings == 'CRLF':
            self.errors.append(("Shell Line Endings",
                                "Shell scripts with CRLF line endings often fail. "
                                "Convert to LF (Unix) line endings."))

    def _check_log(self, content):
        """Analyze log file for errors and patterns."""
        lines = content.split('\n')
        errors = []
        warnings = []
        fatals = []

        for i, line in enumerate(lines):
            upper = line.upper()
            if 'FATAL' in upper:
                fatals.append(i + 1)
            elif 'ERROR' in upper or 'EXCEPTION' in upper or 'TRACEBACK' in upper:
                errors.append(i + 1)
            elif 'WARNING' in upper or 'WARN' in upper:
                warnings.append(i + 1)

        if fatals:
            self.errors.append(("Log Fatal", f"Found {len(fatals)} FATAL error(s) at lines: "
                                f"{fatals[:10]}{'...' if len(fatals) > 10 else ''}"))
        if errors:
            self.errors.append(("Log Errors", f"Found {len(errors)} error(s) at lines: "
                                f"{errors[:10]}{'...' if len(errors) > 10 else ''}"))
        if warnings:
            self.warnings.append(("Log Warnings", f"Found {len(warnings)} warning(s) at lines: "
                                  f"{warnings[:10]}{'...' if len(warnings) > 10 else ''}"))

        if not fatals and not errors and not warnings:
            self.info.append(("Log", "No errors, warnings, or fatal messages found in log file."))

    def _check_ini(self, content):
        """Check INI/config file for errors."""
        lines = content.split('\n')
        in_section = False
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if not stripped or stripped.startswith('#') or stripped.startswith(';'):
                continue
            if stripped.startswith('[') and stripped.endswith(']'):
                in_section = True
                continue
            if '=' not in stripped and ':' not in stripped:
                self.warnings.append(("INI Format",
                                     f"Line {i}: Expected key=value pair, found: {stripped[:50]}"))

    def _check_env(self, content):
        """Check .env file for errors."""
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if not stripped or stripped.startswith('#'):
                continue
            if '=' not in stripped:
                self.errors.append(("ENV Format",
                                    f"Line {i}: Invalid .env format (missing '='): {stripped[:50]}"))
                continue
            key, _, value = stripped.partition('=')
            if not key.strip():
                self.errors.append(("ENV Format",
                                    f"Line {i}: Empty key name"))
            # Check for unquoted special characters
            if value and not value.strip().startswith(('"', "'")):
                if any(c in value for c in (' ', '#', '$', '&', '|', '>', '<', '(', ')')):
                    self.warnings.append(("ENV Quoting",
                                         f"Line {i}: Value contains special characters and is not quoted. "
                                         f"This may cause unexpected behavior."))

    def _check_toml(self, filepath, content):
        """Check TOML file for errors."""
        try:
            import tomllib
            tomllib.loads(content)
        except ImportError:
            try:
                import tomli
                tomli.loads(content)
            except ImportError:
                try:
                    import toml
                    toml.loads(content)
                except ImportError:
                    self.info.append(("TOML", "No TOML parser installed. "
                                     "Install with: pip install tomli"))
                    return
                except Exception as e:
                    self.errors.append(("TOML Syntax", str(e)))
                return
        except Exception as e:
            self.errors.append(("TOML Syntax", str(e)))

    def _check_markdown(self, content):
        """Check Markdown file for common issues."""
        # Check for unclosed code blocks
        code_block_count = content.count('```')
        if code_block_count % 2 != 0:
            self.errors.append(("Markdown", "Unclosed code block (odd number of ``` markers)"))

        # Check for broken links (basic)
        broken_links = re.findall(r'\[([^\]]+)\]\((?!http|#)([^)]+)\)', content)
        if broken_links:
            self.warnings.append(("Markdown Links",
                                 f"Found {len(broken_links)} relative link(s) that may be broken"))

        # Check heading levels
        headings = re.findall(r'^(#{1,6})\s', content, re.MULTILINE)
        if headings and not headings[0] == '#':
            self.info.append(("Markdown", "Document doesn't start with an H1 heading (#)"))

    def _check_general(self, filepath, content, lines):
        """General checks applicable to all file types."""
        # Trailing whitespace
        trailing_lines = []
        for i, line in enumerate(lines, 1):
            if line != line.rstrip():
                trailing_lines.append(i)
        if trailing_lines:
            count = len(trailing_lines)
            show = trailing_lines[:5]
            extra = f" (and {count - 5} more)" if count > 5 else ""
            self.info.append(("Trailing Whitespace",
                             f"{count} line(s) with trailing whitespace: {show}{extra}"))

        # Multiple trailing blank lines
        if content.endswith('\n\n\n'):
            self.info.append(("Trailing Blank Lines", "File ends with multiple blank lines"))

        # Very long lines
        long_lines = [(i + 1, len(line)) for i, line in enumerate(lines) if len(line) > 200]
        if long_lines:
            self.info.append(("Long Lines",
                             f"{len(long_lines)} line(s) longer than 200 characters"))

    # --- Fix helpers ---

    def _try_fix_json(self, filepath, content, dry_run):
        """Try to fix common JSON issues."""
        try:
            json.loads(content)
            return None  # Already valid
        except json.JSONDecodeError:
            # Try common fixes
            fixed = content
            # Remove BOM
            fixed = fixed.lstrip('\ufeff')
            # Replace single quotes with double quotes (naive but helps sometimes)
            # Actually, let's not do this automatically as it can break string content
            try:
                json.loads(fixed)
                if not dry_run:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(fixed)
                return "Fixed JSON by removing BOM"
            except json.JSONDecodeError:
                return None  # Can't auto-fix

    def _try_fix_yaml(self, filepath, content, dry_run):
        """Try to fix common YAML issues."""
        # Fix tabs to spaces
        if '\t' in content:
            fixed = content.replace('\t', '  ')
            try:
                import yaml
                yaml.safe_load(fixed)
                if not dry_run:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(fixed)
                return "Fixed YAML by replacing tabs with spaces"
            except Exception:
                pass
        return None

    # --- Utility methods ---

    def _detect_encoding(self, filepath):
        """Detect file encoding using file command."""
        try:
            result = subprocess.run(['file', '-bi', str(filepath)],
                                    capture_output=True, text=True, timeout=5)
            output = result.stdout.strip()
            if 'charset=' in output:
                return output.split('charset=')[1].strip().rstrip(';')
            return "unknown"
        except Exception:
            return "unknown"

    def _detect_line_endings(self, filepath):
        """Detect line ending type."""
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            if b'\r\n' in content and b'\n' in content:
                # Check if there are bare \n too
                stripped = content.replace(b'\r\n', b'')
                if b'\n' in stripped:
                    return 'Mixed'
                return 'CRLF'
            elif b'\r\n' in content:
                return 'CRLF'
            elif b'\n' in content:
                return 'LF'
            elif b'\r' in content:
                return 'CR'
            else:
                return 'None (single line or empty)'
        except Exception:
            return 'Unknown'

    def _check_bom(self, filepath):
        """Check if file has UTF-8 BOM."""
        try:
            with open(filepath, 'rb') as f:
                header = f.read(3)
            return header == b'\xef\xbb\xbf'
        except Exception:
            return False

    def _remove_bom(self, filepath):
        """Remove UTF-8 BOM from file."""
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            if content.startswith(b'\xef\xbb\xbf'):
                content = content[3:]
                with open(filepath, 'wb') as f:
                    f.write(content)
        except Exception as e:
            print(f"Error removing BOM: {e}")

    def _fix_encoding(self, filepath, to_encoding):
        """Fix file encoding."""
        from_enc = self._detect_encoding(filepath)
        try:
            with open(filepath, 'r', encoding=from_enc, errors='replace') as f:
                content = f.read()
            with open(filepath, 'w', encoding=to_encoding) as f:
                f.write(content)
        except Exception as e:
            print(f"Error fixing encoding: {e}")

    def _fix_line_endings(self, filepath, to):
        """Fix line endings."""
        try:
            with open(filepath, 'rb') as f:
                content = f.read()
            if to == 'lf':
                content = content.replace(b'\r\n', b'\n')
            elif to == 'crlf':
                content = content.replace(b'\r\n', b'\n').replace(b'\n', b'\r\n')
            with open(filepath, 'wb') as f:
                f.write(content)
        except Exception as e:
            print(f"Error fixing line endings: {e}")

    def _get_file_type(self, ext):
        """Get human-readable file type from extension."""
        types = {
            '.py': 'Python', '.js': 'JavaScript', '.ts': 'TypeScript',
            '.jsx': 'React JSX', '.tsx': 'React TSX', '.html': 'HTML',
            '.css': 'CSS', '.scss': 'SCSS', '.less': 'LESS',
            '.json': 'JSON', '.yaml': 'YAML', '.yml': 'YAML',
            '.xml': 'XML', '.csv': 'CSV', '.tsv': 'TSV',
            '.md': 'Markdown', '.txt': 'Plain Text', '.log': 'Log File',
            '.ini': 'INI Config', '.cfg': 'Config', '.conf': 'Config',
            '.env': 'Environment', '.toml': 'TOML',
            '.sh': 'Shell Script', '.bash': 'Bash Script',
            '.java': 'Java', '.cpp': 'C++', '.c': 'C',
            '.go': 'Go', '.rb': 'Ruby', '.php': 'PHP',
        }
        return types.get(ext, ext.upper() if ext else 'Unknown')

    def _human_size(self, size):
        """Convert bytes to human-readable size."""
        for unit in ('B', 'KB', 'MB', 'GB'):
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} TB"

    def _print_report(self):
        """Print the diagnostic report."""
        total = len(self.errors) + len(self.warnings) + len(self.info)

        print(f"\nSummary: {len(self.errors)} Critical | {len(self.warnings)} Warnings | "
              f"{len(self.info)} Info")

        if not total:
            print("\nNo issues found. File looks healthy!")

        if self.errors:
            print("\n[CRITICAL]")
            for category, message in self.errors:
                print(f"  - {category}: {message}")

        if self.warnings:
            print("\n[WARNING]")
            for category, message in self.warnings:
                print(f"  - {category}: {message}")

        if self.info:
            print("\n[INFO]")
            for category, message in self.info:
                print(f"  - {category}: {message}")

        print()

    def _build_result(self, filepath, encoding, line_endings, content):
        """Build a result dictionary."""
        return {
            'filepath': str(filepath),
            'encoding': encoding,
            'line_endings': line_endings,
            'errors': self.errors,
            'warnings': self.warnings,
            'info': self.info,
        }

    # --- Validators (return is_valid, message) ---

    def _validate_json(self, filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                json.load(f)
            return True, "Valid JSON"
        except Exception as e:
            return False, str(e)

    def _validate_yaml(self, filepath):
        try:
            import yaml
            with open(filepath, 'r', encoding='utf-8') as f:
                yaml.safe_load(f)
            return True, "Valid YAML"
        except ImportError:
            return None, "PyYAML not installed"
        except Exception as e:
            return False, str(e)

    def _validate_xml(self, filepath):
        try:
            import xml.etree.ElementTree as ET
            ET.parse(filepath)
            return True, "Valid XML"
        except Exception as e:
            return False, str(e)

    def _validate_csv(self, filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                rows = list(reader)
            if not rows:
                return True, "Empty CSV (valid)"
            lengths = set(len(r) for r in rows)
            if len(lengths) == 1:
                return True, f"Valid CSV ({len(rows)} rows, {lengths.pop()} columns)"
            return False, f"Inconsistent column counts: {lengths}"
        except Exception as e:
            return False, str(e)

    def _validate_python(self, filepath):
        result = subprocess.run(
            ['python3', '-c', f'import ast; ast.parse(open("{filepath}").read())'],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            return True, "Valid Python syntax"
        return False, result.stderr.strip()

    def _validate_html(self, filepath):
        try:
            from html.parser import HTMLParser
            parser = HTMLParser()
            with open(filepath, 'r', encoding='utf-8') as f:
                parser.feed(f.read())
            return True, "Basic HTML parse OK"
        except Exception as e:
            return False, str(e)

    def _validate_css(self, filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            if content.count('{') == content.count('}'):
                return True, "Balanced braces"
            return False, f"Unbalanced braces: {content.count('{')} open, {content.count('}')} close"
        except Exception as e:
            return False, str(e)

    def _validate_shell(self, filepath):
        result = subprocess.run(
            ['bash', '-n', str(filepath)],
            capture_output=True, text=True, timeout=10
        )
        if result.returncode == 0:
            return True, "Valid shell script syntax"
        return False, result.stderr.strip()

    def _validate_toml(self, filepath):
        try:
            import tomllib
            with open(filepath, 'rb') as f:
                tomllib.load(f)
            return True, "Valid TOML"
        except ImportError:
            try:
                import tomli
                with open(filepath, 'r', encoding='utf-8') as f:
                    tomli.loads(f.read())
                return True, "Valid TOML"
            except ImportError:
                return None, "No TOML parser available"
            except Exception as e:
                return False, str(e)
        except Exception as e:
            return False, str(e)


def main():
    parser = argparse.ArgumentParser(description='File Doctor - Diagnose and fix file errors')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # diagnose
    diag_parser = subparsers.add_parser('diagnose', help='Diagnose file for errors')
    diag_parser.add_argument('filepath', help='Path to file to diagnose')

    # fix
    fix_parser = subparsers.add_parser('fix', help='Auto-fix common file issues')
    fix_parser.add_argument('filepath', help='Path to file to fix')
    fix_parser.add_argument('--dry-run', action='store_true', help='Preview fixes without applying')

    # scan
    scan_parser = subparsers.add_parser('scan', help='Scan directory for issues')
    scan_parser.add_argument('directory', help='Directory to scan')

    # fix-encoding
    enc_parser = subparsers.add_parser('fix-encoding', help='Fix file encoding')
    enc_parser.add_argument('filepath', help='Path to file')
    enc_parser.add_argument('--to', default='utf-8', help='Target encoding (default: utf-8)')

    # fix-endings
    end_parser = subparsers.add_parser('fix-endings', help='Fix line endings')
    end_parser.add_argument('filepath', help='Path to file')
    end_parser.add_argument('--to', default='lf', choices=['lf', 'crlf'],
                           help='Target line ending (default: lf)')

    # validate
    val_parser = subparsers.add_parser('validate', help='Validate file format')
    val_parser.add_argument('filepath', help='Path to file to validate')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    doctor = FileDoctor()

    if args.command == 'diagnose':
        doctor.diagnose(args.filepath)
    elif args.command == 'fix':
        doctor.fix(args.filepath, args.dry_run)
    elif args.command == 'scan':
        doctor.scan(args.directory)
    elif args.command == 'fix-encoding':
        doctor.fix_encoding(args.filepath, args.to)
    elif args.command == 'fix-endings':
        doctor.fix_endings(args.filepath, args.to)
    elif args.command == 'validate':
        doctor.validate(args.filepath)


if __name__ == '__main__':
    main()
