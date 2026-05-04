'use strict';

// Visualization approach: draw the level set of f on [0,1]² as an open domain
// (no torus identification). Level-set components that close within [0,1]² are
// "closed curves"; those that hit the boundary are "open trajectories" — pieces
// of infinite curves that extend across R² in the Novikov sense.

class LevelSetMath {

    static get TWO_PI() { return 2 * Math.PI; }

    static get ALPHA_PRESETS() {
        return {
            'half':         { value: 0.5,                    label: '1/2',  type: 'rational'   },
            'two-thirds':   { value: 2 / 3,                  label: '2/3',  type: 'rational'   },
            'three-fifths': { value: 3 / 5,                  label: '3/5',  type: 'rational'   },
            'sqrt2':        { value: Math.SQRT2,              label: '√2',   type: 'irrational' },
            'phi':          { value: (1 + Math.sqrt(5)) / 2, label: 'φ',    type: 'irrational' },
            'pi-4':         { value: Math.PI / 4,            label: 'π/4',  type: 'irrational' },
        };
    }

    // Marching squares segment table.
    // Bit ordering: bit0=BL(1), bit1=BR(2), bit2=TR(4), bit3=TL(8).
    // Edge IDs: 0=BOTTOM(BL↔BR), 1=RIGHT(BR↔TR), 2=TOP(TR↔TL), 3=LEFT(TL↔BL).
    // null = saddle case, resolved dynamically.
    static get SEGMENT_TABLE() {
        return [
            [],        // 0:  all below
            [[3, 0]],  // 1:  BL       → LEFT-BOTTOM
            [[0, 1]],  // 2:  BR       → BOTTOM-RIGHT
            [[3, 1]],  // 3:  BL+BR    → LEFT-RIGHT
            [[1, 2]],  // 4:  TR       → RIGHT-TOP
            null,      // 5:  BL+TR    → saddle
            [[0, 2]],  // 6:  BR+TR    → BOTTOM-TOP
            [[3, 2]],  // 7:  BL+BR+TR → LEFT-TOP
            [[2, 3]],  // 8:  TL       → TOP-LEFT
            [[0, 2]],  // 9:  BL+TL   → BOTTOM-TOP
            null,      // 10: BR+TL    → saddle
            [[1, 2]],  // 11: BL+BR+TL → RIGHT-TOP
            [[1, 3]],  // 12: TR+TL    → RIGHT-LEFT
            [[0, 1]],  // 13: BL+TR+TL → BOTTOM-RIGHT
            [[3, 0]],  // 14: BR+TR+TL → LEFT-BOTTOM
            [],        // 15: all above
        ];
    }

    // f(x,y) = cos(2πx) + cos(2πy) + cos(2παx)
    // This is quasiperiodic on R² for irrational α (3 incommensurate frequencies).
    // It is NOT periodic on [0,1]² unless α is an integer.
    static evaluate(x, y, alpha) {
        const tp = LevelSetMath.TWO_PI;
        return Math.cos(tp * x) + Math.cos(tp * y) + Math.cos(tp * alpha * x);
    }

    // Sample f on an (N+1)×(N+1) grid covering [0,1]².
    // Grid index (i,j) → position (i/N, j/N). Returns flat Float64Array.
    static sampleGrid(alpha, N) {
        const grid = new Float64Array((N + 1) * (N + 1));
        const tp = LevelSetMath.TWO_PI;
        const tpa = tp * alpha;
        for (let i = 0; i <= N; i++) {
            const x = i / N;
            const cxSum = Math.cos(tp * x) + Math.cos(tpa * x);
            const base = i * (N + 1);
            for (let j = 0; j <= N; j++) {
                grid[base + j] = cxSum + Math.cos(tp * (j / N));
            }
        }
        return grid;
    }

    // Canonical edge key for interior shared edges (no modulo — boundary edges get unique keys).
    // Edge 0 (BOTTOM of i,j) and Edge 2 (TOP of i,j-1) share the same key → i,j,0.
    // Edge 3 (LEFT of i,j) and Edge 1 (RIGHT of i-1,j) share the same key → i,j,3.
    // Boundary edges (i=0 LEFT, i=N RIGHT, j=0 BOTTOM, j=N TOP) are intentionally unique.
    static edgeKey(i, j, edgeId) {
        switch (edgeId) {
            case 0: return `${i},${j},0`;    // BOTTOM of (i,j)
            case 1: return `${i+1},${j},3`;  // → LEFT of (i+1, j) — NO modulo
            case 2: return `${i},${j+1},0`;  // → BOTTOM of (i, j+1) — NO modulo
            case 3: return `${i},${j},3`;    // LEFT of (i,j)
        }
    }

    // Linearly interpolate the crossing point on an edge of cell (i,j).
    // Edge 0: BL→BR, Edge 1: BR→TR, Edge 2: TR→TL, Edge 3: TL→BL.
    static interpolateEdge(i, j, edgeId, N, vBL, vBR, vTR, vTL, c) {
        const vA = [vBL, vBR, vTR, vTL][edgeId];
        const vB = [vBR, vTR, vTL, vBL][edgeId];
        const t = Math.max(0, Math.min(1, (c - vA) / (vB - vA)));
        let x, y;
        switch (edgeId) {
            case 0: x = (i + t) / N;       y = j / N;             break;
            case 1: x = (i + 1) / N;       y = (j + t) / N;       break;
            case 2: x = (i + 1 - t) / N;   y = (j + 1) / N;       break;
            case 3: x = i / N;             y = (j + 1 - t) / N;   break;
        }
        return { x, y };
    }

    // Run marching squares on a precomputed grid and return raw line segments.
    // Each segment: { p0, p1, key0, key1 } where p0/p1 are {x,y} in [0,1]².
    static runMarchingSquares(grid, N, c) {
        const table = LevelSetMath.SEGMENT_TABLE;
        const segments = [];

        for (let i = 0; i < N; i++) {
            const base  = i * (N + 1);
            const baseR = (i + 1) * (N + 1);
            for (let j = 0; j < N; j++) {
                const vBL = grid[base  + j];
                const vBR = grid[baseR + j];
                const vTR = grid[baseR + j + 1];
                const vTL = grid[base  + j + 1];

                const caseIdx = (vBL > c ? 1 : 0)
                              | (vBR > c ? 2 : 0)
                              | (vTR > c ? 4 : 0)
                              | (vTL > c ? 8 : 0);

                let pairs = table[caseIdx];
                if (pairs === null) {
                    const centerAbove = (vBL + vBR + vTR + vTL) / 4 > c;
                    if (caseIdx === 5) {
                        pairs = centerAbove ? [[3, 2], [0, 1]] : [[3, 0], [1, 2]];
                    } else {
                        pairs = centerAbove ? [[3, 0], [1, 2]] : [[3, 2], [0, 1]];
                    }
                }

                for (const [eA, eB] of pairs) {
                    segments.push({
                        p0:   LevelSetMath.interpolateEdge(i, j, eA, N, vBL, vBR, vTR, vTL, c),
                        p1:   LevelSetMath.interpolateEdge(i, j, eB, N, vBL, vBR, vTR, vTL, c),
                        key0: LevelSetMath.edgeKey(i, j, eA),
                        key1: LevelSetMath.edgeKey(i, j, eB),
                    });
                }
            }
        }

        return segments;
    }

    // Assemble raw segments into connected chains.
    // Interior edges are shared by two cells and have two neighbors in the adjacency.
    // Boundary edges have only one neighbor → chain walk stops there (open chain).
    // Returns [{points, isClosed}].
    static assembleChains(segments) {
        const adj = new Map();
        segments.forEach((seg, idx) => {
            if (!adj.has(seg.key0)) adj.set(seg.key0, []);
            if (!adj.has(seg.key1)) adj.set(seg.key1, []);
            adj.get(seg.key0).push({ idx, otherKey: seg.key1, otherPt: seg.p1 });
            adj.get(seg.key1).push({ idx, otherKey: seg.key0, otherPt: seg.p0 });
        });

        const used = new Uint8Array(segments.length);
        const chains = [];

        for (let startIdx = 0; startIdx < segments.length; startIdx++) {
            if (used[startIdx]) continue;
            used[startIdx] = 1;

            const seg = segments[startIdx];
            const startKey = seg.key0;
            const points   = [seg.p0, seg.p1];
            let isClosed   = false;
            let currentKey = seg.key1;

            // Walk FORWARD from key1
            while (true) {
                const nbrs = adj.get(currentKey);
                if (!nbrs) break;
                const nb = nbrs.find(n => !used[n.idx]);
                if (!nb) break;
                used[nb.idx] = 1;
                if (nb.otherKey === startKey) {
                    isClosed = true;
                    break;
                }
                points.push(nb.otherPt);
                currentKey = nb.otherKey;
            }

            // If not closed, walk BACKWARD from key0 to find the other end
            if (!isClosed) {
                let backKey    = startKey;
                const backPts  = [];
                while (true) {
                    const nbrs = adj.get(backKey);
                    if (!nbrs) break;
                    const nb = nbrs.find(n => !used[n.idx]);
                    if (!nb) break;
                    used[nb.idx] = 1;
                    backPts.unshift(nb.otherPt);
                    backKey = nb.otherKey;
                }
                for (const pt of backPts) points.unshift(pt);
            }

            chains.push({ points, isClosed });
        }

        return chains;
    }

    // Classify a chain.
    // 'closed': the chain forms a complete loop within [0,1]² (bounded component).
    // 'open':   the chain hits the domain boundary — part of an infinite open
    //           trajectory that extends across R² in the Novikov sense.
    static classifyChain(chain) {
        return chain.isClosed ? 'closed' : 'open';
    }

    // Full pipeline: sample → marching squares → chains → classification.
    // Pass cachedGrid to skip resampling when only c has changed.
    static computeLevelSet(alpha, c, N, cachedGrid = null) {
        const grid = cachedGrid || LevelSetMath.sampleGrid(alpha, N);
        const segments = LevelSetMath.runMarchingSquares(grid, N, c);
        const chains   = LevelSetMath.assembleChains(segments);
        chains.forEach(ch => { ch.type = LevelSetMath.classifyChain(ch); });
        const nClosed = chains.filter(ch => ch.type === 'closed').length;
        const nOpen   = chains.filter(ch => ch.type === 'open').length;
        return { grid, chains, nClosed, nOpen };
    }
}
