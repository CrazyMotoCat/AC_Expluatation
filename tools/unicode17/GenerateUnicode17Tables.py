#!/usr/bin/env python3
"""Generate the Assets Domain's pinned Unicode 17.0.0 name tables.

This script uses only the Python standard library. It downloads the final UCD
17.0.0 files (or reads them from --ucd-directory), verifies their SHA-256
hashes, then writes the deterministic U17N binary resource consumed by the
domain normalizer. It does not use the host's Unicode implementation.
"""

from __future__ import annotations

import argparse
import hashlib
import struct
import urllib.request
from pathlib import Path


VERSION = "17.0.0"
BASE_URL = f"https://www.unicode.org/Public/{VERSION}/ucd/"
PINNED_HASHES = {
    "UnicodeData.txt": "2e1efc1dcb59c575eedf5ccae60f95229f706ee6d031835247d843c11d96470c",
    "CaseFolding.txt": "ff8d8fefbf123574205085d6714c36149eb946d717a0c585c27f0f4ef58c4183",
    "DerivedNormalizationProps.txt": "71fd6a206a2c0cdd41feb6b7f656aa31091db45e9cedc926985d718397f9e488",
    "PropList.txt": "130dcddcaadaf071008bdfce1e7743e04fdfbc910886f017d9f9ac931d8c64dd",
    "ReadMe.txt": "9fe1a90bd32659d7953616283dc2bffaa165518aae9ace026040c42c559ba606",
}


def parse_range(text: str) -> tuple[int, int]:
    if ".." in text:
        start, end = text.split("..", 1)
        return int(start, 16), int(end, 16)
    value = int(text, 16)
    return value, value


def parse_property_file(path: Path, property_name: str) -> list[tuple[int, int]]:
    ranges = []
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if not line:
            continue
        code_range, name, *_ = (part.strip() for part in line.split(";"))
        if name == property_name:
            ranges.append(parse_range(code_range))
    return ranges


def merge_ranges(ranges: list[tuple[int, int]]) -> list[tuple[int, int]]:
    merged: list[list[int]] = []
    for start, end in sorted(ranges):
        if merged and start <= merged[-1][1] + 1:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return [(start, end) for start, end in merged]


def read_case_folding(path: Path) -> dict[int, tuple[int, ...]]:
    mappings: dict[int, tuple[int, ...]] = {}
    priorities: dict[int, int] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if not line:
            continue
        scalar, status, mapping, *_ = (part.strip() for part in line.split(";"))
        if status not in {"C", "F"}:
            continue
        codepoint = int(scalar, 16)
        priority = 2 if status == "F" else 1
        if priority >= priorities.get(codepoint, 0):
            mappings[codepoint] = tuple(int(value, 16) for value in mapping.split())
            priorities[codepoint] = priority
    return mappings


def load_ucd(directory: Path) -> dict[str, bytes]:
    result = {}
    for filename, expected_hash in PINNED_HASHES.items():
        path = directory / filename
        if not path.is_file():
            request = urllib.request.Request(
                BASE_URL + filename,
                headers={"User-Agent": "Assets-Unicode17-table-generator/1.0"},
            )
            with urllib.request.urlopen(request, timeout=60) as response:
                content = response.read()
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(content)
        else:
            content = path.read_bytes()
        actual_hash = hashlib.sha256(content).hexdigest()
        if actual_hash != expected_hash:
            raise ValueError(
                f"{filename} is not the pinned Unicode {VERSION} file: {actual_hash}"
            )
        result[filename] = content
    return result


def canonical_decompositions(path: Path) -> dict[int, tuple[int, ...]]:
    result = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        fields = raw_line.split(";")
        codepoint = int(fields[0], 16)
        decomposition = fields[5]
        if decomposition and not decomposition.startswith("<"):
            result[codepoint] = tuple(int(value, 16) for value in decomposition.split())
    return result


def combining_classes(path: Path) -> dict[int, int]:
    result = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        fields = raw_line.split(";")
        codepoint = int(fields[0], 16)
        combining_class = int(fields[3])
        if combining_class:
            result[codepoint] = combining_class
    return result


def full_composition_exclusions(path: Path) -> set[int]:
    result = set()
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.split("#", 1)[0].strip()
        if not line:
            continue
        code_range, property_name, *_ = (part.strip() for part in line.split(";"))
        if property_name == "Full_Composition_Exclusion":
            start, end = parse_range(code_range)
            result.update(range(start, end + 1))
    return result


def write_u16(output: bytearray, value: int) -> None:
    output.extend(struct.pack("<H", value))


def write_u32(output: bytearray, value: int) -> None:
    output.extend(struct.pack("<I", value))


def write_mappings(output: bytearray, mappings: dict[int, tuple[int, ...]]) -> None:
    write_u16(output, len(mappings))
    for codepoint, values in sorted(mappings.items()):
        if not values or len(values) > 255:
            raise ValueError(f"Invalid Unicode mapping for U+{codepoint:04X}")
        write_u32(output, codepoint)
        output.append(len(values))
        for value in values:
            write_u32(output, value)


def build_tables(directory: Path) -> tuple[bytes, dict[str, int]]:
    load_ucd(directory)
    decompositions = canonical_decompositions(directory / "UnicodeData.txt")
    classes = combining_classes(directory / "UnicodeData.txt")
    folds = read_case_folding(directory / "CaseFolding.txt")
    exclusions = full_composition_exclusions(directory / "DerivedNormalizationProps.txt")
    whitespace = merge_ranges(parse_property_file(directory / "PropList.txt", "White_Space"))
    compositions = {
        pair: composite
        for composite, pair in decompositions.items()
        if len(pair) == 2 and composite not in exclusions
    }

    output = bytearray(b"U17N")
    write_u16(output, 1)
    write_u16(output, len(whitespace))
    for start, end in whitespace:
        write_u32(output, start)
        write_u32(output, end)
    write_mappings(output, folds)
    write_mappings(output, decompositions)

    write_u16(output, len(classes))
    for codepoint, combining_class in sorted(classes.items()):
        write_u32(output, codepoint)
        output.append(combining_class)

    write_u16(output, len(compositions))
    for (first, second), composite in sorted(compositions.items()):
        write_u32(output, first)
        write_u32(output, second)
        write_u32(output, composite)

    stats = {
        "whitespace_scalars": sum(end - start + 1 for start, end in whitespace),
        "casefold_mappings": len(folds),
        "max_casefold_scalars": max(map(len, folds.values())),
        "canonical_decompositions": len(decompositions),
        "combining_classes": len(classes),
        "composition_pairs": len(compositions),
    }
    return bytes(output), stats


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--ucd-directory", type=Path)
    args = parser.parse_args()

    directory = args.ucd_directory or (args.output.parent / "ucd-source")
    tables, stats = build_tables(directory)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_bytes(tables)
    digest = hashlib.sha256(tables).hexdigest()
    print(f"Unicode {VERSION}: {stats}; bytes={len(tables)}; sha256={digest}")
    print(f"Wrote {args.output}")


if __name__ == "__main__":
    main()
