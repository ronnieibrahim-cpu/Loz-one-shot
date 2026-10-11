// THE CLIFFSIDE CISTERN, DOOR TO ESSENCE, as actor directives (S184).
//
// tools/check-side.mjs plays it from a stated world (what the robot holds at
// the Cistern's door, with 200 hearts) as the proof that the whole dungeon —
// all three floors, N1-N9, every key and the Boss Key from the East Tank —
// can be finished in one run. It is not a second copy of the route: it is the
// robot's own Cistern, cut out of tools/playthrough-route.mjs from the first
// step inside the door to the fourth Essence, so the two cannot drift apart.
import { ROUTE } from '../playthrough-route.mjs';

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const key = ROUTE.findIndex(d => same(d, ['keyhole', 6, 2, 'left', 'openedD4', 900]));
// In through the door (goto, hold, wait), and from there.
const from = key + 4;
const boss = ROUTE.findIndex(d => same(d, ['boss', 24000, null, { reachSwing: true }]));
// The boss, then the Essence: wait, walk onto it, its pose, the Heart
// Container, the last box.
const to = boss + 9;
if (key < 0 || boss < from) throw new Error('d4-run: the Cistern is no longer where the route had it');
export const D4_RUN = ROUTE.slice(from, to);
