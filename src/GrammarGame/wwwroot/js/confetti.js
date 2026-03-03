window.confetti = {
    burst(elementId) {
        const btn = document.getElementById(elementId);
        if (!btn) return;

        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        // Three waves for a sustained explosion
        this._wave(cx, cy, 60, 0);
        this._wave(cx, cy, 40, 120);
        this._wave(cx, cy, 30, 250);
    },

    _wave(cx, cy, count, delay) {
        setTimeout(() => {
            for (let i = 0; i < count; i++) {
                this._createParticle(cx, cy);
            }
        }, delay);
    },

    _createParticle(cx, cy) {
        const colors = [
            '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6bf6',
            '#ff9f43', '#ee5a24', '#0abde3', '#10ac84', '#f368e0',
            '#ff4757', '#2ed573', '#ffa502', '#3742fa', '#ff6348'
        ];

        const shapes = ['circle', 'rect', 'star', 'strip'];
        const shape = shapes[Math.floor(Math.random() * shapes.length)];
        const color = colors[Math.floor(Math.random() * colors.length)];

        const el = document.createElement('div');
        el.style.position = 'fixed';
        el.style.zIndex = '10000';
        el.style.pointerEvents = 'none';
        el.style.left = cx + 'px';
        el.style.top = cy + 'px';

        const size = 4 + Math.random() * 10;

        if (shape === 'circle') {
            el.style.width = size + 'px';
            el.style.height = size + 'px';
            el.style.borderRadius = '50%';
            el.style.background = color;
        } else if (shape === 'rect') {
            el.style.width = size * 0.6 + 'px';
            el.style.height = size * 1.4 + 'px';
            el.style.borderRadius = '2px';
            el.style.background = color;
        } else if (shape === 'star') {
            el.style.width = size + 'px';
            el.style.height = size + 'px';
            el.style.background = 'none';
            el.innerHTML = `<svg viewBox="0 0 20 20" width="${size}" height="${size}"><polygon points="10,0 13,7 20,7 14,12 16,20 10,15 4,20 6,12 0,7 7,7" fill="${color}"/></svg>`;
        } else {
            // strip / streamer
            el.style.width = size * 0.3 + 'px';
            el.style.height = size * 2.5 + 'px';
            el.style.borderRadius = '1px';
            el.style.background = color;
        }

        document.body.appendChild(el);

        // Physics: random angle, strong velocity, gravity
        const angle = Math.random() * Math.PI * 2;
        const power = 300 + Math.random() * 500;
        let vx = Math.cos(angle) * power;
        let vy = Math.sin(angle) * power - 200; // bias upward
        const gravity = 800 + Math.random() * 400;
        const spin = (Math.random() - 0.5) * 1200;
        const drag = 0.97 + Math.random() * 0.02;

        let x = 0, y = 0, rot = 0, opacity = 1;
        let lastTime = performance.now();
        const totalLife = 1600 + Math.random() * 800;
        const startTime = lastTime;

        function tick(now) {
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;
            const age = now - startTime;

            vx *= Math.pow(drag, dt * 60);
            vy += gravity * dt;
            vy *= Math.pow(drag, dt * 60);

            x += vx * dt;
            y += vy * dt;
            rot += spin * dt;

            // Fade out in last 30%
            if (age > totalLife * 0.7) {
                opacity = Math.max(0, 1 - (age - totalLife * 0.7) / (totalLife * 0.3));
            }

            el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`;
            el.style.opacity = opacity;

            if (age < totalLife) {
                requestAnimationFrame(tick);
            } else {
                el.remove();
            }
        }

        requestAnimationFrame(tick);
    }
};
