'use strict';

class LevelSetApp {

    constructor() {
        this.canvas = document.getElementById('levelSetCanvas');
        this.ctx    = this.canvas.getContext('2d');
        this.W = this.canvas.width;
        this.H = this.canvas.height;

        // State
        this.alpha  = Math.SQRT2;   // quasiperiod
        this.c      = -1.5;         // isovalue — start with a visible closed curve
        this.N      = 400;          // grid resolution

        // Cached grid (reused when only c changes)
        this.cachedGrid  = null;
        this.cachedAlpha = null;
        this.cachedN     = null;

        // Last computed result
        this.chains  = [];
        this.nClosed = 0;
        this.nOpen   = 0;

        // Debounce timers
        this._gridTimer   = null;
        this._cTimer      = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.compute(true);
    }

    setupEventListeners() {
        // Alpha slider + number input (linked)
        const alphaSlider = document.getElementById('alphaSlider');
        const alphaInput  = document.getElementById('alphaInput');

        alphaSlider.addEventListener('input', () => {
            const v = parseFloat(alphaSlider.value);
            alphaInput.value = v.toFixed(4);
            this.alpha = v;
            this.scheduleGridRecompute();
        });

        alphaInput.addEventListener('change', () => {
            const v = parseFloat(alphaInput.value);
            if (isNaN(v) || v <= 0) return;
            alphaSlider.value = Math.min(3, Math.max(0.01, v));
            this.alpha = v;
            this.scheduleGridRecompute();
        });

        // Level c slider
        const cSlider = document.getElementById('cSlider');
        const cValue  = document.getElementById('cValue');

        cSlider.addEventListener('input', () => {
            this.c = parseFloat(cSlider.value);
            cValue.textContent = this.c.toFixed(2);
            this.scheduleCRecompute();
        });

        // Resolution slider
        const resSlider = document.getElementById('resSlider');
        const resValue  = document.getElementById('resValue');

        resSlider.addEventListener('input', () => {
            this.N = parseInt(resSlider.value);
            resValue.textContent = this.N;
            this.scheduleGridRecompute();
        });

        // Alpha preset buttons
        document.querySelectorAll('[data-alpha-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.getAttribute('data-alpha-preset');
                const preset = LevelSetMath.ALPHA_PRESETS[key];
                if (!preset) return;
                this.alpha = preset.value;
                alphaSlider.value = Math.min(3, Math.max(0.01, preset.value));
                alphaInput.value  = preset.value.toFixed(6);
                this.scheduleGridRecompute();
            });
        });
    }

    // Debounce: recompute grid + chains after 120ms idle
    scheduleGridRecompute() {
        clearTimeout(this._gridTimer);
        clearTimeout(this._cTimer);
        this._gridTimer = setTimeout(() => this.compute(true), 120);
    }

    // Debounce: reuse cached grid, only redo marching squares + chains after 60ms
    scheduleCRecompute() {
        clearTimeout(this._cTimer);
        this._cTimer = setTimeout(() => this.compute(false), 60);
    }

    // Full compute pipeline.
    // recomputeGrid=true: resample the function grid (needed when alpha or N change).
    // recomputeGrid=false: reuse cached grid (only c changed).
    compute(recomputeGrid) {
        this.showOverlay(true);
        // Double rAF ensures the overlay is painted before the blocking compute.
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const cached = (!recomputeGrid && this.cachedGrid
                && this.cachedAlpha === this.alpha
                && this.cachedN     === this.N)
                ? this.cachedGrid : null;

            const result = LevelSetMath.computeLevelSet(this.alpha, this.c, this.N, cached);

            this.cachedGrid  = result.grid;
            this.cachedAlpha = this.alpha;
            this.cachedN     = this.N;
            this.chains      = result.chains;
            this.nClosed     = result.nClosed;
            this.nOpen       = result.nOpen;

            this.render();
            this.updateStatusBar();
            this.updateAlphaInfo();
            this.showOverlay(false);
        }));
    }

    // ─── Rendering ─────────────────────────────────────────────────────────────

    render() {
        const ctx = this.ctx;
        const W = this.W, H = this.H;

        // Background
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, W, H);

        // Subtle grid
        this.drawGrid();

        // Draw all chains
        for (const chain of this.chains) {
            if (chain.points.length < 2) continue;
            let color;
            if      (chain.type === 'closed')  color = '#1976D2';  // blue
            else if (chain.type === 'open')    color = '#E65100';  // orange
            else                               color = '#9E9E9E';  // gray (degenerate)
            this.drawChain(chain.points, color, chain.isClosed);
        }

        // Border
        ctx.strokeStyle = '#24292e';
        ctx.lineWidth   = 2;
        ctx.strokeRect(1, 1, W - 2, H - 2);
    }

    drawGrid() {
        const ctx = this.ctx;
        const W = this.W, H = this.H;
        const divisions = 10;
        ctx.strokeStyle = '#dde1e7';
        ctx.lineWidth   = 0.5;
        ctx.beginPath();
        for (let k = 1; k < divisions; k++) {
            const xPx = (k / divisions) * W;
            const yPx = (k / divisions) * H;
            ctx.moveTo(xPx, 0); ctx.lineTo(xPx, H);
            ctx.moveTo(0, yPx); ctx.lineTo(W, yPx);
        }
        ctx.stroke();
    }

    // Draw a polyline on the torus, lifting the pen at wrap-around jumps.
    drawChain(points, color, closed) {
        const ctx = this.ctx;
        const W = this.W, H = this.H;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 1.4;
        ctx.lineJoin    = 'round';

        let penDown = false;
        for (let k = 0; k < points.length; k++) {
            const px = points[k].x * W;
            const py = (1 - points[k].y) * H;   // y-flip: torus y=0 is bottom

            if (!penDown) {
                ctx.moveTo(px, py);
                penDown = true;
            } else {
                const dx = Math.abs(points[k].x - points[k - 1].x);
                const dy = Math.abs(points[k].y - points[k - 1].y);
                if (dx > 0.5 || dy > 0.5) {
                    // Torus boundary jump — lift pen
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
        }

        // Close the loop visually if the chain is closed and last→first doesn't jump
        if (closed && points.length > 1) {
            const dx = Math.abs(points[0].x - points[points.length - 1].x);
            const dy = Math.abs(points[0].y - points[points.length - 1].y);
            if (dx <= 0.5 && dy <= 0.5) {
                ctx.lineTo(points[0].x * W, (1 - points[0].y) * H);
            }
        }

        ctx.stroke();
    }

    // ─── UI helpers ────────────────────────────────────────────────────────────

    updateStatusBar() {
        const total = this.nClosed + this.nOpen;
        document.getElementById('closedCount').textContent =
            `${this.nClosed} closed curve${this.nClosed !== 1 ? 's' : ''}`;
        document.getElementById('openCount').textContent =
            `${this.nOpen} open ${this.nOpen !== 1 ? 'trajectories' : 'trajectory'}`;
        document.getElementById('totalCount').textContent =
            `${total} component${total !== 1 ? 's' : ''} total`;
    }

    updateAlphaInfo() {
        const el = document.getElementById('alphaTypeInfo');
        if (!el) return;
        if (this.isLikelyRational(this.alpha)) {
            el.innerHTML = '<span class="alpha-rational">α ≈ p/q (rational) — f has period q in x; level sets on R² are all closed.</span>';
        } else {
            el.innerHTML = '<span class="alpha-irrational">α irrational — f is truly quasiperiodic; open trajectories can appear.</span>';
        }
    }

    // Quick check: is v within 1e-8 of any p/q with q ≤ 120?
    isLikelyRational(v) {
        for (let q = 1; q <= 120; q++) {
            if (Math.abs(v - Math.round(v * q) / q) < 1e-8) return true;
        }
        return false;
    }

    showOverlay(visible) {
        const el = document.getElementById('computingOverlay');
        if (el) el.style.display = visible ? 'flex' : 'none';
    }
}

// Boot
window.addEventListener('DOMContentLoaded', () => { new LevelSetApp(); });
