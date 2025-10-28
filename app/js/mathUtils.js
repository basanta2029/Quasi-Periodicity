/**
 * Mathematical utilities for flat torus geodesics
 * Ported from Python implementation in interactive_flat_torus.py
 */

class MathUtils {
    /**
     * Wrap coordinate to [0, 1] interval (torus identification)
     */
    static wrap(x) {
        const result = x % 1.0;
        return result < 0 ? result + 1 : result;
    }

    /**
     * Calculate slope from two points
     * @param {Object} point1 - {x, y} coordinates
     * @param {Object} point2 - {x, y} coordinates
     * @returns {number} slope
     */
    static calculateSlope(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;

        if (Math.abs(dx) < 1e-10) {
            return dy > 0 ? Infinity : -Infinity;
        }

        return dy / dx;
    }

    /**
     * Find greatest common divisor (for rational approximation)
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
     * Find rational approximation p/q of a number using continued fractions
     * @param {number} x - Number to approximate
     * @param {number} maxDenominator - Maximum allowed denominator
     * @returns {Object} {p, q} where p/q approximates x
     */
    static rationalApproximation(x, maxDenominator = 10000) {
        if (!isFinite(x)) {
            return { p: 1, q: 0 };
        }

        const sign = x < 0 ? -1 : 1;
        x = Math.abs(x);

        // Simple continued fraction algorithm
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
     * Classify slope as rational or irrational
     * Uses whitelist of known irrational constants for accurate classification
     * @param {number} slope
     * @param {number} tolerance
     * @returns {Object} Classification info
     */
    static classifySlope(slope, tolerance = 1e-10) {
        if (!isFinite(slope)) {
            return {
                slope: slope,
                isRational: true,
                p: 1,
                q: 0,
                approxStr: slope > 0 ? '∞' : '-∞',
                classification: 'Vertical',
                description: 'Vertical line - wraps horizontally',
                symbolName: null
            };
        }

        // FIRST: Check if slope matches a KNOWN irrational constant (exact match within floating point precision)
        const knownIrrationals = [
            { value: Math.SQRT2, symbol: '√2', name: 'square root of 2' },
            { value: Math.sqrt(3), symbol: '√3', name: 'square root of 3' },
            { value: Math.sqrt(5), symbol: '√5', name: 'square root of 5' },
            { value: Math.PI, symbol: 'π', name: 'pi' },
            { value: Math.PI / 2, symbol: 'π/2', name: 'pi over 2' },
            { value: Math.PI / 3, symbol: 'π/3', name: 'pi over 3' },
            { value: Math.PI / 4, symbol: 'π/4', name: 'pi over 4' },
            { value: Math.PI / 6, symbol: 'π/6', name: 'pi over 6' },
            { value: (1 + Math.sqrt(5)) / 2, symbol: 'φ', name: 'golden ratio (phi)' },
            { value: (Math.sqrt(5) - 1) / 2, symbol: 'φ-1', name: 'phi minus 1' },
            { value: Math.E, symbol: 'e', name: 'Euler\'s number' },
            { value: 2 * Math.PI, symbol: '2π', name: 'two pi' }
        ];

        // Check for exact match (within floating point precision 1e-14)
        for (const irrational of knownIrrationals) {
            if (Math.abs(slope - irrational.value) < 1e-14) {
                const { p, q } = this.rationalApproximation(slope, 10000);
                return {
                    slope: slope,
                    isRational: false,
                    p: p,
                    q: q,
                    approxStr: `${irrational.symbol} ≈ ${p}/${q}`,
                    symbolName: irrational.symbol,
                    fullName: irrational.name,
                    classification: 'Dense',
                    description: `Irrational slope ${irrational.symbol} - Never closes! Fills square densely.`,
                    expectedSegments: null
                };
            }
        }

        // SECOND: Use rational approximation with STRICT tolerance
        const { p, q } = this.rationalApproximation(slope, 10000);
        const isRational = Math.abs(slope - p / q) < tolerance && q <= 50;

        if (isRational) {
            return {
                slope: slope,
                isRational: true,
                p: p,
                q: q,
                approxStr: `${p}/${q}`,
                classification: 'Periodic',
                description: `Rational slope ${p}/${q} - Returns to start after ${Math.abs(q)} complete cycles!`,
                expectedSegments: Math.abs(p) + Math.abs(q),
                symbolName: null
            };
        } else {
            return {
                slope: slope,
                isRational: false,
                p: p,
                q: q,
                approxStr: `≈ ${p}/${q}`,
                classification: 'Dense',
                description: `Irrational slope ≈ ${slope.toFixed(6)} - Never closes! Fills square densely.`,
                expectedSegments: null,
                symbolName: null
            };
        }
    }

    /**
     * Generate geodesic line with wrapping (LEGACY - uses slope)
     * @param {Object} startPoint - {x, y} starting point
     * @param {number} slope - Slope of the line
     * @param {number} tMax - How far to trace the line
     * @param {number} nPoints - Number of points to generate
     * @returns {Array} Array of {x, y} points with wrapping applied
     */
    static generateGeodesic(startPoint, slope, tMax, nPoints = 1000) {
        const points = [];

        if (!isFinite(slope)) {
            // Vertical line
            for (let i = 0; i < nPoints; i++) {
                const t = (i / nPoints) * tMax;
                const x = this.wrap(startPoint.x);
                const y = this.wrap(startPoint.y + t);
                points.push({ x, y });
            }
        } else {
            // Normal line: parametric form (x0 + t, y0 + slope*t)
            for (let i = 0; i < nPoints; i++) {
                const t = (i / nPoints) * tMax;
                const x = this.wrap(startPoint.x + t);
                const y = this.wrap(startPoint.y + slope * t);
                points.push({ x, y });
            }
        }

        return points;
    }

    /**
     * Generate geodesic line from direction vector (ensures line passes through both points)
     * @param {Object} startPoint - {x, y} starting point (origin)
     * @param {Object} directionPoint - {x, y} point that defines the direction
     * @param {number} tMax - How far to trace the line (in multiples of direction vector)
     * @param {number} nPoints - Number of points to generate
     * @returns {Array} Array of {x, y} points with wrapping applied
     */
    static generateGeodesicFromDirection(startPoint, directionPoint, tMax, nPoints = 1000) {
        const points = [];

        // Calculate direction vector from start to direction point
        const dx = directionPoint.x - startPoint.x;
        const dy = directionPoint.y - startPoint.y;

        // Parametric form: (x0 + dx*t, y0 + dy*t)
        // When t=1, we reach the direction point exactly
        for (let i = 0; i < nPoints; i++) {
            const t = (i / nPoints) * tMax;
            const x = this.wrap(startPoint.x + dx * t);
            const y = this.wrap(startPoint.y + dy * t);
            points.push({ x, y });
        }

        return points;
    }

    /**
     * Split points into segments at wrap boundaries
     * @param {Array} points - Array of {x, y} points
     * @returns {Array} Array of segment arrays
     */
    static splitAtWraps(points) {
        if (points.length === 0) return [[]];

        const segments = [];
        let currentSegment = [points[0]];

        for (let i = 1; i < points.length; i++) {
            const dx = Math.abs(points[i].x - points[i - 1].x);
            const dy = Math.abs(points[i].y - points[i - 1].y);

            // Detect wrap (sudden jump)
            if (dx > 0.5 || dy > 0.5) {
                if (currentSegment.length > 1) {
                    segments.push(currentSegment);
                }
                currentSegment = [points[i]];
            } else {
                currentSegment.push(points[i]);
            }
        }

        if (currentSegment.length > 1) {
            segments.push(currentSegment);
        }

        return segments;
    }

    /**
     * Common irrational numbers
     */
    static get IRRATIONALS() {
        return {
            'sqrt2': Math.sqrt(2),
            'sqrt3': Math.sqrt(3),
            'sqrt5': Math.sqrt(5),
            'phi': (1 + Math.sqrt(5)) / 2, // Golden ratio
            'pi': Math.PI,
            'e': Math.E,
            'piOver4': Math.PI / 4,
            'phiMinus1': (Math.sqrt(5) - 1) / 2
        };
    }

    /**
     * Get preset slope value from button data attribute
     * Maps to exact mathematical constants
     */
    static getPresetSlope(presetName) {
        const presets = {
            'half': 0.5,
            'two-thirds': 2/3,
            'three-fifths': 3/5,
            'sqrt2': Math.SQRT2,
            'phi': (1 + Math.sqrt(5)) / 2, // Golden ratio
            'pi-4': Math.PI / 4
        };

        return presets[presetName] || parseFloat(presetName);
    }

    /**
     * Calculate preset points for a given slope (DEPRECATED - use getPresetDirectionPoint)
     */
    static getPresetPoints(slope) {
        // Legacy function - now all geodesics start from origin
        const origin = { x: 0, y: 0 };
        const directionPoint = this.getPresetDirectionPoint(slope);
        return [origin, directionPoint];
    }

    /**
     * Get direction point for a given slope (starting from origin)
     */
    static getPresetDirectionPoint(slope) {
        // All geodesics start from origin (0, 0)
        // Direction point is chosen to give the desired slope
        const dx = 0.5; // Go halfway across the square
        const dy = slope * dx;

        return {
            x: this.wrap(dx),
            y: this.wrap(dy)
        };
    }
}
