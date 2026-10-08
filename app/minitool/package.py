"""Package the generated static directory itself, with no extra root folder."""
from pathlib import Path
import sys, zipfile
root = Path(__file__).resolve().parent.parent
source = root / 'dist-minitool'
target = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else root / 'not-for-work-xiaohongshu-minitool.zip'
assert (source / 'index.html').is_file(), 'Run node minitool/build.mjs first'
target.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for path in sorted(source.rglob('*')):
        if path.is_file():
            archive.write(path, path.relative_to(source).as_posix())
with zipfile.ZipFile(target) as archive:
    assert archive.testzip() is None
    assert 'index.html' in archive.namelist()
print(f'{target}: {target.stat().st_size} bytes')
