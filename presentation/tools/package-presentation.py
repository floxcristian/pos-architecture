"""Package the local tutorial and its sources without corporate clones or QA captures."""
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[2]
output = root / "dist" / "pos-atlas.zip"
output.parent.mkdir(exist_ok=True)
files = [root / "README.md"]
files += [p for p in (root / "docs").rglob("*") if p.is_file()]
# Audit evidence linked by the new central-integration reports.
files += sorted((root / "tools").glob("concentrador-*-evidence.json"))
files += [
    p for p in (root / "presentation").rglob("*")
    if p.is_file() and "qa" not in p.relative_to(root / "presentation").parts
    and p.suffix.lower() != ".png" and "node_modules" not in p.parts
    and "__pycache__" not in p.parts
]
with ZipFile(output, "w", compression=ZIP_DEFLATED) as archive:
    for item in sorted(files):
        archive.write(item, "pos-atlas/" + item.relative_to(root).as_posix())
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert all("/repos/" not in name for name in archive.namelist())
print(f"Paquete creado y verificado: {output} ({output.stat().st_size:,} bytes)")
