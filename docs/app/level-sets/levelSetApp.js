'use strict';

class LevelSetApp {

    constructor() {
        this.canvas = document.getElementById('levelSetCanvas');
        this.ctx    = this.canvas.getContext('2d');
        this.W = this.canvas.width;
        this.H = this.canvas.height;

        // Function parameters
        this.alpha = Math.SQRT2;
        this.c     = -1.5;
        this.N     = 400;

        // Viewport origin: f is sampled on [panX, panX+1] × [panY, panY+1]
        this.panX = 0;
        this.panY = 0;

        // Drag state
        this.isDragging   = false;
        this.dragStartX   = 0;
        this.dragStartY   = 0;
        this.panStartX    = 0;
        this.panStartY    = 0;

        // Cached grid — invalidated when alpha, N, or pan changes
        this.cachedGrid  = null;
        this.cachedAlpha = null;
        this.cachedN     = null;
        this.cachedPanX  = null;
        this.cachedPanY  = null;

        // Last result
        this.chains  = [];
        this.nClosed = 0;
        this.nOpen   = 0;

        // Debounce timers
        this._gridTimer = null;
        this._cTimer    = null;
        this._panTimer  = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvasPan();
        this.compute(true);
    }

    setupEventListeners() {
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

        const cSlider = document.getElementById('cSlider');
        const cValue  = document.getElementById('cValue');
        cSlider.addEventListener('input', () => {
            this.c = parseFloat(cSlider.value);
            cValue.textContent = this.c.toFixed(2);
            this.scheduleCRecompute();
        });

        const resSlider = document.getElementById('resSlider');
        const resValue  = document.getElementById('resValue');
        resSlider.addEventListener('input', () => {
            this.N = parseInt(resSlider.value);
            resValue.textContent = this.N;
            this.scheduleGridRecompute();
        });

        document.querySelectorAll('[data-alpha-preset]').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = LevelSetMath.ALPHA_PRESETS[btn.getAttribute('data-alpha-preset')];
                if (!preset) return;
                this.alpha = preset.value;
                alphaSlider.value = Math.min(3, Math.max(0.01, preset.value));
                alphaInput.value  = preset.value.toFixed(6);
                this.scheduleGridRecompute();
            });
        });

        // Reset pan button
        const resetBtn = document.getElementById('resetPanBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.panX = 0;
                this.panY = 0;
                this.updatePanDisplay();
                this.scheduleGridRecompute();
            });
        }
    }

    // ─── Pan / drag ────────────────────────────────────────────────────────────

    setupCanvasPan() {
        const canvas = this.canvas;
        canvas.style.cursor = 'grab';

        canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.panStartX  = this.panX;
            this.panStartY  = this.panY;
            canvas.style.cursor = 'grabbing';
            e.preventDefault();
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            // Pixel delta → unit delta. W pixels = 1 unit in x, H pixels = 1 unit in y.
            // Dragging right (dx>0) moves viewport left → panX decreases.
            // Dragging down  (dy>0) moves viewport up   → panY increases (y-axis flipped).
            const dx =  (e.clientX - this.dragStartX) / this.W;
            const dy = -(e.clientY - this.dragStartY) / this.H;
            this.panX = this.panStartX - dx;
            this.panY = this.panStartY - dy;
            this.updatePanDisplay();
            this.schedulePanRecompute();
        });

        const stopDrag = (e) => {
            if (!this.isDragging) return;
            this.isDragging = false;
            canvas.style.cursor = 'grab';
            clearTimeout(this._panTimer);
            this.compute(true);  // Final precise render after drag ends
        };
        canvas.addEventListener('mouseup',    stopDrag);
        canvas.addEventListener('mouseleave', stopDrag);

        // Touch support
        canvas.addEventListener('touchstart', (e) => {
            const t = e.touches[0];
            this.isDragging = true;
            this.dragStartX = t.clientX;
            this.dragStartY = t.clientY;
            this.panStartX  = this.panX;
            this.panStartY  = this.panY;
            e.preventDefault();
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            const t = e.touches[0];
            const dx =  (t.clientX - this.dragStartX) / this.W;
            const dy = -(t.clientY - this.dragStartY) / this.H;
            this.panX = this.panStartX - dx;
            this.panY = this.panStartY - dy;
            this.updatePanDisplay();
            this.schedulePanRecompute();
            e.preventDefault();
        }, { passive: false });

        canvas.addEventListener('touchend', stopDrag);
    }

    updatePanDisplay() {
        const el = document.getElementById('panDisplay');
        if (!el) return;
        const ox = this.panX.toFixed(2);
        const oy = this.panY.toFixed(2);
        el.textContent = `View origin: (${ox}, ${oy})`;
        const resetBtn = document.getElementById('resetPanBtn');
        if (resetBtn) {
            resetBtn.style.display = (this.panX !== 0 || this.panY !== 0) ? 'inline-block' : 'none';
        }
    }

    // Fast recompute during drag (no overlay, debounced 80ms)
    schedulePanRecompute() {
        clearTimeout(this._panTimer);
        this._panTimer = setTimeout(() => {
            const result = LevelSetMath.computeLevelSet(
                this.alpha, this.c, this.N, null, this.panX, this.panY
            );
            this.cachedGrid  = result.grid;
            this.cachedAlpha = this.alpha;
            this.cachedN     = this.N;
            this.cachedPanX  = this.panX;
            this.cachedPanY  = this.panY;
            this.chains      = result.chains;
            this.nClosed     = result.nClosed;
            this.nOpen       = result.nOpen;
            this.render();
            this.updateStatusBar();
        }, 80);
    }

    // ─── Compute ───────────────────────────────────────────────────────────────

    scheduleGridRecompute() {
        clearTimeout(this._gridTimer);
        clearTimeout(this._cTimer);
        this._gridTimer = setTimeout(() => this.compute(true), 120);
    }

    scheduleCRecompute() {
        clearTimeout(this._cTimer);
        this._cTimer = setTimeout(() => this.compute(false), 60);
    }

    compute(recomputeGrid) {
        this.showOverlay(true);
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const gridStale = recomputeGrid
                || this.cachedAlpha !== this.alpha
                || this.cachedN     !== this.N
                || this.cachedPanX  !== this.panX
                || this.cachedPanY  !== this.panY;

            const cached = gridStale ? null : this.cachedGrid;

            const result = LevelSetMath.computeLevelSet(
                this.alpha, this.c, this.N, cached, this.panX, this.panY
            );

            this.cachedGrid  = result.grid;
            this.cachedAlpha = this.alpha;
            this.cachedN     = this.N;
            this.cachedPanX  = this.panX;
            this.cachedPanY  = this.panY;
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

        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, W, H);

        this.drawGrid();

        for (const chain of this.chains) {
            if (chain.points.length < 2) continue;
            const color = chain.type === 'closed' ? '#1976D2'
                        : chain.type === 'open'   ? '#E65100'
                        : '#9E9E9E';
            this.drawChain(chain.points, color, chain.isClosed);
        }

        // Border
        ctx.strokeStyle = '#24292e';
        ctx.lineWidth   = 2;
        ctx.strokeRect(1, 1, W - 2, H - 2);

        // Pan indicator watermark (only when panned away from origin)
        if (this.panX !== 0 || this.panY !== 0) {
            ctx.fillStyle = 'rgba(100,110,130,0.55)';
            ctx.font      = '11px monospace';
            ctx.fillText(`x ∈ [${this.panX.toFixed(2)}, ${(this.panX+1).toFixed(2)}]  `
                       + `y ∈ [${this.panY.toFixed(2)}, ${(this.panY+1).toFixed(2)}]`,
                8, H - 8);
        }
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
            const py = (1 - points[k].y) * H;

            if (!penDown) {
                ctx.moveTo(px, py);
                penDown = true;
            } else {
                const dx = Math.abs(points[k].x - points[k - 1].x);
                const dy = Math.abs(points[k].y - points[k - 1].y);
                if (dx > 0.5 || dy > 0.5) {
                    ctx.moveTo(px, py);
                } else {
                    ctx.lineTo(px, py);
                }
            }
        }

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

window.addEventListener('DOMContentLoaded', () => { new LevelSetApp(); });
