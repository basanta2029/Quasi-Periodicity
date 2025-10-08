"""
Interactive "Draw Your Own Line" Dash App for Flat Torus

Students click two points to define a line, then watch it wrap in real-time!
"""

import dash
from dash import dcc, html, Input, Output, State
import dash_bootstrap_components as dbc
import plotly.graph_objects as go
import numpy as np
from pathlib import Path
import sys

# Add src to path
sys.path.append(str(Path(__file__).parent.parent / 'src'))

from visualizations.interactive_flat_torus import (
    create_interactive_canvas,
    calculate_slope_from_points,
    classify_slope,
    generate_wrapping_line_animated,
    add_clicked_points_to_fig,
    add_line_segments_to_fig
)

# Initialize app
app = dash.Dash(__name__, external_stylesheets=[dbc.themes.BOOTSTRAP])
app.title = "Draw Your Own Geodesic"

# Layout
app.layout = dbc.Container([
    dbc.Row([
        dbc.Col([
            html.H1("🎨 Draw Your Own Geodesic on the Flat Torus",
                   className="text-center mb-4 mt-4"),
            html.P([
                "Click ", html.B("two points"), " on the square to draw a line. ",
                "Watch it wrap around the edges! Will it close (rational slope) or fill the square (irrational slope)?"
            ], className="text-center lead")
        ])
    ]),

    dbc.Row([
        # Left column: Canvas
        dbc.Col([
            dcc.Graph(
                id='interactive-canvas',
                figure=create_interactive_canvas(),
                config={'displayModeBar': False},
                style={'height': '600px'}
            ),

            # Control buttons
            html.Div([
                dbc.ButtonGroup([
                    dbc.Button("Clear", id="btn-clear", color="secondary", className="me-2"),
                    dbc.Button("Play", id="btn-play", color="success", className="me-2"),
                    dbc.Button("Pause", id="btn-pause", color="warning", className="me-2", disabled=True),
                ], className="mb-3")
            ], className="text-center mt-3"),

            # Speed slider
            html.Div([
                html.Label("Animation Speed:", className="fw-bold"),
                dcc.Slider(
                    id='speed-slider',
                    min=1,
                    max=10,
                    step=1,
                    value=5,
                    marks={i: f'{i}x' for i in range(1, 11)},
                    tooltip={"placement": "bottom", "always_visible": True}
                )
            ], className="mt-3"),

            # Preset slopes
            html.Div([
                html.Label("Try these slopes:", className="fw-bold mt-3"),
                dbc.ButtonGroup([
                    dbc.Button("1/2", id="preset-half", size="sm", color="primary", outline=True),
                    dbc.Button("2/3", id="preset-two-thirds", size="sm", color="primary", outline=True),
                    dbc.Button("3/5", id="preset-three-fifths", size="sm", color="primary", outline=True),
                    dbc.Button("√2", id="preset-sqrt2", size="sm", color="success", outline=True),
                    dbc.Button("φ", id="preset-phi", size="sm", color="success", outline=True),
                    dbc.Button("π/4", id="preset-pi", size="sm", color="success", outline=True),
                ], className="mt-2")
            ], className="text-center")

        ], md=7),

        # Right column: Info panel
        dbc.Col([
            dbc.Card([
                dbc.CardHeader(html.H4("Your Geodesic", className="mb-0")),
                dbc.CardBody([
                    html.Div(id='slope-info', children=[
                        html.P("Click two points on the square to get started!",
                              className="text-muted text-center")
                    ])
                ])
            ], className="mb-3"),

            dbc.Card([
                dbc.CardHeader(html.H5("Understanding the Result", className="mb-0")),
                dbc.CardBody([
                    html.P([
                        html.Strong("Rational Slope (e.g., 1/2, 2/3):"), html.Br(),
                        "The line ", html.Span("closes", className="text-danger fw-bold"),
                        " after a finite number of wraps. It traces a periodic orbit."
                    ], className="mb-3"),
                    html.P([
                        html.Strong("Irrational Slope (e.g., √2, φ, π):"), html.Br(),
                        "The line ", html.Span("never closes", className="text-success fw-bold"),
                        " and becomes ", html.Span("dense", className="text-success fw-bold"),
                        " - it eventually passes arbitrarily close to every point!"
                    ], className="mb-3"),
                    html.Hr(),
                    html.P([
                        html.Strong("The Flat Torus:"), html.Br(),
                        "The square with opposite edges identified. ",
                        "When the line hits an edge, it wraps to the opposite edge and continues."
                    ], className="mb-0 small text-muted")
                ])
            ])
        ], md=5)
    ]),

    # Hidden stores for state
    dcc.Store(id='clicked-points', data=[]),
    dcc.Store(id='slope-data', data=None),
    dcc.Store(id='animation-frames', data=None),
    dcc.Store(id='is-playing', data=False),

    # Animation interval
    dcc.Interval(id='animation-interval', interval=50, disabled=True, n_intervals=0),

], fluid=True)


# Callback for handling clicks on canvas
@app.callback(
    [Output('clicked-points', 'data'),
     Output('slope-data', 'data'),
     Output('animation-frames', 'data'),
     Output('interactive-canvas', 'figure'),
     Output('slope-info', 'children')],
    [Input('interactive-canvas', 'clickData'),
     Input('btn-clear', 'n_clicks'),
     Input('preset-half', 'n_clicks'),
     Input('preset-two-thirds', 'n_clicks'),
     Input('preset-three-fifths', 'n_clicks'),
     Input('preset-sqrt2', 'n_clicks'),
     Input('preset-phi', 'n_clicks'),
     Input('preset-pi', 'n_clicks')],
    [State('clicked-points', 'data'),
     State('slope-data', 'data')]
)
def handle_clicks(clickData, btn_clear, preset_half, preset_two_thirds, preset_three_fifths,
                  preset_sqrt2, preset_phi, preset_pi, clicked_points, slope_data):
    """Handle clicks on canvas and preset buttons."""
    ctx = dash.callback_context

    if not ctx.triggered:
        return dash.no_update

    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]

    # Clear button
    if trigger_id == 'btn-clear':
        fig = create_interactive_canvas()
        info = html.P("Click two points on the square to get started!",
                     className="text-muted text-center")
        return [], None, None, fig, info

    # Preset buttons
    preset_slopes = {
        'preset-half': (0.2, 0.1, 0.8, 0.4),  # slope = 1/2
        'preset-two-thirds': (0.15, 0.1, 0.75, 0.5),  # slope = 2/3
        'preset-three-fifths': (0.2, 0.1, 0.7, 0.4),  # slope = 3/5
        'preset-sqrt2': (0.1, 0.1, 0.6, 0.1 + 0.5*np.sqrt(2)),  # slope = √2
        'preset-phi': (0.1, 0.1, 0.7, 0.1 + 0.6*(1+np.sqrt(5))/2),  # slope = φ
        'preset-pi': (0.1, 0.1, 0.8, 0.1 + 0.7*np.pi/4),  # slope = π/4
    }

    if trigger_id in preset_slopes:
        x1, y1, x2, y2 = preset_slopes[trigger_id]
        # Wrap y2 to [0, 1]
        y2 = y2 % 1.0
        clicked_points = [(x1, y1), (x2, y2)]

    # Canvas click
    elif trigger_id == 'interactive-canvas' and clickData is not None:
        point = clickData['points'][0]
        new_point = (point['x'], point['y'])

        # Ensure point is in [0, 1]
        new_point = (max(0, min(1, new_point[0])), max(0, min(1, new_point[1])))

        if clicked_points is None:
            clicked_points = []

        if len(clicked_points) < 2:
            clicked_points.append(new_point)
        else:
            # Reset and start new line
            clicked_points = [new_point]

    # Create figure
    fig = create_interactive_canvas()

    # If we don't have points yet, just return empty canvas
    if clicked_points is None or len(clicked_points) == 0:
        info = html.P("Click two points on the square to get started!",
                     className="text-muted text-center")
        return clicked_points, None, None, fig, info

    # Add clicked points to figure
    fig = add_clicked_points_to_fig(fig, clicked_points, color='blue')

    # If we have one point, show instruction
    if len(clicked_points) == 1:
        info = html.P([
            html.Span("Point 1: ", className="fw-bold"),
            f"({clicked_points[0][0]:.3f}, {clicked_points[0][1]:.3f})", html.Br(),
            html.Span("Click a second point to draw the line!", className="text-primary")
        ])
        return clicked_points, None, None, fig, info

    # We have two points - calculate slope and generate animation
    point1, point2 = clicked_points[0], clicked_points[1]
    slope = calculate_slope_from_points(point1, point2)
    slope_info = classify_slope(slope)

    # Generate animation frames
    frames = generate_wrapping_line_animated(point1, slope, n_frames=300, wraps_per_frame=0.1)

    # Create info panel
    color = 'danger' if slope_info['is_rational'] else 'success'
    icon = '🔴' if slope_info['is_rational'] else '🟢'

    info = html.Div([
        html.H5([icon, f" {slope_info['classification']}"], className=f"text-{color}"),
        html.Hr(),
        html.P([
            html.Strong("Slope: "),
            f"α = {slope_info['slope']:.6f}" if abs(slope) < 100 else "α = ∞"
        ]),
        html.P([
            html.Strong("Rational Form: "),
            slope_info['approx_str']
        ]),
        html.P([
            html.Strong("Description: "), html.Br(),
            slope_info['description']
        ], className=f"text-{color} fw-bold"),
        html.Hr(),
        html.P([
            html.Strong("Wraps: "),
            html.Span("0", id='wrap-counter')
        ]),
        html.Div([
            html.P("Click ", html.Strong("Play"), " to watch the line wrap!",
                  className="text-center text-muted small")
        ])
    ])

    return clicked_points, slope_info, frames, fig, info


# Callback for animation
@app.callback(
    [Output('interactive-canvas', 'figure', allow_duplicate=True),
     Output('animation-interval', 'disabled'),
     Output('btn-play', 'disabled'),
     Output('btn-pause', 'disabled'),
     Output('is-playing', 'data')],
    [Input('btn-play', 'n_clicks'),
     Input('btn-pause', 'n_clicks'),
     Input('animation-interval', 'n_intervals')],
    [State('clicked-points', 'data'),
     State('slope-data', 'data'),
     State('animation-frames', 'data'),
     State('is-playing', 'data'),
     State('speed-slider', 'value')],
    prevent_initial_call=True
)
def control_animation(play_clicks, pause_clicks, n_intervals,
                     clicked_points, slope_data, frames, is_playing, speed):
    """Control play/pause and update animation."""
    ctx = dash.callback_context

    if not ctx.triggered:
        return dash.no_update

    trigger_id = ctx.triggered[0]['prop_id'].split('.')[0]

    # Play button
    if trigger_id == 'btn-play':
        if frames is None:
            return dash.no_update
        return dash.no_update, False, True, False, True

    # Pause button
    if trigger_id == 'btn-pause':
        return dash.no_update, True, False, True, False

    # Animation interval tick
    if trigger_id == 'animation-interval' and is_playing and frames is not None:
        # Determine which frame to show based on n_intervals and speed
        frame_idx = (n_intervals * speed) % len(frames)
        frame = frames[frame_idx]

        # Create figure
        fig = create_interactive_canvas()

        # Add clicked points
        if clicked_points:
            fig = add_clicked_points_to_fig(fig, clicked_points, color='blue')

        # Add line segments
        color = 'red' if slope_data and slope_data['is_rational'] else 'green'
        fig = add_line_segments_to_fig(
            fig,
            frame['segments_x'],
            frame['segments_y'],
            color=color,
            width=3
        )

        # Update title with wrap count
        fig.update_layout(
            title=f"🎨 Wraps: {frame['wrap_count']} | Current position: ({frame['current_point'][0]:.3f}, {frame['current_point'][1]:.3f})"
        )

        return fig, False, True, False, True

    return dash.no_update


if __name__ == '__main__':
    print("=" * 70)
    print("INTERACTIVE FLAT TORUS EXPLORER")
    print("=" * 70)
    print()
    print("Starting app...")
    print("Open your browser to: http://127.0.0.1:8051/")
    print()
    print("Instructions:")
    print("  1. Click TWO POINTS on the square to define a line")
    print("  2. Click PLAY to watch the line wrap around edges")
    print("  3. Try different slopes to see rational vs irrational behavior!")
    print()
    print("=" * 70)
    app.run(debug=True, port=8051)
