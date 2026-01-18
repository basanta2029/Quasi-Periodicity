// Additional interactive demonstrations for the complete paper

// Rational preset button
const rationalButton = document.getElementById('preset-rational');
if (rationalButton) {
    rationalButton.addEventListener('click', () => {
        document.getElementById('omega1').value = 1;
        document.getElementById('omega2').value = 1.5;
        if (typeof drawFunction !== 'undefined') {
            drawFunction();
        }
    });
}

// Load enhanced quasicrystal generator with cache busting
const script = document.createElement('script');
script.src = 'quasicrystal-enhanced.js?v=' + Date.now();
document.head.appendChild(script);

// Triply periodic function visualization
const tpCanvas = document.getElementById('triply-periodic-viz');
if (tpCanvas) {
    const tpCtx = tpCanvas.getContext('2d');
    const tpWidth = tpCanvas.width;
    const tpHeight = tpCanvas.height;
    
    function drawTriplyPeriodic() {
        tpCtx.clearRect(0, 0, tpWidth, tpHeight);
        
        // Draw three different z-slices
        const slices = [-1, 0, 1];
        const sliceWidth = tpWidth / 3;
        
        slices.forEach((z, idx) => {
            // Create gradient for this slice
            const imageData = tpCtx.createImageData(sliceWidth, tpHeight);
            const data = imageData.data;
            
            for (let px = 0; px < sliceWidth; px++) {
                for (let py = 0; py < tpHeight; py++) {
                    // Convert to mathematical coordinates
                    const x = (px / sliceWidth) * 2 * Math.PI;
                    const y = (py / tpHeight) * 2 * Math.PI;
                    
                    // Evaluate F(x,y,z)
                    const value = Math.cos(x) * Math.cos(y) + 
                                 Math.cos(y) * Math.cos(z * Math.PI) + 
                                 Math.cos(z * Math.PI) * Math.cos(x);
                    
                    // Convert to color
                    const normalized = (value + 3) / 6;
                    const intensity = Math.floor(normalized * 255);
                    
                    const pidx = (py * sliceWidth + px) * 4;
                    if (value > 0) {
                        data[pidx] = 255;
                        data[pidx+1] = intensity;
                        data[pidx+2] = intensity;
                    } else {
                        data[pidx] = intensity;
                        data[pidx+1] = intensity;
                        data[pidx+2] = 255;
                    }
                    data[pidx+3] = 255;
                }
            }
            
            // Draw this slice
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = sliceWidth;
            tempCanvas.height = tpHeight;
            tempCanvas.getContext('2d').putImageData(imageData, 0, 0);
            tpCtx.drawImage(tempCanvas, idx * sliceWidth, 0);
            
            // Add labels
            tpCtx.fillStyle = '#333';
            tpCtx.font = '14px Arial';
            tpCtx.fillText(`z = ${z}π`, idx * sliceWidth + 10, 20);
        });
        
        // Add axis labels
        tpCtx.strokeStyle = '#666';
        tpCtx.lineWidth = 1;
        for (let i = 1; i < 3; i++) {
            tpCtx.beginPath();
            tpCtx.moveTo(i * sliceWidth, 0);
            tpCtx.lineTo(i * sliceWidth, tpHeight);
            tpCtx.stroke();
        }
    }
    
    // Draw on load
    drawTriplyPeriodic();
}

// Enhanced smooth scrolling with offset for fixed headers
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
        if (target) {
            const offset = 20; // Adjust based on your layout
            const targetPosition = target.offsetTop - offset;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Add "Copy link" functionality for sections
document.querySelectorAll('h2[id], h3[id]').forEach(heading => {
    heading.style.cursor = 'pointer';
    heading.title = 'Click to copy link to this section';
    
    heading.addEventListener('click', function() {
        const url = window.location.href.split('#')[0] + '#' + this.id;
        navigator.clipboard.writeText(url).then(() => {
            // Visual feedback
            const original = this.style.color;
            this.style.color = '#3498db';
            setTimeout(() => {
                this.style.color = original;
            }, 200);
        });
    });
});

// Print optimization
window.addEventListener('beforeprint', () => {
    // Add print-specific classes
    document.body.classList.add('printing');
    
    // Capture current states of interactive elements
    document.querySelectorAll('canvas').forEach(canvas => {
        const img = document.createElement('img');
        img.src = canvas.toDataURL();
        img.className = 'print-image';
        canvas.parentNode.insertBefore(img, canvas);
    });
});

window.addEventListener('afterprint', () => {
    document.body.classList.remove('printing');
    document.querySelectorAll('.print-image').forEach(img => img.remove());
});

// Function to check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Lazy loading for iframes - DISABLED to fix loading issues
// Commenting out lazy loading as it's preventing iframes from displaying
/*
const iframes = document.querySelectorAll('iframe');
const iframeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const iframe = entry.target;
            if (!iframe.src && iframe.dataset.src) {
                iframe.src = iframe.dataset.src;
            }
        }
    });
}, { rootMargin: '50px' });

iframes.forEach(iframe => {
    // Store original src and clear it
    iframe.dataset.src = iframe.src;
    iframe.src = '';
    iframeObserver.observe(iframe);
});
*/

// Add progress indicator
const progressBar = document.createElement('div');
progressBar.id = 'reading-progress';
progressBar.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 0%;
    height: 3px;
    background: #3498db;
    z-index: 1000;
    transition: width 0.2s;
`;
document.body.appendChild(progressBar);

window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = scrolled + '%';
});

// Debug iframe loading
document.addEventListener('DOMContentLoaded', () => {
    const iframes = document.querySelectorAll('iframe');
    console.log(`Found ${iframes.length} iframes`);
    
    iframes.forEach((iframe, index) => {
        console.log(`Iframe ${index + 1} src:`, iframe.src);
        
        // Add load event listener
        iframe.addEventListener('load', () => {
            console.log(`Iframe ${index + 1} loaded successfully`);
            iframe.style.opacity = '1';
        });
        
        // Add error event listener
        iframe.addEventListener('error', (e) => {
            console.error(`Iframe ${index + 1} failed to load:`, e);
            // Show fallback message
            const parent = iframe.parentElement;
            const fallback = document.createElement('div');
            fallback.style.cssText = 'padding: 40px; text-align: center; background: #f0f0f0;';
            fallback.innerHTML = `
                <p>Interactive app couldn't load in iframe.</p>
                <p><a href="${iframe.src}" target="_blank" style="color: #3498db;">Click here to open in new tab</a></p>
            `;
            parent.insertBefore(fallback, iframe.nextSibling);
        });
    });
});