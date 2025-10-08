"""
Mathematical functions for quasiperiodic systems and visualizations.
"""

import numpy as np
from typing import Tuple, Optional


def torus_surface(R: float = 2, r: float = 1,
                  n_theta: int = 100, n_phi: int = 100) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Generate a 2-torus surface using parametric equations.

    Parameters:
    -----------
    R : float
        Major radius (distance from center of torus to center of tube)
    r : float
        Minor radius (radius of the tube)
    n_theta : int
        Number of points in the poloidal direction
    n_phi : int
        Number of points in the toroidal direction

    Returns:
    --------
    X, Y, Z : ndarray
        Coordinates of the torus surface
    """
    theta = np.linspace(0, 2*np.pi, n_theta)
    phi = np.linspace(0, 2*np.pi, n_phi)
    theta, phi = np.meshgrid(theta, phi)

    X = (R + r*np.cos(theta)) * np.cos(phi)
    Y = (R + r*np.cos(theta)) * np.sin(phi)
    Z = r * np.sin(theta)

    return X, Y, Z


def torus_trajectory(t: np.ndarray, alpha: float,
                     R: float = 2, r: float = 1) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Generate a trajectory on the torus with winding number alpha.

    For rational alpha = p/q, the trajectory closes after q loops.
    For irrational alpha, the trajectory densely fills the torus.

    Parameters:
    -----------
    t : ndarray
        Time/parameter array
    alpha : float
        Winding number (slope on the universal cover)
    R : float
        Major radius
    r : float
        Minor radius

    Returns:
    --------
    X, Y, Z : ndarray
        Trajectory coordinates
    """
    theta = t  # Poloidal angle
    phi = alpha * t  # Toroidal angle (scaled by winding number)

    X = (R + r*np.cos(theta)) * np.cos(phi)
    Y = (R + r*np.cos(theta)) * np.sin(phi)
    Z = r * np.sin(theta)

    return X, Y, Z


def poincare_section(t: np.ndarray, alpha: float,
                     section_angle: float = 0) -> Tuple[np.ndarray, np.ndarray]:
    """
    Compute Poincaré section of torus trajectory.

    Parameters:
    -----------
    t : ndarray
        Time array
    alpha : float
        Winding number
    section_angle : float
        Angle at which to take the section

    Returns:
    --------
    theta_crossings, phi_crossings : ndarray
        Angles at section crossings
    """
    phi = alpha * t
    theta = t

    # Find crossings of the section plane
    phi_mod = np.mod(phi, 2*np.pi)
    crossings = np.where(np.diff(np.sign(phi_mod - section_angle)))[0]

    if len(crossings) > 0:
        theta_crossings = theta[crossings] % (2*np.pi)
        phi_crossings = phi[crossings] % (2*np.pi)
    else:
        theta_crossings = np.array([])
        phi_crossings = np.array([])

    return theta_crossings, phi_crossings


def quasiperiodic_function_1d(x: np.ndarray, frequencies: list) -> np.ndarray:
    """
    Generate a quasiperiodic function in 1D.

    f(x) = sum_i cos(2π * ω_i * x)

    Parameters:
    -----------
    x : ndarray
        Input array
    frequencies : list
        List of frequencies (should be incommensurable for quasiperiodicity)

    Returns:
    --------
    f : ndarray
        Quasiperiodic function values
    """
    f = np.zeros_like(x)
    for omega in frequencies:
        f += np.cos(2 * np.pi * omega * x)
    return f


def triply_periodic_function(x: np.ndarray, y: np.ndarray, z: np.ndarray,
                              function_type: str = 'schoen-iwp') -> np.ndarray:
    """
    Compute triply periodic minimal surface approximations.

    Parameters:
    -----------
    x, y, z : ndarray
        Coordinate arrays
    function_type : str
        Type of surface:
        - 'schoen-iwp': F(x,y,z) = cos(x)cos(y) + cos(y)cos(z) + cos(z)cos(x)
        - 'gyroid': sin(x)cos(y) + sin(y)cos(z) + sin(z)cos(x)
        - 'schwarz-p': cos(x) + cos(y) + cos(z)
        - 'schwarz-d': sin(x)sin(y)sin(z) + sin(x)cos(y)cos(z) + cos(x)sin(y)cos(z) + cos(x)cos(y)sin(z)

    Returns:
    --------
    F : ndarray
        Function values
    """
    if function_type == 'schoen-iwp':
        F = np.cos(x)*np.cos(y) + np.cos(y)*np.cos(z) + np.cos(z)*np.cos(x)
    elif function_type == 'gyroid':
        F = np.sin(x)*np.cos(y) + np.sin(y)*np.cos(z) + np.sin(z)*np.cos(x)
    elif function_type == 'schwarz-p':
        F = np.cos(x) + np.cos(y) + np.cos(z)
    elif function_type == 'schwarz-d':
        F = (np.sin(x)*np.sin(y)*np.sin(z) +
             np.sin(x)*np.cos(y)*np.cos(z) +
             np.cos(x)*np.sin(y)*np.cos(z) +
             np.cos(x)*np.cos(y)*np.sin(z))
    else:
        raise ValueError(f"Unknown function type: {function_type}")

    return F


def create_meshgrid_3d(bounds: Tuple[float, float] = (-np.pi, np.pi),
                       resolution: int = 50) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """
    Create a 3D meshgrid for volume data.

    Parameters:
    -----------
    bounds : tuple
        (min, max) bounds for each dimension
    resolution : int
        Number of points along each axis

    Returns:
    --------
    X, Y, Z : ndarray
        Meshgrid arrays
    """
    x = np.linspace(bounds[0], bounds[1], resolution)
    y = np.linspace(bounds[0], bounds[1], resolution)
    z = np.linspace(bounds[0], bounds[1], resolution)
    X, Y, Z = np.meshgrid(x, y, z, indexing='ij')
    return X, Y, Z


def golden_ratio() -> float:
    """Return the golden ratio φ = (1 + √5)/2"""
    return (1 + np.sqrt(5)) / 2


def common_irrational_numbers() -> dict:
    """Return dictionary of common irrational numbers used in quasiperiodic systems."""
    return {
        'sqrt(2)': np.sqrt(2),
        'sqrt(3)': np.sqrt(3),
        'sqrt(5)': np.sqrt(5),
        'phi (golden ratio)': golden_ratio(),
        'pi': np.pi,
        'e': np.e,
        'sqrt(2)/2': np.sqrt(2)/2,
        'phi - 1': golden_ratio() - 1,
        '1/phi': 1/golden_ratio(),
    }


def rational_approximation(alpha: float, max_denominator: int = 100) -> Tuple[int, int]:
    """
    Find rational approximation p/q of irrational number alpha.

    Parameters:
    -----------
    alpha : float
        Irrational number to approximate
    max_denominator : int
        Maximum allowed denominator

    Returns:
    --------
    p, q : int
        Numerator and denominator of best approximation
    """
    from fractions import Fraction
    frac = Fraction(alpha).limit_denominator(max_denominator)
    return frac.numerator, frac.denominator


def is_closed_orbit(alpha: float, tolerance: float = 1e-6) -> bool:
    """
    Check if winding number alpha gives a closed orbit (rational) or quasiperiodic (irrational).

    Parameters:
    -----------
    alpha : float
        Winding number
    tolerance : float
        Tolerance for rationality check

    Returns:
    --------
    bool
        True if orbit is closed (alpha is rational), False if quasiperiodic
    """
    p, q = rational_approximation(alpha, max_denominator=10000)
    return abs(alpha - p/q) < tolerance
