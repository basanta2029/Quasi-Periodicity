/**
 * 3D Torus Renderer and Interaction Manager v2.0
 *
 * UPDATED: Progressive reveal system for irrational slopes (maxProgress=200)
 * UPDATED: Grey marker color instead of yellow
 *
 * This module handles:
 * - Three.js scene setup and rendering
 * - User interaction (raycasting, point selection)
 * - Geodesic curve visualization
 * - Animation system
 */

class TorusApp {
    constructor() {
        this.container = document.getElementById('canvas-container');

        // Scene components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Torus mesh
        this.torusMesh = null;

        // Raycaster for clicking
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        // State
        this.originPoint = { theta: 0, phi: 0, mesh: null }; // Always at origin
        this.directionPoint = null; // User selects only the direction
        this.windingNumbers = null;
        this.windingInfo = null;

        // Geodesic rendering
        this.geodesicCurve = null;
        this.geodesicPoints = [];
        this.fullGeodesicPoints = null; // Pre-generated full curve for irrational
        // Note: Traveling marker removed for cleaner visualization

        // Animation
        this.isAnimating = false;
        this.animationProgress = 0;
        this.animationSpeed = 1;
        this.maxProgress = 60; // Will be dynamic: 60 for rational, 200 for irrational
        this.frameCounter = 0; // For throttling geometry updates
        this.updateInterval = 3; // Update geometry every N frames (not every frame!)

        this.init();
    }

    init() {
        this.setupScene();
        this.setupLights();
        this.createTorus();
        this.createOriginMarker(); // Always show origin
        this.setupEventListeners();
        this.updateInfo(null);
        this.animate();
    }

    createOriginMarker() {
        // Create permanent origin marker
        const pos = TorusGeometry.toroidalTo3D(0, 0);
        const geometry = new THREE.SphereGeometry(0.15, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: 0xFF5722,  // Orange for origin
            emissive: 0xFF5722,
            emissiveIntensity: 0.3,
            shininess: 100
        });
        this.originPoint.mesh = new THREE.Mesh(geometry, material);
        this.originPoint.mesh.position.set(pos.x, pos.y, pos.z);
        this.scene.add(this.originPoint.mesh);
    }

    setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf5f5f5);

        // Camera
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
        this.camera.position.set(8, 4, 8);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Orbit Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 20;

        // Add coordinate grid
        const gridHelper = new THREE.GridHelper(20, 20, 0xcccccc, 0xe0e0e0);
        this.scene.add(gridHelper);

        // Add coordinate axes (X=red, Y=green, Z=blue)
        const axesHelper = new THREE.AxesHelper(5);
        this.scene.add(axesHelper);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional lights
        const light1 = new THREE.DirectionalLight(0xffffff, 0.8);
        light1.position.set(5, 5, 5);
        this.scene.add(light1);

        const light2 = new THREE.DirectionalLight(0xffffff, 0.4);
        light2.position.set(-5, -5, -5);
        this.scene.add(light2);
    }

    createTorus() {
        const R = TorusGeometry.R;
        const r = TorusGeometry.r;

        // Torus geometry
        const geometry = new THREE.TorusGeometry(R, r, 64, 128);

        // Semi-transparent material with wireframe overlay - more vibrant
        const material = new THREE.MeshPhongMaterial({
            color: 0x5599ff,
            transparent: true,
            opacity: 0.85,
            side: THREE.DoubleSide,
            shininess: 30
        });

        this.torusMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.torusMesh);

        // Add wireframe
        const wireframeGeometry = new THREE.TorusGeometry(R, r, 32, 64);
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x3366ff,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
        this.scene.add(wireframe);
    }

    setupEventListeners() {
        // Canvas click for point selection
        this.renderer.domElement.addEventListener('click', (e) => this.handleCanvasClick(e));

        // Button controls
        document.getElementById('clearBtn').addEventListener('click', () => this.clear());
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('resetCameraBtn').addEventListener('click', () => this.resetCamera());

        // Speed slider
        const speedSlider = document.getElementById('speedSlider');
        speedSlider.addEventListener('input', (e) => {
            const sliderValue = parseInt(e.target.value);
            const speedMap = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12];
            this.animationSpeed = speedMap[sliderValue];
            document.getElementById('speedValue').textContent = `${this.animationSpeed}x`;
        });

        // Preset buttons
        document.querySelectorAll('.btn-preset').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const presetName = e.target.getAttribute('data-preset');
                this.applyPreset(presetName);
            });
        });
    }

    handleCanvasClick(event) {
        // Skip if currently dragging camera
        if (this.controls.isDragging) return;

        // Calculate mouse position in normalized device coordinates
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Raycast
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.torusMesh);

        if (intersects.length > 0) {
            const point3D = intersects[0].point;

            // Convert to toroidal coordinates
            const toroidal = TorusGeometry.cartesianToToroidal(point3D.x, point3D.y, point3D.z);

            // Remove old direction marker if exists
            if (this.directionPoint && this.directionPoint.mesh) {
                this.scene.remove(this.directionPoint.mesh);
            }

            // Create new direction marker
            const marker = this.createPointMarker(point3D, false); // false = not origin

            // Set direction point (origin is always first)
            this.directionPoint = {
                theta: toroidal.theta,
                phi: toroidal.phi,
                x: point3D.x,
                y: point3D.y,
                z: point3D.z,
                mesh: marker
            };

            this.animationProgress = 0;
            this.pause();
            this.updateVisualization();
        }
    }

    createPointMarker(position, isOrigin = false) {
        const geometry = new THREE.SphereGeometry(0.15, 16, 16);
        const color = isOrigin ? 0xFF5722 : 0x00aaff; // Orange for origin, bright blue for direction
        const emissive = isOrigin ? 0xFF5722 : 0x00aaff;

        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: emissive,
            emissiveIntensity: 0.3,
            shininess: 100
        });
        const marker = new THREE.Mesh(geometry, material);
        marker.position.copy(position);
        this.scene.add(marker);
        return marker;
    }

    updateVisualization() {
        // Remove old geodesic curve
        if (this.geodesicCurve) {
            if (this.geodesicCurve.geometry) {
                this.geodesicCurve.geometry.dispose();
            }
            if (this.geodesicCurve.material) {
                this.geodesicCurve.material.dispose();
            }
            this.scene.remove(this.geodesicCurve);
            this.geodesicCurve = null;
        }

        // Reset pre-generated curve data
        this.fullGeodesicPoints = null;

        if (!this.directionPoint) {
            this.updateInfo(null);
            return;
        }

        // Calculate winding numbers from origin to direction point
        this.windingNumbers = TorusGeometry.calculateWindingNumbers(
            this.originPoint,
            this.directionPoint
        );

        // Classify
        this.windingInfo = TorusGeometry.classifyWindingNumbers(
            this.windingNumbers.p,
            this.windingNumbers.q
        );

        // Set max progress based on type (higher for more complete coverage)
        this.maxProgress = this.windingInfo.isRational ? 200 : 500;

        // For irrational, pre-generate full curve for progressive reveal
        if (!this.windingInfo.isRational) {
            this.pregenerateIrrationalCurve();
        } else {
            // For rational, draw normally
            this.drawGeodesic(this.animationProgress);
        }

        // Update info panel
        this.updateInfo(this.windingInfo);
    }

    drawGeodesic(tMax) {
        if (!this.directionPoint) return;

        // Skip if this is a pre-generated irrational curve (use progressive reveal instead)
        if (this.windingInfo && !this.windingInfo.isRational && this.fullGeodesicPoints) {
            return;
        }

        // Remove old curve and dispose geometry/material to free GPU memory
        if (this.geodesicCurve) {
            if (this.geodesicCurve.geometry) {
                this.geodesicCurve.geometry.dispose();
            }
            if (this.geodesicCurve.material) {
                this.geodesicCurve.material.dispose();
            }
            this.scene.remove(this.geodesicCurve);
        }

        const startPoint = this.originPoint;
        const { p, q } = this.windingNumbers;

        // Generate geodesic points (capped at 1000 for performance)
        const nPoints = Math.min(1000, Math.max(300, Math.floor(tMax * 10)));
        this.geodesicPoints = TorusGeometry.generateGeodesic(
            startPoint,
            p,
            q,
            tMax,
            nPoints
        );

        if (this.geodesicPoints.length < 2) return;

        // Create curve geometry (optimized for performance)
        const points = this.geodesicPoints.map(pt => new THREE.Vector3(pt.x, pt.y, pt.z));
        const curve = new THREE.CatmullRomCurve3(points);
        const tubularSegments = Math.min(1000, points.length);
        const tubeGeometry = new THREE.TubeGeometry(curve, tubularSegments, 0.05, 6, false);

        // Color based on classification - more vibrant colors
        const color = this.windingInfo && this.windingInfo.isRational ? 0x00ff00 : 0xff0066;

        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
            shininess: 50
        });

        this.geodesicCurve = new THREE.Mesh(tubeGeometry, material);
        this.scene.add(this.geodesicCurve);
    }

    pregenerateIrrationalCurve() {
        // Pre-generate FULL geodesic curve for irrational slopes
        // This allows progressive reveal without regenerating geometry
        const startPoint = this.originPoint;
        const { p, q } = this.windingNumbers;

        // Generate complete geodesic at maxProgress (200)
        const nPoints = 1000;
        this.fullGeodesicPoints = TorusGeometry.generateGeodesic(
            startPoint,
            p,
            q,
            this.maxProgress,
            nPoints
        );

        // Create full tube geometry ONCE
        const points = this.fullGeodesicPoints.map(pt => new THREE.Vector3(pt.x, pt.y, pt.z));
        const curve = new THREE.CatmullRomCurve3(points);
        const tubularSegments = 1000; // Increased for smoother curves
        const tubeGeometry = new THREE.TubeGeometry(curve, tubularSegments, 0.05, 8, false); // Increased radial segments to 8

        // Vibrant pink color for irrational
        const color = 0xff0066;
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3,
            shininess: 50
        });

        this.geodesicCurve = new THREE.Mesh(tubeGeometry, material);
        this.geodesicCurve.geometry.setDrawRange(0, 0); // Start hidden
        this.scene.add(this.geodesicCurve);
    }

    revealIrrationalCurveUpTo(progress) {
        // Progressively reveal the pre-generated curve (NO geometry regeneration!)
        if (!this.geodesicCurve || !this.fullGeodesicPoints) return;

        // Calculate how much to reveal (0 to 1)
        const revealRatio = Math.min(1, progress / this.maxProgress);

        // Update draw range to reveal more of the geometry
        const totalIndices = this.geodesicCurve.geometry.index.count;
        const maxIndex = Math.floor(totalIndices * revealRatio);
        this.geodesicCurve.geometry.setDrawRange(0, maxIndex);
    }

    // Traveling marker functions removed for cleaner visualization

    updateInfo(info) {
        const infoDiv = document.getElementById('geodesicInfo');

        if (!info) {
            infoDiv.innerHTML = `
                <p class="text-muted">Click anywhere on the torus to set the geodesic direction!</p>
                <hr>
                <p class="small"><strong>💡 How to interact:</strong></p>
                <ul class="small">
                    <li>The <strong style="color: #FF5722;">orange marker</strong> shows the origin</li>
                    <li>Click to set the direction (creates a <strong style="color: #2196F3;">blue marker</strong>)</li>
                    <li>Drag to rotate the view</li>
                    <li>Scroll to zoom in/out</li>
                    <li>Watch the geodesic curve grow along the surface</li>
                </ul>
                <hr>
                <p class="small"><strong>ℹ️ Note:</strong> Due to translation invariance, all geodesics start from the origin.</p>
            `;
            return;
        }

        // Full info display
        const icon = info.isRational ? '🟢' : '🔴';
        const colorClass = info.isRational ? 'text-success' : 'text-danger';

        let clarification = '';
        if (info.isRational) {
            clarification = `
                <div class="classification-badge rational-badge">
                    ✓ RATIONAL WINDING NUMBERS
                </div>
                <p class="explanation">This geodesic has rational winding numbers (${info.p}, ${info.q}).</p>
                <hr class="small-divider">
                <div class="educational-note">
                    <p class="small"><strong>📚 What this means:</strong></p>
                    <ul class="small">
                        <li>The curve <strong>closes after finite time</strong></li>
                        <li>Forms a <strong>periodic pattern</strong> on the torus</li>
                        <li>Wraps ${Math.abs(info.p)} times around major circle, ${Math.abs(info.q)} times around minor circle</li>
                    </ul>
                </div>
            `;
        } else {
            let symbolInfo = '';
            if (info.symbolName) {
                symbolInfo = `<p class="explanation">This geodesic has <strong>irrational winding ratio ${info.symbolName}</strong>.</p>`;
            } else {
                symbolInfo = `<p class="explanation">This geodesic has <strong>irrational winding numbers</strong>.</p>`;
            }

            clarification = `
                <div class="classification-badge irrational-badge">
                    ✗ IRRATIONAL WINDING NUMBERS
                </div>
                ${symbolInfo}
                <p><strong>Approximation:</strong> ${info.approximation || info.approxStr}</p>
                <hr class="small-divider">
                <div class="educational-note">
                    <p class="small"><strong>📚 What this means:</strong></p>
                    <ul class="small">
                        <li>The curve <strong>never closes</strong></li>
                        <li>Densely fills the torus surface over time</li>
                        <li>Creates a <strong>quasiperiodic pattern</strong></li>
                    </ul>
                </div>
            `;
        }

        // Format point coordinates
        const pt1 = this.originPoint;
        const pt2 = this.directionPoint;
        const coordsInfo = `
            <p class="small"><strong>📍 Origin:</strong> (θ: ${pt1.theta.toFixed(3)}, φ: ${pt1.phi.toFixed(3)})</p>
            <p class="small"><strong>📍 Direction:</strong> (θ: ${pt2.theta.toFixed(3)}, φ: ${pt2.phi.toFixed(3)})</p>
        `;

        infoDiv.innerHTML = `
            <h4 class="${colorClass}">
                <span class="icon">${icon}</span>
                ${info.classification}
            </h4>
            <hr>
            ${clarification}
            <hr>
            <p><strong>Winding Numbers:</strong> ${info.approxStr}</p>
            <p class="${colorClass}"><strong>${info.description}</strong></p>
            <hr>
            ${coordsInfo}
            <hr>
            <p><strong>Animation Progress:</strong> <span id="progressCounter">${this.animationProgress.toFixed(1)}</span> / ${this.maxProgress}</p>
            <p class="small text-muted">Click <strong>Play</strong> to watch the geodesic grow!</p>
        `;
    }

    play() {
        if (!this.directionPoint) return;

        this.isAnimating = true;
        document.getElementById('playBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
    }

    pause() {
        this.isAnimating = false;
        document.getElementById('playBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
    }

    clear() {
        this.pause();

        // Remove direction marker (keep origin)
        if (this.directionPoint && this.directionPoint.mesh) {
            this.scene.remove(this.directionPoint.mesh);
        }
        this.directionPoint = null;

        // Remove geodesic curve
        if (this.geodesicCurve) {
            if (this.geodesicCurve.geometry) {
                this.geodesicCurve.geometry.dispose();
            }
            if (this.geodesicCurve.material) {
                this.geodesicCurve.material.dispose();
            }
            this.scene.remove(this.geodesicCurve);
            this.geodesicCurve = null;
        }

        this.windingNumbers = null;
        this.windingInfo = null;
        this.fullGeodesicPoints = null; // Reset pre-generated curve
        this.animationProgress = 0;
        this.updateInfo(null);
    }

    resetCamera() {
        this.camera.position.set(8, 4, 8);
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
    }

    applyPreset(presetName) {
        this.clear();

        const directionPoint = TorusGeometry.getPresetDirectionPoint(presetName);
        const pos3D = TorusGeometry.toroidalTo3D(directionPoint.theta, directionPoint.phi);
        const marker = this.createPointMarker(new THREE.Vector3(pos3D.x, pos3D.y, pos3D.z), false);

        this.directionPoint = {
            theta: directionPoint.theta,
            phi: directionPoint.phi,
            x: pos3D.x,
            y: pos3D.y,
            z: pos3D.z,
            mesh: marker
        };

        this.animationProgress = 0;
        this.updateVisualization();
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        try {
            // Update controls
            this.controls.update();

            // Animation logic
            if (this.isAnimating && this.directionPoint) {
                this.animationProgress += this.animationSpeed * 0.05;

                if (this.windingInfo && this.windingInfo.isRational) {
                    // Rational: continue growing (no reset - let the torus fill)
                    // Update geometry
                    this.frameCounter++;
                    if (this.frameCounter >= this.updateInterval) {
                        this.drawGeodesic(this.animationProgress);
                        this.frameCounter = 0;
                    }
                } else {
                    // Irrational: progressive reveal (no geometry regeneration!)
                    if (this.animationProgress < this.maxProgress) {
                        // Reveal more of the pre-generated curve
                        this.revealIrrationalCurveUpTo(this.animationProgress);
                    }
                    // Continue forever - no reset (let the torus surface fill completely)
                }

                // Update progress counter
                const progressCounter = document.getElementById('progressCounter');
                if (progressCounter) {
                    progressCounter.textContent = this.animationProgress.toFixed(1);
                }
            }

            // Render
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('Animation error:', error);
            // Pause animation on error to prevent crash loop
            this.pause();
        }
    }

    onWindowResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new TorusApp();
    window.torusApp = app; // Make available for debugging
    console.log('3D Torus App initialized! Click two points on the torus to draw a geodesic.');
});
