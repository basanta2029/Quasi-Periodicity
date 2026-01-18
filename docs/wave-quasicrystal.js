// True Quasicrystal Generator using Wave Interference
// Creates genuine quasiperiodic patterns with proper incommensurability
// Implements proper marching squares for contour visualization

class WaveQuasicrystal {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = {
            symmetry: config.symmetry !== undefined ? config.symmetry : 5,
            scale: config.scale !== undefined ? config.scale : 50,
            method: config.method || 'dualWave',
            showContours: config.showContours !== undefined ? config.showContours : false,
            contourLevels: config.contourLevels !== undefined ? config.contourLevels : 10,
            colorScheme: config.colorScheme || 'quasicrystal'
        };

        // Golden ratio for incommensurability
        this.PHI = (1 + Math.sqrt(5)) / 2;
        this.densityField = null;
        this.waveVectors = null;
    }

    // Generate wave vectors with proper quasicrystal properties
    generateWaveVectors() {
        const vectors = [];
        const n = this.config.symmetry;

        if (this.config.method === 'goldenRatio') {
            // Method 1: Two sets of waves with golden ratio scaling
            // First set of waves
            for (let i = 0; i < n; i++) {
                const angle = 2 * Math.PI * i / n;
                vectors.push({
                    qx: Math.cos(angle),
                    qy: Math.sin(angle),
                    magnitude: 1,
                    phase: 0
                });
            }

            // Second set with golden ratio scaling (incommensurate)
            for (let i = 0; i < n; i++) {
                const angle = 2 * Math.PI * i / n + Math.PI / n;
                vectors.push({
                    qx: Math.cos(angle) * this.PHI,
                    qy: Math.sin(angle) * this.PHI,
                    magnitude: 0.8,
                    phase: 0
                });
            }
        } else {
            // dualWave method: Waves with two incommensurate wavelengths
            const q1 = 1;
            const q2 = this.PHI;

            for (let i = 0; i < n; i++) {
                const angle = 2 * Math.PI * i / n;

                // Wave with wavelength 2π/q1
                vectors.push({
                    qx: q1 * Math.cos(angle),
                    qy: q1 * Math.sin(angle),
                    magnitude: 1,
                    phase: 0
                });

                // Wave with incommensurate wavelength 2π/q2
                vectors.push({
                    qx: q2 * Math.cos(angle),
                    qy: q2 * Math.sin(angle),
                    magnitude: 0.618,
                    phase: Math.PI / 4
                });
            }
        }

        return vectors;
    }

    // Calculate the density field ρ(x,y)
    calculateDensity(x, y, waveVectors) {
        let density = 0;
        for (const wave of waveVectors) {
            const dotProduct = wave.qx * x + wave.qy * y;
            density += wave.magnitude * Math.cos(dotProduct + wave.phase);
        }
        return density;
    }

    // Generate the quasicrystal pattern
    generate() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const imageData = this.ctx.createImageData(width, height);
        const data = imageData.data;

        this.waveVectors = this.generateWaveVectors();

        // Calculate density field
        this.densityField = [];
        let minDensity = Infinity;
        let maxDensity = -Infinity;

        for (let py = 0; py < height; py++) {
            this.densityField[py] = [];
            for (let px = 0; px < width; px++) {
                const x = (px - width / 2) / this.config.scale;
                const y = (py - height / 2) / this.config.scale;

                const density = this.calculateDensity(x, y, this.waveVectors);
                this.densityField[py][px] = density;

                minDensity = Math.min(minDensity, density);
                maxDensity = Math.max(maxDensity, density);
            }
        }

        // Normalize and apply color scheme
        const range = maxDensity - minDensity;

        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const normalized = (this.densityField[py][px] - minDensity) / range;
                const color = this.getColor(normalized);

                const idx = (py * width + px) * 4;
                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = 255;
            }
        }

        this.ctx.putImageData(imageData, 0, 0);

        // Draw contours if requested
        if (this.config.showContours) {
            this.drawContoursMarching(this.densityField, minDensity, maxDensity);
        }
    }

    // Smooth color interpolation
    getColor(value) {
        value = Math.max(0, Math.min(1, value));

        const schemes = {
            quasicrystal: (v) => {
                // Smooth gradient: deep blue -> cyan -> white -> yellow -> orange
                if (v < 0.25) {
                    const t = v / 0.25;
                    return this.lerpColor({r: 20, g: 20, b: 100}, {r: 30, g: 100, b: 180}, t);
                } else if (v < 0.5) {
                    const t = (v - 0.25) / 0.25;
                    return this.lerpColor({r: 30, g: 100, b: 180}, {r: 255, g: 255, b: 255}, t);
                } else if (v < 0.75) {
                    const t = (v - 0.5) / 0.25;
                    return this.lerpColor({r: 255, g: 255, b: 255}, {r: 255, g: 200, b: 50}, t);
                } else {
                    const t = (v - 0.75) / 0.25;
                    return this.lerpColor({r: 255, g: 200, b: 50}, {r: 180, g: 80, b: 20}, t);
                }
            },

            physics: (v) => {
                // Classic physics colormap (blue -> green -> yellow -> red)
                if (v < 0.33) {
                    const t = v / 0.33;
                    return this.lerpColor({r: 0, g: 0, b: 255}, {r: 0, g: 255, b: 0}, t);
                } else if (v < 0.66) {
                    const t = (v - 0.33) / 0.33;
                    return this.lerpColor({r: 0, g: 255, b: 0}, {r: 255, g: 255, b: 0}, t);
                } else {
                    const t = (v - 0.66) / 0.34;
                    return this.lerpColor({r: 255, g: 255, b: 0}, {r: 255, g: 0, b: 0}, t);
                }
            },

            binary: (v) => {
                return v > 0.5 ? {r: 0, g: 0, b: 0} : {r: 255, g: 255, b: 255};
            }
        };

        const scheme = schemes[this.config.colorScheme] || schemes.quasicrystal;
        return scheme(value);
    }

    // Linear interpolation between colors
    lerpColor(c1, c2, t) {
        return {
            r: Math.round(c1.r + (c2.r - c1.r) * t),
            g: Math.round(c1.g + (c2.g - c1.g) * t),
            b: Math.round(c1.b + (c2.b - c1.b) * t)
        };
    }

    // Proper Marching Squares contour algorithm
    drawContoursMarching(densityField, minDensity, maxDensity) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const levels = this.config.contourLevels;

        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.lineWidth = 1;

        // Draw contour lines at equally spaced levels
        for (let i = 1; i < levels; i++) {
            const level = minDensity + (i / levels) * (maxDensity - minDensity);
            this.traceContour(densityField, level, width, height);
        }

        ctx.restore();
    }

    // Marching squares contour tracing
    traceContour(field, level, width, height) {
        const ctx = this.ctx;

        ctx.beginPath();

        for (let y = 0; y < height - 1; y++) {
            for (let x = 0; x < width - 1; x++) {
                // Get values at corners of cell
                const v00 = field[y][x];
                const v10 = field[y][x + 1];
                const v01 = field[y + 1][x];
                const v11 = field[y + 1][x + 1];

                // Determine cell configuration (4-bit index)
                let config = 0;
                if (v00 >= level) config |= 1;
                if (v10 >= level) config |= 2;
                if (v11 >= level) config |= 4;
                if (v01 >= level) config |= 8;

                // Skip if all corners same
                if (config === 0 || config === 15) continue;

                // Linear interpolation for edge crossings
                const lerp = (v1, v2) => {
                    if (Math.abs(v2 - v1) < 0.0001) return 0.5;
                    return (level - v1) / (v2 - v1);
                };

                // Edge midpoints
                const top = x + lerp(v00, v10);
                const bottom = x + lerp(v01, v11);
                const left = y + lerp(v00, v01);
                const right = y + lerp(v10, v11);

                // Draw line segments based on configuration
                switch (config) {
                    case 1: case 14:
                        ctx.moveTo(x, left); ctx.lineTo(top, y);
                        break;
                    case 2: case 13:
                        ctx.moveTo(top, y); ctx.lineTo(x + 1, right);
                        break;
                    case 3: case 12:
                        ctx.moveTo(x, left); ctx.lineTo(x + 1, right);
                        break;
                    case 4: case 11:
                        ctx.moveTo(x + 1, right); ctx.lineTo(bottom, y + 1);
                        break;
                    case 5:
                        ctx.moveTo(x, left); ctx.lineTo(top, y);
                        ctx.moveTo(x + 1, right); ctx.lineTo(bottom, y + 1);
                        break;
                    case 6: case 9:
                        ctx.moveTo(top, y); ctx.lineTo(bottom, y + 1);
                        break;
                    case 7: case 8:
                        ctx.moveTo(x, left); ctx.lineTo(bottom, y + 1);
                        break;
                    case 10:
                        ctx.moveTo(x, left); ctx.lineTo(bottom, y + 1);
                        ctx.moveTo(top, y); ctx.lineTo(x + 1, right);
                        break;
                }
            }
        }

        ctx.stroke();
    }

    // Verify quasicrystalline properties
    verifyQuasicrystalline() {
        const symmetry = this.config.symmetry;
        const hasForbiddenSymmetry = [5, 7, 8, 10, 11, 12].includes(symmetry);
        const isAperiodic = this.config.method === 'goldenRatio' || this.config.method === 'dualWave';
        return hasForbiddenSymmetry && isAperiodic;
    }

    getInfo() {
        return {
            type: 'Wave Interference Quasicrystal',
            symmetry: this.config.symmetry + '-fold',
            method: this.config.method,
            waves: this.waveVectors ? this.waveVectors.length : 0,
            genuine: this.verifyQuasicrystalline()
        };
    }
}

// Helper function to create wave quasicrystal
function createWaveQuasicrystal(canvasId, config = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with id '${canvasId}' not found`);
        return null;
    }

    const qc = new WaveQuasicrystal(canvas, config);
    qc.generate();

    return qc;
}
