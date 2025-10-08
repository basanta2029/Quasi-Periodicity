"""
Interactive Dash application for exploring quasiperiodic motion on the 2-torus.

This educational tool allows students to:
1. Adjust the winding number (slope) α interactively
2. See real-time comparison between periodic and quasiperiodic motion
3. Visualize Poincaré sections
4. Understand the fundamental difference between rational and irrational winding
"""

import dash
from dash import dcc, html, Input, Output
try:
    import dash_bootstrap_components as dbc
except ImportError:
    print("Warning: dash-bootstrap-components not installed. Install with: pip install dash-bootstrap-components")
    dbc = None
import plotly.graph_objects as go
import numpy as np
from pathlib import Path
import sys

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from utils.math_functions import (
    torus_surface,
    torus_trajectory,
    poincare_section,
    golden_ratio,
    is_closed_orbit,
    rational_approximation,
    common_irrational_numbers
)
from visualizations.flat_torus import visualize_flat_torus_line, create_density_heatmap

# Initialize the Dash app
app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
app.title = "Quasiperiodic Torus Explorer"

# Common irrational values
IRRATIONAL_PRESETS = common_irrational_numbers()

# Define the layout
app.layout = dbc.Container([
    dbc.Row([
        dbc.Col([
            html.H1("🌀 Quasiperiodic Motion on the 2-Torus",
                   className="text-center mb-4 mt-4"),
            html.P([
                "Explore the difference between ",
                html.B("periodic (rational slope)"),
                " and ",
                html.B("quasiperiodic (irrational slope)"),
                " trajectories on a 2-dimensional torus."
            ], className="text-center lead")
        ])
    ]),

    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader(html.H4("Controls")),
                dbc.CardBody([
                    # Alpha (winding number) slider
                    html.Label("Winding Number α:", className="fw-bold"),
                    html.Div([
                        dcc.Slider(
                            id='alpha-slider',
                            min=0,
                            max=2,
                            step=0.001,
                            value=golden_ratio() - 1,
                            marks={
                                0: '0',
                                0.5: '0.5',
                                1.0: '1.0',
                                1.5: '1.5',
                                2.0: '2.0'
                            },
                            tooltip={"placement": "bottom", "always_visible": True}
                        ),
                    ], className="mb-3"),

                    # Preset buttons
                    html.Label("Quick Presets:", className="fw-bold"),
                    dbc.ButtonGroup([
                        dbc.Button("1/2", id="btn-half", color="primary", size="sm"),
                        dbc.Button("2/3", id="btn-two-thirds", color="primary", size="sm"),
                        dbc.Button("3/4", id="btn-three-fourths", color="primary", size="sm"),
                        dbc.Button("√2-1", id="btn-sqrt2", color="success", size="sm"),
                        dbc.Button("φ-1", id="btn-phi", color="success", size="sm"),
                        dbc.Button("π/4", id="btn-pi", color="success", size="sm"),
                    ], className="mb-3"),

                    html.Hr(),

                    # Time range slider
                    html.Label("Time Range (cycles):", className="fw-bold"),
                    dcc.Slider(
                        id='time-slider',
                        min=10,
                        max=500,
                        step=10,
                        value=100,
                        marks={10: '10', 100: '100', 200: '200', 500: '500'},
                        tooltip={"placement": "bottom", "always_visible": True}
                    ),

                    html.Hr(),

                    # Display options
                    html.Label("Display Options:", className="fw-bold"),
                    dbc.Checklist(
                        id='display-options',
                        options=[
                            {'label': ' Show Torus Surface', 'value': 'torus'},
                            {'label': ' Show Poincaré Section', 'value': 'poincare'},
                            {'label': ' Show Flat Torus View', 'value': 'flat_torus'},
                            {'label': ' Show Density Heatmap', 'value': 'density'},
                        ],
                        value=['torus'],
                        switch=True,
                    ),

                    html.Hr(),

                    # Info display
                    html.Div(id='alpha-info', className='mt-3 p-3 bg-light rounded'),
                ])
            ], className="mb-4")
        ], md=3),

        dbc.Col([
            # Main 3D visualization
            dcc.Loading(
                id="loading-1",
                type="default",
                children=[
                    dcc.Graph(
                        id='torus-3d-plot',
                        style={'height': '600px'},
                        config={'displayModeBar': True, 'displaylogo': False}
                    )
                ]
            ),

            # Poincaré section plot
            dcc.Loading(
                id="loading-2",
                type="default",
                children=[
                    html.Div(id='poincare-container', children=[
                        dcc.Graph(
                            id='poincare-plot',
                            style={'height': '400px'},
                            config={'displayModeBar': True, 'displaylogo': False}
                        )
                    ], style={'display': 'none'})
                ]
            ),

            # Flat torus view
            dcc.Loading(
                id="loading-3",
                type="default",
                children=[
                    html.Div(id='flat-torus-container', children=[
                        dcc.Graph(
                            id='flat-torus-plot',
                            style={'height': '500px'},
                            config={'displayModeBar': True, 'displaylogo': False}
                        )
                    ], style={'display': 'none'})
                ]
            ),

            # Density heatmap
            dcc.Loading(
                id="loading-4",
                type="default",
                children=[
                    html.Div(id='density-container', children=[
                        dcc.Graph(
                            id='density-plot',
                            style={'height': '500px'},
                            config={'displayModeBar': True, 'displaylogo': False}
                        )
                    ], style={'display': 'none'})
                ]
            )
        ], md=9)
    ]),

    dbc.Row([
        dbc.Col([
            dbc.Card([
                dbc.CardHeader(html.H5("Understanding Quasiperiodic Motion")),
                dbc.CardBody([
                    html.P([
                        html.B("Rational Winding Numbers (α = p/q):"),
                        " The trajectory closes after q loops around the torus, creating a periodic orbit. ",
                        "The Poincaré section shows exactly q distinct points."
                    ], className="mb-2"),
                    html.P([
                        html.B("Irrational Winding Numbers (α ∉ ℚ):"),
                        " The trajectory never closes and densely fills the torus surface over time. ",
                        "The Poincaré section densely fills a circle. This is quasiperiodic motion!"
                    ], className="mb-2"),
                    html.P([
                        html.B("Flat Torus View:"),
                        " Shows the torus as a unit square with opposite edges identified. ",
                        "Lines with irrational slope wrap around infinitely and densely fill the square!"
                    ], className="mb-2"),
                    html.P([
                        html.B("Golden Ratio (φ-1 ≈ 0.618):"),
                        " The 'most irrational' number, which creates the most uniformly distributed trajectory."
                    ], className="mb-0"),
                ])
            ])
        ])
    ], className="mt-4 mb-4")

], fluid=True)


# Callback for preset buttons
@app.callback(
    Output('alpha-slider', 'value'),
    [Input('btn-half', 'n_clicks'),
     Input('btn-two-thirds', 'n_clicks'),
     Input('btn-three-fourths', 'n_clicks'),
     Input('btn-sqrt2', 'n_clicks'),
     Input('btn-phi', 'n_clicks'),
     Input('btn-pi', 'n_clicks')],
    prevent_initial_call=True
)
def update_alpha_from_buttons(*args):
    """Update alpha slider based on preset button clicks."""
    ctx = dash.callback_context
    if not ctx.triggered:
        return dash.no_update

    button_id = ctx.triggered[0]['prop_id'].split('.')[0]

    button_map = {
        'btn-half': 0.5,
        'btn-two-thirds': 2/3,
        'btn-three-fourths': 0.75,
        'btn-sqrt2': np.sqrt(2) - 1,
        'btn-phi': golden_ratio() - 1,
        'btn-pi': np.pi / 4
    }

    return button_map.get(button_id, dash.no_update)


# Main visualization callback
@app.callback(
    [Output('torus-3d-plot', 'figure'),
     Output('poincare-plot', 'figure'),
     Output('poincare-container', 'style'),
     Output('flat-torus-plot', 'figure'),
     Output('flat-torus-container', 'style'),
     Output('density-plot', 'figure'),
     Output('density-container', 'style'),
     Output('alpha-info', 'children')],
    [Input('alpha-slider', 'value'),
     Input('time-slider', 'value'),
     Input('display-options', 'value')]
)
def update_visualization(alpha, t_max, display_options):
    """Update all visualizations based on control inputs."""

    # Create 3D torus visualization
    fig_3d = go.Figure()

    # Add torus surface if selected
    if 'torus' in display_options:
        X_torus, Y_torus, Z_torus = torus_surface()
        fig_3d.add_trace(
            go.Surface(
                x=X_torus, y=Y_torus, z=Z_torus,
                opacity=0.25,
                colorscale='Blues',
                showscale=False,
                name='Torus',
                hoverinfo='skip'
            )
        )

    # Add trajectory
    t = np.linspace(0, t_max, 10000)
    X, Y, Z = torus_trajectory(t, alpha)

    is_periodic = is_closed_orbit(alpha)
    color = 'red' if is_periodic else 'green'

    fig_3d.add_trace(
        go.Scatter3d(
            x=X, y=Y, z=Z,
            mode='lines',
            line=dict(color=color, width=4),
            name='Trajectory',
            hoverinfo='skip'
        )
    )

    # Update 3D layout
    p, q = rational_approximation(alpha)
    title = f'α = {alpha:.6f}'
    if is_periodic:
        title += f' = {p}/{q} (Periodic)'
    else:
        title += f' ≈ {p}/{q} (Quasiperiodic)'

    fig_3d.update_layout(
        title=title,
        scene=dict(
            aspectmode='data',
            xaxis_title='X',
            yaxis_title='Y',
            zaxis_title='Z',
            camera=dict(
                eye=dict(x=1.5, y=1.5, z=1.2),
                up=dict(x=0, y=0, z=1)
            ),
            dragmode='turntable'
        ),
        showlegend=False,
        margin=dict(l=0, r=0, t=40, b=0)
    )

    # Create Poincaré section
    show_poincare = 'poincare' in display_options
    poincare_style = {'display': 'block'} if show_poincare else {'display': 'none'}

    if show_poincare:
        t_poincare = np.linspace(0, min(t_max * 10, 5000), 100000)
        theta, phi = poincare_section(t_poincare, alpha, section_angle=0)

        fig_poincare = go.Figure()
        fig_poincare.add_trace(
            go.Scatter(
                x=theta,
                y=phi,
                mode='markers',
                marker=dict(
                    size=3 if is_periodic else 1,
                    color=color,
                    opacity=0.7
                ),
                name='Section Points',
                hoverinfo='skip'
            )
        )

        fig_poincare.update_layout(
            title='Poincaré Section',
            xaxis_title='θ (poloidal)',
            yaxis_title='φ (toroidal)',
            xaxis=dict(range=[0, 2*np.pi]),
            yaxis=dict(range=[0, 2*np.pi]),
            margin=dict(l=50, r=50, t=50, b=50),
            showlegend=False
        )
    else:
        fig_poincare = go.Figure()

    # Create info panel
    info_content = [
        html.H5(f"α = {alpha:.8f}", className="mb-3"),
    ]

    if is_periodic:
        info_content.extend([
            html.P([
                html.Strong("Type: "), "Periodic (Closed Orbit)", html.Br(),
                html.Strong("Rational Form: "), f"{p}/{q}", html.Br(),
                html.Strong("Period: "), f"{q} cycles", html.Br(),
                html.Strong("Poincaré Points: "), f"{q} distinct points"
            ], className="mb-0"),
            html.Div([
                html.Span("●", style={'color': 'red', 'fontSize': '20px'}),
                " Red indicates periodic motion"
            ], className="mt-2")
        ])
    else:
        info_content.extend([
            html.P([
                html.Strong("Type: "), "Quasiperiodic (Dense)", html.Br(),
                html.Strong("Best Approximation: "), f"{p}/{q}", html.Br(),
                html.Strong("Error: "), f"{abs(alpha - p/q):.2e}", html.Br(),
                html.Strong("Poincaré Section: "), "Dense circle"
            ], className="mb-0"),
            html.Div([
                html.Span("●", style={'color': 'green', 'fontSize': '20px'}),
                " Green indicates quasiperiodic motion"
            ], className="mt-2")
        ])

    # Create flat torus visualization
    show_flat_torus = 'flat_torus' in display_options
    flat_torus_style = {'display': 'block'} if show_flat_torus else {'display': 'none'}

    if show_flat_torus:
        fig_flat_torus = visualize_flat_torus_line(slope=alpha, t_max=t_max, show_unwrapped=True)
    else:
        fig_flat_torus = go.Figure()

    # Create density heatmap
    show_density = 'density' in display_options
    density_style = {'display': 'block'} if show_density else {'display': 'none'}

    if show_density:
        fig_density = create_density_heatmap(slope=alpha, t_max=min(t_max * 10, 5000), grid_size=100)
    else:
        fig_density = go.Figure()

    return fig_3d, fig_poincare, poincare_style, fig_flat_torus, flat_torus_style, fig_density, density_style, info_content


# Run the app
if __name__ == '__main__':
    print("Starting Dash app...")
    print("Open your browser to: http://127.0.0.1:8050/")
    app.run(debug=True, port=8050)
