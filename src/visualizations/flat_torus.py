"""
Flat torus visualization: geodesic lines on the unit square with edge wrapping.

This module demonstrates the fundamental theorem:
- Rational slope → closed periodic orbit
- Irrational slope → dense geodesic that fills the torus
"""

import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from typing import Tuple, List


def wrap_coordinate(x: float) -> float:
    """Wrap coordinate to [0, 1] interval (torus identification)."""
    return x % 1.0


def generate_wrapping_line(slope: float, t_max: float = 10.0, n_points: int = 10000) -> Tuple[np.ndarray, np.ndarray, List[Tuple[int, int]]]:
    """
    Generate a line with given slope on the flat torus (unit square with wrapping).

    The flat torus is the unit square [0,1] × [0,1] with opposite edges identified.
    A line y = slope * x wraps around when it crosses edges.

    Parameters:
    -----------
    slope : float
        Slope of the line (α). Rational → periodic, irrational → dense.
    t_max : float
        Maximum parameter value (how far to trace the line)
    n_points : int
        Number of points to generate

    Returns:
    --------
    x_wrapped, y_wrapped : ndarray
        Coordinates wrapped to [0, 1]
    wrap_points : list of tuples
        (x, y) coordinates where wrapping occurs (for visual breaks)
    """
    t = np.linspace(0, t_max, n_points)
    x = t
    y = slope * t

    # Wrap to unit square
    x_wrapped = wrap_coordinate(x)
    y_wrapped = wrap_coordinate(y)

    # Find wrapping points (where line crosses edges)
    wrap_points = []
    for i in range(1, len(x_wrapped)):
        # Detect wrapping (sudden jump in wrapped coordinate)
        dx = abs(x_wrapped[i] - x_wrapped[i-1])
        dy = abs(y_wrapped[i] - y_wrapped[i-1])
        if dx > 0.5 or dy > 0.5:  # Wrapping occurred
            wrap_points.append(i)

    return x_wrapped, y_wrapped, wrap_points


def visualize_flat_torus_line(slope: float, t_max: float = 20.0,
                               show_unwrapped: bool = True,
                               title: str = None) -> go.Figure:
    """
    Visualize a geodesic line on the flat torus (unit square representation).

    Parameters:
    -----------
    slope : float
        Slope of the geodesic line
    t_max : float
        How far to trace the line
    show_unwrapped : bool
        If True, show both wrapped and unwrapped views
    title : str
        Custom title for the plot

    Returns:
    --------
    fig : plotly Figure
    """
    from fractions import Fraction

    # Generate line
    x_wrapped, y_wrapped, wrap_points = generate_wrapping_line(slope, t_max)

    # Determine if slope is rational
    frac = Fraction(slope).limit_denominator(1000)
    is_rational = abs(slope - frac.numerator / frac.denominator) < 1e-9

    if title is None:
        if is_rational:
            title = f'Flat Torus Geodesic: slope = {frac.numerator}/{frac.denominator} (Periodic Orbit)'
        else:
            title = f'Flat Torus Geodesic: slope ≈ {slope:.6f} (Dense Geodesic)'

    if show_unwrapped:
        fig = make_subplots(
            rows=1, cols=2,
            subplot_titles=('Unwrapped Line', 'Flat Torus (Unit Square with Wrapping)'),
            specs=[[{'type': 'scatter'}, {'type': 'scatter'}]]
        )

        # Left: Unwrapped line
        t = np.linspace(0, t_max, len(x_wrapped))
        fig.add_trace(
            go.Scatter(x=t, y=slope * t, mode='lines',
                      line=dict(color='blue', width=2),
                      name='Unwrapped line'),
            row=1, col=1
        )
        fig.update_xaxes(title_text='x', row=1, col=1)
        fig.update_yaxes(title_text='y = αx', row=1, col=1)

        # Right: Wrapped on torus
        color = 'red' if is_rational else 'green'

        # Split into segments at wrap points
        segments_x = []
        segments_y = []
        start_idx = 0
        for wrap_idx in wrap_points + [len(x_wrapped)]:
            segments_x.append(x_wrapped[start_idx:wrap_idx])
            segments_y.append(y_wrapped[start_idx:wrap_idx])
            start_idx = wrap_idx

        # Plot each segment
        for i, (seg_x, seg_y) in enumerate(zip(segments_x, segments_y)):
            if len(seg_x) > 0:
                fig.add_trace(
                    go.Scatter(x=seg_x, y=seg_y, mode='lines',
                              line=dict(color=color, width=2),
                              showlegend=(i == 0),
                              name='Geodesic'),
                    row=1, col=2
                )

        # Draw unit square boundary
        fig.add_trace(
            go.Scatter(x=[0, 1, 1, 0, 0], y=[0, 0, 1, 1, 0],
                      mode='lines', line=dict(color='black', width=2),
                      name='Torus boundary', showlegend=True),
            row=1, col=2
        )

        # Mark starting point
        fig.add_trace(
            go.Scatter(x=[0], y=[0], mode='markers',
                      marker=dict(size=10, color='blue', symbol='circle'),
                      name='Start'),
            row=1, col=2
        )

        fig.update_xaxes(title_text='x (mod 1)', range=[-0.05, 1.05], row=1, col=2)
        fig.update_yaxes(title_text='y (mod 1)', range=[-0.05, 1.05], row=1, col=2)

    else:
        fig = go.Figure()

        color = 'red' if is_rational else 'green'

        # Split into segments
        segments_x = []
        segments_y = []
        start_idx = 0
        for wrap_idx in wrap_points + [len(x_wrapped)]:
            segments_x.append(x_wrapped[start_idx:wrap_idx])
            segments_y.append(y_wrapped[start_idx:wrap_idx])
            start_idx = wrap_idx

        for i, (seg_x, seg_y) in enumerate(zip(segments_x, segments_y)):
            if len(seg_x) > 0:
                fig.add_trace(
                    go.Scatter(x=seg_x, y=seg_y, mode='lines',
                              line=dict(color=color, width=2),
                              showlegend=(i == 0),
                              name='Geodesic')
                )

        # Unit square
        fig.add_trace(
            go.Scatter(x=[0, 1, 1, 0, 0], y=[0, 0, 1, 1, 0],
                      mode='lines', line=dict(color='black', width=2),
                      name='Torus boundary')
        )

        fig.add_trace(
            go.Scatter(x=[0], y=[0], mode='markers',
                      marker=dict(size=10, color='blue'),
                      name='Start')
        )

        fig.update_xaxes(title_text='x (mod 1)', range=[-0.05, 1.05])
        fig.update_yaxes(title_text='y (mod 1)', range=[-0.05, 1.05])

    fig.update_layout(
        title=title,
        height=500,
        showlegend=True,
        hovermode='closest'
    )

    return fig


def create_density_heatmap(slope: float, t_max: float = 1000.0,
                           grid_size: int = 100) -> go.Figure:
    """
    Create a density heatmap showing how a geodesic line fills the flat torus.

    For irrational slopes, this demonstrates the dense filling property.
    For rational slopes, only specific points are visited.

    Parameters:
    -----------
    slope : float
        Slope of the geodesic
    t_max : float
        How long to trace the geodesic
    grid_size : int
        Resolution of the heatmap grid

    Returns:
    --------
    fig : plotly Figure with heatmap
    """
    from fractions import Fraction

    x_wrapped, y_wrapped, _ = generate_wrapping_line(slope, t_max, n_points=100000)

    # Create 2D histogram (density map)
    heatmap, xedges, yedges = np.histogram2d(
        x_wrapped, y_wrapped,
        bins=grid_size,
        range=[[0, 1], [0, 1]]
    )

    # Normalize
    heatmap = heatmap.T
    if heatmap.max() > 0:
        heatmap = heatmap / heatmap.max()

    # Determine rationality
    frac = Fraction(slope).limit_denominator(1000)
    is_rational = abs(slope - frac.numerator / frac.denominator) < 1e-9

    if is_rational:
        title = f'Density Map: slope = {frac.numerator}/{frac.denominator} (Sparse - Periodic)'
        colorscale = 'Reds'
    else:
        title = f'Density Map: slope ≈ {slope:.6f} (Dense - Fills Torus)'
        colorscale = 'Greens'

    fig = go.Figure(data=go.Heatmap(
        z=heatmap,
        x=xedges[:-1],
        y=yedges[:-1],
        colorscale=colorscale,
        colorbar=dict(title='Density')
    ))

    fig.update_layout(
        title=title,
        xaxis_title='x (mod 1)',
        yaxis_title='y (mod 1)',
        width=600,
        height=600
    )

    return fig


def compare_rational_vs_irrational(rational_slope: float = 2/3,
                                   irrational_slope: float = None,
                                   t_max: float = 50.0) -> go.Figure:
    """
    Side-by-side comparison of rational (periodic) vs irrational (dense) geodesics.

    Parameters:
    -----------
    rational_slope : float
        A rational slope (e.g., 2/3)
    irrational_slope : float
        An irrational slope (default: φ - 1, golden ratio minus 1)
    t_max : float
        How far to trace each geodesic

    Returns:
    --------
    fig : plotly Figure with comparison
    """
    if irrational_slope is None:
        irrational_slope = (1 + np.sqrt(5)) / 2 - 1  # φ - 1

    from fractions import Fraction

    fig = make_subplots(
        rows=1, cols=2,
        subplot_titles=(
            f'Rational: {Fraction(rational_slope).limit_denominator()} (Periodic)',
            f'Irrational: ≈{irrational_slope:.6f} (Dense)'
        )
    )

    # Rational geodesic
    x_rat, y_rat, wrap_rat = generate_wrapping_line(rational_slope, t_max)
    segments_x = []
    segments_y = []
    start = 0
    for w in wrap_rat + [len(x_rat)]:
        segments_x.append(x_rat[start:w])
        segments_y.append(y_rat[start:w])
        start = w

    for i, (sx, sy) in enumerate(zip(segments_x, segments_y)):
        if len(sx) > 0:
            fig.add_trace(
                go.Scatter(x=sx, y=sy, mode='lines',
                          line=dict(color='red', width=2),
                          showlegend=(i == 0), name='Periodic'),
                row=1, col=1
            )

    # Irrational geodesic
    x_irr, y_irr, wrap_irr = generate_wrapping_line(irrational_slope, t_max)
    segments_x = []
    segments_y = []
    start = 0
    for w in wrap_irr + [len(x_irr)]:
        segments_x.append(x_irr[start:w])
        segments_y.append(y_irr[start:w])
        start = w

    for i, (sx, sy) in enumerate(zip(segments_x, segments_y)):
        if len(sx) > 0:
            fig.add_trace(
                go.Scatter(x=sx, y=sy, mode='lines',
                          line=dict(color='green', width=2),
                          showlegend=(i == 0), name='Dense'),
                row=1, col=2
            )

    # Add square boundaries
    for col in [1, 2]:
        fig.add_trace(
            go.Scatter(x=[0, 1, 1, 0, 0], y=[0, 0, 1, 1, 0],
                      mode='lines', line=dict(color='black', width=2),
                      showlegend=False),
            row=1, col=col
        )
        fig.add_trace(
            go.Scatter(x=[0], y=[0], mode='markers',
                      marker=dict(size=8, color='blue'),
                      showlegend=False),
            row=1, col=col
        )

    fig.update_xaxes(title_text='x (mod 1)', range=[-0.05, 1.05])
    fig.update_yaxes(title_text='y (mod 1)', range=[-0.05, 1.05])

    fig.update_layout(
        title='<b>The Veech Dichotomy: Rational vs Irrational Slopes</b>',
        height=500,
        width=1000,
        showlegend=True
    )

    return fig
