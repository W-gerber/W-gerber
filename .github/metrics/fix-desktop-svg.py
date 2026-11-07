import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path


path = Path(sys.argv[1])
svg = path.read_text(encoding="utf-8")
root = ET.fromstring(svg)
height = int(root.attrib["height"])
if root.attrib["width"] != "100%" or height <= 0:
    raise ValueError("Unexpected metrics SVG dimensions")

svg, count = re.subn(
    r'(<svg\b[^>]*?)\bwidth="100%"',
    rf'\1width="960" viewBox="0 0 960 {height}"',
    svg,
    count=1,
)
if count != 1:
    raise ValueError("Could not normalize metrics SVG dimensions")

path.write_text(svg, encoding="utf-8")
