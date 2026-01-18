// True Penrose P3 (Rhombus) Tiling Generator
// Uses Robinson triangle decomposition with proper inflation rules
// Reference: https://en.wikipedia.org/wiki/Penrose_tiling

const PHI = (1 + Math.sqrt(5)) / 2;  // Golden ratio ≈ 1.618
const PSI = 1 / PHI;  // Inverse golden ratio ≈ 0.618

// Complex number class for geometric calculations
class Complex {
    constructor(real, imag) {
        this.real = real;
        this.imag = imag;
    }

    add(other) {
        return new Complex(this.real + other.real, this.imag + other.imag);
    }

    subtract(other) {
        return new Complex(this.real - other.real, this.imag - other.imag);
    }

    scale(factor) {
        return new Complex(this.real * factor, this.imag * factor);
    }

    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Complex(
            this.real * cos - this.imag * sin,
            this.real * sin + this.imag * cos
        );
    }

    magnitude() {
        return Math.sqrt(this.real * this.real + this.imag * this.imag);
    }
}

// Robinson Triangle - the building block of Penrose P3 rhombi
// Two triangles of the same type make a rhombus
class RobinsonTriangle {
    constructor(A, B, C, type, generation = 0) {
        this.A = A;  // Apex vertex
        this.B = B;  // Base vertex 1
        this.C = C;  // Base vertex 2
        this.type = type;  // 0 = thin (36° apex), 1 = thick (72° apex)
        this.generation = generation;
    }

    // Subdivide using the proper Penrose inflation rules
    subdivide() {
        const nextGen = this.generation + 1;

        if (this.type === 0) {
            // Thin triangle (36° apex) -> 1 thin + 1 thick
            // P divides AB in golden ratio
            const P = this.A.add(this.B.subtract(this.A).scale(PHI / (1 + PHI)));
            return [
                new RobinsonTriangle(this.C, P, this.B, 0, nextGen),
                new RobinsonTriangle(P, this.C, this.A, 1, nextGen)
            ];
        } else {
            // Thick triangle (72° apex) -> 2 thick + 1 thin
            // Q divides AC in golden ratio, R divides AB in golden ratio
            const Q = this.B.add(this.A.subtract(this.B).scale(PHI / (1 + PHI)));
            const R = this.B.add(this.C.subtract(this.B).scale(PHI / (1 + PHI)));
            return [
                new RobinsonTriangle(R, this.C, this.A, 1, nextGen),
                new RobinsonTriangle(Q, R, this.B, 1, nextGen),
                new RobinsonTriangle(R, Q, this.A, 0, nextGen)
            ];
        }
    }

    // Get rhombus type this triangle belongs to
    getRhombusType() {
        return this.type === 0 ? 'thin' : 'thick';
    }

    // Draw the triangle
    draw(ctx, colorScheme) {
        ctx.beginPath();
        ctx.moveTo(this.A.real, this.A.imag);
        ctx.lineTo(this.B.real, this.B.imag);
        ctx.lineTo(this.C.real, this.C.imag);
        ctx.closePath();

        const color = colorScheme(this.type, this.generation);
        ctx.fillStyle = color.fill;
        ctx.fill();

        if (color.stroke) {
            ctx.strokeStyle = color.stroke;
            ctx.lineWidth = color.lineWidth || 0.5;
            ctx.stroke();
        }
    }
}

// Penrose P3 Tiling Generator
class PenroseTiling {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = {
            generations: config.generations !== undefined ? config.generations : 5,
            initialSize: config.initialSize !== undefined ? config.initialSize : 300,
            colorScheme: config.colorScheme || 'classic',
            showGrid: config.showGrid !== undefined ? config.showGrid : false,
            showRhombi: config.showRhombi !== undefined ? config.showRhombi : true
        };
        this.triangles = [];
    }

    // Initialize with a "sun" pattern - 10 triangles forming 5-fold symmetric start
    initializeSunConfiguration() {
        const center = new Complex(this.canvas.width / 2, this.canvas.height / 2);
        const radius = this.config.initialSize;
        this.triangles = [];

        // Create 10 thick triangles arranged around center (sun pattern)
        for (let i = 0; i < 10; i++) {
            const angle1 = (2 * Math.PI * i) / 10 - Math.PI / 2;
            const angle2 = (2 * Math.PI * (i + 1)) / 10 - Math.PI / 2;

            const B = center.add(new Complex(
                radius * Math.cos(angle1),
                radius * Math.sin(angle1)
            ));
            const C = center.add(new Complex(
                radius * Math.cos(angle2),
                radius * Math.sin(angle2)
            ));

            // Alternate orientation to create proper sun pattern
            if (i % 2 === 0) {
                this.triangles.push(new RobinsonTriangle(center, B, C, 1, 0));
            } else {
                this.triangles.push(new RobinsonTriangle(center, C, B, 1, 0));
            }
        }
    }

    // Generate the tiling through subdivision
    generate() {
        this.initializeSunConfiguration();

        // Apply subdivision rules for specified generations
        for (let gen = 0; gen < this.config.generations; gen++) {
            const newTriangles = [];
            for (const triangle of this.triangles) {
                newTriangles.push(...triangle.subdivide());
            }
            this.triangles = newTriangles;
        }
    }

    // Color schemes
    getColorScheme(name) {
        const schemes = {
            // Classic blue/red rhombus coloring
            classic: (type, generation) => {
                if (type === 1) {  // Thick rhombus
                    return {
                        fill: '#4a90d9',
                        stroke: '#2a5a99',
                        lineWidth: 0.5
                    };
                } else {  // Thin rhombus
                    return {
                        fill: '#e85a4f',
                        stroke: '#b84a3f',
                        lineWidth: 0.5
                    };
                }
            },

            // Color by generation depth
            generation: (type, generation) => {
                const hue = (generation * 40 + (type === 1 ? 200 : 30)) % 360;
                return {
                    fill: `hsl(${hue}, 65%, 55%)`,
                    stroke: `hsl(${hue}, 65%, 35%)`,
                    lineWidth: 0.5
                };
            },

            // High contrast rhombus view
            rhombus: (type, generation) => {
                if (type === 1) {
                    return {
                        fill: '#2ecc71',
                        stroke: '#27ae60',
                        lineWidth: 1
                    };
                } else {
                    return {
                        fill: '#9b59b6',
                        stroke: '#8e44ad',
                        lineWidth: 1
                    };
                }
            },

            // Show matching rules with 4 distinct colors
            matching: (type, generation) => {
                const colors = [
                    { fill: '#e74c3c', stroke: '#c0392b' },  // Thin
                    { fill: '#3498db', stroke: '#2980b9' }   // Thick
                ];
                return {
                    ...colors[type],
                    lineWidth: 1
                };
            }
        };

        return schemes[name] || schemes.classic;
    }

    // Draw the complete tiling
    draw() {
        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, width, height);

        // Get color scheme function
        const colorScheme = this.getColorScheme(this.config.colorScheme);

        // Draw all triangles
        for (const triangle of this.triangles) {
            triangle.draw(ctx, colorScheme);
        }

        // Draw 5-fold symmetry guides if enabled
        if (this.config.showGrid) {
            this.drawSymmetryGuides();
        }

        // Draw info
        this.drawInfo();
    }

    // Draw local 5-fold rotational symmetry indicator at the central sun vertex
    // Note: Penrose tilings have local rotational symmetry, not global mirror symmetry
    drawSymmetryGuides() {
        const ctx = this.ctx;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        // Short radius: approximately 2-4 tile edge lengths from center
        // This indicates local rotational symmetry at the central star vertex only
        const localRadius = this.config.initialSize * 0.25;

        ctx.save();

        // Draw white outline first for visibility
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 5;
        ctx.setLineDash([]);

        for (let i = 0; i < 5; i++) {
            const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
            const x = cx + localRadius * Math.cos(angle);
            const y = cy + localRadius * Math.sin(angle);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // Draw 5 short red line segments indicating local 5-fold rotational symmetry
        ctx.strokeStyle = '#d32f2f';
        ctx.lineWidth = 3;

        for (let i = 0; i < 5; i++) {
            const angle = (2 * Math.PI * i) / 5 - Math.PI / 2;
            const x = cx + localRadius * Math.cos(angle);
            const y = cy + localRadius * Math.sin(angle);

            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(x, y);
            ctx.stroke();
        }

        // Draw center point marking the local symmetry vertex
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
        ctx.fill();

        ctx.fillStyle = '#d32f2f';
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, 2 * Math.PI);
        ctx.fill();

        ctx.restore();
    }

    // No text overlay on canvas - keep it clean
    drawInfo() {
        // Intentionally empty - information is shown in HTML below the canvas
    }

    // Count rhombi by type
    countRhombi() {
        let thick = 0, thin = 0;
        for (const t of this.triangles) {
            if (t.type === 1) thick++;
            else thin++;
        }
        // Each rhombus is made of 2 triangles
        return { thick: Math.floor(thick/2), thin: Math.floor(thin/2) };
    }
}

// Helper function to create Penrose tiling
function createPenroseTiling(canvasId, config = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) {
        console.error(`Canvas with id '${canvasId}' not found`);
        return null;
    }

    const tiling = new PenroseTiling(canvas, config);
    tiling.generate();
    tiling.draw();

    return tiling;
}
