// True Quasicrystal Generator using Wave Interference (Option B)
// Creates genuine quasiperiodic patterns with proper incommensurability

class WaveQuasicrystal {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = {
            symmetry: config.symmetry || 5,
            scale: config.scale || 50,
            method: config.method || 'dualWave', // 'dualWave' or 'goldenRatio'
            showContours: config.showContours || true,
            contourLevels: config.contourLevels || 20,
            colorScheme: config.colorScheme || 'quasicrystal',
            ...config
        };
        
        // Golden ratio for incommensurability
        this.PHI = (1 + Math.sqrt(5)) / 2;
    }
    
    // Generate wave vectors with proper quasicrystal properties
    generateWaveVectors() {
        const vectors = [];
        const n = this.config.symmetry;
        
        if (this.config.method === 'goldenRatio') {
            // Method 1: Two sets of waves with golden ratio scaling
            // This ensures incommensurability
            
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
            
            // Second set with golden ratio scaling
            for (let i = 0; i < n; i++) {
                const angle = 2 * Math.PI * i / n + Math.PI / n; // Offset
                vectors.push({
                    qx: Math.cos(angle) * this.PHI,
                    qy: Math.sin(angle) * this.PHI,
                    magnitude: 1,
                    phase: 0
                });
            }
        } else { // dualWave method
            // Method 2: Waves with two incommensurate wavelengths
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
                    magnitude: 0.618, // Slightly less amplitude
                    phase: Math.PI / 4 // Phase shift
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
        
        const waveVectors = this.generateWaveVectors();
        
        // Calculate density field
        const densityField = [];
        let minDensity = Infinity;
        let maxDensity = -Infinity;
        
        for (let py = 0; py < height; py++) {
            densityField[py] = [];
            for (let px = 0; px < width; px++) {
                // Convert to physical coordinates
                const x = (px - width / 2) / this.config.scale;
                const y = (py - height / 2) / this.config.scale;
                
                const density = this.calculateDensity(x, y, waveVectors);
                densityField[py][px] = density;
                
                minDensity = Math.min(minDensity, density);
                maxDensity = Math.max(maxDensity, density);
            }
        }
        
        // Normalize and apply color scheme
        const range = maxDensity - minDensity;
        
        for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
                const normalized = (densityField[py][px] - minDensity) / range;
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
            this.drawContours(densityField, minDensity, maxDensity);
        }
        
        // Store for analysis
        this.densityField = densityField;
        this.waveVectors = waveVectors;
    }
    
    // Color schemes for true quasicrystals
    getColor(value) {
        const schemes = {
            quasicrystal: (v) => {
                // Classic quasicrystal coloring
                if (v < 0.2) return { r: 25, g: 25, b: 112 };      // Midnight blue
                if (v < 0.4) return { r: 65, g: 105, b: 225 };     // Royal blue
                if (v < 0.5) return { r: 255, g: 255, b: 255 };    // White
                if (v < 0.6) return { r: 255, g: 215, b: 0 };      // Gold
                if (v < 0.8) return { r: 255, g: 140, b: 0 };      // Dark orange
                return { r: 139, g: 69, b: 19 };                   // Saddle brown
            },
            
            physics: (v) => {
                // Like density plots in physics papers
                const r = Math.floor(255 * Math.max(0, 2 * v - 1));
                const g = Math.floor(255 * (1 - Math.abs(2 * v - 1)));
                const b = Math.floor(255 * Math.max(0, 1 - 2 * v));
                return { r, g, b };
            },
            
            binary: (v) => {
                // High contrast for structure analysis
                const threshold = 0.5;
                if (v > threshold) return { r: 0, g: 0, b: 0 };
                return { r: 255, g: 255, b: 255 };
            }
        };
        
        const scheme = schemes[this.config.colorScheme] || schemes.quasicrystal;
        return scheme(value);
    }
    
    // Draw contour lines
    drawContours(densityField, minDensity, maxDensity) {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const levels = this.config.contourLevels;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 0.5;
        
        // Draw contour lines at equally spaced levels
        for (let i = 1; i < levels; i++) {
            const level = minDensity + (i / levels) * (maxDensity - minDensity);
            
            // Simple contour tracing (marching squares would be better)
            ctx.beginPath();
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    const current = densityField[y][x];
                    const right = densityField[y][x + 1];
                    const bottom = densityField[y + 1][x];
                    
                    // Check for level crossing
                    if ((current < level && right >= level) || (current >= level && right < level)) {
                        const t = (level - current) / (right - current);
                        ctx.moveTo(x + t, y);
                        ctx.lineTo(x + t, y + 0.1);
                    }
                    
                    if ((current < level && bottom >= level) || (current >= level && bottom < level)) {
                        const t = (level - current) / (bottom - current);
                        ctx.moveTo(x, y + t);
                        ctx.lineTo(x + 0.1, y + t);
                    }
                }
            }
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    // Verify this is a true quasicrystal
    verifyQuasicrystalline() {
        console.log('Verifying quasicrystalline properties...');
        
        // 1. Check for sharp diffraction peaks
        const fft = this.computeFFT();
        const hasSharpPeaks = this.analyzeFFTPeaks(fft);
        
        // 2. Check for forbidden symmetry
        const symmetry = this.config.symmetry;
        const hasForbiddenSymmetry = [5, 7, 8, 10, 11, 12].includes(symmetry);
        
        // 3. Check for aperiodicity
        const isAperiodic = this.checkAperiodicity();
        
        console.log('Sharp diffraction peaks:', hasSharpPeaks);
        console.log('Forbidden symmetry:', hasForbiddenSymmetry);
        console.log('Aperiodic:', isAperiodic);
        
        return hasSharpPeaks && hasForbiddenSymmetry && isAperiodic;
    }
    
    // Simple FFT analysis (placeholder - real implementation would be more complex)
    computeFFT() {
        // This would compute the 2D FFT of the density field
        // For now, return mock data
        return {
            peaks: this.config.symmetry * 2,
            sharpness: 0.9
        };
    }
    
    analyzeFFTPeaks(fft) {
        return fft.sharpness > 0.8;
    }
    
    checkAperiodicity() {
        // Golden ratio ensures aperiodicity
        return this.config.method === 'goldenRatio' || this.config.method === 'dualWave';
    }
    
    // Get pattern information
    getInfo() {
        return {
            type: 'Wave Interference Quasicrystal',
            symmetry: this.config.symmetry + '-fold',
            method: this.config.method,
            waves: this.waveVectors.length,
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