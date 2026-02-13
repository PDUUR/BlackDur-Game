class ArcadeAudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.bpm = 128;
        this.beat = 0;
        this.scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
        this.intervalId = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.15;
        this.masterGain.connect(this.ctx.destination);
        this.startLoop();
    }

    startLoop() {
        if (this.intervalId) return;
        const step = (60 / this.bpm) / 4; // Faster steps for better rhythm
        this.intervalId = setInterval(() => {
            if (!this.isPlaying || !this.ctx) return;
            if (this.beat % 8 === 0) this.playKick();
            if (this.beat % 8 === 4) this.playSnare();
            if (this.beat % 2 === 0) this.playHiHat();
            if ([0, 3, 6, 9, 12, 15].includes(this.beat % 16)) {
                this.playMarimba(this.scale[Math.floor(Math.random() * this.scale.length)]);
            }
            this.beat = (this.beat + 1) % 32;
        }, step * 1000);
    }

    stopMusic() {
        this.isPlaying = false;
    }

    playKick() {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.connect(g); g.connect(this.masterGain);
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
        g.gain.setValueAtTime(0.5, this.ctx.currentTime);
        g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.15);
        osc.start(); osc.stop(this.ctx.currentTime + 0.15);
    }

    playSnare() {
        const bufferSize = this.ctx.sampleRate * 0.12;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const g = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass"; filter.frequency.value = 1200;
        source.connect(filter); filter.connect(g); g.connect(this.masterGain);
        g.gain.setValueAtTime(0.15, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        source.start();
    }

    playHiHat() {
        const g = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = "highpass"; filter.frequency.value = 8000;
        const bufferSize = this.ctx.sampleRate * 0.03;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(filter); filter.connect(g); g.connect(this.masterGain);
        g.gain.setValueAtTime(0.04, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);
        source.start();
    }

    playMarimba(freq) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.connect(g); g.connect(this.masterGain);
        g.gain.setValueAtTime(0.4, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
        osc.start(); osc.stop(this.ctx.currentTime + 0.4);
    }

    playSfx(type) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        if (type === 'place') {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.connect(g); g.connect(this.masterGain);
            osc.frequency.setValueAtTime(300, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);
            g.gain.setValueAtTime(0.2, now);
            g.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(); osc.stop(now + 0.2);
        } else if (type === 'clear') {
            this.playMarimba(1046.50); this.playMarimba(1567.98);
        } else if (type === 'gameover') {
            const g = this.ctx.createGain();
            g.connect(this.ctx.destination);
            g.gain.setValueAtTime(0.8, now);
            g.gain.exponentialRampToValueAtTime(0.01, now + 2.0);
            const osc1 = this.ctx.createOscillator();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(120, now);
            osc1.frequency.exponentialRampToValueAtTime(10, now + 1.2);
            osc1.connect(g);
            osc1.start(); osc1.stop(now + 1.2);
        }
    }
}

const audio = new ArcadeAudioEngine();

class Particle {
    constructor(x, y, color, speedScale = 1) {
        this.x = x; this.y = y; this.color = color;
        this.size = Math.random() * 8 + 4;
        this.vx = (Math.random() - 0.5) * 15 * speedScale;
        this.vy = (Math.random() - 0.5) * 15 * speedScale;
        this.alpha = 1;
        this.gravity = 0.2;
    }

    update() {
        this.x += this.vx; this.y += this.vy;
        this.vy += this.gravity;
        this.alpha -= 0.03;
    }

    draw(ctx) {
        ctx.save(); ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10; ctx.shadowColor = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
    }
}

const GRID_SIZE = 10;
const CELL_GAP = 4;
const LERP_FACTOR = 0.35;

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('blackdur_high')) || 0;
        this.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
        this.tray = []; this.particles = [];
        this.dragging = null; this.targetPos = { x: 0, y: 0 }; this.renderPos = { x: 0, y: 0 };
        this.effectIndex = 0; this.undoState = null; this.over = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.reset();
        this.listen();
        this.loop();
    }

    resize() {
        const containerWidth = Math.min(window.innerWidth - 40, 420);
        this.canvas.width = containerWidth;
        this.canvas.height = containerWidth + 120;
        this.cellSize = (containerWidth - (CELL_GAP * (GRID_SIZE + 1))) / GRID_SIZE;
        this.trayY = containerWidth + 10;
    }

    reset() {
        this.grid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(null));
        this.score = 0; this.effectIndex = 0;
        this.tray = []; for (let i = 0; i < 3; i++) this.tray.push(this.makeSmartBlock(i));
        this.updateUI();
        document.getElementById('overlay').style.display = 'none';
        this.over = false;
        if (audio.ctx) audio.isPlaying = document.getElementById('btn-sound').innerText.includes("ON");
    }

    makeSmartBlock(slot) {
        const templates = [
            [[1]], [[1, 1]], [[1], [1]], [[1, 1, 1]], [[1], [1], [1]],
            [[1, 1], [1, 1]], [[1, 0], [1, 1]], [[1, 1], [1, 0]],
            [[0, 1], [1, 1]], [[1, 1], [0, 1]], [[1, 1, 1, 1]], [[1], [1], [1], [1]], [[0, 1, 0], [1, 1, 1]],
            [[1, 1, 1], [0, 1, 0]], [[1, 1, 1], [1, 0, 0]], [[1, 1, 1], [0, 0, 1]]
        ];
        const matrix = templates[Math.floor(Math.random() * templates.length)];
        const colors = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#f87171', '#2dd4bf'];
        return {
            matrix, color: colors[Math.floor(Math.random() * colors.length)], slot,
            x: (this.canvas.width / 3) * slot + (this.canvas.width / 6),
            y: this.trayY + 55,
            targetX: (this.canvas.width / 3) * slot + (this.canvas.width / 6),
            targetY: this.trayY + 55,
            scale: 0.5
        };
    }

    updateUI() {
        document.getElementById('score').innerText = this.score;
        document.getElementById('high-score').innerText = this.highScore;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('blackdur_high', this.highScore);
        }
        document.getElementById('btn-undo').disabled = !this.undoState;
    }

    showSequentialEffect() {
        const effects = [
            { text: "GASSKEUNN!", color: "#60a5fa" },
            { text: "GOKILS!", color: "#f472b6" },
            { text: "JAGO BET!", color: "#34d399" },
            { text: "BERAPI-API!", color: "#fbbf24" },
            { text: "GGWP!", color: "#f87171" }
        ];
        const currentEffect = effects[this.effectIndex];
        const msgEl = document.getElementById('combo-msg');
        msgEl.innerText = currentEffect.text; msgEl.style.color = currentEffect.color;
        msgEl.classList.remove('animate-pop'); void msgEl.offsetWidth;
        msgEl.classList.add('animate-pop');

        this.canvas.classList.remove('shake'); void this.canvas.offsetWidth;
        this.canvas.classList.add('shake');

        this.effectIndex = (this.effectIndex + 1) % effects.length;
        if (navigator.vibrate) navigator.vibrate(50);
    }

    listen() {
        const getPos = (e) => {
            const r = this.canvas.getBoundingClientRect();
            const t = e.touches ? e.touches[0] : e;
            return { x: t.clientX - r.left, y: t.clientY - r.top };
        };
        const start = (e) => {
            audio.init(); if (this.over) return;
            const p = getPos(e);
            this.tray.forEach(b => {
                const dx = p.x - b.x;
                const dy = p.y - b.y;
                if (Math.sqrt(dx * dx + dy * dy) < 60) {
                    this.dragging = b;
                    this.targetPos = { x: p.x, y: p.y - 100 };
                    this.renderPos = { x: b.x, y: b.y };
                    if (e.cancelable) e.preventDefault();
                }
            });
        };
        const move = (e) => {
            if (this.dragging) {
                if (e.cancelable) e.preventDefault();
                const p = getPos(e);
                this.targetPos.x = p.x; this.targetPos.y = p.y - 100;
            }
        };
        const end = () => {
            if (!this.dragging) return;
            const gx = Math.round((this.renderPos.x - (this.dragging.matrix[0].length * this.cellSize) / 2 - CELL_GAP) / (this.cellSize + CELL_GAP));
            const gy = Math.round((this.renderPos.y - (this.dragging.matrix.length * this.cellSize) / 2 - CELL_GAP) / (this.cellSize + CELL_GAP));
            if (this.isValid(this.dragging.matrix, gx, gy)) {
                this.placeBlock(gx, gy);
            } else {
                this.dragging.targetX = (this.canvas.width / 3) * this.dragging.slot + (this.canvas.width / 6);
                this.dragging.targetY = this.trayY + 55;
            }
            this.dragging = null;
        };

        this.canvas.addEventListener('mousedown', start);
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', end);
        this.canvas.addEventListener('touchstart', start, { passive: false });
        window.addEventListener('touchmove', move, { passive: false });
        window.addEventListener('touchend', end);

        document.getElementById('btn-restart').onclick = () => this.reset();
        document.getElementById('btn-again').onclick = () => this.reset();
        document.getElementById('btn-undo').onclick = () => this.undo();
        document.getElementById('btn-sound').onclick = (e) => {
            audio.isPlaying = !audio.isPlaying;
            e.target.innerText = audio.isPlaying ? "MUSIC ON" : "MUSIC OFF";
        };
    }

    isValid(matrix, gx, gy) {
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[0].length; c++) {
                if (matrix[r][c]) {
                    const tx = gx + c, ty = gy + r;
                    if (tx < 0 || tx >= GRID_SIZE || ty < 0 || ty >= GRID_SIZE || this.grid[ty][tx]) return false;
                }
            }
        }
        return true;
    }

    placeBlock(gx, gy) {
        this.undoState = {
            grid: JSON.parse(JSON.stringify(this.grid)),
            score: this.score,
            tray: JSON.parse(JSON.stringify(this.tray)),
            effectIndex: this.effectIndex
        };

        for (let i = 0; i < 15; i++) {
            this.particles.push(new Particle(this.renderPos.x, this.renderPos.y, this.dragging.color, 0.8));
        }

        for (let r = 0; r < this.dragging.matrix.length; r++) {
            for (let c = 0; c < this.dragging.matrix[0].length; c++) {
                if (this.dragging.matrix[r][c]) {
                    this.grid[gy + r][gx + c] = { color: this.dragging.color, scale: 0 };
                }
            }
        }

        this.score += this.dragging.matrix.flat().filter(x => x).length * 10;
        this.tray = this.tray.filter(x => x !== this.dragging);
        audio.playSfx('place');
        this.checkLines();

        if (this.tray.length === 0) {
            for (let i = 0; i < 3; i++) this.tray.push(this.makeSmartBlock(i));
        }

        this.updateUI();
        this.checkGameOver();
    }

    checkLines() {
        let rows = [], cols = [];
        for (let y = 0; y < GRID_SIZE; y++) if (this.grid[y].every(c => c)) rows.push(y);
        for (let x = 0; x < GRID_SIZE; x++) {
            let full = true;
            for (let y = 0; y < GRID_SIZE; y++) if (!this.grid[y][x]) full = false;
            if (full) cols.push(x);
        }

        if (rows.length + cols.length > 0) {
            this.score += (rows.length + cols.length) * 100;
            audio.playSfx('clear');
            this.showSequentialEffect();

            rows.forEach(y => {
                for (let x = 0; x < GRID_SIZE; x++) {
                    const cellX = CELL_GAP + x * (this.cellSize + CELL_GAP) + this.cellSize / 2;
                    const cellY = CELL_GAP + y * (this.cellSize + CELL_GAP) + this.cellSize / 2;
                    for (let i = 0; i < 8; i++) this.particles.push(new Particle(cellX, cellY, this.grid[y][x].color, 1.5));
                    this.grid[y][x] = null;
                }
            });

            cols.forEach(x => {
                for (let y = 0; y < GRID_SIZE; y++) {
                    if (this.grid[y][x]) {
                        const cellX = CELL_GAP + x * (this.cellSize + CELL_GAP) + this.cellSize / 2;
                        const cellY = CELL_GAP + y * (this.cellSize + CELL_GAP) + this.cellSize / 2;
                        for (let i = 0; i < 8; i++) this.particles.push(new Particle(cellX, cellY, this.grid[y][x].color, 1.5));
                        this.grid[y][x] = null;
                    }
                }
            });
        }
    }

    checkGameOver() {
        const canContinue = this.tray.some(block => {
            const m = block.matrix;
            for (let y = 0; y <= GRID_SIZE - m.length; y++) {
                for (let x = 0; x <= GRID_SIZE - m[0].length; x++) {
                    if (this.isValid(m, x, y)) return true;
                }
            }
            return false;
        });

        if (!canContinue) {
            this.over = true;
            audio.stopMusic();
            audio.playSfx('gameover');
            setTimeout(() => {
                document.getElementById('overlay').style.display = 'flex';
                document.getElementById('final-score').innerText = 'Skor Akhir: ' + this.score;
            }, 800);
        }
    }

    undo() {
        if (!this.undoState) return;
        this.grid = this.undoState.grid;
        this.score = this.undoState.score;
        this.tray = this.undoState.tray;
        this.effectIndex = this.undoState.effectIndex;
        this.undoState = null;
        this.updateUI();
    }

    loop() {
        this.update(); this.draw();
        requestAnimationFrame(() => this.loop());
    }

    update() {
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (this.grid[y][x] && this.grid[y][x].scale < 1) this.grid[y][x].scale += 0.15;
            }
        }

        if (this.dragging) {
            this.renderPos.x += (this.targetPos.x - this.renderPos.x) * LERP_FACTOR;
            this.renderPos.y += (this.targetPos.y - this.renderPos.y) * LERP_FACTOR;
        }

        this.tray.forEach(b => {
            if (b !== this.dragging) {
                b.x += (b.targetX - b.x) * LERP_FACTOR;
                b.y += (b.targetY - b.y) * LERP_FACTOR;
            }
        });

        this.particles.forEach((p, i) => {
            p.update();
            if (p.alpha <= 0) this.particles.splice(i, 1);
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid background cells
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                const cx = CELL_GAP + x * (this.cellSize + CELL_GAP);
                const cy = CELL_GAP + y * (this.cellSize + CELL_GAP);

                // Isi kotak kosong (lebih terang sedikit dari sebelumnya)
                this.ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
                this.roundRect(cx, cy, this.cellSize, this.cellSize, 8);

                // Tambahkan stroke/garis tepi agar kotak kosong nampak jelas
                this.ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
                this.ctx.lineWidth = 1;
                this.ctx.stroke();

                if (this.grid[y][x]) {
                    this.ctx.save();
                    this.ctx.translate(cx + this.cellSize / 2, cy + this.cellSize / 2);
                    this.ctx.scale(this.grid[y][x].scale || 1, this.grid[y][x].scale || 1);
                    this.ctx.fillStyle = this.grid[y][x].color;
                    this.ctx.shadowBlur = 15;
                    this.ctx.shadowColor = this.grid[y][x].color;
                    this.roundRect(-this.cellSize / 2, -this.cellSize / 2, this.cellSize, this.cellSize, 8);
                    this.ctx.restore();
                }
            }
        }

        // Preview shadow while dragging
        if (this.dragging) {
            const gx = Math.round((this.renderPos.x - (this.dragging.matrix[0].length * this.cellSize) / 2 - CELL_GAP) / (this.cellSize + CELL_GAP));
            const gy = Math.round((this.renderPos.y - (this.dragging.matrix.length * this.cellSize) / 2 - CELL_GAP) / (this.cellSize + CELL_GAP));
            if (this.isValid(this.dragging.matrix, gx, gy)) {
                this.ctx.save();
                this.ctx.fillStyle = this.dragging.color;
                this.ctx.globalAlpha = 0.3;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = this.dragging.color;
                for (let r = 0; r < this.dragging.matrix.length; r++) {
                    for (let c = 0; c < this.dragging.matrix[0].length; c++) {
                        if (this.dragging.matrix[r][c]) {
                            this.roundRect(
                                CELL_GAP + (gx + c) * (this.cellSize + CELL_GAP),
                                CELL_GAP + (gy + r) * (this.cellSize + CELL_GAP),
                                this.cellSize, this.cellSize, 8
                            );
                        }
                    }
                }
                this.ctx.restore();
            }
        }

        // Draw blocks in the tray
        this.tray.forEach(b => {
            if (b !== this.dragging) this.drawBlock(b, b.x, b.y, 0.5);
        });

        if (this.dragging) {
            this.drawBlock(this.dragging, this.renderPos.x, this.renderPos.y, 1.0);
        }

        this.particles.forEach(p => p.draw(this.ctx));
    }

    drawBlock(b, x, y, s) {
        const w = b.matrix[0].length * (this.cellSize + CELL_GAP) * s;
        const h = b.matrix.length * (this.cellSize + CELL_GAP) * s;
        const sx = x - w / 2, sy = y - h / 2;
        this.ctx.save();
        this.ctx.fillStyle = b.color;
        this.ctx.shadowBlur = 20 * s;
        this.ctx.shadowColor = b.color;
        for (let r = 0; r < b.matrix.length; r++) {
            for (let c = 0; c < b.matrix[0].length; c++) {
                if (b.matrix[r][c]) {
                    this.roundRect(
                        sx + c * (this.cellSize + CELL_GAP) * s,
                        sy + r * (this.cellSize + CELL_GAP) * s,
                        this.cellSize * s, this.cellSize * s, 8 * s
                    );
                }
            }
        }
        this.ctx.restore();
    }

    roundRect(x, y, w, h, r) {
        this.ctx.beginPath();
        if (this.ctx.roundRect) {
            this.ctx.roundRect(x, y, w, h, r);
        } else {
            this.ctx.rect(x, y, w, h);
        }
        this.ctx.fill();
    }
}

window.onload = () => new Game();
