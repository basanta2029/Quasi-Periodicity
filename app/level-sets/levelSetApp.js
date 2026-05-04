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
        this.chains    = [];
        this.nClosed   = 0;
        this.nBoundary = 0;

        // Debounce timers
        this._gridTimer = null;
        this._cTimer    = null;
        this._panTimer  = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvasPan();
        this.updatePanDisplay();
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
            const rect = this.getPlotRect();
            // Pixel delta → unit delta. The inner plot area represents one unit in x/y.
            // Dragging right (dx>0) moves viewport left → panX decreases.
            // Dragging down  (dy>0) moves viewport up   → panY increases (y-axis flipped).
            const dx =  (e.clientX - this.dragStartX) / rect.width;
            const dy = -(e.clientY - this.dragStartY) / rect.height;
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
            const rect = this.getPlotRect();
            const dx =  (t.clientX - this.dragStartX) / rect.width;
            const dy = -(t.clientY - this.dragStartY) / rect.height;
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
        el.textContent = `Showing x [${ox}, ${(this.panX + 1).toFixed(2)}], y [${oy}, ${(this.panY + 1).toFixed(2)}] - drag the plot to move around`;
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
            this.nBoundary   = result.nBoundary;
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
            this.nBoundary   = result.nBoundary;

            this.render();
            this.updateStatusBar();
            this.updateAlphaInfo();
            this.showOverlay(false);
        }));
    }

    // ─── Rendering ─────────────────────────────────────────────────────────────

    getPlotRect() {
        return {
            left: 54,
            top: 22,
            right: this.W - 18,
            bottom: this.H - 46,
            get width() { return this.right - this.left; },
            get height() { return this.bottom - this.top; },
        };
    }

    toCanvasPoint(pt) {
        const rect = this.getPlotRect();
        return {
            x: rect.left + pt.x * rect.width,
            y: rect.top + (1 - pt.y) * rect.height,
        };
    }

    render() {
        const ctx = this.ctx;
        const W = this.W, H = this.H;
        const rect = this.getPlotRect();

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, W, H);

        this.drawGrid();

        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.left, rect.top, rect.width, rect.height);
        ctx.clip();

        for (const chain of this.chains) {
            if (chain.points.length < 2) continue;
            const color = chain.type === 'closed'   ? '#1976D2'
                        : chain.type === 'boundary' ? '#E65100'
                        : '#9E9E9E';
            this.drawChain(chain.points, color, chain.isClosed);
        }
        ctx.restore();

        this.drawEndpointMarkers();

        // Plot border
        ctx.strokeStyle = '#24292e';
        ctx.lineWidth   = 1.5;
        ctx.strokeRect(rect.left, rect.top, rect.width, rect.height);

        // Pan indicator watermark (only when panned away from origin)
        if (this.panX !== 0 || this.panY !== 0) {
            ctx.fillStyle = 'rgba(100,110,130,0.55)';
            ctx.font      = '11px monospace';
            ctx.fillText(`x ∈ [${this.panX.toFixed(2)}, ${(this.panX+1).toFixed(2)}]  `
                       + `y ∈ [${this.panY.toFixed(2)}, ${(this.panY+1).toFixed(2)}]`,
                rect.left, H - 10);
        }
    }

    drawGrid() {
        const ctx = this.ctx;
        const rect = this.getPlotRect();
        const divisions = 5;  // 5 divisions → ticks at 0.2, 0.4, 0.6, 0.8

        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(rect.left, rect.top, rect.width, rect.height);

        // Grid lines
        ctx.strokeStyle = '#dde1e7';
        ctx.lineWidth   = 0.8;
        ctx.beginPath();
        for (let k = 0; k <= divisions; k++) {
            const xPx = rect.left + (k / divisions) * rect.width;
            const yPx = rect.top + (k / divisions) * rect.height;
            ctx.moveTo(xPx, rect.top);
            ctx.lineTo(xPx, rect.bottom);
            ctx.moveTo(rect.left, yPx);
            ctx.lineTo(rect.right, yPx);
        }
        ctx.stroke();

        // Axis tick labels
        ctx.fillStyle = 'rgba(36,41,46,0.8)';
        ctx.font      = '11px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // X-axis labels (bottom edge)
        for (let k = 0; k <= divisions; k++) {
            const val  = this.panX + k / divisions;
            const xPx  = rect.left + (k / divisions) * rect.width;
            ctx.fillText(val.toFixed(1), xPx, rect.bottom + 7);
        }

        // Y-axis labels (left edge)
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let k = 0; k <= divisions; k++) {
            const val = this.panY + k / divisions;
            const yPx = rect.bottom - (k / divisions) * rect.height;
            ctx.fillText(val.toFixed(1), rect.left - 8, yPx);
        }

        // Axis name labels
        ctx.fillStyle = 'rgba(36,41,46,0.9)';
        ctx.font      = '600 12px -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText('x', rect.left + rect.width / 2, this.H - 8);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('y', 12, rect.top + rect.height / 2);
    }

    drawChain(points, color, closed) {
        const ctx = this.ctx;

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth   = 2.1;
        ctx.lineJoin    = 'round';
        ctx.lineCap     = 'round';

        let penDown = false;
        for (let k = 0; k < points.length; k++) {
            const pt = this.toCanvasPoint(points[k]);

            if (!penDown) {
                ctx.moveTo(pt.x, pt.y);
                penDown = true;
            } else {
                const dx = Math.abs(points[k].x - points[k - 1].x);
                const dy = Math.abs(points[k].y - points[k - 1].y);
                if (dx > 0.5 || dy > 0.5) {
                    ctx.moveTo(pt.x, pt.y);
                } else {
                    ctx.lineTo(pt.x, pt.y);
                }
            }
        }

        if (closed && points.length > 1) {
            const dx = Math.abs(points[0].x - points[points.length - 1].x);
            const dy = Math.abs(points[0].y - points[points.length - 1].y);
            if (dx <= 0.5 && dy <= 0.5) {
                const first = this.toCanvasPoint(points[0]);
                ctx.lineTo(first.x, first.y);
            }
        }

        ctx.stroke();
    }

    drawEndpointMarkers() {
        const ctx = this.ctx;
        const rect = this.getPlotRect();
        ctx.save();
        ctx.beginPath();
        ctx.rect(rect.left, rect.top, rect.width, rect.height);
        ctx.clip();

        for (const chain of this.chains) {
            if (chain.type !== 'boundary' || chain.points.length < 2) continue;
            const endpoints = [chain.points[0], chain.points[chain.points.length - 1]];
            for (const point of endpoints) {
                const pt = this.toCanvasPoint(point);
                ctx.beginPath();
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#E65100';
                ctx.lineWidth = 1.5;
                ctx.arc(pt.x, pt.y, 3.5, 0, LevelSetMath.TWO_PI);
                ctx.fill();
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    // ─── UI helpers ────────────────────────────────────────────────────────────

    updateStatusBar() {
        const total = this.nClosed + this.nBoundary;
        document.getElementById('closedCount').textContent =
            `${this.nClosed} closed curve${this.nClosed !== 1 ? 's' : ''}`;
        document.getElementById('openCount').textContent =
            `${this.nBoundary} edge-touching piece${this.nBoundary !== 1 ? 's' : ''}`;
        document.getElementById('totalCount').textContent =
            `${total} component${total !== 1 ? 's' : ''} total`;
    }

    updateAlphaInfo() {
        const el = document.getElementById('alphaTypeInfo');
        if (!el) return;
        if (this.isLikelyRational(this.alpha)) {
            el.innerHTML = '<span class="alpha-rational">This α is close to a rational value, so the pattern repeats more regularly.</span>';
        } else {
            el.innerHTML = '<span class="alpha-irrational">This α behaves like an irrational value, so the pattern does not line up exactly as it repeats.</span>';
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
