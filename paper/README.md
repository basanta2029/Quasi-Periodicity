# Research Paper: Quasiperiodic Functions in Multiple Variables

This directory contains the LaTeX source and supporting materials for the undergraduate research paper on quasiperiodic functions.

## Structure

- `quasiperiodic_functions_paper.tex` - Main LaTeX document
- `paper_outline.md` - Detailed outline with section planning
- `figure_capture_guide.md` - Instructions for creating figures
- `figures/` - Directory for all figures (create before compiling)
- `Makefile` - Build automation

## Building the Paper

### Prerequisites

- LaTeX distribution (TeX Live, MiKTeX, or MacTeX)
- PDF viewer
- Python (for generating some figures)

### Compilation

```bash
# Simple build
make

# Clean auxiliary files
make clean

# Clean everything including PDF
make distclean

# Manual compilation
pdflatex quasiperiodic_functions_paper.tex
pdflatex quasiperiodic_functions_paper.tex  # Run twice for references
```

## Writing Guidelines

### Mathematical Notation

- Use `\R`, `\Z`, `\T`, `\Q`, `\N` for number systems
- Define all notation before first use
- Use theorem environments consistently

### Code Integration

When including code examples:
```latex
\begin{verbatim}
# Python code here
import numpy as np
\end{verbatim}
```

Or for inline code: `\texttt{function\_name}`

### References

Add new references to the bibliography section:
```latex
\bibitem{key2024}
Author Name,
\emph{Title of Work},
Journal/Publisher, Year.
```

## Progress Tracking

- [x] Paper structure and outline
- [x] LaTeX template with proper formatting
- [ ] Abstract (needs refinement with actual results)
- [ ] Section 1: Introduction
- [ ] Section 2: Mathematical Foundations  
- [ ] Section 3: Multiple Variables
- [ ] Section 4: Quasicrystals Connection
- [ ] Section 5: Visualization Tools
- [ ] Section 6: Special Functions
- [ ] Section 7: Physical Applications
- [ ] Section 8: Conclusions
- [ ] Figures from web apps
- [ ] Python-generated figures
- [ ] Bibliography completion
- [ ] Proofreading and revision

## Next Steps

1. **Immediate tasks**:
   - Create `figures/` directory
   - Capture screenshots from web apps
   - Begin writing Section 1 (Introduction)

2. **Research tasks**:
   - Gather more references on quasicrystals
   - Find specific examples for magnetoresistance section
   - Research NTC library documentation

3. **Technical tasks**:
   - Implement Python scripts for additional figures
   - Add export functionality to web apps
   - Create reproducible examples

## Notes for Writing

### Target Audience
- Undergraduate students in mathematics/physics
- Assume calculus and linear algebra knowledge
- Explain specialized concepts clearly

### Writing Style
- Clear, concise explanations
- Build concepts progressively
- Use examples liberally
- Connect theory to visualizations

### Length Guidelines
- Total: 25-30 pages
- Each main section: 3-5 pages
- Include plenty of figures
- Balance text with visual elements

## Resources

- [NTC Library](https://deleo.website/NTC/)
- [Three.js Documentation](https://threejs.org/docs/)
- [LaTeX Math Symbols](http://www.ctan.org/tex-archive/info/symbols/comprehensive/)
- [Academic Writing Guide](https://www.scribbr.com/academic-writing/)

## Contact

For questions about the mathematical content, consult with Professor Roberto De Leo.