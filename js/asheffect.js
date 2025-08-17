 class InfinityAshEffect {
            constructor(options = {}) {
                this.config = {
                    containerSelector: '.ash-container',
                    imageSelector: 'img',
                    particleCount: 80,
                    particleColors: ['rgba(139, 116, 93, 0.8)', 'rgba(160, 140, 120, 0.7)'],
                    formationDuration: 3000,
                    dissolutionDuration: 2500,
                    enableViewportTrigger: true,
                    showStatusIndicators: true,
                    statusSelector: '.ash-status',
                    ...options
                };
                
                this.containers = new Map();
                this.observer = null;
                this.activeAnimations = new Set();
                
                this.init();
            }
            
            init() {
                this.injectCSS();
                this.setupContainers();
                if (this.config.enableViewportTrigger) {
                    this.setupViewportObserver();
                }
            }
            
            injectCSS() {
                if (document.getElementById('infinity-ash-styles')) return;
                
                const style = document.createElement('style');
                style.id = 'infinity-ash-styles';
                style.textContent = `
                    .ash-particles-container {
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        pointer-events: none;
                        z-index: 10;
                        overflow: visible;
                    }
                    .ash-particle {
                        position: absolute;
                        border-radius: 50%;
                        pointer-events: none;
                        opacity: 0;
                        transition: all 2s ease;
                    }
                    .ash-particle.size-large { width: 4px; height: 4px; }
                    .ash-particle.size-medium { width: 2.5px; height: 2.5px; }
                    .ash-particle.size-small { width: 1.5px; height: 1.5px; }
                    .ash-particle.size-tiny { width: 1px; height: 1px; }
                    .ash-forming .ash-particle {
                        animation: ashFormation 3s ease-out forwards;
                    }
                    .ash-dissolving .ash-particle {
                        animation: ashDissolution 2.5s ease-in forwards;
                    }
                    .ash-formed .ash-particle {
                        animation: ashFloat 4s ease-in-out infinite;
                    }
                    @keyframes ashFormation {
                        0% { opacity: 0; transform: scale(0) rotate(0deg); }
                        20% { opacity: 1; transform: scale(1.5) rotate(180deg); }
                        100% { opacity: 1; transform: scale(1) rotate(360deg); }
                    }
                    @keyframes ashDissolution {
                        0% { opacity: 1; transform: scale(1) rotate(0deg); }
                        30% { opacity: 0.8; transform: scale(1.2) rotate(90deg); }
                        100% { opacity: 0; transform: scale(0.3) rotate(450deg); }
                    }
                    @keyframes ashFloat {
                        0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.9; }
                        50% { transform: translateY(-3px) rotate(5deg); opacity: 1; }
                    }
                    .ash-particle.wind-right {
                        animation: scatterRight 2.5s ease-in forwards !important;
                    }
                    .ash-particle.wind-left {
                        animation: scatterLeft 2.5s ease-in forwards !important;
                    }
                    .ash-particle.wind-up {
                        animation: scatterUp 2.5s ease-in forwards !important;
                    }
                    @keyframes scatterRight {
                        0% { opacity: 1; transform: translateX(0) translateY(0) scale(1); }
                        100% { opacity: 0; transform: translateX(150px) translateY(-20px) scale(0.2); }
                    }
                    @keyframes scatterLeft {
                        0% { opacity: 1; transform: translateX(0) translateY(0) scale(1); }
                        100% { opacity: 0; transform: translateX(-120px) translateY(-15px) scale(0.3); }
                    }
                    @keyframes scatterUp {
                        0% { opacity: 1; transform: translateX(0) translateY(0) scale(1); }
                        100% { opacity: 0; transform: translateX(0) translateY(-100px) scale(0.1); }
                    }
                `;
                
                document.head.appendChild(style);
            }
            
            setupContainers() {
                const elements = document.querySelectorAll(this.config.containerSelector);
                elements.forEach((element, index) => {
                    this.setupContainer(element, `container-${index}`);
                });
            }
            
            setupContainer(element, id) {
                if (this.containers.has(id)) return;
                
                const computedStyle = window.getComputedStyle(element);
                if (computedStyle.position === 'static') {
                    element.style.position = 'relative';
                }
                
                const particlesContainer = document.createElement('div');
                particlesContainer.className = 'ash-particles-container';
                element.appendChild(particlesContainer);
                
                this.containers.set(id, {
                    element,
                    particlesContainer,
                    image: element.querySelector(this.config.imageSelector),
                    state: 'empty',
                    id
                });
                
                element.dataset.ashId = id;
            }
            
            setupViewportObserver() {
                this.observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        const id = entry.target.dataset.ashId;
                        if (!id) return;
                        
                        if (entry.isIntersecting) {
                            this.form(id);
                        } else {
                            this.dissolve(id);
                        }
                    });
                }, { threshold: 0.1, rootMargin: '0px' });
                
                this.containers.forEach(container => {
                    this.observer.observe(container.element);
                });
            }
            
            createParticles(id) {
                const container = this.containers.get(id);
                if (!container) return;
                
                const { particlesContainer, element } = container;
                particlesContainer.innerHTML = '';
                
                const width = element.offsetWidth;
                const height = element.offsetHeight;
                
                for (let i = 0; i < this.config.particleCount; i++) {
                    const particle = document.createElement('div');
                    particle.className = `ash-particle size-${this.getRandomSize()}`;
                    
                    const color = this.config.particleColors[Math.floor(Math.random() * this.config.particleColors.length)];
                    particle.style.backgroundColor = color;
                    particle.style.boxShadow = `0 0 6px ${color}`;
                    
                    const edge = Math.floor(Math.random() * 4);
                    const positions = this.getParticlePositions(edge, width, height);
                    
                    particle.style.left = positions.startX + 'px';
                    particle.style.top = positions.startY + 'px';
                    particle.dataset.targetX = positions.endX;
                    particle.dataset.targetY = positions.endY;
                    
                    const windClasses = ['wind-right', 'wind-left', 'wind-up'];
                    particle.classList.add(windClasses[Math.floor(Math.random() * windClasses.length)]);
                    
                    particle.style.animationDelay = (Math.random() * 2) + 's';
                    
                    particlesContainer.appendChild(particle);
                }
            }
            
            getParticlePositions(edge, width, height) {
                let startX, startY;
                const margin = 30;
                const endX = Math.random() * width;
                const endY = Math.random() * height;
                
                switch(edge) {
                    case 0: startX = Math.random() * width; startY = -margin; break;
                    case 1: startX = width + margin; startY = Math.random() * height; break;
                    case 2: startX = Math.random() * width; startY = height + margin; break;
                    case 3: startX = -margin; startY = Math.random() * height; break;
                }
                
                return { startX, startY, endX, endY };
            }
            
            getRandomSize() {
                const sizes = ['large', 'medium', 'small', 'tiny'];
                const weights = [0.1, 0.2, 0.4, 0.3];
                const random = Math.random();
                let cumulative = 0;
                
                for (let i = 0; i < sizes.length; i++) {
                    cumulative += weights[i];
                    if (random < cumulative) return sizes[i];
                }
                return 'small';
            }
            
            animateParticles(id) {
                const container = this.containers.get(id);
                if (!container) return;
                
                const particles = container.particlesContainer.querySelectorAll('.ash-particle');
                particles.forEach((particle, index) => {
                    setTimeout(() => {
                        const targetX = parseFloat(particle.dataset.targetX);
                        const targetY = parseFloat(particle.dataset.targetY);
                        
                        particle.style.left = targetX + 'px';
                        particle.style.top = targetY + 'px';
                        particle.style.opacity = '1';
                    }, index * 15);
                });
            }
            
            updateStatus(id, status, text) {
                if (!this.config.showStatusIndicators) return;
                
                const container = this.containers.get(id);
                if (!container) return;
                
                const statusEl = container.element.querySelector(this.config.statusSelector);
                if (statusEl) {
                    statusEl.textContent = text;
                    statusEl.className = `${this.config.statusSelector.replace('.', '')} status-${status}`;
                }
            }
            
            form(id) {
                const container = this.containers.get(id);
                if (!container || container.state === 'formed' || container.state === 'forming') return;
                if (this.activeAnimations.has(id)) return;
                
                this.activeAnimations.add(id);
                container.state = 'forming';
                
                const { element, image } = container;
                
                this.updateStatus(id, 'forming', 'Assembling...');
                this.createParticles(id);
                element.classList.add('ash-forming');
                
                setTimeout(() => this.animateParticles(id), 100);
                
                setTimeout(() => {
                    if (image) image.style.opacity = '1';
                    
                    setTimeout(() => {
                        element.classList.remove('ash-forming');
                        element.classList.add('ash-formed');
                        container.state = 'formed';
                        this.updateStatus(id, 'formed', 'Assembled');
                        this.activeAnimations.delete(id);
                    }, 1000);
                }, 2000);
            }
            
            dissolve(id) {
                const container = this.containers.get(id);
                if (!container || container.state === 'empty' || container.state === 'dissolving') return;
                if (this.activeAnimations.has(id)) return;
                
                this.activeAnimations.add(id);
                container.state = 'dissolving';
                
                const { element, image } = container;
                
                this.updateStatus(id, 'dissolving', 'Turning to dust...');
                element.classList.remove('ash-formed');
                element.classList.add('ash-dissolving');
                
                setTimeout(() => {
                    if (image) image.style.opacity = '0';
                }, 500);
                
                setTimeout(() => {
                    element.classList.remove('ash-dissolving');
                    container.state = 'empty';
                    
                    setTimeout(() => {
                        container.particlesContainer.innerHTML = '';
                        this.updateStatus(id, 'empty', 'Empty Space');
                        this.activeAnimations.delete(id);
                    }, 1500);
                }, 2000);
            }
            
            formAll() {
                this.containers.forEach((_, id) => {
                    setTimeout(() => this.form(id), Math.random() * 1000);
                });
            }
            
            dissolveAll() {
                this.containers.forEach((_, id) => {
                    setTimeout(() => this.dissolve(id), Math.random() * 600);
                });
            }
            
            resetAll() {
                this.activeAnimations.clear();
                this.containers.forEach((container, id) => {
                    const { element, image, particlesContainer } = container;
                    
                    element.classList.remove('ash-forming', 'ash-formed', 'ash-dissolving');
                    if (image) image.style.opacity = '0';
                    particlesContainer.innerHTML = '';
                    container.state = 'empty';
                    
                    this.updateStatus(id, 'empty', 'Empty Space');
                });
            }
            
            setViewportTrigger(enabled) {
                this.config.enableViewportTrigger = enabled;
                
                if (enabled && !this.observer) {
                    this.setupViewportObserver();
                } else if (!enabled && this.observer) {
                    this.observer.disconnect();
                    this.observer = null;
                }
            }
            
            addContainer(element) {
                const id = `container-${Date.now()}`;
                this.setupContainer(element, id);
                
                if (this.observer && this.config.enableViewportTrigger) {
                    this.observer.observe(element);
                }
                
                return id;
            }
        }
        
        // Initialize the effect
        let ashEffect;
        
        document.addEventListener('DOMContentLoaded', function() {
            // Initialize with your configuration
            ashEffect = new InfinityAshEffect({
                containerSelector: '.ash-container',  // Your gallery item class
                imageSelector: 'img',                 // Image selector within containers
                particleCount: 100,                   // Number of particles per image
                enableViewportTrigger: true,          // Auto-trigger on scroll
                showStatusIndicators: true,           // Show status badges
                statusSelector: '.ash-status',        // Status indicator selector
                
                // Customize particle colors to match your theme
                particleColors: [
                    'rgba(139, 116, 93, 0.8)',
                    'rgba(160, 140, 120, 0.7)',
                    'rgba(120, 100, 80, 0.6)'
                ],
                
                // Animation timing
                formationDuration: 3000,
                dissolutionDuration: 2500,
                
                // Callbacks (optional)
                onFormStart: (id, element) => {
                    console.log(`Image ${id} started forming`);
                },
                onFormComplete: (id, element) => {
                    console.log(`Image ${id} fully formed`);
                },
                onDissolveStart: (id, element) => {
                    console.log(`Image ${id} started dissolving`);
                },
                onDissolveComplete: (id, element) => {
                    console.log(`Image ${id} fully dissolved`);
                }
            });
        });
        