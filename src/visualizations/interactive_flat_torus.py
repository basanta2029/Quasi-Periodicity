"""
Interactive flat torus visualization with click-to-draw geodesic lines.

Students can:
1. Click two points to define a line
2. Watch the line wrap at edges in real-time
3. See immediate feedback on rational vs irrational slopes
4. Observe periodic closure or dense filling
"""

import numpy as np
import plotly.graph_objects as go
from typing import Tuple, List, Optional, Dict
from fractions import Fraction


def calculate_slope_from_points(point1: Tuple[float, float],
                                 point2: Tuple[float, float]) -> float:
    """
    Calculate slope from two clicked points.

    Parameters:
    -----------
    point1, point2 : tuple
        (x, y) coordinates

    Returns:
    --------
    slope : float
        Rise over run
    """
    x1, y1 = point1
    x2, y2 = point2

    dx = x2 - x1
    dy = y2 - y1

    if abs(dx) < 1e-10:
        return float('inf') if dy > 0 else float('-inf')

    return dy / dx


def classify_slope(slope: float, tolerance: float = 1e-6) -> Dict[str, any]:
    """
    Classify slope as rational or irrational.

    Parameters:
    -----------
    slope : float
        The slope to classify
    tolerance : float
        Tolerance for rationality check

    Returns:
    --------
    info : dict
        {
            'slope': float,
            'is_rational': bool,
            'p': int,  # numerator
            'q': int,  # denominator
            'approx_str': str,  # e.g., "2/3"
            'classification': str,  # "Periodic" or "Dense"
            'description': str  # Full description
        }
    """
    if abs(slope) == float('inf'):
        return {
            'slope': slope,
            'is_rational': True,
            'p': 1,
            'q': 0,
            'approx_str': '∞' if slope > 0 else '-∞',
            'classification': 'Vertical',
            'description': 'Vertical line - wraps horizontally'
        }

    # Find best rational approximation
    frac = Fraction(slope).limit_denominator(10000)
    p, q = frac.numerator, frac.denominator

    is_rational = abs(slope - p/q) < tolerance

    if is_rational:
        return {
            'slope': slope,
            'is_rational': True,
            'p': p,
            'q': q,
            'approx_str': f'{p}/{q}',
            'classification': 'Periodic',
            'description': f'Rational slope {p}/{q} - Closes after {q} wraps!'
        }
    else:
        return {
            'slope': slope,
            'is_rational': False,
            'p': p,
            'q': q,
            'approx_str': f'≈ {p}/{q}',
            'classification': 'Dense',
            'description': f'Irrational slope ≈ {slope:.6f} - Never closes! Fills square densely.'
        }


def generate_wrapping_line_animated(start_point: Tuple[float, float],
                                     slope: float,
                                     n_frames: int = 200,
                                     wraps_per_frame: float = 0.05) -> List[Dict]:
    """
    Generate animation frames for a wrapping line.

    Parameters:
    -----------
    start_point : tuple
        (x0, y0) starting coordinates
    slope : float
        Slope of the line
    n_frames : int
        Number of animation frames to generate
    wraps_per_frame : float
        How far to progress each frame

    Returns:
    --------
    frames : list of dict
        Each frame contains:
        {
            'segments_x': list of arrays (split at wraps),
            'segments_y': list of arrays,
            'wrap_count': int,
            'current_point': tuple
        }
    """
    x0, y0 = start_point
    frames = []

    # If vertical line, handle specially
    if abs(slope) == float('inf'):
        for frame_idx in range(n_frames):
            t_max = (frame_idx + 1) * wraps_per_frame
            y = np.linspace(y0, y0 + t_max, int(t_max * 100))
            x = np.full_like(y, x0)

            # Wrap coordinates
            x_wrapped = x % 1.0
            y_wrapped = y % 1.0

            # Split into segments at wrap points
            segments_x, segments_y = _split_at_wraps(x_wrapped, y_wrapped)

            frames.append({
                'segments_x': segments_x,
                'segments_y': segments_y,
                'wrap_count': int(t_max),
                'current_point': (x_wrapped[-1], y_wrapped[-1])
            })

        return frames

    # Normal case: non-vertical line
    for frame_idx in range(n_frames):
        t_max = (frame_idx + 1) * wraps_per_frame
        t = np.linspace(0, t_max, int(t_max * 200) + 10)

        # Parametric line: (x0 + t, y0 + slope*t)
        x = x0 + t
        y = y0 + slope * t

        # Wrap to [0, 1]
        x_wrapped = x % 1.0
        y_wrapped = y % 1.0

        # Split into segments at wrap points
        segments_x, segments_y = _split_at_wraps(x_wrapped, y_wrapped)

        # Count wraps (how many times we've gone past 1 in either direction)
        wrap_count = int(t_max)

        frames.append({
            'segments_x': segments_x,
            'segments_y': segments_y,
            'wrap_count': wrap_count,
            'current_point': (x_wrapped[-1], y_wrapped[-1])
        })

    return frames


def _split_at_wraps(x: np.ndarray, y: np.ndarray) -> Tuple[List[np.ndarray], List[np.ndarray]]:
    """
    Split coordinate arrays into segments at wrap points.

    Detects discontinuities (wrapping) and splits the line accordingly.
    """
    if len(x) == 0:
        return [[]], [[]]

    segments_x = []
    segments_y = []

    current_seg_x = [x[0]]
    current_seg_y = [y[0]]

    for i in range(1, len(x)):
        dx = abs(x[i] - x[i-1])
        dy = abs(y[i] - y[i-1])

        # Detect wrap (sudden jump)
        if dx > 0.5 or dy > 0.5:
            # Save current segment
            if len(current_seg_x) > 1:
                segments_x.append(np.array(current_seg_x))
                segments_y.append(np.array(current_seg_y))

            # Start new segment
            current_seg_x = [x[i]]
            current_seg_y = [y[i]]
        else:
            current_seg_x.append(x[i])
            current_seg_y.append(y[i])

    # Add final segment
    if len(current_seg_x) > 1:
        segments_x.append(np.array(current_seg_x))
        segments_y.append(np.array(current_seg_y))

    return segments_x, segments_y


def create_interactive_canvas(width: int = 600, height: int = 600) -> go.Figure:
    """
    Create an empty interactive canvas for drawing lines.

    Returns:
    --------
    fig : plotly Figure
        Empty unit square with grid, ready for click events
    """
    fig = go.Figure()

    # Add unit square boundary
    fig.add_trace(go.Scatter(
        x=[0, 1, 1, 0, 0],
        y=[0, 0, 1, 1, 0],
        mode='lines',
        line=dict(color='black', width=2),
        hoverinfo='skip',
        showlegend=False
    ))

    # Add grid lines
    grid_spacing = 0.1
    for i in np.arange(0, 1.1, grid_spacing):
        # Vertical grid lines
        fig.add_trace(go.Scatter(
            x=[i, i],
            y=[0, 1],
            mode='lines',
            line=dict(color='lightgray', width=0.5),
            hoverinfo='skip',
            showlegend=False
        ))
        # Horizontal grid lines
        fig.add_trace(go.Scatter(
            x=[0, 1],
            y=[i, i],
            mode='lines',
            line=dict(color='lightgray', width=0.5),
            hoverinfo='skip',
            showlegend=False
        ))

    # Configure layout
    fig.update_layout(
        title='🎨 Click Two Points to Draw a Line',
        xaxis=dict(
            range=[-0.05, 1.05],
            constrain='domain',
            showgrid=False,
            zeroline=False,
            title='x'
        ),
        yaxis=dict(
            range=[-0.05, 1.05],
            scaleanchor='x',
            scaleratio=1,
            showgrid=False,
            zeroline=False,
            title='y'
        ),
        width=width,
        height=height,
        hovermode='closest',
        showlegend=False,
        plot_bgcolor='#f8f9fa'
    )

    return fig


def add_clicked_points_to_fig(fig: go.Figure,
                                points: List[Tuple[float, float]],
                                color: str = 'blue') -> go.Figure:
    """
    Add clicked point markers to the figure.

    Parameters:
    -----------
    fig : plotly Figure
        Figure to modify
    points : list of tuples
        List of (x, y) coordinates
    color : str
        Marker color

    Returns:
    --------
    fig : modified Figure
    """
    if len(points) == 0:
        return fig

    x_coords = [p[0] for p in points]
    y_coords = [p[1] for p in points]

    fig.add_trace(go.Scatter(
        x=x_coords,
        y=y_coords,
        mode='markers',
        marker=dict(size=12, color=color, symbol='circle',
                   line=dict(width=2, color='white')),
        name='Clicked Points',
        hovertemplate='(%{x:.3f}, %{y:.3f})<extra></extra>'
    ))

    return fig


def add_line_segments_to_fig(fig: go.Figure,
                               segments_x: List[np.ndarray],
                               segments_y: List[np.ndarray],
                               color: str = 'red',
                               width: int = 3,
                               name: str = 'Geodesic') -> go.Figure:
    """
    Add line segments to figure (handles wrapping discontinuities).

    Parameters:
    -----------
    fig : plotly Figure
    segments_x, segments_y : lists of arrays
        Line segments split at wrap points
    color : str
        Line color
    width : int
        Line width
    name : str
        Trace name

    Returns:
    --------
    fig : modified Figure
    """
    for i, (seg_x, seg_y) in enumerate(zip(segments_x, segments_y)):
        if len(seg_x) > 1:
            fig.add_trace(go.Scatter(
                x=seg_x,
                y=seg_y,
                mode='lines',
                line=dict(color=color, width=width),
                name=name if i == 0 else None,
                showlegend=(i == 0),
                hoverinfo='skip'
            ))

    return fig
