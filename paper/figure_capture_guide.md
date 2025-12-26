# Figure Capture Guide for Research Paper

## How to Capture High-Quality Figures from Interactive Apps

### 1. Capturing from 2D Flat Torus App

1. **Open the app**: Navigate to `app/js/index.html` in your browser
2. **Set up the scene**:
   - Clear any existing geodesics
   - Choose a clean background
   - Set appropriate zoom level

3. **Recommended captures**:
   - **Figure 1**: Single irrational geodesic (use φ or √2)
   - **Figure 2**: Multiple geodesics showing different behaviors
   - **Figure 5**: UI demonstration with controls visible

4. **Screenshot process**:
   - Use browser developer tools (F12)
   - Set viewport to exactly 1200x800 pixels for consistency
   - Use browser's screenshot feature or OS screenshot tool
   - Save as PNG in `paper/figures/` directory

### 2. Capturing from 3D Torus App

1. **Open the app**: Navigate to `app/js-3d/index.html`
2. **Camera positioning**:
   - Use orbit controls to get good viewing angle
   - Ensure torus fills frame appropriately

3. **Recommended captures**:
   - **Figure 3**: Complex irrational geodesic after ~100 wraps
   - **Figure 6**: Multiple viewing angles of same geodesic

### 3. Creating Additional Figures

For figures that need to be created (not from existing apps):

#### Figure 4: Quasicrystal Pattern
```python
import numpy as np
import matplotlib.pyplot as plt

# Create Penrose-like pattern
def quasicrystal_pattern(n=5, size=500):
    x = np.linspace(-5, 5, size)
    y = np.linspace(-5, 5, size)
    X, Y = np.meshgrid(x, y)
    
    pattern = np.zeros_like(X)
    for i in range(n):
        angle = 2 * np.pi * i / n
        kx, ky = np.cos(angle), np.sin(angle)
        pattern += np.cos(kx * X + ky * Y)
    
    return pattern

# Generate and save
pattern = quasicrystal_pattern()
plt.figure(figsize=(8, 8))
plt.imshow(pattern, cmap='viridis')
plt.axis('off')
plt.tight_layout()
plt.savefig('figures/quasicrystal_pattern.png', dpi=300, bbox_inches='tight')
```

#### Figure 7: Level Sets Visualization
```python
# Code for F(x,y,z) = cos(x)cos(y) + cos(y)cos(z) + cos(z)cos(x)
# To be implemented with matplotlib 3D or mayavi
```

### 4. Figure Organization

Create the following directory structure:
```
paper/
├── figures/
│   ├── flat_torus_single.png      (Figure 1)
│   ├── flat_torus_multiple.png    (Figure 2)
│   ├── torus_3d_geodesic.png      (Figure 3)
│   ├── quasicrystal_pattern.png   (Figure 4)
│   ├── app_2d_interface.png       (Figure 5)
│   ├── torus_3d_views.png         (Figure 6)
│   └── level_sets.png             (Figure 7)
└── ...
```

### 5. LaTeX Integration

In your LaTeX file, use:
```latex
\begin{figure}[H]
\centering
\includegraphics[width=0.8\textwidth]{figures/flat_torus_single.png}
\caption{Your caption here}
\label{fig:label}
\end{figure}
```

### 6. Best Practices

1. **Consistency**: Use same resolution for all captures
2. **Annotations**: Add labels in LaTeX, not in screenshots
3. **Color schemes**: Ensure good contrast for printing
4. **File formats**: PNG for screenshots, PDF for vector graphics
5. **Accessibility**: Consider colorblind-friendly palettes

### 7. Quick Capture Script

For automated captures using Puppeteer:
```javascript
// capture_figures.js
const puppeteer = require('puppeteer');

async function captureApp2D() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 800 });
  
  await page.goto('file:///path/to/app/js/index.html');
  await page.waitForTimeout(2000); // Let animations settle
  
  // Add geodesic programmatically if needed
  // await page.click(...);
  
  await page.screenshot({ 
    path: 'paper/figures/flat_torus_single.png',
    fullPage: false 
  });
  
  await browser.close();
}

captureApp2D();
```

### 8. Alternative: Export Functions

Consider adding export functionality to your apps:
- SVG export for vector graphics
- High-resolution canvas export
- Save current state/parameters for reproducibility