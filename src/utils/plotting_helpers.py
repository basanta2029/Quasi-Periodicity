"""
Plotting helper functions for visualizations.
"""

import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from typing import Tuple, Optional, List
import matplotlib.pyplot as plt
from matplotlib import cm


def create_torus_surface_plotly(X: np.ndarray, Y: np.ndarray, Z: np.ndarray,
                                 opacity: float = 0.3,
                                 colorscale: str = 'Blues') -> go.Surface:
    """
    Create a Plotly surface object for the torus.

    Parameters:
    -----------
    X, Y, Z : ndarray
        Torus surface coordinates
    opacity : float
        Surface opacity (0-1)
    colorscale : str
        Plotly colorscale name

    Returns:
    --------
    surface : go.Surface
        Plotly surface object
    """
    surface = go.Surface(
        x=X, y=Y, z=Z,
        opacity=opacity,
        colorscale=colorscale,
        showscale=False,
        name='Torus'
    )
    return surface


def create_trajectory_plotly(X: np.ndarray, Y: np.ndarray, Z: np.ndarray,
                             color: str = 'red',
                             width: int = 3,
                             name: str = 'Trajectory') -> go.Scatter3d:
    """
    Create a Plotly 3D scatter/line object for a trajectory.

    Parameters:
    -----------
    X, Y, Z : ndarray
        Trajectory coordinates
    color : str
        Line color
    width : int
        Line width
    name : str
        Trace name

    Returns:
    --------
    trajectory : go.Scatter3d
        Plotly 3D scatter object
    """
    trajectory = go.Scatter3d(
        x=X, y=Y, z=Z,
        mode='lines',
        line=dict(color=color, width=width),
        name=name
    )
    return trajectory


def setup_3d_layout(title: str = '',
                    show_axes: bool = True,
                    aspect_equal: bool = True) -> dict:
    """
    Create a standard 3D layout dictionary for Plotly.

    Parameters:
    -----------
    title : str
        Plot title
    show_axes : bool
        Whether to show axes
    aspect_equal : bool
        Whether to use equal aspect ratio

    Returns:
    --------
    layout : dict
        Plotly layout dictionary
    """
    scene_dict = dict(
        xaxis=dict(showticklabels=show_axes, title='X' if show_axes else ''),
        yaxis=dict(showticklabels=show_axes, title='Y' if show_axes else ''),
        zaxis=dict(showticklabels=show_axes, title='Z' if show_axes else ''),
    )

    if aspect_equal:
        scene_dict['aspectmode'] = 'data'

    layout = dict(
        title=title,
        scene=scene_dict,
        showlegend=True,
        hovermode='closest',
    )
    return layout


def create_poincare_section_plot(theta: np.ndarray, phi: np.ndarray,
                                 title: str = 'Poincaré Section') -> go.Figure:
    """
    Create a 2D plot of Poincaré section.

    Parameters:
    -----------
    theta, phi : ndarray
        Angle coordinates of section crossings
    title : str
        Plot title

    Returns:
    --------
    fig : go.Figure
        Plotly figure
    """
    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=theta,
        y=phi,
        mode='markers',
        marker=dict(size=5, color='red'),
        name='Section Points'
    ))

    fig.update_layout(
        title=title,
        xaxis_title='θ (poloidal angle)',
        yaxis_title='φ (toroidal angle)',
        xaxis=dict(range=[0, 2*np.pi]),
        yaxis=dict(range=[0, 2*np.pi]),
        width=600,
        height=600,
    )

    return fig


def create_comparison_figure(rational_data: dict, irrational_data: dict) -> go.Figure:
    """
    Create side-by-side comparison of rational and irrational trajectories.

    Parameters:
    -----------
    rational_data : dict
        Dictionary with 'X', 'Y', 'Z', 'alpha' keys for rational case
    irrational_data : dict
        Dictionary with 'X', 'Y', 'Z', 'alpha' keys for irrational case

    Returns:
    --------
    fig : go.Figure
        Plotly figure with subplots
    """
    from plotly.subplots import make_subplots

    fig = make_subplots(
        rows=1, cols=2,
        subplot_titles=(
            f"Rational α = {rational_data['alpha']:.4f} (Periodic)",
            f"Irrational α = {irrational_data['alpha']:.6f} (Quasiperiodic)"
        ),
        specs=[[{'type': 'surface'}, {'type': 'surface'}]],
        horizontal_spacing=0.05
    )

    # Rational case
    from .math_functions import torus_surface
    X_torus, Y_torus, Z_torus = torus_surface()

    fig.add_trace(
        go.Surface(x=X_torus, y=Y_torus, z=Z_torus,
                   opacity=0.2, colorscale='Blues', showscale=False),
        row=1, col=1
    )

    fig.add_trace(
        go.Scatter3d(
            x=rational_data['X'],
            y=rational_data['Y'],
            z=rational_data['Z'],
            mode='lines',
            line=dict(color='red', width=5),
            name='Closed Orbit'
        ),
        row=1, col=1
    )

    # Irrational case
    fig.add_trace(
        go.Surface(x=X_torus, y=Y_torus, z=Z_torus,
                   opacity=0.2, colorscale='Blues', showscale=False),
        row=1, col=2
    )

    fig.add_trace(
        go.Scatter3d(
            x=irrational_data['X'],
            y=irrational_data['Y'],
            z=irrational_data['Z'],
            mode='lines',
            line=dict(color='green', width=3),
            name='Dense Trajectory'
        ),
        row=1, col=2
    )

    fig.update_layout(
        height=600,
        showlegend=True,
        title_text="Periodic vs Quasiperiodic Motion on the Torus"
    )

    return fig


def create_minimal_surface_plotly(X: np.ndarray, Y: np.ndarray, Z: np.ndarray,
                                  values: np.ndarray,
                                  colorscale: str = 'Viridis',
                                  title: str = 'Minimal Surface') -> go.Figure:
    """
    Create a Plotly figure for minimal surface visualization.

    Parameters:
    -----------
    X, Y, Z : ndarray
        Surface coordinates
    values : ndarray
        Values to color the surface (e.g., mean curvature)
    colorscale : str
        Plotly colorscale
    title : str
        Plot title

    Returns:
    --------
    fig : go.Figure
        Plotly figure
    """
    fig = go.Figure(data=[
        go.Surface(
            x=X, y=Y, z=Z,
            surfacecolor=values,
            colorscale=colorscale,
            showscale=True,
            colorbar=dict(title="Value"),
        )
    ])

    fig.update_layout(
        title=title,
        scene=dict(
            aspectmode='data',
            xaxis_title='X',
            yaxis_title='Y',
            zaxis_title='Z'
        ),
        height=700,
    )

    return fig


def plot_level_sets_2d(x: np.ndarray, y: np.ndarray, z_slice: float,
                       func, title: str = 'Level Sets') -> go.Figure:
    """
    Plot 2D level sets of a 3D function at fixed z.

    Parameters:
    -----------
    x, y : ndarray
        2D coordinate arrays
    z_slice : float
        Z-value for the slice
    func : callable
        Function f(x, y, z) to evaluate
    title : str
        Plot title

    Returns:
    --------
    fig : go.Figure
        Plotly contour figure
    """
    X, Y = np.meshgrid(x, y)
    Z_values = func(X, Y, z_slice)

    fig = go.Figure(data=
        go.Contour(
            x=x,
            y=y,
            z=Z_values,
            colorscale='Viridis',
            contours=dict(
                coloring='heatmap',
                showlabels=True,
            ),
            colorbar=dict(title="Value"),
        )
    )

    fig.update_layout(
        title=f"{title} (z = {z_slice:.2f})",
        xaxis_title='X',
        yaxis_title='Y',
        width=600,
        height=600,
    )

    return fig


def matplotlib_torus_trajectory(alpha: float, t_max: float = 50,
                                n_points: int = 5000,
                                save_path: Optional[str] = None) -> None:
    """
    Create matplotlib figure of torus trajectory (for static exports).

    Parameters:
    -----------
    alpha : float
        Winding number
    t_max : float
        Maximum time
    n_points : int
        Number of points
    save_path : str, optional
        Path to save figure
    """
    from .math_functions import torus_surface, torus_trajectory

    fig = plt.figure(figsize=(12, 10))
    ax = fig.add_subplot(111, projection='3d')

    # Plot torus surface
    X_torus, Y_torus, Z_torus = torus_surface()
    ax.plot_surface(X_torus, Y_torus, Z_torus, alpha=0.2, color='lightblue')

    # Plot trajectory
    t = np.linspace(0, t_max, n_points)
    X, Y, Z = torus_trajectory(t, alpha)
    ax.plot(X, Y, Z, 'r-', linewidth=1, label=f'α = {alpha:.4f}')

    ax.set_xlabel('X')
    ax.set_ylabel('Y')
    ax.set_zlabel('Z')
    ax.legend()
    ax.set_title(f'Torus Trajectory with α = {alpha:.4f}')

    if save_path:
        plt.savefig(save_path, dpi=150, bbox_inches='tight')
    else:
        plt.show()

    plt.close()
