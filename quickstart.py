#!/usr/bin/env python
"""
Quickstart script to demonstrate flat torus geodesics.

This script shows the key concept your professor explained:
- Lines with rational slope → close (periodic orbit)
- Lines with irrational slope → dense (fill the torus)
"""

import numpy as np
import sys
from pathlib import Path

# Add src to path
sys.path.append(str(Path(__file__).parent / 'src'))

from visualizations.flat_torus import (
    visualize_flat_torus_line,
    create_density_heatmap,
    compare_rational_vs_irrational
)

print("=" * 70)
print("FLAT TORUS GEODESICS: The Veech Dichotomy")
print("=" * 70)
print()
print("Your professor's concept explained:")
print("-" * 70)
print("A TORUS can be represented as a UNIT SQUARE with opposite edges")
print("identified (wrap-around, like a video game screen).")
print()
print("When you draw a STRAIGHT LINE with slope α:")
print()
print("  • RATIONAL slope (α = p/q):")
print("    → Line CLOSES after q wraps")
print("    → Creates PERIODIC orbit")
print("    → Visits only FINITELY many points")
print()
print("  • IRRATIONAL slope (α = √2, φ, π, ...):")
print("    → Line NEVER CLOSES")
print("    → Becomes DENSE (fills entire torus)")
print("    → Eventually passes arbitrarily close to EVERY point!")
print()
print("=" * 70)
print()

# Example 1: Rational slope
print("📊 Example 1: Rational Slope (α = 2/3)")
print("-" * 70)
print("Creating visualization...")
fig1 = visualize_flat_torus_line(slope=2/3, t_max=20, show_unwrapped=True)
fig1.show()
print("✅ Notice: The line returns to the starting point after 3 wraps!")
print()

# Example 2: Irrational slope (golden ratio)
print("📊 Example 2: Irrational Slope (α = φ - 1, golden ratio)")
print("-" * 70)
golden_ratio = (1 + np.sqrt(5)) / 2
alpha_irrational = golden_ratio - 1
print(f"φ - 1 = {alpha_irrational:.10f}")
print("Creating visualization...")
fig2 = visualize_flat_torus_line(slope=alpha_irrational, t_max=50, show_unwrapped=True)
fig2.show()
print("✅ Notice: The line fills the square densely, never returning!")
print()

# Example 3: Side-by-side comparison
print("📊 Example 3: Side-by-Side Comparison")
print("-" * 70)
print("Creating comparison...")
fig3 = compare_rational_vs_irrational(
    rational_slope=2/3,
    irrational_slope=alpha_irrational,
    t_max=50
)
fig3.show()
print("✅ The dichotomy is clear: periodic vs dense!")
print()

# Example 4: Density heatmap
print("📊 Example 4: Density Heatmap (Long-time behavior)")
print("-" * 70)
print("Creating density visualization (this may take a moment)...")
fig4 = create_density_heatmap(slope=alpha_irrational, t_max=5000, grid_size=100)
fig4.show()
print("✅ The heatmap shows uniform density - the line truly fills the torus!")
print()

print("=" * 70)
print("KEY MATHEMATICAL THEOREM (Veech Dichotomy):")
print("=" * 70)
print()
print("For a geodesic on the flat torus with slope α:")
print()
print("  1. If α ∈ ℚ (rational): Orbit is PERIODIC")
print("  2. If α ∉ ℚ (irrational): Orbit is DENSE")
print()
print("There is NOTHING in between!")
print()
print("=" * 70)
print("NEXT STEPS:")
print("=" * 70)
print()
print("1. Run the interactive Dash app:")
print("   $ python app/dash_torus_app.py")
print("   Then open: http://127.0.0.1:8050/")
print()
print("2. Explore the Jupyter notebook:")
print("   $ jupyter notebook notebooks/02_flat_torus_geodesics.ipynb")
print()
print("3. Try different slopes in the visualizations above!")
print()
print("=" * 70)
