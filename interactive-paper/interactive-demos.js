// Interactive demos for the research paper

// 1D Quasiperiodic Function Demo
const canvas = document.getElementById('demo1d');
if (canvas) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Get controls
    const omegaInput = document.getElementById('omega');
    const omegaValue = document.getElementById('omega-value');
    const xrangeInput = document.getElementById('xrange');
    const xrangeValue = document.getElementById('xrange-value');
    const goldenButton = document.getElementById('preset-golden');
    const sqrt2Button = document.getElementById('preset-sqrt2');
    const rationalButton = document.getElementById('preset-rational');

    function drawFunction() {
        ctx.clearRect(0, 0, width, height);

        // Get frequency value (omega1 is fixed to 1)
        const omega = parseFloat(omegaInput.value);
        const xRange = parseFloat(xrangeInput.value);

        // Update display
        omegaValue.textContent = omega.toFixed(3);
        xrangeValue.textContent = xRange;

        // Draw axes
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height/2);
        ctx.lineTo(width, height/2);
        ctx.stroke();

        // Draw function f(x) = cos(x) + cos(omega * x)
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const scale = 50;

        for (let i = 0; i < width; i++) {
            const x = (i / width) * xRange;
            const y = Math.cos(x) + Math.cos(omega * x);
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
        let periodInfo = '';

        // Check if omega is close to special values
        const tolerance = 0.001;
        const phi = (1 + Math.sqrt(5)) / 2;

        if (Math.abs(omega - 1) < tolerance) {
            periodInfo = 'ω = 1: Period 2π (commensurate)';
        } else if (Math.abs(omega - Math.sqrt(2)) < tolerance) {
            periodInfo = 'ω = √2 ≈ 1.414 (irrational → quasiperiodic)';
        } else if (Math.abs(omega - phi) < tolerance) {
            periodInfo = 'ω = φ ≈ 1.618 (golden ratio → quasiperiodic)';
        } else if (Math.abs(omega - 1.5) < tolerance) {
            periodInfo = 'ω = 3/2: Period 4π (periodic)';
        } else {
            // Check if it's close to a simple fraction
            const fractions = [[3,2], [4,3], [5,3], [5,4], [7,4], [2,1], [5,2]];
            let foundRational = false;
            for (const [p, q] of fractions) {
                if (Math.abs(omega - p/q) < tolerance) {
                    periodInfo = `ω = ${p}/${q} (rational → periodic)`;
                    foundRational = true;
                    break;
                }
            }
            if (!foundRational) {
                periodInfo = `ω = ${omega.toFixed(3)} (likely irrational → quasiperiodic)`;
            }
        }

        ctx.fillText(periodInfo, 10, 20);
        ctx.fillText(`x range: [0, ${xRange}]`, 10, height - 10);
    }

    // Event listeners
    omegaInput.addEventListener('input', drawFunction);
    xrangeInput.addEventListener('input', drawFunction);

    goldenButton.addEventListener('click', () => {
        omegaInput.value = (1 + Math.sqrt(5)) / 2; // Exact golden ratio
        drawFunction();
    });

    sqrt2Button.addEventListener('click', () => {
        omegaInput.value = Math.sqrt(2); // Exact sqrt(2)
        drawFunction();
    });

    rationalButton.addEventListener('click', () => {
        omegaInput.value = 1.5; // 3/2
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