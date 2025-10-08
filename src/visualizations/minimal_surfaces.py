"""
Triply Periodic Minimal Surface Visualization Module.

Implements visualization of F(x,y,z) = cos(x)cos(y) + cos(y)cos(z) + cos(z)cos(x)
and related triply periodic functions using marching cubes algorithm.
"""

import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from skimage import measure
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).parent.parent))

from utils.math_functions import (
    triply_periodic_function,
    create_meshgrid_3d
)


def compute_level_set(function_type: str = 'schoen-iwp',
                      level: float = 0,
                      bounds: tuple = (-np.pi, np.pi),
                      resolution: int = 50) -> tuple:
    """
    Compute level set surface using marching cubes algorithm.

    Parameters:
    -----------
    function_type : str
        Type of triply periodic function
    level : float
        Level set value (c in F(x,y,z) = c)
    bounds : tuple
        Spatial bounds (min, max)
    resolution : int
        Grid resolution

    Returns:
    --------
    verts : ndarray
        Vertex coordinates
    faces : ndarray
        Triangle faces
    normals : ndarray
        Vertex normals
    values : ndarray
        Function values at vertices
    """
    # Create 3D grid
    X, Y, Z = create_meshgrid_3d(bounds=bounds, resolution=resolution)

    # Compute function values
    F = triply_periodic_function(X, Y, Z, function_type=function_type)

    # Extract level set using marching cubes
    try:
        verts, faces, normals, values = measure.marching_cubes(
            F, level=level, spacing=(
                (bounds[1] - bounds[0]) / resolution,
                (bounds[1] - bounds[0]) / resolution,
                (bounds[1] - bounds[0]) / resolution
            )
        )

        # Shift vertices to correct coordinate system
        verts = verts + bounds[0]

    except Exception as e:
        print(f"Marching cubes failed: {e}")
        # Return empty arrays
        verts = np.array([])
        faces = np.array([])
        normals = np.array([])
        values = np.array([])

    return verts, faces, normals, values


def visualize_minimal_surface(function_type: str = 'schoen-iwp',
                              level: float = 0,
                              bounds: tuple = (-np.pi, np.pi),
                              resolution: int = 60,
                              colorscale: str = 'Viridis') -> go.Figure:
    """
    Visualize a triply periodic minimal surface.

    Parameters:
    -----------
    function_type : str
        Type of surface ('schoen-iwp', 'gyroid', 'schwarz-p', 'schwarz-d')
    level : float
        Level set value
    bounds : tuple
        Spatial bounds
    resolution : int
        Grid resolution
    colorscale : str
        Plotly colorscale

    Returns:
    --------
    fig : go.Figure
        Plotly figure
    """
    verts, faces, normals, values = compute_level_set(
        function_type=function_type,
        level=level,
        bounds=bounds,
        resolution=resolution
    )

    if len(verts) == 0:
        # Return empty figure with message
        fig = go.Figure()
        fig.update_layout(
            title=f"No level set found for {function_type} at level {level}",
            annotations=[
                dict(
                    text="Try a different level value",
                    xref="paper", yref="paper",
                    x=0.5, y=0.5, showarrow=False,
                    font=dict(size=20)
                )
            ]
        )
        return fig

    # Compute mean curvature approximation (using normals)
    mean_curvature = np.linalg.norm(normals, axis=1)

    # Create mesh
    fig = go.Figure(data=[
        go.Mesh3d(
            x=verts[:, 0],
            y=verts[:, 1],
            z=verts[:, 2],
            i=faces[:, 0],
            j=faces[:, 1],
            k=faces[:, 2],
            intensity=mean_curvature,
            colorscale=colorscale,
            showscale=True,
            colorbar=dict(title="Curvature"),
            lighting=dict(
                ambient=0.5,
                diffuse=0.8,
                specular=0.3,
                roughness=0.5
            ),
            lightposition=dict(x=100, y=200, z=300)
        )
    ])

    # Function names for display
    function_names = {
        'schoen-iwp': 'Schoen I-WP Surface: cos(x)cos(y) + cos(y)cos(z) + cos(z)cos(x)',
        'gyroid': 'Gyroid: sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x)',
        'schwarz-p': 'Schwarz P Surface: cos(x) + cos(y) + cos(z)',
        'schwarz-d': 'Schwarz D Surface'
    }

    title = function_names.get(function_type, function_type)
    title += f"<br>Level Set: F(x,y,z) = {level}"

    fig.update_layout(
        title=title,
        scene=dict(
            aspectmode='cube',
            xaxis_title='X',
            yaxis_title='Y',
            zaxis_title='Z',
            camera=dict(
                eye=dict(x=1.5, y=1.5, z=1.5)
            )
        ),
        height=700,
        width=900
    )

    return fig


def visualize_unit_cells(function_type: str = 'schoen-iwp',
                         level: float = 0,
                         n_cells: int = 2) -> go.Figure:
    """
    Visualize multiple unit cells of a triply periodic surface.

    Parameters:
    -----------
    function_type : str
        Type of surface
    level : float
        Level set value
    n_cells : int
        Number of unit cells in each direction

    Returns:
    --------
    fig : go.Figure
        Plotly figure showing periodic structure
    """
    bounds = (-np.pi * n_cells, np.pi * n_cells)
    resolution = 40 * n_cells

    verts, faces, normals, values = compute_level_set(
        function_type=function_type,
        level=level,
        bounds=bounds,
        resolution=resolution
    )

    if len(verts) == 0:
        return visualize_minimal_surface(function_type, level, bounds=(-np.pi, np.pi))

    # Create mesh
    fig = go.Figure(data=[
        go.Mesh3d(
            x=verts[:, 0],
            y=verts[:, 1],
            z=verts[:, 2],
            i=faces[:, 0],
            j=faces[:, 1],
            k=faces[:, 2],
            color='lightblue',
            opacity=0.7,
        )
    ])

    # Add unit cell boundaries
    for i in range(-n_cells, n_cells + 1):
        for j in range(-n_cells, n_cells + 1):
            for k in range(-n_cells, n_cells + 1):
                # Draw edges of unit cell
                cell_edges = get_cube_edges(
                    center=(i * 2 * np.pi, j * 2 * np.pi, k * 2 * np.pi),
                    size=2 * np.pi
                )
                for edge in cell_edges:
                    fig.add_trace(
                        go.Scatter3d(
                            x=edge[:, 0],
                            y=edge[:, 1],
                            z=edge[:, 2],
                            mode='lines',
                            line=dict(color='black', width=1),
                            showlegend=False,
                            hoverinfo='skip'
                        )
                    )

    fig.update_layout(
        title=f'{function_type.upper()}: {n_cells}×{n_cells}×{n_cells} Unit Cells',
        scene=dict(
            aspectmode='cube',
            xaxis_title='X',
            yaxis_title='Y',
            zaxis_title='Z'
        ),
        height=800,
        width=1000
    )

    return fig


def get_cube_edges(center: tuple, size: float) -> list:
    """
    Get edge coordinates for a cube.

    Parameters:
    -----------
    center : tuple
        (x, y, z) center coordinates
    size : float
        Size of cube

    Returns:
    --------
    edges : list
        List of edge coordinate arrays
    """
    cx, cy, cz = center
    s = size / 2

    # Define 8 corners
    corners = np.array([
        [cx - s, cy - s, cz - s],
        [cx + s, cy - s, cz - s],
        [cx + s, cy + s, cz - s],
        [cx - s, cy + s, cz - s],
        [cx - s, cy - s, cz + s],
        [cx + s, cy - s, cz + s],
        [cx + s, cy + s, cz + s],
        [cx - s, cy + s, cz + s],
    ])

    # Define 12 edges (pairs of corner indices)
    edge_indices = [
        (0, 1), (1, 2), (2, 3), (3, 0),  # Bottom face
        (4, 5), (5, 6), (6, 7), (7, 4),  # Top face
        (0, 4), (1, 5), (2, 6), (3, 7),  # Vertical edges
    ]

    edges = []
    for i, j in edge_indices:
        edge = np.array([corners[i], corners[j]])
        edges.append(edge)

    return edges


def compare_minimal_surfaces(level: float = 0,
                             bounds: tuple = (-np.pi, np.pi),
                             resolution: int = 50) -> go.Figure:
    """
    Create comparison visualization of different minimal surfaces.

    Parameters:
    -----------
    level : float
        Level set value
    bounds : tuple
        Spatial bounds
    resolution : int
        Grid resolution

    Returns:
    --------
    fig : go.Figure
        Figure with subplots
    """
    surfaces = ['schoen-iwp', 'gyroid', 'schwarz-p']
    titles = [
        'Schoen I-WP',
        'Gyroid',
        'Schwarz P'
    ]

    fig = make_subplots(
        rows=1, cols=3,
        subplot_titles=titles,
        specs=[[{'type': 'surface'}, {'type': 'surface'}, {'type': 'surface'}]],
        horizontal_spacing=0.05
    )

    for idx, (surface_type, title) in enumerate(zip(surfaces, titles), 1):
        verts, faces, normals, values = compute_level_set(
            function_type=surface_type,
            level=level,
            bounds=bounds,
            resolution=resolution
        )

        if len(verts) > 0:
            fig.add_trace(
                go.Mesh3d(
                    x=verts[:, 0],
                    y=verts[:, 1],
                    z=verts[:, 2],
                    i=faces[:, 0],
                    j=faces[:, 1],
                    k=faces[:, 2],
                    color='lightblue',
                    opacity=0.8,
                    showscale=False
                ),
                row=1, col=idx
            )

    fig.update_layout(
        title_text=f"Comparison of Triply Periodic Minimal Surfaces (Level = {level})",
        height=500,
        showlegend=False
    )

    # Update all scenes
    fig.update_scenes(aspectmode='cube')

    return fig


def visualize_level_set_evolution(function_type: str = 'schoen-iwp',
                                  levels: list = None,
                                  bounds: tuple = (-np.pi, np.pi),
                                  resolution: int = 50) -> go.Figure:
    """
    Visualize how level sets evolve as the level parameter changes.

    Parameters:
    -----------
    function_type : str
        Type of surface
    levels : list
        List of level values to visualize
    bounds : tuple
        Spatial bounds
    resolution : int
        Grid resolution

    Returns:
    --------
    fig : go.Figure
        Animated figure showing level set evolution
    """
    if levels is None:
        levels = np.linspace(-1.5, 1.5, 20)

    frames = []

    for level in levels:
        verts, faces, normals, values = compute_level_set(
            function_type=function_type,
            level=level,
            bounds=bounds,
            resolution=resolution
        )

        if len(verts) > 0:
            frame = go.Frame(
                data=[
                    go.Mesh3d(
                        x=verts[:, 0],
                        y=verts[:, 1],
                        z=verts[:, 2],
                        i=faces[:, 0],
                        j=faces[:, 1],
                        k=faces[:, 2],
                        color='lightblue',
                        opacity=0.8,
                    )
                ],
                name=f'{level:.2f}'
            )
            frames.append(frame)

    # Create initial figure
    if len(frames) > 0:
        fig = go.Figure(
            data=frames[0].data,
            frames=frames
        )

        fig.update_layout(
            title=f'{function_type.upper()}: Level Set Evolution',
            scene=dict(
                aspectmode='cube',
                xaxis_title='X',
                yaxis_title='Y',
                zaxis_title='Z'
            ),
            updatemenus=[
                dict(
                    type='buttons',
                    showactive=False,
                    buttons=[
                        dict(
                            label='Play',
                            method='animate',
                            args=[None, dict(frame=dict(duration=200, redraw=True),
                                           fromcurrent=True)]
                        ),
                        dict(
                            label='Pause',
                            method='animate',
                            args=[[None], dict(frame=dict(duration=0, redraw=False),
                                             mode='immediate')]
                        )
                    ]
                )
            ],
            sliders=[
                dict(
                    steps=[
                        dict(
                            args=[[f.name], dict(frame=dict(duration=0, redraw=True),
                                               mode='immediate')],
                            method='animate',
                            label=f'{float(f.name):.2f}'
                        ) for f in frames
                    ],
                    active=0,
                    y=0,
                    len=0.9,
                    x=0.1,
                )
            ],
            height=700,
            width=900
        )
    else:
        fig = go.Figure()
        fig.update_layout(title="No valid level sets found")

    return fig


# Example usage
if __name__ == "__main__":
    print("Generating minimal surface visualizations...")

    # Test 1: Schoen I-WP surface
    print("\n1. Creating Schoen I-WP surface...")
    fig1 = visualize_minimal_surface('schoen-iwp', level=0, resolution=60)
    fig1.write_html("schoen_iwp_surface.html")
    print("Saved to schoen_iwp_surface.html")

    # Test 2: Comparison
    print("\n2. Creating surface comparison...")
    fig2 = compare_minimal_surfaces(level=0, resolution=50)
    fig2.write_html("minimal_surfaces_comparison.html")
    print("Saved to minimal_surfaces_comparison.html")

    # Test 3: Unit cells
    print("\n3. Creating unit cell visualization...")
    fig3 = visualize_unit_cells('gyroid', level=0, n_cells=2)
    fig3.write_html("gyroid_unit_cells.html")
    print("Saved to gyroid_unit_cells.html")

    print("\nAll visualizations created successfully!")
