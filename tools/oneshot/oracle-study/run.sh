#!/bin/sh
# Oracle dungeon study (S180). Renders every Ages and Seasons dungeon floor
# from the cartridges' own room layouts and tilesets, and lists every room's
# objects, chests and terrain. Asserts nothing; docs/briefs/
# DUNGEON-DESIGN-LANGUAGE.md is what was learned from it.
# Usage: ORACLE_STUDY=<scratch dir> sh tools/oneshot/oracle-study/run.sh
# Needs pillow, and clones oracles-disasm into $ORACLE_STUDY if absent.
set -e
H=$(cd "$(dirname "$0")" && pwd)
S=$ORACLE_STUDY; D=$S/oracles-disasm
[ -d "$D" ] || git clone --depth 1 https://github.com/Stewmath/oracles-disasm "$D"
for g in ages seasons; do
  F=$S/flat-$g; mkdir -p "$F"
  for f in $D/data/$g/*.s $D/tileset_layouts/$g/*.bin; do ln -sf "$f" "$F/"; done
  for f in $(find $D/gfx $D/gfx_compressible -path "*/$g/*" -name "*.png") $(find $D/gfx $D/gfx_compressible -maxdepth 2 -path "*common*" -name "*.png"); do ln -sf "$f" "$F/"; done
done
mkdir -p "$S/study"; cd "$S/study"
python3 "$H/layouts.py" "$D/" ages > ages-layouts.json
python3 "$H/layouts.py" "$D/" seasons > seasons-layouts.json
for g in ages seasons; do
  for k in 01 02 03 04 05 06 07 08 0c; do
    [ $g = seasons ] && [ $k = 0c ] && continue
    python3 -c "import json,sys; print(json.dumps(json.load(open('$g-layouts.json'))['$k']))" > lay.json
    python3 "$H/render.py" $g "$(cat lay.json)" "$g-d$k-f%d.png"
    python3 "$H/objs.py" $g $k > "$g-d$k.txt"
    python3 "$H/cond.py" "$g-d$k.txt" > "$g-d$k.c.txt"
  done
done
echo "study written to $S/study"
