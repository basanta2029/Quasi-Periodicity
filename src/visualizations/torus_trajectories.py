"""
Torus trajectory visualization module.

This module provides functions to visualize periodic and quasiperiodic
trajectories on the 2-torus, demonstrating the fundamental difference
between rational and irrational winding numbers.
"""

import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent.parent))

from utils.math_functions import (
    torus_surface,
    torus_trajectory,
    poincare_section,
    golden_ratio,
    is_closed_orbit,
    rational_approximation
)
from utils.plotting_helpers import (
    create_torus_surface_plotly,
    create_trajectory_plotly,
    setup_3d_layout,
    create_poincare_section_plot
)


def visualize_single_trajectory(alpha: float,
                                t_max: float = 100,
                                n_points: int = 10000,
                                show_torus: bool = True,
                                R: float = 2,
                                r: float = 1) -> go.Figure:
    """
    Visualize a single trajectory on the torus.

    Parameters:
    -----------
    alpha : float
        Winding number (slope on universal cover)
    t_max : float
        Maximum parameter value
    n_points : int
        Number of trajectory points
    show_torus : bool
        Whether to show the torus surface
    R : float
        Major radius
    r : float
        Minor radius

    Returns:
    --------
    fig : go.Figure
        Plotly figure
    """
    fig = go.Figure()

    # Add torus surface if requested
    if show_torus:
        X_torus, Y_torus, Z_torus = torus_surface(R=R, r=r)
        torus_surf = create_torus_surface_plotly(
            X_torus, Y_torus, Z_torus,
            opacity=0.25,
            colorscale='Blues'
        )
        fig.add_trace(torus_surf)

    # Add trajectory
    t = np.linspace(0, t_max, n_points)
    X, Y, Z = torus_trajectory(t, alpha, R=R, r=r)

    # Color based on whether it's periodic or quasiperiodic
    is_periodic = is_closed_orbit(alpha)
    color = 'red' if is_periodic else 'green'
    name = 'Periodic (Closed)' if is_periodic else 'Quasiperiodic (Dense)'

    trajectory = create_trajectory_plotly(X, Y, Z, color=color, width=4, name=name)
    fig.add_trace(trajectory)

    # Update layout
    p, q = rational_approximation(alpha)
    approx_text = f" ≈ {p}/{q}" if not is_periodic else f" = {p}/{q}"

    layout = setup_3d_layout(
        title=f'Torus Trajectory: α = {alpha:.6f}{approx_text}<br>{name}',
        show_axes=True,
        aspect_equal=True
    )
    fig.update_layout(**layout)
    fig.update_layout(height=700, width=900)

    return fig


def compare_rational_irrational(rational_alpha: float = 2/3,
                                irrational_alpha: float = None,
                                t_max: float = 100,
                                n_points: int = 10000) -> go.Figure:
    """
    Create side-by-side comparison of rational (periodic) and
    irrational (quasiperiodic) trajectories.

    Parameters:
    -----------
    rational_alpha : float
        Rational winding number (e.g., 2/3)
    irrational_alpha : float, optional
        Irrational winding number (default: golden ratio - 1)
    t_max : float
        Maximum parameter value
    n_points : int
        Number of points

    Returns:
    --------
    fig : go.Figure
        Comparison figure with subplots
    """
    if irrational_alpha is None:
        irrational_alpha = golden_ratio() - 1  # ≈ 0.618...

    # Create subplots
    fig = make_subplots(
        rows=1, cols=2,
        subplot_titles=(
            f"Rational: α = {rational_alpha} (Periodic)",
            f"Irrational: α ≈ {irrational_alpha:.6f} (Quasiperiodic)"
        ),
        specs=[[{'type': 'surface'}, {'type': 'surface'}]],
        horizontal_spacing=0.08
    )

    # Torus surfaces
    X_torus, Y_torus, Z_torus = torus_surface()

    # Rational case (left)
    fig.add_trace(
        go.Surface(x=X_torus, y=Y_torus, z=Z_torus,
                   opacity=0.25, colorscale='Blues', showscale=False,
                   name='Torus'),
        row=1, col=1
    )

    t = np.linspace(0, t_max, n_points)
    X_rat, Y_rat, Z_rat = torus_trajectory(t, rational_alpha)
    fig.add_trace(
        go.Scatter3d(
            x=X_rat, y=Y_rat, z=Z_rat,
            mode='lines',
            line=dict(color='red', width=5),
            name='Closed Orbit'
        ),
        row=1, col=1
    )

    # Irrational case (right)
    fig.add_trace(
        go.Surface(x=X_torus, y=Y_torus, z=Z_torus,
                   opacity=0.25, colorscale='Blues', showscale=False,
                   name='Torus'),
        row=1, col=2
    )

    X_irr, Y_irr, Z_irr = torus_trajectory(t, irrational_alpha)
    fig.add_trace(
        go.Scatter3d(
            x=X_irr, y=Y_irr, z=Z_irr,
            mode='lines',
            line=dict(color='green', width=3),
            name='Dense Trajectory'
        ),
        row=1, col=2
    )

    # Update layout
    fig.update_layout(
        height=600,
        width=1400,
        showlegend=True,
        title_text="<b>Periodic vs Quasiperiodic Motion on the 2-Torus</b>",
        title_x=0.5
    )

    # Equal aspect ratio for both subplots
    fig.update_scenes(aspectmode='data')

    return fig


def poincare_section_visualization(alpha: float,
                                   t_max: float = 1000,
                                   section_angle: float = 0) -> go.Figure:
    """
    Visualize the Poincaré section of a torus trajectory.

    For rational alpha, the Poincaré section shows finitely many points.
    For irrational alpha, it densely fills a circle.

    Parameters:
    -----------
    alpha : float
        Winding number
    t_max : float
        Maximum time to compute section
    section_angle : float
        Angle of the section plane

    Returns:
    --------
    fig : go.Figure
        Poincaré section plot
    """
    t = np.linspace(0, t_max, 100000)
    theta, phi = poincare_section(t, alpha, section_angle)

    # Create the plot
    is_periodic = is_closed_orbit(alpha)
    title = f'Poincaré Section: α = {alpha:.6f}<br>'
    title += 'Finite Points (Periodic)' if is_periodic else 'Dense Circle (Quasiperiodic)'

    fig = go.Figure()

    fig.add_trace(go.Scatter(
        x=theta,
        y=phi,
        mode='markers',
        marker=dict(
            size=5 if is_periodic else 2,
            color='red' if is_periodic else 'green',
            opacity=0.6
        ),
        name='Section Points'
    ))

    fig.update_layout(
        title=title,
        xaxis_title='θ (poloidal angle)',
        yaxis_title='φ (toroidal angle)',
        xaxis=dict(range=[0, 2*np.pi], tickmode='array',
                   tickvals=[0, np.pi/2, np.pi, 3*np.pi/2, 2*np.pi],
                   ticktext=['0', 'π/2', 'π', '3π/2', '2π']),
        yaxis=dict(range=[0, 2*np.pi], tickmode='array',
                   tickvals=[0, np.pi/2, np.pi, 3*np.pi/2, 2*np.pi],
                   ticktext=['0', 'π/2', 'π', '3π/2', '2π']),
        width=700,
        height=700,
        showlegend=True
    )

    return fig


def interactive_winding_exploration(alphas: list = None) -> go.Figure:
    """
    Create an interactive figure showing multiple trajectories with different
    winding numbers for exploration.

    Parameters:
    -----------
    alphas : list, optional
        List of winding numbers to visualize

    Returns:
    --------
    fig : go.Figure
        Interactive figure with multiple trajectories
    """
    if alphas is None:
        # Default: mix of rational and irrational
        alphas = [
            1/2,  # Rational
            2/3,  # Rational
            3/4,  # Rational
            np.sqrt(2) - 1,  # Irrational
            golden_ratio() - 1,  # Irrational
            np.pi/4  # Irrational
        ]

    fig = go.Figure()

    # Add torus surface
    X_torus, Y_torus, Z_torus = torus_surface()
    fig.add_trace(
        go.Surface(
            x=X_torus, y=Y_torus, z=Z_torus,
            opacity=0.2,
            colorscale='Blues',
            showscale=False,
            name='Torus',
            visible=True
        )
    )

    # Add trajectories for each alpha
    colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple']
    t = np.linspace(0, 100, 10000)

    for i, alpha in enumerate(alphas):
        X, Y, Z = torus_trajectory(t, alpha)
        is_periodic = is_closed_orbit(alpha)
        p, q = rational_approximation(alpha)

        label = f"α = {alpha:.4f}"
        if is_periodic:
            label += f" = {p}/{q} (Periodic)"
        else:
            label += f" ≈ {p}/{q} (Quasiperiodic)"

        fig.add_trace(
            go.Scatter3d(
                x=X, y=Y, z=Z,
                mode='lines',
                line=dict(color=colors[i % len(colors)], width=3),
                name=label,
                visible='legendonly'  # Start with only first one visible
            )
        )

    # Make first trajectory visible
    fig.data[1].visible = True

    layout = setup_3d_layout(
        title='Interactive Torus Trajectory Explorer<br><sub>Click legend items to show/hide trajectories</sub>',
        show_axes=True,
        aspect_equal=True
    )
    fig.update_layout(**layout)
    fig.update_layout(height=800, width=1000)

    return fig


# Example usage and testing
if __name__ == "__main__":
    # Test 1: Single trajectory
    print("Creating single trajectory visualization...")
    fig1 = visualize_single_trajectory(alpha=golden_ratio() - 1, t_max=200)
    fig1.write_html("torus_trajectory_single.html")
    print("Saved to torus_trajectory_single.html")

    # Test 2: Comparison
    print("\nCreating comparison visualization...")
    fig2 = compare_rational_irrational(rational_alpha=2/3, t_max=100)
    fig2.write_html("torus_trajectory_comparison.html")
    print("Saved to torus_trajectory_comparison.html")

    # Test 3: Poincaré section
    print("\nCreating Poincaré section...")
    fig3 = poincare_section_visualization(alpha=golden_ratio() - 1, t_max=2000)
    fig3.write_html("poincare_section.html")
    print("Saved to poincare_section.html")

    # Test 4: Interactive explorer
    print("\nCreating interactive explorer...")
    fig4 = interactive_winding_exploration()
    fig4.write_html("torus_trajectory_explorer.html")
    print("Saved to torus_trajectory_explorer.html")

    print("\nAll visualizations created successfully!")
