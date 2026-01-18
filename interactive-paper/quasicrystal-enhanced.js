// Enhanced Quasicrystal Pattern Generator

function createEnhancedQuasicrystal() {
    const canvas = document.getElementById('quasicrystal-demo');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Configuration
    const config = {
        scale: 50,           // Increased scale for better visibility
        amplitude: 1.2,      // Wave amplitude
        colorScheme: 'vibrant', // 'vibrant', 'classic', 'grayscale'
        antialiasing: true,
        showGrid: false,
        offsetX: 0,          // Pan offset X
        offsetY: 0           // Pan offset Y
    };
    
    function generateQuasicrystal() {
        const symmetry = parseInt(document.getElementById('symmetry').value);
        
        // Clear canvas with white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Create off-screen canvas for smoother rendering
        const offCanvas = document.createElement('canvas');
        offCanvas.width = width;
        offCanvas.height = height;
        const offCtx = offCanvas.getContext('2d');
        
        // Generate the pattern
        const imageData = offCtx.createImageData(width, height);
        const data = imageData.data;
        
        // Calculate pattern with enhanced algorithm
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                // Convert to centered coordinates with pan offset
                const cx = (x - width/2) / config.scale + config.offsetX;
                const cy = (y - height/2) / config.scale + config.offsetY;
                
                // Calculate quasicrystal pattern
                let sum = 0;
                for (let i = 0; i < symmetry; i++) {
                    const angle = 2 * Math.PI * i / symmetry;
                    const kx = Math.cos(angle);
                    const ky = Math.sin(angle);
                    
                    // Add wave with phase shift for more interesting patterns
                    sum += config.amplitude * Math.cos(kx * cx + ky * cy);
                }
                
                // Normalize to [0, 1]
                const normalized = (sum + symmetry * config.amplitude) / (2 * symmetry * config.amplitude);
                
                // Get color based on selected scheme
                const color = getColor(normalized, config.colorScheme);
                
                const idx = (y * width + x) * 4;
                data[idx] = color.r;
                data[idx + 1] = color.g;
                data[idx + 2] = color.b;
                data[idx + 3] = 255;
            }
        }
        
        // Apply the image data
        offCtx.putImageData(imageData, 0, 0);
        
        // Draw to main canvas with smoothing
        ctx.imageSmoothingEnabled = config.antialiasing;
        ctx.drawImage(offCanvas, 0, 0);
        
        // Add symmetry lines if requested
        if (config.showGrid) {
            drawSymmetryLines(ctx, width, height, symmetry);
        }
        
        // Add label
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = '16px Arial';
        ctx.fillText(`${symmetry}-fold Symmetry`, 10, height - 10);
    }
    
    function getColor(value, scheme) {
        // Clamp value to [0, 1]
        value = Math.max(0, Math.min(1, value));
        
        switch(scheme) {
            case 'vibrant':
                // Vibrant color scheme with multiple levels
                if (value < 0.2) {
                    return { r: 29, g: 43, b: 83 };      // Dark blue
                } else if (value < 0.35) {
                    return { r: 41, g: 128, b: 185 };    // Medium blue
                } else if (value < 0.5) {
                    return { r: 52, g: 152, b: 219 };    // Light blue
                } else if (value < 0.65) {
                    return { r: 155, g: 89, b: 182 };    // Purple
                } else if (value < 0.8) {
                    return { r: 231, g: 76, b: 60 };     // Red
                } else {
                    return { r: 241, g: 196, b: 15 };    // Yellow
                }
                
            case 'classic':
                // Classic blue-white-red scheme
                if (value < 0.45) {
                    const t = value / 0.45;
                    return {
                        r: Math.floor(41 + (255 - 41) * t),
                        g: Math.floor(128 + (255 - 128) * t),
                        b: Math.floor(185 + (255 - 185) * t)
                    };
                } else if (value < 0.55) {
                    return { r: 255, g: 255, b: 255 };
                } else {
                    const t = (value - 0.55) / 0.45;
                    return {
                        r: 255,
                        g: Math.floor(255 - 255 * t),
                        b: Math.floor(255 - 255 * t)
                    };
                }
                
            case 'grayscale':
                // Grayscale for printing
                const gray = Math.floor(value * 255);
                return { r: gray, g: gray, b: gray };
                
            default:
                // Default to vibrant
                return getColor(value, 'vibrant');
        }
    }
    
    function drawSymmetryLines(ctx, width, height, symmetry) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        
        const cx = width / 2;
        const cy = height / 2;
        const radius = Math.min(width, height) / 2;
        
        for (let i = 0; i < symmetry; i++) {
            const angle = 2 * Math.PI * i / symmetry;
            const endX = cx + radius * Math.cos(angle);
            const endY = cy + radius * Math.sin(angle);
            
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        ctx.setLineDash([]);
    }
    
    // Add controls for enhanced features
    function addEnhancedControls() {
        const controlsDiv = document.querySelector('#quasicrystal-demo').nextElementSibling;
        if (!controlsDiv) return;

        // Add color scheme selector
        const colorControl = document.createElement('label');
        colorControl.style.marginLeft = '20px';
        colorControl.innerHTML = `
            Color Scheme:
            <select id="color-scheme">
                <option value="vibrant">Vibrant</option>
                <option value="classic">Classic</option>
                <option value="grayscale">Grayscale</option>
            </select>
        `;
        controlsDiv.appendChild(colorControl);

        // Add scale slider
        const scaleControl = document.createElement('label');
        scaleControl.style.display = 'block';
        scaleControl.style.marginTop = '10px';
        scaleControl.innerHTML = `
            Zoom: <input type="range" id="scale-slider" min="20" max="100" value="50">
            <span id="scale-value">50</span>
        `;
        controlsDiv.appendChild(scaleControl);

        // Add pan controls for exploring the pattern
        const panControl = document.createElement('div');
        panControl.style.marginTop = '10px';
        panControl.innerHTML = `
            <label>Pan X: <input type="range" id="pan-x-slider" min="-20" max="20" step="0.5" value="0">
            <span id="pan-x-value">0</span></label>
            <label style="margin-left: 20px;">Pan Y: <input type="range" id="pan-y-slider" min="-20" max="20" step="0.5" value="0">
            <span id="pan-y-value">0</span></label>
            <button id="reset-pan" style="margin-left: 20px;">Reset View</button>
        `;
        controlsDiv.appendChild(panControl);

        // Event listeners
        document.getElementById('color-scheme').addEventListener('change', generateQuasicrystal);

        const scaleSlider = document.getElementById('scale-slider');
        scaleSlider.addEventListener('input', (e) => {
            config.scale = parseInt(e.target.value);
            document.getElementById('scale-value').textContent = config.scale;
            generateQuasicrystal();
        });

        // Update color scheme when changed
        document.getElementById('color-scheme').addEventListener('change', (e) => {
            config.colorScheme = e.target.value;
            generateQuasicrystal();
        });

        // Pan X slider
        const panXSlider = document.getElementById('pan-x-slider');
        panXSlider.addEventListener('input', (e) => {
            config.offsetX = parseFloat(e.target.value);
            document.getElementById('pan-x-value').textContent = config.offsetX.toFixed(1);
            generateQuasicrystal();
        });

        // Pan Y slider
        const panYSlider = document.getElementById('pan-y-slider');
        panYSlider.addEventListener('input', (e) => {
            config.offsetY = parseFloat(e.target.value);
            document.getElementById('pan-y-value').textContent = config.offsetY.toFixed(1);
            generateQuasicrystal();
        });

        // Reset view button
        document.getElementById('reset-pan').addEventListener('click', () => {
            config.offsetX = 0;
            config.offsetY = 0;
            config.scale = 50;
            document.getElementById('pan-x-slider').value = 0;
            document.getElementById('pan-y-slider').value = 0;
            document.getElementById('scale-slider').value = 50;
            document.getElementById('pan-x-value').textContent = '0';
            document.getElementById('pan-y-value').textContent = '0';
            document.getElementById('scale-value').textContent = '50';
            generateQuasicrystal();
        });
    }
    
    // Set up event listeners
    const generateBtn = document.getElementById('generate-qc');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateQuasicrystal);
    }
    
    const symmetrySelect = document.getElementById('symmetry');
    if (symmetrySelect) {
        symmetrySelect.addEventListener('change', generateQuasicrystal);
    }
    
    // Add enhanced controls and generate initial pattern
    setTimeout(() => {
        addEnhancedControls();
        generateQuasicrystal();
    }, 100);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createEnhancedQuasicrystal);
} else {
    createEnhancedQuasicrystal();
}