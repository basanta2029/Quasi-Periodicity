"""
Quasiperiodic Functions Visualization Package

This package provides tools for visualizing and exploring quasiperiodic functions,
torus dynamics, minimal surfaces, and quasicrystals.
"""

__version__ = "1.0.0"
__author__ = "Your Name"

from .utils import math_functions, plotting_helpers
from .visualizations import torus_trajectories, minimal_surfaces, quasicrystals

__all__ = [
    'math_functions',
    'plotting_helpers',
    'torus_trajectories',
    'minimal_surfaces',
    'quasicrystals'
]
