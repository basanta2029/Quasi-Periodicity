#!/usr/bin/env python3
"""
Create a complete self-contained HTML file with all assets embedded
"""

import base64
import re
from pathlib import Path

def read_file(path):
    """Read file content"""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    except:
        return None

def read_binary(path):
    """Read binary file as base64"""
    try:
        with open(path, 'rb') as f:
            return base64.b64encode(f.read()).decode('utf-8')
    except:
        return None

def embed_css(html_content, base_path):
    """Embed external CSS files"""
    # Find CSS links
    css_pattern = r'<link[^>]*href="([^"]*\.css[^"]*)"[^>]*>'
    
    def replace_css(match):
        css_url = match.group(1)
        # Remove query params
        css_file = css_url.split('?')[0]
        css_path = base_path / css_file
        
        if css_path.exists():
            css_content = read_file(css_path)
            if css_content:
                return f'<style>\n/* Embedded from {css_file} */\n{css_content}\n</style>'
        return match.group(0)
    
    return re.sub(css_pattern, replace_css, html_content)

def embed_js(html_content, base_path):
    """Embed external JS files"""
    # Find script tags with src
    js_pattern = r'<script[^>]*src="([^"]*\.js)"[^>]*></script>'
    
    def replace_js(match):
        js_file = match.group(1)
        js_path = base_path / js_file
        
        if js_path.exists():
            js_content = read_file(js_path)
            if js_content:
                return f'<script>\n/* Embedded from {js_file} */\n{js_content}\n</script>'
        return match.group(0)
    
    return re.sub(js_pattern, replace_js, html_content)

def embed_iframes(html_content, base_path):
    """Replace iframes with embedded content"""
    # Pattern to match iframes
    iframe_pattern = r'<iframe[^>]*src="([^"]*)"[^>]*></iframe>'
    
    def replace_iframe(match):
        iframe_src = match.group(1)
        full_match = match.group(0)
        
        # Extract width and height from iframe
        width_match = re.search(r'width="(\d+%?)"', full_match)
        height_match = re.search(r'height="(\d+)"', full_match)
        
        width = width_match.group(1) if width_match else "100%"
        height = height_match.group(1) if height_match else "600"
        
        # Create a unique ID for this embed
        if 'js-3d' in iframe_src:
            embed_id = "embed-3d-torus"
            title = "3D Torus Visualization"
        else:
            embed_id = "embed-2d-torus"
            title = "2D Flat Torus Visualization"
        
        # Create embedded section
        embed_html = f'''
<div class="embedded-demo" style="border: 1px solid #ddd; padding: 20px; margin: 20px 0; background: #f9f9f9;">
    <h4 style="margin-top: 0; color: #3498db;">{title}</h4>
    <div id="{embed_id}" style="width: {width}; height: {height}px; background: white; border: 1px solid #ccc; position: relative;">
        <canvas id="{embed_id}-canvas" style="width: 100%; height: 100%;"></canvas>
    </div>
    <div class="demo-controls" style="margin-top: 15px;">
        <p><em>Note: This is a simplified embedded version. For full interactivity, use the online version.</em></p>
    </div>
</div>'''
        
        return embed_html
    
    return re.sub(iframe_pattern, replace_iframe, html_content, flags=re.IGNORECASE)

def create_complete_package():
    """Create the complete self-contained HTML file"""
    
    # Read main HTML
    docs_path = Path("docs")
    main_html = read_file(docs_path / "index.html")
    
    if not main_html:
        print("Error: Could not read main HTML file")
        return
    
    # Remove external script tags (MathJax, polyfill)
    main_html = re.sub(r'<script[^>]*src="https://[^"]*"[^>]*></script>', '', main_html)
    
    # Embed CSS
    main_html = embed_css(main_html, docs_path)
    
    # Embed JavaScript files
    main_html = embed_js(main_html, docs_path)
    
    # Read and embed app files
    app_2d_html = read_file("app/js/index.html") or ""
    app_3d_html = read_file("app/js-3d/index.html") or ""
    
    # Read JavaScript files from apps
    flat_torus_js = read_file("app/js/flatTorusApp.js") or ""
    math_utils_js = read_file("app/js/mathUtils.js") or ""
    
    # Read 3D app files
    three_min_js = read_file("app/js-3d/three.min.js") or ""
    orbit_controls_js = read_file("app/js-3d/OrbitControls.js") or ""
    torus_geometry_js = read_file("app/js-3d/torusGeometry.js") or ""
    torus_renderer_js = read_file("app/js-3d/torusRenderer.js") or ""
    
    # Replace iframes with embedded content
    main_html = embed_iframes(main_html, docs_path)
    
    # Add embedded app scripts before closing body tag
    embedded_scripts = f'''
    <!-- Embedded 2D Torus App Scripts -->
    <script>
    /* Math Utilities */
    {math_utils_js}
    
    /* 2D Flat Torus App */
    (function() {{
        // Simplified version of flatTorusApp.js for embedded use
        const canvas2d = document.querySelector('#embed-2d-torus-canvas');
        if (canvas2d) {{
            const ctx = canvas2d.getContext('2d');
            let animationId = null;
            
            // Basic drawing function
            function drawTorus2D() {{
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas2d.width, canvas2d.height);
                
                // Draw grid
                ctx.strokeStyle = '#e0e0e0';
                ctx.lineWidth = 1;
                for (let i = 0; i <= 10; i++) {{
                    const pos = i * canvas2d.width / 10;
                    ctx.beginPath();
                    ctx.moveTo(pos, 0);
                    ctx.lineTo(pos, canvas2d.height);
                    ctx.stroke();
                    
                    ctx.beginPath();
                    ctx.moveTo(0, pos);
                    ctx.lineTo(canvas2d.width, pos);
                    ctx.stroke();
                }}
                
                // Draw a sample geodesic
                ctx.strokeStyle = '#ff0066';
                ctx.lineWidth = 2;
                ctx.beginPath();
                const slope = 1.618; // Golden ratio
                for (let t = 0; t < 10; t += 0.01) {{
                    const x = (t % 1) * canvas2d.width;
                    const y = ((slope * t) % 1) * canvas2d.height;
                    if (t === 0) {{
                        ctx.moveTo(x, y);
                    }} else {{
                        ctx.lineTo(x, y);
                    }}
                }}
                ctx.stroke();
                
                // Add label
                ctx.fillStyle = '#333';
                ctx.font = '14px Arial';
                ctx.fillText('Golden Ratio Geodesic (φ = 1.618...)', 10, 20);
            }}
            
            // Set canvas size and draw
            canvas2d.width = 600;
            canvas2d.height = 600;
            drawTorus2D();
        }}
    }})();
    
    /* Note: 3D visualization requires WebGL and Three.js which is too large to embed effectively */
    (function() {{
        const canvas3d = document.querySelector('#embed-3d-torus-canvas');
        if (canvas3d) {{
            const ctx = canvas3d.getContext('2d');
            canvas3d.width = 600;
            canvas3d.height = 600;
            
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas3d.width, canvas3d.height);
            
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('3D visualization requires WebGL', canvas3d.width/2, canvas3d.height/2 - 20);
            ctx.fillText('Please use the online version for full 3D interactivity', canvas3d.width/2, canvas3d.height/2 + 20);
            
            // Draw a simple 2D projection of torus
            ctx.strokeStyle = '#3498db';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(canvas3d.width/2, canvas3d.height/2, 150, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.arc(canvas3d.width/2, canvas3d.height/2, 80, 0, Math.PI * 2);
            ctx.stroke();
        }}
    }})();
    </script>
    
    <!-- Add inline MathJax configuration -->
    <script>
    // Basic math rendering fallback
    document.addEventListener('DOMContentLoaded', function() {{
        // Convert $...$ to readable format
        const mathElements = document.querySelectorAll('p, li, td');
        mathElements.forEach(el => {{
            el.innerHTML = el.innerHTML.replace(/\$([^$]+)\$/g, '<em style="font-family: serif;">$1</em>');
        }});
    }});
    </script>
    '''
    
    # Insert scripts before closing body tag
    main_html = main_html.replace('</body>', embedded_scripts + '\n</body>')
    
    # Add notice at the top of body
    notice = '''
    <div style="background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; margin: 20px auto; max-width: 900px; border-radius: 4px;">
        <strong>Offline Version Notice:</strong> This is a self-contained version of the paper for offline viewing. 
        Some interactive features are simplified. For the full interactive experience with all visualizations, 
        please visit the online version at: <a href="https://basanta2029.github.io/Quasi-Periodicity/" style="color: #0056b3;">https://basanta2029.github.io/Quasi-Periodicity/</a>
    </div>
    '''
    
    main_html = main_html.replace('<body>', '<body>\n' + notice)
    
    # Write the complete file
    output_path = Path("QuasiperiodicFunctions_Complete_Package.html")
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(main_html)
    
    print(f"Complete package created: {output_path}")
    print(f"File size: {output_path.stat().st_size / 1024:.1f} KB")

if __name__ == "__main__":
    create_complete_package()