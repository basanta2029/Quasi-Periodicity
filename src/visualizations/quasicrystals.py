"""
Quasicrystal and Penrose Tiling Visualization Module.

Implements:
1. Penrose tiling generation and visualization
2. Cut-and-project method for quasicrystals
3. Fourier transform visualization showing quasicrystalline diffraction
"""

import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon
from matplotlib.collections import PatchCollection
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))


class PenroseTiling:
    """
    Generate Penrose tilings using the subdivision method.

    References:
    - https://preshing.com/20110831/penrose-tiling-explained/
    - https://scipython.com/blog/penrose-tiling-1/
    """

    def __init__(self, scale: float = 100):
        """
        Initialize Penrose tiling generator.

        Parameters:
        -----------
        scale : float
            Scale factor for the tiling
        """
        self.goldenRatio = (1 + np.sqrt(5)) / 2
        self.scale = scale
        self.tiles = []

    def subdivide(self, triangles: list, iterations: int = 1) -> list:
        """
        Subdivide triangles using Penrose subdivision rules.

        Parameters:
        -----------
        triangles : list
            List of (type, A, B, C) tuples
        iterations : int
            Number of subdivision iterations

        Returns:
        --------
        result : list
            Subdivided triangles
        """
        result = []
        for color, A, B, C in triangles:
            if color == 0:  # Red triangle
                # Subdivide red triangle
                P = A + (B - A) / self.goldenRatio
                result += [(0, C, P, B), (1, P, C, A)]
            else:  # Blue triangle
                # Subdivide blue triangle
                Q = B + (A - B) / self.goldenRatio
                R = B + (C - B) / self.goldenRatio
                result += [(1, R, C, A), (1, Q, R, B), (0, R, Q, A)]

        if iterations > 1:
            return self.subdivide(result, iterations - 1)
        else:
            return result

    def create_wheel(self, n: int = 10) -> list:
        """
        Create initial wheel pattern of triangles.

        Parameters:
        -----------
        n : int
            Number of triangles (should be multiple of 5 for pentagonal symmetry)

        Returns:
        --------
        triangles : list
            Initial triangle configuration
        """
        triangles = []
        for i in range(n):
            angle = 2 * np.pi * i / n
            A = np.array([0, 0])
            B = self.scale * np.array([np.cos(angle), np.sin(angle)])
            C = self.scale * np.array([
                np.cos(angle + 2*np.pi/n),
                np.sin(angle + 2*np.pi/n)
            ])
            if i % 2 == 0:
                triangles.append((0, A, B, C))  # Red
            else:
                triangles.append((1, A, C, B))  # Blue
        return triangles

    def generate(self, iterations: int = 5) -> list:
        """
        Generate Penrose tiling.

        Parameters:
        -----------
        iterations : int
            Number of subdivision iterations

        Returns:
        --------
        triangles : list
            Final triangle configuration
        """
        triangles = self.create_wheel(10)
        self.tiles = self.subdivide(triangles, iterations)
        return self.tiles


def visualize_penrose_tiling(iterations: int = 6,
                             scale: float = 100,
                             save_path: str = None) -> go.Figure:
    """
    Visualize Penrose tiling using Plotly.

    Parameters:
    -----------
    iterations : int
        Number of subdivision iterations
    scale : float
        Scale factor
    save_path : str, optional
        Path to save HTML file

    Returns:
    --------
    fig : go.Figure
        Plotly figure
    """
    tiling = PenroseTiling(scale=scale)
    tiles = tiling.generate(iterations=iterations)

    fig = go.Figure()

    # Separate red and blue triangles
    red_triangles = [t for t in tiles if t[0] == 0]
    blue_triangles = [t for t in tiles if t[0] == 1]

    # Plot red triangles
    for color, A, B, C in red_triangles:
        fig.add_trace(go.Scatter(
            x=[A[0], B[0], C[0], A[0]],
            y=[A[1], B[1], C[1], A[1]],
            fill='toself',
            fillcolor='rgba(255, 100, 100, 0.6)',
            line=dict(color='darkred', width=0.5),
            mode='lines',
            showlegend=False,
            hoverinfo='skip'
        ))

    # Plot blue triangles
    for color, A, B, C in blue_triangles:
        fig.add_trace(go.Scatter(
            x=[A[0], B[0], C[0], A[0]],
            y=[A[1], B[1], C[1], A[1]],
            fill='toself',
            fillcolor='rgba(100, 100, 255, 0.6)',
            line=dict(color='darkblue', width=0.5),
            mode='lines',
            showlegend=False,
            hoverinfo='skip'
        ))

    fig.update_layout(
        title=f'Penrose Tiling (iterations={iterations})',
        xaxis=dict(scaleanchor='y', scaleratio=1, showgrid=False, zeroline=False),
        yaxis=dict(showgrid=False, zeroline=False),
        width=800,
        height=800,
        showlegend=False,
        plot_bgcolor='white'
    )

    if save_path:
        fig.write_html(save_path)

    return fig


def cut_and_project_1d(n_points: int = 100,
                       slope: float = None,
                       width: float = 0.1) -> tuple:
    """
    Generate 1D quasicrystal using cut-and-project method.

    Parameters:
    -----------
    n_points : int
        Number of lattice points to consider
    slope : float
        Slope of the projection (use irrational for quasiperiodic)
    width : float
        Width of the acceptance window

    Returns:
    --------
    projected_points : ndarray
        1D quasiperiodic point set
    lattice_points : ndarray
        2D lattice points
    accepted_points : ndarray
        Points within acceptance window
    """
    if slope is None:
        slope = (1 + np.sqrt(5)) / 2  # Golden ratio

    # Create 2D square lattice
    n = int(np.sqrt(n_points))
    x = np.arange(-n, n)
    y = np.arange(-n, n)
    X, Y = np.meshgrid(x, y)
    lattice_points = np.column_stack([X.ravel(), Y.ravel()])

    # Define projection direction and perpendicular
    theta = np.arctan(slope)
    proj_dir = np.array([np.cos(theta), np.sin(theta)])
    perp_dir = np.array([-np.sin(theta), np.cos(theta)])

    # Project onto perpendicular direction
    perp_coords = lattice_points @ perp_dir

    # Accept points within window
    accepted_mask = np.abs(perp_coords) < width
    accepted_points = lattice_points[accepted_mask]

    # Project accepted points onto projection direction
    projected_coords = accepted_points @ proj_dir

    return projected_coords, lattice_points, accepted_points


def visualize_cut_and_project(slope: float = None,
                              n_points: int = 2000,
                              width: float = 0.3) -> go.Figure:
    """
    Visualize the cut-and-project method for generating quasicrystals.

    Parameters:
    -----------
    slope : float
        Projection slope (irrational for quasicrystal)
    n_points : int
        Number of lattice points
    width : float
        Acceptance window width

    Returns:
    --------
    fig : go.Figure
        Plotly figure
    """
    if slope is None:
        slope = (1 + np.sqrt(5)) / 2  # Golden ratio

    projected, lattice, accepted = cut_and_project_1d(n_points, slope, width)

    # Create subplots
    fig = make_subplots(
        rows=2, cols=1,
        subplot_titles=(
            f'2D Lattice with Acceptance Window (slope={slope:.6f})',
            '1D Quasiperiodic Projection'
        ),
        row_heights=[0.7, 0.3],
        vertical_spacing=0.15
    )

    # Plot 2D lattice
    fig.add_trace(
        go.Scatter(
            x=lattice[:, 0],
            y=lattice[:, 1],
            mode='markers',
            marker=dict(size=2, color='lightgray'),
            name='Lattice Points',
            showlegend=True
        ),
        row=1, col=1
    )

    # Plot accepted points
    fig.add_trace(
        go.Scatter(
            x=accepted[:, 0],
            y=accepted[:, 1],
            mode='markers',
            marker=dict(size=4, color='red'),
            name='Accepted Points',
            showlegend=True
        ),
        row=1, col=1
    )

    # Draw acceptance window
    theta = np.arctan(slope)
    t = np.linspace(-20, 20, 100)
    window_center_x = t * np.cos(theta)
    window_center_y = t * np.sin(theta)
    window_width_x = width * (-np.sin(theta))
    window_width_y = width * np.cos(theta)

    fig.add_trace(
        go.Scatter(
            x=window_center_x + window_width_x,
            y=window_center_y + window_width_y,
            mode='lines',
            line=dict(color='blue', dash='dash'),
            name='Window Boundary',
            showlegend=True
        ),
        row=1, col=1
    )

    fig.add_trace(
        go.Scatter(
            x=window_center_x - window_width_x,
            y=window_center_y - window_width_y,
            mode='lines',
            line=dict(color='blue', dash='dash'),
            showlegend=False
        ),
        row=1, col=1
    )

    # Plot 1D projection
    fig.add_trace(
        go.Scatter(
            x=projected,
            y=np.zeros_like(projected),
            mode='markers',
            marker=dict(size=8, color='red', symbol='line-ns', line=dict(width=2)),
            name='Projected Points',
            showlegend=True
        ),
        row=2, col=1
    )

    fig.update_xaxes(title_text='X', row=1, col=1)
    fig.update_yaxes(title_text='Y', row=1, col=1)
    fig.update_xaxes(title_text='Position', row=2, col=1)
    fig.update_yaxes(showticklabels=False, row=2, col=1)

    fig.update_layout(
        height=800,
        width=900,
        title_text='Cut-and-Project Method for Quasicrystal Generation',
        showlegend=True
    )

    return fig


def quasicrystal_diffraction_pattern(n: int = 5,
                                     size: int = 400) -> go.Figure:
    """
    Generate quasicrystal diffraction pattern using sum of plane waves.

    For n-fold symmetry, the diffraction pattern shows n-fold rotational symmetry
    despite being aperiodic.

    Parameters:
    -----------
    n : int
        Fold symmetry (5 for Penrose, 8 for octagonal, etc.)
    size : int
        Image size

    Returns:
    --------
    fig : go.Figure
        Plotly figure showing diffraction pattern
    """
    # Create coordinate grid
    x = np.linspace(-2, 2, size)
    y = np.linspace(-2, 2, size)
    X, Y = np.meshgrid(x, y)

    # Sum of plane waves with n-fold symmetry
    pattern = np.zeros((size, size))

    for i in range(n):
        angle = 2 * np.pi * i / n
        kx = np.cos(angle)
        ky = np.sin(angle)
        pattern += np.cos(2 * np.pi * (kx * X + ky * Y))

    # Square to get intensity
    intensity = pattern ** 2

    # Create figure
    fig = go.Figure(data=go.Heatmap(
        z=intensity,
        colorscale='Hot',
        showscale=True,
        colorbar=dict(title='Intensity')
    ))

    fig.update_layout(
        title=f'{n}-fold Quasicrystal Diffraction Pattern',
        xaxis=dict(showticklabels=False, title='kx'),
        yaxis=dict(showticklabels=False, title='ky', scaleanchor='x', scaleratio=1),
        width=700,
        height=700
    )

    return fig


def visualize_quasiperiodic_function_2d(freqs: list = None,
                                       size: int = 500,
                                       extent: float = 10) -> go.Figure:
    """
    Visualize 2D quasiperiodic function as sum of incommensurate frequencies.

    f(x,y) = Σ cos(2π(ωx·x + ωy·y))

    Parameters:
    -----------
    freqs : list
        List of (ωx, ωy) frequency pairs
    size : int
        Grid size
    extent : float
        Spatial extent

    Returns:
    --------
    fig : go.Figure
        Plotly heatmap figure
    """
    if freqs is None:
        # Default: 3 incommensurate frequencies based on golden ratio
        phi = (1 + np.sqrt(5)) / 2
        freqs = [
            (1, 0),
            (np.cos(2*np.pi/5), np.sin(2*np.pi/5)),
            (np.cos(4*np.pi/5), np.sin(4*np.pi/5))
        ]

    x = np.linspace(-extent, extent, size)
    y = np.linspace(-extent, extent, size)
    X, Y = np.meshgrid(x, y)

    # Sum of cosines
    f = np.zeros((size, size))
    for wx, wy in freqs:
        f += np.cos(2 * np.pi * (wx * X + wy * Y))

    fig = go.Figure(data=go.Heatmap(
        z=f,
        x=x,
        y=y,
        colorscale='RdBu',
        zmid=0,
        showscale=True,
        colorbar=dict(title='Value')
    ))

    fig.update_layout(
        title=f'2D Quasiperiodic Function ({len(freqs)} frequencies)',
        xaxis_title='x',
        yaxis_title='y',
        yaxis=dict(scaleanchor='x', scaleratio=1),
        width=700,
        height=700
    )

    return fig


# Example usage
if __name__ == "__main__":
    print("Generating quasicrystal visualizations...")

    # Test 1: Penrose tiling
    print("\n1. Creating Penrose tiling...")
    fig1 = visualize_penrose_tiling(iterations=6)
    fig1.write_html("penrose_tiling.html")
    print("Saved to penrose_tiling.html")

    # Test 2: Cut-and-project
    print("\n2. Creating cut-and-project visualization...")
    fig2 = visualize_cut_and_project(slope=(1+np.sqrt(5))/2)
    fig2.write_html("cut_and_project.html")
    print("Saved to cut_and_project.html")

    # Test 3: Diffraction pattern
    print("\n3. Creating diffraction pattern...")
    fig3 = quasicrystal_diffraction_pattern(n=5)
    fig3.write_html("quasicrystal_diffraction.html")
    print("Saved to quasicrystal_diffraction.html")

    # Test 4: 2D quasiperiodic function
    print("\n4. Creating 2D quasiperiodic function...")
    fig4 = visualize_quasiperiodic_function_2d()
    fig4.write_html("quasiperiodic_2d.html")
    print("Saved to quasiperiodic_2d.html")

    print("\nAll visualizations created successfully!")
