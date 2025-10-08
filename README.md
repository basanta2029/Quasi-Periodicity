# Quasiperiodic Functions: Interactive Educational Platform

<div align="center">

![Python](https://img.shields.io/badge/python-3.9+-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)

**An interactive educational tool for exploring quasiperiodic functions, torus dynamics, and quasicrystals**

[Features](#features) • [Installation](#installation) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Examples](#examples)

</div>

---

## 📚 Overview

This project provides an **undergraduate-level introduction** to quasiperiodic functions through interactive visualizations and Python code. It was developed to support research goals in:

- Understanding quasiperiodic functions in multiple variables
- Exploring the connection between quasiperiodicity and quasicrystals
- Studying triply periodic minimal surfaces (Schoen I-WP, Gyroid, etc.)
- Visualizing torus dynamics with rational vs irrational winding numbers

### What You'll Learn

- ✨ **Mathematical Foundations**: What makes a function quasiperiodic
- 🌀 **Torus Dynamics**: How rational and irrational slopes create different behaviors
- 💎 **Quasicrystals**: Connection to Penrose tilings and aperiodic order
- 🎨 **3D Surfaces**: Triply periodic minimal surfaces and their level sets

---

## 🎯 Features

### 1. Interactive "Draw Your Own Line" App ⭐ NEW!

**The most intuitive way to understand geodesics on the flat torus!**

Students click two points to draw a line, then watch it wrap in real-time:

- **Click-to-draw interface**: Define lines by clicking two points
- **Live animation**: Watch lines wrap at edges continuously
- **Instant feedback**: See if your line is periodic (rational) or dense (irrational)
- **Preset slopes**: Try 1/2, 2/3, √2, φ, π with one click
- **Play/Pause controls**: Control animation speed (1-10x)
- **Visual classification**: Red = closes (periodic), Green = fills densely

**Run it:**
```bash
python app/interactive_draw_app.py
```
Then open http://127.0.0.1:8051 to start drawing!

### 2. Interactive Torus Trajectory Explorer

Visualize the fundamental difference between periodic and quasiperiodic motion:

- **3D torus visualization** with parametric trajectories
- **Adjustable winding number** (α) with rational/irrational presets
- **Poincaré sections** showing finite points vs dense circles
- **Real-time comparison** of closed orbits and dense trajectories
- **Flat torus view**: See geodesics on the unwrapped square
- **Density heatmaps**: Visualize how irrational lines fill the space

**Run it:**
```bash
python app/dash_torus_app.py
```
Then open http://127.0.0.1:8050 in your browser.

### 3. Triply Periodic Minimal Surface Visualizer

Explore surfaces defined by functions like:

**F(x,y,z) = cos(x)cos(y) + cos(y)cos(z) + cos(z)cos(x)**

Features:
- **Marching cubes** algorithm for level set extraction
- Multiple surfaces: Schoen I-WP, Gyroid, Schwarz P, Schwarz D
- **Unit cell visualization** showing periodic structure
- **Level set animation** to see topology changes
- **Curvature coloring** for geometric insight

### 4. Quasicrystal and Penrose Tiling Generator

- **Penrose tiling** with adjustable subdivision iterations
- **Cut-and-project method** visualization
- **Diffraction patterns** showing n-fold symmetry
- **2D quasiperiodic functions** as sum of incommensurate frequencies

### 5. Educational Jupyter Notebooks

Interactive tutorials covering:
1. Introduction to quasiperiodic functions
2. Torus dynamics and winding numbers
3. Quasicrystals and aperiodic order
4. Minimal surface topology

---

## 🚀 Installation

### Prerequisites

- Python 3.9 or higher
- pip package manager

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/quasi-periodicity.git
cd quasi-periodicity
```

### Step 2: Create Virtual Environment (Recommended)

```bash
python -m venv venv

# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 4: Verify Installation

```bash
python -c "import numpy, plotly, dash, pyvista; print('All imports successful!')"
```

---

## ⚡ Quick Start

### Option 1: Interactive Dash App

Launch the main interactive application:

```bash
python app/dash_torus_app.py
```

Visit **http://127.0.0.1:8050** to:
- Adjust winding number α with sliders
- Toggle between periodic/quasiperiodic motion
- View Poincaré sections in real-time
- Explore preset rational and irrational values

### Option 2: Jupyter Notebooks

Start Jupyter and explore the tutorials:

```bash
jupyter notebook notebooks/01_introduction_to_quasiperiodic_functions.ipynb
```

Work through interactive examples covering:
- 1D quasiperiodic functions
- Torus trajectory visualization
- Penrose tilings
- Minimal surfaces

### Option 3: Run Individual Visualizations

Generate standalone HTML visualizations:

```bash
# Torus trajectories
python src/visualizations/torus_trajectories.py

# Minimal surfaces
python src/visualizations/minimal_surfaces.py

# Quasicrystals
python src/visualizations/quasicrystals.py
```

This creates interactive HTML files you can open in any browser.

---

## 📖 Documentation

### Project Structure

```
quasi-periodicity/
├── src/
│   ├── visualizations/
│   │   ├── torus_trajectories.py    # Torus dynamics visualizations
│   │   ├── minimal_surfaces.py      # Triply periodic surfaces
│   │   └── quasicrystals.py         # Penrose tilings & quasicrystals
│   └── utils/
│       ├── math_functions.py        # Core mathematical functions
│       └── plotting_helpers.py      # Plotting utilities
├── app/
│   └── dash_torus_app.py            # Interactive Dash application
├── notebooks/
│   └── 01_introduction_to_quasiperiodic_functions.ipynb
├── requirements.txt
└── README.md
```

### Core Mathematical Functions

#### Torus Dynamics

```python
from src.utils.math_functions import torus_trajectory, golden_ratio

# Quasiperiodic trajectory with golden ratio
alpha = golden_ratio() - 1
t = np.linspace(0, 100, 10000)
X, Y, Z = torus_trajectory(t, alpha)
```

#### Minimal Surfaces

```python
from src.visualizations.minimal_surfaces import visualize_minimal_surface

# Schoen I-WP surface at level 0
fig = visualize_minimal_surface('schoen-iwp', level=0, resolution=60)
fig.show()
```

#### Penrose Tiling

```python
from src.visualizations.quasicrystals import visualize_penrose_tiling

# Generate 6 iterations
fig = visualize_penrose_tiling(iterations=6)
fig.show()
```

---

## 🎨 Examples

### Example 1: Compare Rational vs Irrational Winding

```python
from src.visualizations.torus_trajectories import compare_rational_irrational

# α = 2/3 (rational) vs α = φ-1 (irrational)
fig = compare_rational_irrational(
    rational_alpha=2/3,
    irrational_alpha=None,  # Uses golden ratio - 1
    t_max=100
)
fig.show()
```

**Result:** Side-by-side comparison showing closed orbit (red) vs dense trajectory (green).

### Example 2: Level Set Evolution

```python
from src.visualizations.minimal_surfaces import visualize_level_set_evolution

# Animate level sets from -1.5 to 1.5
levels = np.linspace(-1.5, 1.5, 20)
fig = visualize_level_set_evolution(
    function_type='gyroid',
    levels=levels,
    resolution=50
)
fig.show()
```

**Result:** Animation showing how Gyroid topology changes with level parameter.

### Example 3: Cut-and-Project Quasicrystal

```python
from src.visualizations.quasicrystals import visualize_cut_and_project

# Use golden ratio slope
fig = visualize_cut_and_project(
    slope=(1 + np.sqrt(5))/2,
    n_points=2000,
    width=0.3
)
fig.show()
```

**Result:** 2D lattice with acceptance window projecting to 1D quasiperiodic point set.

### Example 4: Poincaré Section Analysis

```python
from src.visualizations.torus_trajectories import poincare_section_visualization

# Irrational winding number
fig = poincare_section_visualization(
    alpha=np.sqrt(2) - 1,
    t_max=2000
)
fig.show()
```

**Result:** Dense circle in phase space showing quasiperiodic nature.

---

## 🔬 Mathematical Background

### Quasiperiodic Functions

A function f: ℝᵏ → ℝ is **quasiperiodic with n quasiperiods** if:

**f(x) = F(ω₁·x, ω₂·x, ..., ωₙ·x)**

where:
- F: 𝕋ⁿ → ℝ is continuous on the n-torus
- ω₁, ..., ωₙ are rationally independent frequency vectors

### Winding Numbers on the Torus

For trajectories (θ(t), φ(t)) = (t, αt):

- **α ∈ ℚ (rational)**: Closed orbit, period = q if α = p/q
- **α ∉ ℚ (irrational)**: Dense trajectory, never closes

The golden ratio φ = (1+√5)/2 is the "most irrational" number (worst rational approximation).

### Triply Periodic Minimal Surfaces

The Schoen I-WP surface approximates:

**cos(x)cos(y) + cos(y)cos(z) + cos(z)cos(x) = 0**

Properties:
- **Genus 4** topology
- **Zero mean curvature** (minimal)
- **Triply periodic** with period 2π

Planar sections in irrational directions → quasiperiodic patterns!

---

## 🎓 Educational Use

### For Students

1. **Start with notebooks**: Work through `01_introduction_to_quasiperiodic_functions.ipynb`
2. **Experiment with Dash app**: Manipulate parameters and observe changes
3. **Complete exercises**: Try the problems at the end of each notebook
4. **Explore code**: Read the well-documented source in `src/`

### For Instructors

This project is ideal for:
- Advanced undergraduate mathematics/physics courses
- Computational topology seminars
- Mathematical visualization workshops
- Research training in dynamical systems

**Suggested Topics:**
- Ergodic theory and torus dynamics
- Topology of minimal surfaces
- Aperiodic order and quasicrystals
- Numerical methods (marching cubes, Fourier analysis)

---

## 🛠️ Advanced Features

### Custom Minimal Surface Functions

Add your own triply periodic functions in `src/utils/math_functions.py`:

```python
def triply_periodic_function(x, y, z, function_type='custom'):
    if function_type == 'custom':
        # Your function here
        F = np.sin(x)*np.sin(y) + np.sin(y)*np.sin(z) + np.sin(z)*np.sin(x)
    return F
```

### Adjust Resolution and Bounds

For high-quality renderings:

```python
fig = visualize_minimal_surface(
    'schoen-iwp',
    level=0,
    bounds=(-2*np.pi, 2*np.pi),  # Larger domain
    resolution=100,               # Higher resolution
    colorscale='Viridis'
)
```

### Export for Publications

```python
# Save as high-resolution HTML
fig.write_html("output.html")

# Or use matplotlib backend for PDF/PNG
from src.utils.plotting_helpers import matplotlib_torus_trajectory
matplotlib_torus_trajectory(alpha=0.618, save_path='trajectory.pdf')
```

---

## 📚 References

### Key Papers

1. **Quasiperiodic Topology**:
   - De Leo, R. "A survey on quasiperiodic topology" (2018)

2. **Minimal Surfaces**:
   - Schoen, A. H. "Infinite periodic minimal surfaces without self-intersections" (1970)

3. **Quasicrystals**:
   - Shechtman, D. et al. "Metallic Phase with Long-Range Orientational Order and No Translational Symmetry" (1984)

### Online Resources

- [Roberto De Leo's Research](https://deleo.website/NTC/)
- [Penrose Tiling Explained](https://preshing.com/20110831/penrose-tiling-explained/)
- [SciPython Penrose Tilings](https://scipython.com/blog/penrose-tiling-1/)
- [Minimal Surfaces Gallery](https://minimalsurfaces.blog/)

---

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- [ ] Additional minimal surface types (Lidinoid, etc.)
- [ ] 3D quasicrystal visualizations
- [ ] Interactive parameter fitting tools
- [ ] More educational notebooks
- [ ] Performance optimizations for large datasets

**To contribute:**
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Professor Roberto De Leo** for research guidance and the NTC framework
- **NSF Grant DMS-1832126** supporting quasiperiodic topology research
- **Howard University REU Program** for project support
- The Plotly, PyVista, and scientific Python communities

---

## 📧 Contact

**Project Maintainer**: [Your Name]
**Email**: your.email@university.edu
**Research Group**: [De Leo Research Group](https://deleo.website/)

---

## 🚀 Quick Links

- 📊 [Run Dash App](app/dash_torus_app.py)
- 📓 [Jupyter Notebooks](notebooks/)
- 🔬 [Research Background](https://deleo.website/HU/REU/)
- 📚 [API Documentation](docs/)

---

<div align="center">

**Built with ❤️ for mathematical exploration and education**

⭐ Star this repo if you find it useful! ⭐

</div>
