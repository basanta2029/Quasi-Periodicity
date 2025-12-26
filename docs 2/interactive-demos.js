// Interactive demos for the research paper

// 1D Quasiperiodic Function Demo
const canvas = document.getElementById('demo1d');
if (canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Get controls
    const omega1Input = document.getElementById('omega1');
    const omega2Input = document.getElementById('omega2');
    const omega1Value = document.getElementById('omega1-value');
    const omega2Value = document.getElementById('omega2-value');
    const goldenButton = document.getElementById('preset-golden');
    const sqrt2Button = document.getElementById('preset-sqrt2');
    
    function drawFunction() {
        ctx.clearRect(0, 0, width, height);
        
        // Get frequency values
        const omega1 = parseFloat(omega1Input.value);
        const omega2 = parseFloat(omega2Input.value);
        
        // Update display
        omega1Value.textContent = omega1.toFixed(2);
        omega2Value.textContent = omega2.toFixed(3);
        
        // Draw axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height/2);
        ctx.lineTo(width, height/2);
        ctx.stroke();
        
        // Draw function
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const scale = 50;
        const xRange = 50;
        
        for (let i = 0; i < width; i++) {
            const x = (i / width) * xRange;
            const y = Math.cos(omega1 * x) + Math.cos(omega2 * x);
            const canvasY = height/2 - y * scale;
            
            if (i === 0) {
                ctx.moveTo(i, canvasY);
            } else {
                ctx.lineTo(i, canvasY);
            }
        }
        
        ctx.stroke();
        
        // Add period info
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        const ratio = omega2 / omega1;
        let periodInfo = '';
        
        // Check if ratio is close to a simple fraction
        const tolerance = 0.001;
        const phi = (1 + Math.sqrt(5)) / 2;
        
        if (Math.abs(ratio - 1) < tolerance) {
            periodInfo = 'Period: 2π (commensurate)';
        } else if (Math.abs(ratio - Math.sqrt(2)) < tolerance) {
            periodInfo = 'Ratio: √2 (quasiperiodic)';
        } else if (Math.abs(ratio - phi) < tolerance) {
            periodInfo = 'Ratio: φ (golden ratio, quasiperiodic)';
        } else if (Math.abs(ratio - Math.round(ratio)) < tolerance) {
            periodInfo = `Ratio: ${Math.round(ratio)} (periodic)`;
        } else {
            periodInfo = `Ratio: ${ratio.toFixed(3)} (quasiperiodic)`;
        }
        
        ctx.fillText(periodInfo, 10, 20);
    }
    
    // Event listeners
    omega1Input.addEventListener('input', drawFunction);
    omega2Input.addEventListener('input', drawFunction);
    
    goldenButton.addEventListener('click', () => {
        omega1Input.value = 1;
        omega2Input.value = 1.618;
        drawFunction();
    });
    
    sqrt2Button.addEventListener('click', () => {
        omega1Input.value = 1;
        omega2Input.value = 1.414;
        drawFunction();
    });
    
    // Initial draw
    drawFunction();
}

// Smooth scroll for navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add "Back to Top" button functionality
window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        if (scrollTop > 300) {
            backToTop.style.display = 'block';
        } else {
            backToTop.style.display = 'none';
        }
    }
});

// Handle iframe loading
document.querySelectorAll('iframe').forEach(iframe => {
    iframe.addEventListener('load', function() {
        // Could add loading indicators here
        this.style.opacity = '1';
    });
    
    // Start with lower opacity
    iframe.style.opacity = '0.5';
    iframe.style.transition = 'opacity 0.5s';
});

// Print handling - show message instead of iframes
window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.embedded-app').forEach(app => {
        app.classList.add('print-mode');
    });
});

window.addEventListener('afterprint', () => {
    document.querySelectorAll('.embedded-app').forEach(app => {
        app.classList.remove('print-mode');
    });
});