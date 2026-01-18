"""
Alternative: Streamlit-based interactive research paper
Run with: streamlit run streamlit-app.py
"""

import streamlit as st
import numpy as np
import matplotlib.pyplot as plt
import plotly.graph_objects as go
from plotly.subplots import make_subplots

# Page config
st.set_page_config(
    page_title="Quasiperiodic Functions Research",
    page_icon="🔬",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS for academic paper look
st.markdown("""
<style>
    .main {
        max-width: 900px;
        margin: 0 auto;
    }
    .stTabs [data-baseweb="tab-list"] {
        gap: 24px;
    }
    .stTabs [data-baseweb="tab"] {
        font-size: 20px;
    }
</style>
""", unsafe_allow_html=True)

# Title
st.markdown("""
# Quasiperiodic Functions in Multiple Variables: Theory, Visualization, and Applications

**Author**: [Your Name]  
**Advisor**: Professor Roberto De Leo  
**Institution**: [Your Institution]
""")

# Abstract
with st.expander("Abstract", expanded=True):
    st.markdown("""
    This paper presents a comprehensive introduction to quasiperiodic functions in multiple variables...
    [Full abstract here]
    """)

# Navigation tabs
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "1. Introduction", 
    "2. Mathematical Foundations", 
    "3. Interactive Demos",
    "4. Applications",
    "5. References"
])

with tab1:
    st.header("1. Introduction")
    
    st.subheader("1.1 Historical Context")
    st.markdown("""
    In 1982, materials scientist Dan Shechtman peered through his electron microscope...
    """)
    
    # Can embed images
    # st.image("images/diffraction.png", caption="Figure 1: Quasicrystal diffraction pattern")

with tab2:
    st.header("2. Mathematical Foundations")
    
    st.subheader("2.1 Periodic vs. Quasiperiodic Functions")
    
    st.latex(r"""
    f(\mathbf{x} + \mathbf{p}_i) = f(\mathbf{x}) \quad \text{for all } \mathbf{x} \in \mathbb{R}^n
    """)
    
    st.markdown("""
    **Definition 2.1**: A function $f: \\mathbb{R}^n \\to \\mathbb{R}$ is *periodic* if...
    """)

with tab3:
    st.header("3. Interactive Demonstrations")
    
    st.subheader("3.1 One-Dimensional Quasiperiodic Functions")
    
    col1, col2 = st.columns([3, 1])
    
    with col2:
        st.markdown("**Parameters**")
        omega1 = st.slider("ω₁", 0.5, 2.0, 1.0, 0.01)
        omega2 = st.slider("ω₂", 1.0, 3.0, 1.414, 0.001)
        
        if st.button("Golden Ratio"):
            omega2 = 1.618
        if st.button("√2"):
            omega2 = 1.414
            
    with col1:
        x = np.linspace(0, 50, 1000)
        y = np.cos(omega1 * x) + np.cos(omega2 * x)
        
        fig = go.Figure()
        fig.add_trace(go.Scatter(x=x, y=y, mode='lines', name='f(x)'))
        fig.update_layout(
            title=f"f(x) = cos({omega1:.2f}x) + cos({omega2:.3f}x)",
            xaxis_title="x",
            yaxis_title="f(x)",
            height=400
        )
        st.plotly_chart(fig, use_container_width=True)
        
        ratio = omega2 / omega1
        if abs(ratio - round(ratio)) < 0.001:
            st.success(f"Periodic with ratio {round(ratio)}")
        else:
            st.info(f"Quasiperiodic with ratio {ratio:.3f}")
    
    st.subheader("3.2 Geodesics on the Flat Torus")
    
    # Here you could embed your actual app or recreate it
    st.markdown("""
    <iframe src="http://localhost:8000/app/js/index.html" 
            width="100%" height="600" frameborder="1">
    </iframe>
    """, unsafe_allow_html=True)
    
    st.info("Note: Make sure your local server is running to see the embedded app above")

with tab4:
    st.header("4. Physical Applications")
    
    st.subheader("4.1 Quasicrystals")
    
    # Generate quasicrystal pattern
    size = 500
    x = np.linspace(-10, 10, size)
    y = np.linspace(-10, 10, size)
    X, Y = np.meshgrid(x, y)
    
    n_fold = st.radio("Symmetry", [5, 8, 12], horizontal=True)
    
    pattern = np.zeros_like(X)
    for i in range(n_fold):
        angle = 2 * np.pi * i / n_fold
        kx, ky = np.cos(angle), np.sin(angle)
        pattern += np.cos(kx * X + ky * Y)
    
    fig, ax = plt.subplots(figsize=(8, 8))
    im = ax.imshow(pattern, cmap='RdBu', extent=[-10, 10, -10, 10])
    ax.set_title(f'{n_fold}-fold Quasicrystal Pattern')
    plt.colorbar(im, ax=ax)
    st.pyplot(fig)

with tab5:
    st.header("References")
    
    st.markdown("""
    1. Shechtman, D., Blech, I., Gratias, D., & Cahn, J. W. (1984). Metallic phase with long-range orientational order and no translational symmetry. *Physical Review Letters*, 53(20), 1951.
    
    2. Bohr, H. (1925). Zur Theorie der fastperiodischen Funktionen. *Acta Mathematica*, 45, 29-127.
    
    3. De Leo, R. (2023). NTC: Numerical Tools for Crystals. https://deleo.website/NTC/
    """)

# Sidebar for navigation
with st.sidebar:
    st.markdown("## Quick Navigation")
    st.markdown("""
    - [Abstract](#)
    - [Introduction](#)
    - [Mathematical Foundations](#)
    - [Interactive Demos](#)
    - [Applications](#)
    - [References](#)
    """)
    
    st.markdown("---")
    st.markdown("### Download Options")
    st.download_button(
        label="Download as PDF",
        data=b"PDF content would go here",
        file_name="quasiperiodic_functions.pdf",
        mime="application/pdf"
    )