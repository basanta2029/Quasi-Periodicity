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
        this.origin = { x: 0.5, y: 0.5 }; // Origin at center of square
        this.directionPoint = null; // User selects only the direction
        this.slope = null;
        this.slopeInfo = null;
        this.isAnimating = false;
        this.animationProgress = 0;
        this.animationSpeed = 5;
        this.maxWraps = 30; // Will be dynamic based on slope type

        // Dragging state
        this.isDragging = false;
        this.draggedPointIndex = -1;

        // Angle preview state
        this.mousePosition = null;
        this.showAngleGuide = true;

        this.init();
    }

    init() {
        this.drawEmptyCanvas();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Canvas click
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Canvas mouse move (for dragging and angle preview)
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => {
            this.handleMouseUp();
            this.mousePosition = null;
            if (!this.isAnimating) this.updateVisualization();
        });

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
                const label = (i / 10).toFixed(1); // Standard orientation: bottom = 0, top = 1
                this.ctx.fillText(label, -5, this.height - pos);
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
        const y = 1 - (canvasY - rect.top) / this.height;  // Inverted: origin at bottom-left
        return {
            x: Math.max(0, Math.min(1, x)),
            y: Math.max(0, Math.min(1, y))
        };
    }

    unitToCanvasCoords(unitX, unitY) {
        return {
            x: unitX * this.width,
            y: (1 - unitY) * this.height  // Inverted: origin at bottom-left
        };
    }

    handleCanvasClick(e) {
        if (this.isDragging) return; // Don't add points while dragging

        const point = this.canvasToUnitCoords(e.clientX, e.clientY);

        // Always use origin as first point, user's click is the direction
        this.directionPoint = point;
        this.pause();
        this.animationProgress = 0;

        this.updateVisualization();
    }

    handleMouseDown(e) {
        if (!this.directionPoint) return;

        const point = this.canvasToUnitCoords(e.clientX, e.clientY);

        // Check if clicking near the direction point (can't drag origin)
        const dx = Math.abs(point.x - this.directionPoint.x);
        const dy = Math.abs(point.y - this.directionPoint.y);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 0.03) { // Within 3% of canvas
            this.isDragging = true;
            this.draggedPointIndex = 1; // Always dragging the direction point
            this.canvas.style.cursor = 'grabbing';
            e.preventDefault();
        }
    }

    handleMouseMove(e) {
        const point = this.canvasToUnitCoords(e.clientX, e.clientY);

        if (!this.isDragging || this.draggedPointIndex === -1) {
            // Update mouse position for angle preview
            this.mousePosition = point;

            // Check if hovering near the direction point
            if (this.directionPoint) {
                const dx = Math.abs(point.x - this.directionPoint.x);
                const dy = Math.abs(point.y - this.directionPoint.y);
                const distance = Math.sqrt(dx * dx + dy * dy);

                this.canvas.style.cursor = (distance < 0.03) ? 'grab' : 'crosshair';
            }

            // Redraw to show angle preview (only if not animating)
            if (!this.isAnimating) {
                this.updateVisualization();
            }
            return;
        }

        // Dragging
        this.directionPoint = point;
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

        // Draw angle guide and preview (if mouse is over canvas and not animating)
        if (this.mousePosition && this.showAngleGuide && !this.isAnimating) {
            this.drawAngleGuide();
            this.drawAnglePreview(this.mousePosition);
        }

        // Note: Origin at center (0.5, 0.5) is used internally but not drawn (due to translation invariance)

        if (!this.directionPoint) {
            this.updateInfo(null, this.mousePosition);
            return;
        }

        // Draw direction point
        this.drawPoints([this.directionPoint], '#2196F3', 8); // Blue for direction

        // Calculate slope and classify (from origin to direction point)
        this.slope = MathUtils.calculateSlope(this.origin, this.directionPoint);
        this.slopeInfo = MathUtils.classifySlope(this.slope);

        // Set dynamic maxWraps based on slope type
        this.maxWraps = this.slopeInfo.isRational ? 30 : 200;

        // Draw geodesic starting from origin
        this.drawGeodesic(this.origin, this.slope, this.animationProgress);

        // Update info panel
        this.updateInfo(this.slopeInfo);
    }

    drawAngleGuide() {
        // Draw a quarter circle from center with angle markers
        const originCanvas = this.unitToCanvasCoords(this.origin.x, this.origin.y);
        const radius = this.width * 0.15; // 15% of canvas width

        // Draw quarter circle arc from 0° (right/east) to 90° (up/north)
        // In canvas: 0° is right, angles increase clockwise
        // But we want mathematical convention: 0° right, 90° up (counterclockwise)
        this.ctx.save();
        this.ctx.strokeStyle = '#999';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        // Start at 0° (right), go counterclockwise to -90° (up in canvas coords)
        this.ctx.arc(originCanvas.x, originCanvas.y, radius, 0, -Math.PI / 2, true);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw angle tick marks and labels
        const angles = [0, 15, 30, 45, 60, 75, 90];
        this.ctx.fillStyle = '#666';
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'center';

        angles.forEach(deg => {
            // Convert to canvas radians: 0° = right, positive angles go UP (counterclockwise)
            const rad = -deg * Math.PI / 180; // Negative for counterclockwise
            const tickRadius = radius;
            const labelRadius = radius + 15;

            // Tick mark
            const tickX = originCanvas.x + tickRadius * Math.cos(rad);
            const tickY = originCanvas.y + tickRadius * Math.sin(rad);

            this.ctx.fillStyle = deg === 45 ? '#FF5722' : '#999'; // Highlight 45°
            this.ctx.beginPath();
            this.ctx.arc(tickX, tickY, 3, 0, 2 * Math.PI);
            this.ctx.fill();

            // Label
            const labelX = originCanvas.x + labelRadius * Math.cos(rad);
            const labelY = originCanvas.y + labelRadius * Math.sin(rad);

            this.ctx.fillStyle = '#666';
            this.ctx.fillText(`${deg}°`, labelX, labelY);
        });

        this.ctx.restore();
    }

    drawAnglePreview(mousePoint) {
        // Draw line from center origin to mouse cursor
        const originCanvas = this.unitToCanvasCoords(this.origin.x, this.origin.y);
        const mouseCanvas = this.unitToCanvasCoords(mousePoint.x, mousePoint.y);

        // Calculate angle and slope from center
        const dx = mousePoint.x - this.origin.x;
        const dy = mousePoint.y - this.origin.y;

        // atan2 gives angle from positive x-axis, counterclockwise
        // We want: 0° = right, 90° = up
        const angleRad = Math.atan2(dy, dx);
        const angleDeg = angleRad * 180 / Math.PI;
        const slope = dy / dx;

        // Draw preview line
        this.ctx.save();
        this.ctx.strokeStyle = '#2196F3';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([10, 5]);
        this.ctx.globalAlpha = 0.6;

        this.ctx.beginPath();
        this.ctx.moveTo(originCanvas.x, originCanvas.y);
        this.ctx.lineTo(mouseCanvas.x, mouseCanvas.y);
        this.ctx.stroke();

        // Draw angle arc from 0° to current angle
        const arcRadius = 40;
        this.ctx.strokeStyle = '#2196F3';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([]);
        this.ctx.beginPath();
        // Arc from 0° (right) counterclockwise to current angle
        // In canvas: counterclockwise = negative direction, but atan2 gives positive for up
        // So we need to negate for canvas
        this.ctx.arc(originCanvas.x, originCanvas.y, arcRadius, 0, -angleRad, angleRad < 0);
        this.ctx.stroke();

        // Draw info box near mouse
        this.ctx.setLineDash([]);
        this.ctx.globalAlpha = 1;
        this.ctx.fillStyle = 'rgba(33, 150, 243, 0.95)';
        this.ctx.fillRect(mouseCanvas.x + 15, mouseCanvas.y - 55, 140, 50);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 11px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Angle: ${angleDeg.toFixed(1)}°`, mouseCanvas.x + 20, mouseCanvas.y - 40);

        this.ctx.font = '10px Arial';
        this.ctx.fillText(`Radians: ${angleRad.toFixed(3)}`, mouseCanvas.x + 20, mouseCanvas.y - 28);
        this.ctx.fillText(`Slope: ${Math.abs(slope) < 100 ? slope.toFixed(3) : '∞'}`, mouseCanvas.x + 20, mouseCanvas.y - 14);

        this.ctx.restore();
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

            // Add label for origin and direction point
            const isOrigin = (point.x === 0 && point.y === 0);
            const isDirection = (this.directionPoint && point.x === this.directionPoint.x && point.y === this.directionPoint.y);

            if (isOrigin || isDirection) {
                const label = isOrigin ? 'Origin' : 'Direction';

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
                this.ctx.fillText(label, canvasCoords.x + 16, canvasCoords.y - 22);

                this.ctx.font = '10px Arial';
                this.ctx.fillText(`(${point.x.toFixed(3)}, ${point.y.toFixed(3)})`,
                                  canvasCoords.x + 16, canvasCoords.y - 10);

                // Reset stroke style
                this.ctx.fillStyle = color;
            }
        });
    }

    drawGeodesic(startPoint, slope, tMax) {
        // Safety check: ensure directionPoint exists
        if (!this.directionPoint) return;

        // Ensure minimum tMax to show initial geodesic
        const effectiveTMax = Math.max(tMax, 0.1);

        // Generate points using direction vector to ensure line passes through direction point
        const nPoints = Math.max(1000, Math.floor(effectiveTMax * 500));
        const points = MathUtils.generateGeodesicFromDirection(startPoint, this.directionPoint, effectiveTMax, nPoints);

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

    updateInfo(info, mousePoint = null) {
        const slopeInfoDiv = document.getElementById('slopeInfo');

        if (!info) {
            let previewHTML = '';
            if (mousePoint) {
                // Calculate preview info
                const dx = mousePoint.x - 0;
                const dy = mousePoint.y - 0;
                const slope = dy / dx;
                const angleRad = Math.atan2(dy, dx);
                const angleDeg = angleRad * 180 / Math.PI;

                // Classify the slope
                const slopeInfo = MathUtils.classifySlope(slope);
                const icon = slopeInfo.isRational ? '🟢' : '🔴';
                const colorClass = slopeInfo.isRational ? 'text-success' : 'text-danger';

                previewHTML = `
                    <div style="background: #f0f0f0; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                        <p class="small"><strong>📐 Angle Preview:</strong></p>
                        <p class="small">Angle: <strong>${angleDeg.toFixed(1)}°</strong> (${angleRad.toFixed(3)} rad)</p>
                        <p class="small">Slope: <strong>${Math.abs(slope) < 100 ? slope.toFixed(3) : '∞'}</strong></p>
                        <hr class="small-divider">
                        <p class="small ${colorClass}"><span class="icon">${icon}</span> ${slopeInfo.classification}</p>
                    </div>
                `;
            }

            slopeInfoDiv.innerHTML = `
                ${previewHTML}
                <p class="text-muted">Click anywhere to set the geodesic direction from the origin!</p>
                <hr class="small-divider">
                <p class="small"><strong>ℹ️ Note:</strong> Due to translation invariance, all geodesics start from the origin <strong>(0, 0)</strong> at the bottom-left corner.</p>
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
        if (!this.directionPoint) return;

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
        this.directionPoint = null;
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
        const directionPoint = MathUtils.getPresetDirectionPoint(slope);

        this.directionPoint = directionPoint;
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
