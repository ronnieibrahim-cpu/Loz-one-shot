#!/bin/sh
# Delete the 46 branches that are stale, superseded, or fully merged into main.
# Generated 2026-08-20. Run from a machine with branch-deletion rights;
# the agent proxy in Claude Code on the web refuses ref deletions.
# Verify first:  git fetch origin --prune && git branch -r --merged origin/main

set -e
git push origin --delete claude/audio-track-structure-mhglzh
git push origin --delete claude/audit-consolidate-branches-5knfli
git push origin --delete claude/circular-progression-lock-rff8nx
git push origin --delete claude/consolidate-movement-models-f1bqez
git push origin --delete claude/dungeon-5-iteration-polish-o6gpys
git push origin --delete claude/dungeon-6-p8-polish-9vwxpy
git push origin --delete claude/dungeon-p8-d4-iteration-1n9lfb
git push origin --delete claude/enemy-grid-aligned-movement-n2xv16
git push origin --delete claude/engine-feel-determinism-lel1me
git push origin --delete claude/entity-solid-collision-pdxrhy
git push origin --delete claude/gbc-zelda-movement-sword-r1vxqv
git push origin --delete claude/health-economy-instrument-s5s5b8
git push origin --delete claude/merge-four-features-53ql03
git push origin --delete claude/merge-three-features-conflicts-6ipqpz
git push origin --delete claude/next-session-iteration-o1zrx7
git push origin --delete claude/oracle-tides-continued-ebfuit
git push origin --delete claude/oracle-tides-polish-aqche8
git push origin --delete claude/p7-6-multi-screen-rooms-s3m1ms
git push origin --delete claude/p8-dungeon-generation-muve1i
git push origin --delete claude/p8-execution-dungeon-audit-ruwmru
git push origin --delete claude/p9-5-trading-sequence-ama7n7
git push origin --delete claude/p9-heart-health-economy-crpqyb
git push origin --delete claude/player-walkthrough-guide-74mtr5
git push origin --delete claude/playthrough-route-end-714gkr
git push origin --delete claude/playthrough-test-harness-jq9z5o
git push origin --delete claude/project-iteration-p7-n3k9cq
git push origin --delete claude/spatial-tide-level-t2d9kv
git push origin --delete claude/tidewright-items-impl-nrpd3y
git push origin --delete claude/title-screen-art-j2lyg9
git push origin --delete claude/towns-construction-b67b20
git push origin --delete claude/coral-spire-reauth-s93w9t
git push origin --delete claude/fix-playthrough-blocker-e72n4s
git push origin --delete claude/next-session-iteration-6cyssw
git push origin --delete claude/next-session-iteration-b2tuo7
git push origin --delete claude/next-session-iteration-erdixn
git push origin --delete claude/oracle-build-script-coklp7
git push origin --delete claude/oracle-tides-boss-music-4c24tm
git push origin --delete claude/oracle-tides-polish-grjnhj
git push origin --delete claude/oracle-tides-polish-nphkj0
git push origin --delete claude/p7-6-camera
git push origin --delete claude/p8-dungeon-generation-faqood
git push origin --delete claude/p8-execution-plan-jh6exl
git push origin --delete claude/playthrough-route-to-end-kxpd28
git push origin --delete claude/tide-levels-test-flakiness-73jc39
git push origin --delete claude/zelda-boss-behavior-jgbfwo
git push origin --delete claude/zelda-style-game-piqt8v
