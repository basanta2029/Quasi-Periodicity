/**
 * Interactive Flat Torus Geodesic Drawer
 * JavaScript implementation for real-time, zero-latency interaction
 */

class FlatTorusApp {
    constructor() {
        this.canvas = document.getElementById('torusCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        // State
        this.clickedPoints = [];
        this.slope = null;
        this.slopeInfo = null;
        this.isAnimating = false;
        this.animationProgress = 0;
        this.animationSpeed = 5;
        this.maxWraps = 30; // Will be dynamic based on slope type

        // Dragging state
        this.isDragging = false;
        this.draggedPointIndex = -1;

        this.init();
    }

    init() {
        this.drawEmptyCanvas();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Canvas click
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Canvas mouse move (for dragging)
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());

        // Buttons
        document.getElementById('clearBtn').addEventListener('click', () => this.clear());
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());

        // Speed slider with logarithmic mapping for better control
        const speedSlider = document.getElementById('speedSlider');
        speedSlider.addEventListener('input', (e) => {
            const sliderValue = parseInt(e.target.value);
            // Map 0-12 to speeds: 0.25x, 0.5x, 0.75x, 1x, 1.5x, 2x, 3x, 4x, 5x, 6x, 8x, 10x, 12x
            const speedMap = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12];
            this.animationSpeed = speedMap[sliderValue];
            document.getElementById('speedValue').textContent = `${this.animationSpeed}x`;
        });

        // Initialize speed display
        document.getElementById('speedValue').textContent = '1x';
        this.animationSpeed = 1;

        // Preset buttons
        document.querySelectorAll('.btn-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const presetName = e.target.getAttribute('data-preset');
                this.applyPreset(presetName);
            });
        });
    }

    drawEmptyCanvas() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Background
        this.ctx.fillStyle = '#f8f9fa';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Grid
        this.drawGrid();

        // Unit square boundary
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(0, 0, this.width, this.height);
    }

    drawGrid() {
        const gridSpacing = this.width / 10;

        // Draw fine grid lines
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 0.5;

        for (let i = 0; i <= 10; i++) {
            const pos = i * gridSpacing;
            const isMajor = i % 5 === 0; // Major lines at 0, 0.5, 1.0

            // Set line style
            if (isMajor) {
                this.ctx.strokeStyle = '#bbb';
                this.ctx.lineWidth = 1.5;
            } else {
                this.ctx.strokeStyle = '#e0e0e0';
                this.ctx.lineWidth = 0.5;
            }

            // Vertical lines
            this.ctx.beginPath();
            this.ctx.moveTo(pos, 0);
            this.ctx.lineTo(pos, this.height);
            this.ctx.stroke();

            // Horizontal lines
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos);
            this.ctx.lineTo(this.width, pos);
            this.ctx.stroke();

            // Add tick labels
            this.ctx.fillStyle = '#666';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';

            // Bottom tick labels (x-axis)
            if (i % 2 === 0) { // Label every 0.2
                const label = (i / 10).toFixed(1);
                this.ctx.fillText(label, pos, this.height + 5);
            }

            // Left tick labels (y-axis)
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            if (i % 2 === 0) {
                const label = (1 - i / 10).toFixed(1); // Invert for y-axis
                this.ctx.fillText(label, -5, pos);
            }
        }

        // Add axis labels
        this.ctx.fillStyle = '#333';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('x', this.width / 2, this.height + 22);

        this.ctx.save();
        this.ctx.translate(-22, this.height / 2);
        this.ctx.rotate(-Math.PI / 2);
        this.ctx.fillText('y', 0, 0);
        this.ctx.restore();
    }

    canvasToUnitCoords(canvasX, canvasY) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (canvasX - rect.left) / this.width;
        const y = (canvasY - rect.top) / this.height;
        return {
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y))
        };
    }

    unitToCanvasCoords(unitX, unitY) {
        return {
            x: unitX * this.width,
            y: unitY * this.height
        };
    }

    handleCanvasClick(e) {
        if (this.isDragging) return; // Don't add points while dragging

        const point = this.canvasToUnitCoords(e.clientX, e.clientY);

        if (this.clickedPoints.length < 2) {
            this.clickedPoints.push(point);
        } else {
            // Reset and start new line
            this.clickedPoints = [point];
            this.pause();
        }

        this.updateVisualization();
    }

    handleMouseDown(e) {
        if (this.clickedPoints.length === 0) return;

        const point = this.canvasToUnitCoords(e.clientX, e.clientY);

        // Check if clicking near an existing point
        for (let i = 0; i < this.clickedPoints.length; i++) {
            const dx = Math.abs(point.x - this.clickedPoints[i].x);
            const dy = Math.abs(point.y - this.clickedPoints[i].y);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 0.03) { // Within 3% of canvas
                this.isDragging = true;
                this.draggedPointIndex = i;
                this.canvas.style.cursor = 'grabbing';
                e.preventDefault();
                return;
            }
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging || this.draggedPointIndex === -1) {
            // Check if hovering near a point
            if (this.clickedPoints.length > 0) {
                const point = this.canvasToUnitCoords(e.clientX, e.clientY);
                let nearPoint = false;

                for (const clickedPoint of this.clickedPoints) {
                    const dx = Math.abs(point.x - clickedPoint.x);
                    const dy = Math.abs(point.y - clickedPoint.y);
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < 0.03) {
                        nearPoint = true;
                        break;
                    }
                }

                this.canvas.style.cursor = nearPoint ? 'grab' : 'crosshair';
            }
            return;
        }

        const point = this.canvasToUnitCoords(e.clientX, e.clientY);
        this.clickedPoints[this.draggedPointIndex] = point;
        this.animationProgress = 0; // Reset animation
        this.updateVisualization();
    }

    handleMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.draggedPointIndex = -1;
            this.canvas.style.cursor = 'crosshair';
        }
    }

    updateVisualization() {
        this.drawEmptyCanvas();

        if (this.clickedPoints.length === 0) {
            this.updateInfo(null);
            return;
        }

        // Draw clicked points
        this.drawPoints(this.clickedPoints, '#2196F3', 8);

        if (this.clickedPoints.length === 1) {
            this.updateInfo({ status: 'one_point', point: this.clickedPoints[0] });
            return;
        }

        // Calculate slope and classify
        const point1 = this.clickedPoints[0];
        const point2 = this.clickedPoints[1];
        this.slope = MathUtils.calculateSlope(point1, point2);
        this.slopeInfo = MathUtils.classifySlope(this.slope);

        // Set dynamic maxWraps based on slope type
        this.maxWraps = this.slopeInfo.isRational ? 30 : 200;

        // Draw geodesic
        this.drawGeodesic(point1, this.slope, this.animationProgress);

        // Update info panel
        this.updateInfo(this.slopeInfo);
    }

    drawPoints(points, color, radius) {
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;

        points.forEach((point, index) => {
            const canvasCoords = this.unitToCanvasCoords(point.x, point.y);

            // Draw the point
            this.ctx.beginPath();
            this.ctx.arc(canvasCoords.x, canvasCoords.y, radius, 0, 2 * Math.PI);
            this.ctx.fill();
            this.ctx.stroke();

            // Add label only for clicked points (not the endpoint)
            if (this.clickedPoints.includes(point)) {
                const pointIndex = this.clickedPoints.indexOf(point) + 1;

                // Draw label background
                this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                this.ctx.fillRect(canvasCoords.x + 12, canvasCoords.y - 25, 120, 32);

                // Draw border
                this.ctx.strokeStyle = color;
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(canvasCoords.x + 12, canvasCoords.y - 25, 120, 32);

                // Draw text
                this.ctx.fillStyle = '#333';
                this.ctx.font = 'bold 11px Arial';
                this.ctx.textAlign = 'left';
                this.ctx.textBaseline = 'top';
                this.ctx.fillText(`Point ${pointIndex}`, canvasCoords.x + 16, canvasCoords.y - 22);

                this.ctx.font = '10px Arial';
                this.ctx.fillText(`(${point.x.toFixed(3)}, ${point.y.toFixed(3)})`,
                                  canvasCoords.x + 16, canvasCoords.y - 10);

                // Reset stroke style
                this.ctx.fillStyle = color;
            }
        });
    }

    drawGeodesic(startPoint, slope, tMax) {
        // Generate points
        const nPoints = Math.max(1000, Math.floor(tMax * 500));
        const points = MathUtils.generateGeodesic(startPoint, slope, tMax, nPoints);

        // Split into segments at wraps
        const segments = MathUtils.splitAtWraps(points);

        // Color based on classification
        const color = this.slopeInfo && this.slopeInfo.isRational ? '#28a745' : '#dc3545';

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        // Draw each segment
        segments.forEach(segment => {
            if (segment.length < 2) return;

            this.ctx.beginPath();
            const firstPoint = this.unitToCanvasCoords(segment[0].x, segment[0].y);
            this.ctx.moveTo(firstPoint.x, firstPoint.y);

            for (let i = 1; i < segment.length; i++) {
                const canvasPoint = this.unitToCanvasCoords(segment[i].x, segment[i].y);
                this.ctx.lineTo(canvasPoint.x, canvasPoint.y);
            }

            this.ctx.stroke();
        });

        // Draw current endpoint
        if (points.length > 0) {
            const lastPoint = points[points.length - 1];
            this.drawPoints([lastPoint], color, 5);
        }
    }

    updateInfo(info) {
        const slopeInfoDiv = document.getElementById('slopeInfo');

        if (!info) {
            slopeInfoDiv.innerHTML = '<p class="text-muted">Click two points on the square to get started!</p>';
            return;
        }

        if (info.status === 'one_point') {
            const p = info.point;
            slopeInfoDiv.innerHTML = `
                <p><strong>Point 1:</strong> (${p.x.toFixed(3)}, ${p.y.toFixed(3)})</p>
                <p class="text-primary"><strong>Click a second point to draw the line!</strong></p>
            `;
            return;
        }

        // Full slope info with CRYSTAL CLEAR classification
        const icon = info.isRational ? '🟢' : '🔴';
        const colorClass = info.isRational ? 'text-success' : 'text-danger';

        let clarification = '';
        if (info.isRational) {
            clarification = `
                <div class="classification-badge rational-badge">
                    ✓ RATIONAL NUMBER
                </div>
                <p class="explanation">This <strong>IS</strong> a rational number (fraction).</p>
                <p><strong>Exact Value:</strong> ${info.approxStr}</p>
                <hr class="small-divider">
                <div class="educational-note">
                    <p class="small"><strong>📚 What this means:</strong></p>
                    <ul class="small">
                        <li>The line returns to the starting point after <strong>${Math.abs(info.q)} complete cycles</strong></li>
                        <li>You'll see approximately <strong>${info.expectedSegments} line segments</strong> when it closes</li>
                        <li>This creates a <strong>periodic (repeating) pattern</strong></li>
                    </ul>
                </div>
            `;
        } else {
            // Irrational number - show symbolic name if available
            let symbolInfo = '';
            if (info.symbolName) {
                symbolInfo = `<p class="explanation">This is the <strong>irrational constant ${info.symbolName}</strong> (${info.fullName}).</p>`;
            } else {
                symbolInfo = `<p class="explanation">This slope value <strong>CANNOT</strong> be written as an exact fraction.</p>`;
            }

            clarification = `
                <div class="classification-badge irrational-badge">
                    ✗ IRRATIONAL NUMBER
                </div>
                ${symbolInfo}
                <p><strong>Best Approximation:</strong> ${info.approxStr}</p>
                <p class="small text-muted">(Error: ${Math.abs(info.slope - info.p/info.q).toExponential(2)})</p>
            `;
        }

        slopeInfoDiv.innerHTML = `
            <h4 class="${colorClass}">
                <span class="icon">${icon}</span>
                ${info.classification}
            </h4>
            <hr>
            ${clarification}
            <hr>
            <p><strong>Slope Value:</strong> α = ${Math.abs(info.slope) < 100 ? info.slope.toFixed(6) : '∞'}</p>
            <p class="${colorClass}"><strong>${info.description}</strong></p>
            <hr>
            <p><strong>Animation Progress:</strong> <span id="wrapCounter">${this.animationProgress.toFixed(1)}</span> / ${this.maxWraps} wraps</p>
            <p class="small text-muted">Click <strong>Play</strong> to watch the line wrap!</p>
        `;
    }

    play() {
        if (this.clickedPoints.length < 2) return;

        this.isAnimating = true;
        document.getElementById('playBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        this.animate();
    }

    pause() {
        this.isAnimating = false;
        document.getElementById('playBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }

    clear() {
        this.pause();
        this.clickedPoints = [];
        this.slope = null;
        this.slopeInfo = null;
        this.animationProgress = 0;
        this.drawEmptyCanvas();
        this.updateInfo(null);
    }

    animate() {
        if (!this.isAnimating) return;

        // Increment progress based on speed
        this.animationProgress += this.animationSpeed * 0.02;

        // Loop animation at max wraps
        if (this.animationProgress > this.maxWraps) {
            this.animationProgress = 0;
        }

        this.updateVisualization();

        // Update wrap counter
        const wrapCounter = document.getElementById('wrapCounter');
        if (wrapCounter) {
            wrapCounter.textContent = this.animationProgress.toFixed(1);
        }

        requestAnimationFrame(() => this.animate());
    }

    applyPreset(presetName) {
        this.pause();
        const slope = MathUtils.getPresetSlope(presetName);
        const points = MathUtils.getPresetPoints(slope);

        this.clickedPoints = points;
        this.animationProgress = 0;
        this.updateVisualization();
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new FlatTorusApp();
    window.torusApp = app; // Make available for debugging
    console.log('Flat Torus App initialized! Try clicking two points or using presets.');
});
