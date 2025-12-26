#!/usr/bin/env python3
"""
Generate figures for the quasiperiodic functions research paper.
"""

import numpy as np
import matplotlib.pyplot as plt
from matplotlib import cm
from mpl_toolkits.mplot3d import Axes3D
import os

# Ensure figures directory exists
os.makedirs('figures', exist_ok=True)

# Set consistent style
plt.style.use('seaborn-v0_8-darkgrid')
plt.rcParams['figure.dpi'] = 300
plt.rcParams['savefig.dpi'] = 300
plt.rcParams['font.size'] = 12

def generate_quasicrystal_pattern():
    """Generate a 2D quasicrystal-like pattern using wave interference."""
    print("Generating quasicrystal pattern...")
    
    # Create grid
    size = 800
    x = np.linspace(-10, 10, size)
    y = np.linspace(-10, 10, size)
    X, Y = np.meshgrid(x, y)
    
    # Create quasicrystal pattern with 5-fold symmetry
    n_waves = 5
    pattern = np.zeros_like(X)
    
    for i in range(n_waves):
        angle = 2 * np.pi * i / n_waves
        kx, ky = np.cos(angle), np.sin(angle)
        pattern += np.cos(kx * X + ky * Y)
    
    # Create figure
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    
    # Full pattern
    im1 = ax1.imshow(pattern, cmap='RdBu', extent=[-10, 10, -10, 10])
    ax1.set_title('5-fold Quasicrystal Pattern')
    ax1.set_xlabel('x')
    ax1.set_ylabel('y')
    plt.colorbar(im1, ax=ax1, fraction=0.046)
    
    # Zoomed version showing detail
    zoom_size = 200
    center = size // 2
    pattern_zoom = pattern[center-zoom_size:center+zoom_size, 
                          center-zoom_size:center+zoom_size]
    im2 = ax2.imshow(pattern_zoom, cmap='RdBu', extent=[-2.5, 2.5, -2.5, 2.5])
    ax2.set_title('Zoomed Detail')
    ax2.set_xlabel('x')
    ax2.set_ylabel('y')
    plt.colorbar(im2, ax=ax2, fraction=0.046)
    
    plt.tight_layout()
    plt.savefig('figures/quasicrystal_pattern.png', bbox_inches='tight')
    plt.close()
    print("Saved: figures/quasicrystal_pattern.png")

def generate_1d_quasiperiodic():
    """Generate 1D quasiperiodic function examples."""
    print("Generating 1D quasiperiodic function examples...")
    
    x = np.linspace(0, 100, 5000)
    
    fig, axes = plt.subplots(3, 1, figsize=(10, 8))
    
    # Example 1: Two incommensurate frequencies
    y1 = np.cos(x) + np.cos(np.sqrt(2) * x)
    axes[0].plot(x, y1, 'b-', linewidth=1)
    axes[0].set_title(r'$f(x) = \cos(x) + \cos(\sqrt{2}x)$')
    axes[0].set_xlim(0, 100)
    axes[0].grid(True, alpha=0.3)
    
    # Example 2: Three frequencies including golden ratio
    phi = (1 + np.sqrt(5)) / 2
    y2 = np.cos(x) + np.cos(phi * x) + np.cos(np.pi * x)
    axes[1].plot(x, y2, 'r-', linewidth=1)
    axes[1].set_title(r'$f(x) = \cos(x) + \cos(\phi x) + \cos(\pi x)$')
    axes[1].set_xlim(0, 100)
    axes[1].grid(True, alpha=0.3)
    
    # Example 3: Amplitude modulated
    y3 = np.cos(x) * np.cos(np.sqrt(3) * x / 10)
    axes[2].plot(x, y3, 'g-', linewidth=1)
    axes[2].set_title(r'$f(x) = \cos(x) \cdot \cos(\sqrt{3}x/10)$')
    axes[2].set_xlim(0, 100)
    axes[2].set_xlabel('x')
    axes[2].grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.savefig('figures/1d_quasiperiodic_examples.png', bbox_inches='tight')
    plt.close()
    print("Saved: figures/1d_quasiperiodic_examples.png")

def generate_torus_parametrization():
    """Generate a figure showing torus parametrization."""
    print("Generating torus parametrization figure...")
    
    fig = plt.figure(figsize=(12, 5))
    
    # Parameters
    R, r = 3, 1  # Major and minor radius
    u = np.linspace(0, 2 * np.pi, 100)
    v = np.linspace(0, 2 * np.pi, 100)
    U, V = np.meshgrid(u, v)
    
    # Torus parametrization
    X = (R + r * np.cos(V)) * np.cos(U)
    Y = (R + r * np.cos(V)) * np.sin(U)
    Z = r * np.sin(V)
    
    # Subplot 1: 3D torus
    ax1 = fig.add_subplot(121, projection='3d')
    ax1.plot_surface(X, Y, Z, cmap='viridis', alpha=0.8, 
                     linewidth=0.5, edgecolors='gray')
    ax1.set_title('Torus in 3D')
    ax1.set_xlabel('x')
    ax1.set_ylabel('y')
    ax1.set_zlabel('z')
    ax1.set_box_aspect([1,1,0.5])
    
    # Subplot 2: Flat torus (fundamental domain)
    ax2 = fig.add_subplot(122)
    # Draw fundamental domain
    rect = plt.Rectangle((0, 0), 2*np.pi, 2*np.pi, 
                        fill=False, edgecolor='black', linewidth=2)
    ax2.add_patch(rect)
    
    # Add some geodesics
    t = np.linspace(0, 4*np.pi, 1000)
    # Rational geodesic
    x1 = t % (2*np.pi)
    y1 = (2*t/3) % (2*np.pi)
    ax2.plot(x1, y1, 'b-', alpha=0.7, label='Rational (2,3)')
    
    # Irrational geodesic
    x2 = t % (2*np.pi)
    y2 = (np.sqrt(2)*t) % (2*np.pi)
    ax2.plot(x2, y2, 'r-', alpha=0.5, label=r'Irrational ($\sqrt{2}$)')
    
    ax2.set_xlim(-0.5, 2*np.pi + 0.5)
    ax2.set_ylim(-0.5, 2*np.pi + 0.5)
    ax2.set_xlabel(r'$\theta_1$')
    ax2.set_ylabel(r'$\theta_2$')
    ax2.set_title('Flat Torus (Fundamental Domain)')
    ax2.legend()
    ax2.grid(True, alpha=0.3)
    ax2.set_aspect('equal')
    
    plt.tight_layout()
    plt.savefig('figures/torus_parametrization.png', bbox_inches='tight')
    plt.close()
    print("Saved: figures/torus_parametrization.png")

def generate_level_sets_preview():
    """Generate a preview of level sets for the triply periodic function."""
    print("Generating level sets preview...")
    
    # Create a 2D slice
    x = np.linspace(-np.pi, np.pi, 200)
    y = np.linspace(-np.pi, np.pi, 200)
    X, Y = np.meshgrid(x, y)
    
    # Fix z = 0 for the slice
    Z = 0
    F = np.cos(X)*np.cos(Y) + np.cos(Y)*np.cos(Z) + np.cos(Z)*np.cos(X)
    
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))
    
    # Contour plot
    levels = np.linspace(-2, 2, 20)
    cs = ax1.contour(X, Y, F, levels=levels, cmap='RdBu')
    ax1.clabel(cs, inline=True, fontsize=8)
    ax1.set_title(r'Level Sets of $F(x,y,0) = \cos(x)\cos(y) + \cos(y) + \cos(x)$')
    ax1.set_xlabel('x')
    ax1.set_ylabel('y')
    ax1.grid(True, alpha=0.3)
    ax1.set_aspect('equal')
    
    # Filled contour
    cf = ax2.contourf(X, Y, F, levels=levels, cmap='RdBu')
    plt.colorbar(cf, ax=ax2, label='F(x,y,0)')
    ax2.set_title('Filled Contour Plot')
    ax2.set_xlabel('x')
    ax2.set_ylabel('y')
    ax2.set_aspect('equal')
    
    plt.tight_layout()
    plt.savefig('figures/level_sets_preview.png', bbox_inches='tight')
    plt.close()
    print("Saved: figures/level_sets_preview.png")

def main():
    """Generate all figures."""
    print("Starting figure generation...")
    print("-" * 40)
    
    generate_quasicrystal_pattern()
    generate_1d_quasiperiodic()
    generate_torus_parametrization()
    generate_level_sets_preview()
    
    print("-" * 40)
    print("All figures generated successfully!")
    print(f"Figures saved in: {os.path.abspath('figures/')}")

if __name__ == '__main__':
    main()