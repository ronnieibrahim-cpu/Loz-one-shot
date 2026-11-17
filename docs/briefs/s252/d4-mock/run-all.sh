#!/bin/sh
# Re-proves both options. Run from the repository root:
#   sh docs/briefs/s252/d4-mock/run-all.sh
D=docs/briefs/s252/d4-mock
echo "== A: node tools/check-iceblocks.mjs --mock $D/option-a-ice.json"
node tools/check-iceblocks.mjs --mock $D/option-a-ice.json 2>&1
echo
echo "== A: node $D/run-bellows-mock.mjs $D/option-a-bellows.json"
node $D/run-bellows-mock.mjs $D/option-a-bellows.json 2>&1
echo
echo "== B: node tools/check-bridges.mjs --mock $D/option-b-bridge.json"
node tools/check-bridges.mjs --mock $D/option-b-bridge.json 2>&1
echo
echo "== B: node $D/run-bellows-mock.mjs $D/option-b-bellows.json"
node $D/run-bellows-mock.mjs $D/option-b-bellows.json 2>&1
