from __future__ import annotations

import argparse
import csv
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET


NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def column_index(cell_reference: str) -> int:
    letters = re.match(r"[A-Z]+", cell_reference).group(0)
    index = 0
    for char in letters:
        index = index * 26 + (ord(char) - ord("A") + 1)
    return index - 1


def load_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []

    values = []
    for item in root.findall("main:si", NS):
        text_parts = [node.text or "" for node in item.findall(".//main:t", NS)]
        values.append("".join(text_parts))
    return values


def first_sheet_path(archive: zipfile.ZipFile) -> str:
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    first_sheet = workbook.find("main:sheets/main:sheet", NS)
    if first_sheet is None:
        raise ValueError("No sheet found in workbook.")

    rel_id = first_sheet.attrib[f"{{{NS['rel']}}}id"]
    for rel in rels:
        if rel.attrib.get("Id") == rel_id:
            target = rel.attrib["Target"]
            if target.startswith("/"):
                target = target.lstrip("/")
            elif not target.startswith("xl/"):
                target = f"xl/{target}"
            return target
    raise ValueError(f"Could not resolve worksheet relationship {rel_id}.")


def cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    value_node = cell.find("main:v", NS)

    if cell_type == "inlineStr":
        text_node = cell.find(".//main:t", NS)
        return text_node.text if text_node is not None and text_node.text is not None else ""

    if value_node is None or value_node.text is None:
        return ""

    raw = value_node.text
    if cell_type == "s":
        return shared_strings[int(raw)]
    if cell_type == "b":
        return "TRUE" if raw == "1" else "FALSE"
    return raw


def convert_xlsx_to_csv(input_path: Path, output_path: Path) -> tuple[int, int]:
    with zipfile.ZipFile(input_path) as archive:
        shared_strings = load_shared_strings(archive)
        sheet_path = first_sheet_path(archive)
        sheet = ET.fromstring(archive.read(sheet_path))

    rows = []
    max_column = 0
    for row in sheet.findall(".//main:sheetData/main:row", NS):
        values = {}
        for cell in row.findall("main:c", NS):
            ref = cell.attrib.get("r", "")
            if not ref:
                continue
            col = column_index(ref)
            values[col] = cell_value(cell, shared_strings)
            max_column = max(max_column, col + 1)
        rows.append(values)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        for values in rows:
            writer.writerow([values.get(index, "") for index in range(max_column)])

    return len(rows), max_column


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    rows, columns = convert_xlsx_to_csv(Path(args.input), Path(args.output))
    print(f"Converted {rows} rows and {columns} columns to {args.output}")


if __name__ == "__main__":
    main()

