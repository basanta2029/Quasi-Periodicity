# Interactive Research Paper

This is an interactive web-based research paper that combines academic writing with live, playable visualizations.

## Features

- **Embedded Interactive Apps**: Your 2D and 3D torus visualizations are embedded directly in the paper
- **Live Mathematical Demos**: Readers can adjust parameters and see results in real-time
- **Professional Academic Format**: Maintains the structure and rigor of a traditional research paper
- **MathJax Integration**: Beautiful mathematical notation rendering
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Structure

```
interactive-paper/
├── index.html          # Main paper document
├── style.css          # Professional styling
├── interactive-demos.js # JavaScript for inline demos
├── images/            # Static images (create as needed)
└── README.md          # This file
```

## Viewing the Paper

1. **Local Viewing**:
   ```bash
   # From the Quasi-Periodicity directory
   python -m http.server 8000
   # Or with Python 2
   python -m SimpleHTTPServer 8000
   ```
   Then open `http://localhost:8000/interactive-paper/` in your browser.

2. **GitHub Pages**: The paper can be deployed to GitHub Pages for online access

3. **PDF Export**: Can still export to PDF (iframes will show placeholder text)

## Key Advantages

1. **True Interactivity**: Readers can explore concepts hands-on
2. **No Installation Required**: Works in any modern web browser
3. **Shareable**: Send a link instead of a PDF file
4. **Always Up-to-Date**: Updates automatically when you modify the apps
5. **Multimedia**: Can include videos, animations, and sound if needed

## Adding Content

### Adding Sections

Add new sections in `index.html`:
```html
<section id="new-section">
    <h2>N. New Section Title</h2>
    <p>Your content here...</p>
</section>
```

### Embedding Your Apps

To embed either of your existing apps:
```html
<div class="embedded-app">
    <h4>Title</h4>
    <iframe src="../app/js/index.html" width="100%" height="600"></iframe>
    <p class="caption">Figure N: Description</p>
</div>
```

### Adding Interactive Demos

Create new canvas-based demos in `interactive-demos.js`:
```javascript
// Your interactive code here
```

## Alternative Formats

### 1. Jupyter Book
If you prefer Python integration:
```bash
pip install jupyter-book
jupyter-book create interactive-paper-jb
# Convert this content to Jupyter notebooks
jupyter-book build interactive-paper-jb
```

### 2. Observable Notebooks
For more advanced interactivity: https://observablehq.com/

### 3. Distill.pub Style
For ML/AI focused papers with advanced visualizations

## Deployment Options

1. **GitHub Pages**: Free hosting with your repository
2. **Netlify**: Already configured in your project
3. **University Server**: If your institution provides web hosting
4. **Arxiv HTML**: Some journals now accept HTML submissions

## Next Steps

1. Complete the remaining sections with your mathematical content
2. Add more interactive demos for key concepts
3. Capture any needed static images
4. Test on different devices and browsers
5. Share with your professor!

## Tips

- Keep file sizes reasonable (especially images)
- Test offline functionality
- Consider adding a table of equations or symbols
- Include downloadable resources (code, data)
- Add social sharing metadata

This format combines the best of both worlds: the rigor and structure of academic writing with the engagement and clarity of interactive visualizations!