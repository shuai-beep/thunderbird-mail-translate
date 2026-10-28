#!/usr/bin/env python3
"""打包 Thunderbird 扩展为 xpi。

用法：
    python build.py

产物写入 dist/mail-translate-<version>.xpi
"""

import json
import os
import zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, "dist")

# 不参与打包的文件
EXCLUDE_FILES = {
    "build.py",
    "README.md",
    "CHANGELOG.md",
    "LICENSE",
    ".gitignore",
}
EXCLUDE_DIRS = {".git", "dist", "__pycache__", ".github"}


def read_version():
    with open(os.path.join(ROOT, "manifest.json"), encoding="utf-8") as f:
        return json.load(f)["version"]


def collect_files():
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for name in sorted(filenames):
            if name in EXCLUDE_FILES or name.startswith("."):
                continue
            full = os.path.join(dirpath, name)
            yield full, os.path.relpath(full, ROOT).replace(os.sep, "/")


def main():
    version = read_version()
    os.makedirs(DIST, exist_ok=True)
    out = os.path.join(DIST, f"mail-translate-{version}.xpi")

    files = list(collect_files())
    if not any(arc == "manifest.json" for _, arc in files):
        raise SystemExit("错误：manifest.json 不在包根目录")

    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for full, arc in files:
            z.write(full, arc)

    size = os.path.getsize(out) / 1024
    print(f"已打包  {out}")
    print(f"版本    {version}")
    print(f"大小    {size:.1f} KB")
    print(f"文件数  {len(files)}")


if __name__ == "__main__":
    main()
