/**
 * Torus Geometry and Geodesic Mathematics
 *
 * This module handles:
 * - Coordinate conversions between 3D and toroidal (θ, φ) coordinates
 * - Geodesic curve calculation on torus surface
 * - Winding number classification (rational vs irrational)
 */

class TorusGeometry {
    /**
     * Standard torus parameters
     * R = major radius (distance from center of torus to center of tube)
     * r = minor radius (radius of tube)
     */
    static get R() { return 3; }
    static get r() { return 1; }

    /**
     * Convert toroidal coordinates (θ, φ) to 3D Cartesian (x, y, z)
     * @param {number} theta - Angle around major circle [0, 2π]
     * @param {number} phi - Angle around minor circle [0, 2π]
     * @returns {object} {x, y, z}
     */
    static toroidalTo3D(theta, phi) {
        const R = this.R;
        const r = this.r;

        return {
            x: (R + r * Math.cos(phi)) * Math.cos(theta),
            y: (R + r * Math.cos(phi)) * Math.sin(theta),
            z: r * Math.sin(phi)
        };
    }

    /**
     * Convert 3D Cartesian (x, y, z) to toroidal coordinates (θ, φ)
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {object} {theta, phi}
     */
    static cartesianToToroidal(x, y, z) {
        const R = this.R;
        const r = this.r;

        // θ is the angle in the xy-plane
        let theta = Math.atan2(y, x);
        if (theta < 0) theta += 2 * Math.PI;

        // Distance from z-axis
        const rho = Math.sqrt(x * x + y * y);

        // φ is determined by the cross-sectional circle
        let phi = Math.atan2(z, rho - R);
        if (phi < 0) phi += 2 * Math.PI;

        return { theta, phi };
    }

    /**
     * Wrap angle to [0, 2π]
     */
    static wrapAngle(angle) {
        const TWO_PI = 2 * Math.PI;
        let result = angle % TWO_PI;
        if (result < 0) result += TWO_PI;
        return result;
    }

    /**
     * Find GCD for rational approximation
     */
    static gcd(a, b) {
        a = Math.abs(Math.round(a));
        b = Math.abs(Math.round(b));
        while (b !== 0) {
            const temp = b;
            b = a % b;
            a = temp;
        }
        return a;
    }

    /**
     * Rational approximation using continued fractions
     * @param {number} x - Number to approximate
     * @param {number} maxDenominator - Maximum allowed denominator
     * @returns {object} {p, q} where p/q approximates x
     */
    static rationalApproximation(x, maxDenominator = 10000) {
        if (!isFinite(x)) {
            return { p: 1, q: 0 };
        }

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);

        let a = Math.floor(x);
        let h1 = 1, h2 = 0;
        let k1 = 0, k2 = 1;

        let b = x - a;
        let h = a * h1 + h2;
        let k = a * k1 + k2;

        while (Math.abs(x - h / k) > 1e-9 && k < maxDenominator && b > 1e-10) {
            b = 1 / b;
            a = Math.floor(b);
            b = b - a;

            h2 = h1;
            h1 = h;
            k2 = k1;
            k1 = k;

            h = a * h1 + h2;
            k = a * k1 + k2;

            if (k > maxDenominator) {
                return { p: sign * h1, q: k1 };
            }
        }

        return { p: sign * h, q: k };
    }

    /**
     * Calculate geodesic direction on torus
     * For a torus, geodesics are characterized by winding numbers (p, q)
     * This gives the "velocity" direction (dθ/dt, dφ/dt) for a geodesic
     *
     * @param {number} p - Winding number around major circle
     * @param {number} q - Winding number around minor circle
     * @returns {object} {dtheta, dphi} - normalized direction
     */
    static geodesicDirection(p, q) {
        // Normalize so that the path parameter t goes from 0 to 2π
        const norm = Math.sqrt(p * p + q * q);
        return {
            dtheta: p / norm,
            dphi: q / norm
        };
    }

    /**
     * Generate geodesic curve points on torus surface
     * @param {object} startPoint - {theta, phi} starting angles
     * @param {number} p - Winding number around major circle
     * @param {number} q - Winding number around minor circle
     * @param {number} tMax - How far to trace (in radians)
     * @param {number} nPoints - Number of points to generate
     * @returns {Array} Array of {x, y, z, theta, phi} points
     */
    static generateGeodesic(startPoint, p, q, tMax, nPoints = 1000) {
        const points = [];
        const { dtheta, dphi } = this.geodesicDirection(p, q);

        for (let i = 0; i < nPoints; i++) {
            const t = (i / nPoints) * tMax;

            // Integrate angles
            const theta = this.wrapAngle(startPoint.theta + dtheta * t);
            const phi = this.wrapAngle(startPoint.phi + dphi * t);

            // Convert to 3D
            const pos = this.toroidalTo3D(theta, phi);

            points.push({
                x: pos.x,
                y: pos.y,
                z: pos.z,
                theta: theta,
                phi: phi
            });
        }

        return points;
    }

    /**
     * Classify winding number ratio as rational or irrational
     * @param {number} p - Winding number 1
     * @param {number} q - Winding number 2
     * @returns {object} Classification information
     */
    static classifyWindingNumbers(p, q) {
        if (q === 0) {
            return {
                isRational: true,
                p: p,
                q: 0,
                ratio: Infinity,
                approxStr: `(${p}, 0)`,
                classification: 'Periodic',
                description: `Wraps ${p} times around major circle only`,
                expectedPeriod: Math.abs(p) * 2 * Math.PI
            };
        }

        const ratio = p / q;

        // Check for known irrational constants
        const knownIrrationals = [
            { value: Math.SQRT2, symbol: '√2', name: 'square root of 2' },
            { value: Math.sqrt(3), symbol: '√3', name: 'square root of 3' },
            { value: Math.sqrt(5), symbol: '√5', name: 'square root of 5' },
            { value: Math.PI, symbol: 'π', name: 'pi' },
            { value: (1 + Math.sqrt(5)) / 2, symbol: 'φ', name: 'golden ratio' },
            { value: Math.E, symbol: 'e', name: 'Euler\'s number' }
        ];

        for (const irrational of knownIrrationals) {
            if (Math.abs(ratio - irrational.value) < 1e-10) {
                const { p: approxP, q: approxQ } = this.rationalApproximation(ratio, 10000);
                return {
                    isRational: false,
                    p: p,
                    q: q,
                    ratio: ratio,
                    approxStr: `(${irrational.symbol}, 1)`,
                    symbolName: irrational.symbol,
                    fullName: irrational.name,
                    classification: 'Dense',
                    description: `Irrational winding ratio ${irrational.symbol} - Never closes!`,
                    expectedPeriod: null,
                    approximation: `≈ (${approxP}, ${approxQ})`
                };
            }
        }

        // Use rational approximation with reasonable tolerance
        const { p: approxP, q: approxQ } = this.rationalApproximation(ratio, 10000);
        const isRational = Math.abs(ratio - approxP / approxQ) < 1e-6 && approxQ <= 50;

        if (isRational) {
            // Simplify using GCD
            const g = this.gcd(approxP, approxQ);
            const simpleP = approxP / g;
            const simpleQ = approxQ / g;

            return {
                isRational: true,
                p: simpleP,
                q: simpleQ,
                ratio: ratio,
                approxStr: `(${simpleP}, ${simpleQ})`,
                classification: 'Periodic',
                description: `Rational winding (${simpleP}, ${simpleQ}) - Closes after ${Math.abs(simpleP) + Math.abs(simpleQ)} cycles!`,
                expectedPeriod: Math.abs(simpleQ) * 2 * Math.PI
            };
        } else {
            return {
                isRational: false,
                p: p,
                q: q,
                ratio: ratio,
                approxStr: `≈ (${approxP}, ${approxQ})`,
                classification: 'Dense',
                description: `Irrational winding ratio ${ratio.toFixed(6)} - Never closes!`,
                expectedPeriod: null,
                approximation: `≈ (${approxP}, ${approxQ})`
            };
        }
    }

    /**
     * Calculate winding numbers from two points
     * @param {object} point1 - {theta, phi}
     * @param {object} point2 - {theta, phi}
     * @returns {object} {p, q} winding numbers
     */
    static calculateWindingNumbers(point1, point2) {
        // Calculate angular differences
        let dtheta = point2.theta - point1.theta;
        let dphi = point2.phi - point1.phi;

        // Handle wrapping (take shortest path)
        if (Math.abs(dtheta) > Math.PI) {
            dtheta = dtheta > 0 ? dtheta - 2 * Math.PI : dtheta + 2 * Math.PI;
        }
        if (Math.abs(dphi) > Math.PI) {
            dphi = dphi > 0 ? dphi - 2 * Math.PI : dphi + 2 * Math.PI;
        }

        // Normalize to get direction
        // We'll scale so that the smaller component is 1 (or close to it)
        const scale = Math.max(Math.abs(dtheta), Math.abs(dphi));

        if (scale < 1e-10) {
            return { p: 0, q: 0 };
        }

        const p = dtheta / scale;
        const q = dphi / scale;

        return { p, q };
    }

    /**
     * Get preset winding numbers from name
     */
    static getPresetWindingNumbers(presetName) {
        const presets = {
            '1-1': { p: 1, q: 1 },
            '2-3': { p: 2, q: 3 },
            '3-5': { p: 3, q: 5 },
            'sqrt2': { p: Math.SQRT2, q: 1 },
            'phi': { p: (1 + Math.sqrt(5)) / 2, q: 1 },
            'pi': { p: Math.PI, q: 1 }
        };

        return presets[presetName] || { p: 1, q: 1 };
    }

    /**
     * Get preset starting points for a given winding number preset (DEPRECATED)
     */
    static getPresetPoints(presetName) {
        // Legacy function - now all geodesics start from origin
        const origin = { theta: 0, phi: 0 };
        const directionPoint = this.getPresetDirectionPoint(presetName);
        return [origin, directionPoint];
    }

    /**
     * Get direction point for a given preset (starting from origin)
     */
    static getPresetDirectionPoint(presetName) {
        // All geodesics start from origin (0, 0)
        const { p, q } = this.getPresetWindingNumbers(presetName);

        // Move by a fraction of a full cycle to set direction
        const t = 0.3; // 30% of the way
        const directionPoint = {
            theta: this.wrapAngle(p * t * 2 * Math.PI),
            phi: this.wrapAngle(q * t * 2 * Math.PI)
        };

        return directionPoint;
    }
}
