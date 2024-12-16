// Set up the scene, camera, and renderer
let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let joystick;
let backgroundPlane; // Add background plane reference

let backgroundMusic;
let musicPlaying = false;

// Create point cloud nexuses
const nexuses = [];
const nexusCount = 7;
const nodeCount = 400;

// Add enemy-related variables
let enemies = [];
const ENEMY_COUNT = 5;

// Define Evolution system first
const Evolution = {
    generation: 0,
    mutationRate: 0.1,
    population: [],
    timeAlive: 0,
    lastEvolve: Date.now(),
    successfulMutations: 0,
    
    // Expanded mutation possibilities
    mutations: {
        GEOMETRIC: 'geometric',
        TEXTURAL: 'textural',
        BEHAVIORAL: 'behavioral',
        HYBRID: 'hybrid',
        PARASITIC: 'parasitic',
        SYMBIOTIC: 'symbiotic'
    },
    
    // Cultural phrases that evolve over time
    culturalPhrases: [
        ["MADE IN CHINA", "中国制造", "中國製造", "MADE WITH LOVE", "MADE WITH FEAR"],
        ["EXPORT QUALITY", "IMPORT DREAMS", "QUALITY CONTROL PASSED", "QUALITY CONTROL FAILED"],
        ["HANDLE WITH CARE", "HANDLE WITH PRAYER", "FRAGILE LIKE CAPITALISM"],
        ["MASS PRODUCED", "MASS CONSUMED", "MASS DESTROYED", "MASS REBORN"],
        ["AUTHENTIC COPY", "GENUINE FAKE", "REAL SIMULATION", "TRUE LIES"],
        ["PRODUCT OF DESIRE", "PRODUCT OF DESPAIR", "PRODUCT OF THE VOID"],
        ["INSPECT BEFORE ACCEPTING", "ACCEPT BEFORE INSPECTING", "NEVER ACCEPT"]
    ],

    // Evolve the cultural phrases themselves
    evolvePhrases() {
        if (Math.random() < 0.1) {
            // Combine random parts of existing phrases
            const set1 = Math.floor(Math.random() * this.culturalPhrases.length);
            const set2 = Math.floor(Math.random() * this.culturalPhrases.length);
            const phrase1 = this.culturalPhrases[set1][Math.floor(Math.random() * this.culturalPhrases[set1].length)];
            const phrase2 = this.culturalPhrases[set2][Math.floor(Math.random() * this.culturalPhrases[set2].length)];
            
            // Split and recombine
            const words1 = phrase1.split(' ');
            const words2 = phrase2.split(' ');
            const newPhrase = words1[Math.floor(Math.random() * words1.length)] + ' ' +
                            words2[Math.floor(Math.random() * words2.length)];
            
            // Add to a random set
            const targetSet = Math.floor(Math.random() * this.culturalPhrases.length);
            this.culturalPhrases[targetSet].push(newPhrase);
            Monitor.log(`New phrase evolved: ${newPhrase}`);
        }
    },
    
    createMutatedTotem() {
        const baseTotem = enemies[Math.floor(Math.random() * enemies.length)];
        const mutationType = this.selectMutationType();
        
        const mutation = {
            type: mutationType,
            height: baseTotem.scale.y * (1 + (Math.random() - 0.5) * this.mutationRate),
            color: this.evolveColor(),
            complexity: Math.floor(Math.random() * 20) + 5,
            textContent: this.generateText(),
            rotationSpeed: (Math.random() - 0.5) * 0.04,
            behaviorPattern: this.evolveBehavior(),
            geometryType: this.evolveGeometry(),
            parasites: [], // For PARASITIC type
            symbionts: []  // For SYMBIOTIC type
        };

        // Add type-specific mutations
        switch(mutationType) {
            case this.mutations.GEOMETRIC:
                mutation.segments = Math.floor(Math.random() * 8) + 3;
                mutation.twistFactor = Math.random() * Math.PI;
                mutation.fractalize = Math.random() < 0.3;
                break;
                
            case this.mutations.TEXTURAL:
                mutation.bumpScale = Math.random() * 2;
                mutation.roughness = Math.random();
                mutation.emissive = new THREE.Color(
                    Math.random() * 0.5,
                    Math.random() * 0.5,
                    Math.random() * 0.5
                );
                break;
                
            case this.mutations.BEHAVIORAL:
                mutation.seekPlayer = Math.random() < 0.3;
                mutation.oscillationFreq = Math.random() * 2;
                mutation.rotationAxis = new THREE.Vector3(
                    Math.random() - 0.5,
                    Math.random() - 0.5,
                    Math.random() - 0.5
                ).normalize();
                break;
                
            case this.mutations.HYBRID:
                // Combine aspects of multiple types
                mutation.geometryType = this.evolveGeometry();
                mutation.behaviorPattern = this.evolveBehavior();
                mutation.texturePattern = this.evolveTexture();
                break;
                
            case this.mutations.PARASITIC:
                // Create smaller entities that attach to other totems
                for(let i = 0; i < Math.floor(Math.random() * 5) + 1; i++) {
                    mutation.parasites.push({
                        size: Math.random() * 0.5,
                        position: new THREE.Vector3(
                            Math.random() - 0.5,
                            Math.random() - 0.5,
                            Math.random() - 0.5
                        ),
                        pulseFreq: Math.random() * 2
                    });
                }
                break;
                
            case this.mutations.SYMBIOTIC:
                // Create beneficial connections between totems
                mutation.connectionType = Math.random() < 0.5 ? 'energyBeam' : 'dataStream';
                mutation.connectionStrength = Math.random();
                mutation.symbioticEffect = {
                    scale: 1 + Math.random() * 0.5,
                    pulseRate: Math.random() * 2,
                    colorShift: Math.random() < 0.3
                };
                break;
        }
        
        return mutation;
    },
    
    selectMutationType() {
        const types = Object.values(this.mutations);
        // Bias towards more complex mutations as generations progress
        const complexityBias = Math.min(this.generation / 20, 1);
        if (Math.random() < complexityBias) {
            return types[Math.floor(Math.random() * 3) + 3]; // More complex types
        }
        return types[Math.floor(Math.random() * types.length)];
    },
    
    evolveColor() {
        const baseColor = new THREE.Color(
            Math.random(),
            Math.random(),
            Math.random()
        );
        
        // Add color evolution patterns
        if (Math.random() < 0.3) {
            // Create complementary color
            const hsl = {};
            baseColor.getHSL(hsl);
            hsl.h = (hsl.h + 0.5) % 1;
            baseColor.setHSL(hsl.h, hsl.s, hsl.l);
        }
        
        return baseColor;
    },
    
    evolveBehavior() {
        return {
            movePattern: ['circular', 'sine', 'spiral', 'chase'][Math.floor(Math.random() * 4)],
            speed: Math.random() * 2,
            interactionRadius: 10 + Math.random() * 20,
            respondToMusic: Math.random() < 0.3,
            affectsNeighbors: Math.random() < 0.2
        };
    },
    
    evolveGeometry() {
        return {
            baseShape: ['box', 'cylinder', 'sphere', 'torusKnot'][Math.floor(Math.random() * 4)],
            deformAmount: Math.random() * 0.5,
            recursionLevel: Math.floor(Math.random() * 3),
            smoothness: Math.random()
        };
    },
    
    evolveTexture() {
        return {
            pattern: ['noise', 'gradient', 'cellular', 'fractal'][Math.floor(Math.random() * 4)],
            scale: Math.random() * 2,
            distortion: Math.random() * 0.5,
            animated: Math.random() < 0.3
        };
    },

    generateText() {
        // Evolve the phrases first
        this.evolvePhrases();
        
        // Select from evolved phrases
        const set = this.culturalPhrases[Math.floor(Math.random() * this.culturalPhrases.length)];
        return set[Math.floor(Math.random() * set.length)];
    },
    
    evolve() {
        this.generation++;
        this.timeAlive += 30; // 30 seconds between evolutions
        Monitor.log(`Starting evolution generation ${this.generation}`);
        
        // Increase complexity over time
        if (this.generation % 5 === 0) {
            this.mutationRate *= 1.1;
            ENEMY_COUNT = Math.min(ENEMY_COUNT + 1, 15); // Gradually increase population
        }
        
        // Create new enemies with mutations
        const numNewEnemies = Math.floor(Math.random() * 3) + 1; // 1-3 new enemies per evolution
        for (let i = 0; i < numNewEnemies; i++) {
            const mutation = this.createMutatedTotem();
            const newEnemy = createEnemy(mutation);
            
            // Handle special mutation types
            if (mutation.type === this.mutations.PARASITIC) {
                this.attachParasites(newEnemy, mutation);
            } else if (mutation.type === this.mutations.SYMBIOTIC) {
                this.createSymbioticLinks(newEnemy, mutation);
            }
        }
        
        // Remove oldest enemies if we're over capacity
        while (enemies.length > ENEMY_COUNT) {
            const oldest = enemies.shift();
            scene.remove(oldest);
        }
        
        // Occasionally trigger special events
        if (Math.random() < 0.1) {
            this.triggerSpecialEvent();
        }
        
        Monitor.log(`Evolution complete. Population: ${enemies.length}, Mutation Rate: ${this.mutationRate}`);
    },
    
    attachParasites(host, mutation) {
        mutation.parasites.forEach(parasite => {
            const parasiteMesh = new THREE.Mesh(
                new THREE.SphereGeometry(parasite.size),
                new THREE.MeshPhongMaterial({
                    color: 0xff0000,
                    emissive: 0x330000
                })
            );
            parasiteMesh.position.copy(parasite.position);
            host.add(parasiteMesh);
            
            // Add pulsing animation
            parasiteMesh.userData.pulseFreq = parasite.pulseFreq;
            parasiteMesh.userData.originalScale = parasite.size;
        });
    },
    
    createSymbioticLinks(newEnemy, mutation) {
        // Find closest enemy to form symbiotic relationship
        let closest = null;
        let minDist = Infinity;
        enemies.forEach(enemy => {
            if (enemy !== newEnemy) {
                const dist = newEnemy.position.distanceTo(enemy.position);
                if (dist < minDist) {
                    minDist = dist;
                    closest = enemy;
                }
            }
        });
        
        if (closest) {
            const connection = this.createSymbioticConnection(newEnemy, closest, mutation);
            scene.add(connection);
            newEnemy.userData.symbioticPartner = closest;
            newEnemy.userData.symbioticConnection = connection;
        }
    },
    
    createSymbioticConnection(enemy1, enemy2, mutation) {
        const points = [];
        points.push(enemy1.position);
        points.push(enemy2.position);
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: mutation.connectionType === 'energyBeam' ? 0x00ff00 : 0x0000ff,
            linewidth: 2,
            transparent: true,
            opacity: 0.6
        });
        
        return new THREE.Line(geometry, material);
    },
    
    triggerSpecialEvent() {
        const events = [
            this.massColorShift.bind(this),
            this.geometricResonance.bind(this),
            this.culturalRevolution.bind(this),
            this.massHybridization.bind(this)
        ];
        
        const event = events[Math.floor(Math.random() * events.length)];
        event();
    },
    
    massColorShift() {
        Monitor.log('Special Event: Mass Color Shift');
        const newColor = this.evolveColor();
        enemies.forEach(enemy => {
            enemy.children[0].material.color.lerp(newColor, 0.5);
        });
    },
    
    geometricResonance() {
        Monitor.log('Special Event: Geometric Resonance');
        const geometry = this.evolveGeometry();
        enemies.forEach(enemy => {
            enemy.userData.resonating = true;
            enemy.scale.multiplyScalar(1.2);
        });
    },
    
    culturalRevolution() {
        Monitor.log('Special Event: Cultural Revolution');
        // Create entirely new set of phrases
        this.culturalPhrases.push([
            "DIGITAL DREAMS",
            "VIRTUAL REALITY",
            "SYNTHETIC TRUTH",
            "ARTIFICIAL WISDOM"
        ]);
    },
    
    massHybridization() {
        Monitor.log('Special Event: Mass Hybridization');
        enemies.forEach(enemy => {
            const hybrid = this.createMutatedTotem();
            hybrid.type = this.mutations.HYBRID;
            Object.assign(enemy.userData, hybrid);
        });
    }
};

// Then define Monitor system
const Monitor = {
    lastCheck: Date.now(),
    checkInterval: 1000,
    errors: [],
    stats: {
        fps: 0,
        activeEnemies: 0,
        evolutionGeneration: 0,
        lastSpecialEvent: null
    },
    // Rest of Monitor system...
};

// Initialize systems in correct order
function initializeSystems() {
    Monitor.init();
    Evolution.lastEvolve = Date.now();
    Evolution.successfulMutations = 0;
    initializeEvolutionSystems();
}

// Update init function to call initialization in correct order
function init() {
    try {
        console.log('Initializing game...');
        
        scene = new THREE.Scene();
        console.log('Scene created');
        
        scene.background = new THREE.Color(0x000000);
        console.log('Background set');
        
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        console.log('Camera created');
        
        const canvas = document.getElementById('game');
        console.log('Canvas found:', canvas);
        
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        console.log('Renderer created');
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        console.log('Renderer size set');

        // Create the moving background
        createBackground();

        // Set up controls
        controls = new THREE.PointerLockControls(camera, renderer.domElement);
        console.log('Controls created');
        
        scene.add(controls.getObject());
        console.log('Controls added to scene');

        document.addEventListener('click', () => {
            controls.lock();
        });

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        // Create nexuses
        for (let i = 0; i < nexusCount; i++) {
            createNexus();
        }
        console.log('Nexuses created');

        camera.position.y = 10;
        console.log('Camera positioned');

        initializeMusic();
        initializeMobileControls();
        
        setInterval(autoCameraMovement, 50);
        console.log('Auto camera movement started');

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        // Add directional light
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(5, 5, 5);
        scene.add(dirLight);
        
        // Create enemies
        for(let i = 0; i < ENEMY_COUNT; i++) {
            createEnemy();
        }
        
        animate();
        console.log('Animation loop started');

        // Initialize background after scene setup
        BackgroundSystem.init().catch(error => {
            console.error('Background initialization failed:', error);
        });

        initializeSystems();
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

function createNexus() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);

    for (let i = 0; i < nodeCount; i++) {
        const x = Math.random() * 400 - 200;
        const y = Math.random() * 400 - 200;
        const z = Math.random() * 400 - 200;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        const color = new THREE.Color();
        color.setHSL(Math.random(), 1.0, 0.5);

        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ size: 0.5, vertexColors: true });
    const points = new THREE.Points(geometry, material);

    scene.add(points);
    nexuses.push(points);
}

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyD': moveRight = true; break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyD': moveRight = false; break;
    }
}

function createMusicButton() {
    const button = document.createElement('button');
    button.id = 'musicButton';
    button.textContent = 'Oor zo iteraties een huisje leeg hoe klinkt dat?';
    button.style.position = 'fixed';
    button.style.top = '50%';
    button.style.left = '50%';
    button.style.transform = 'translate(-50%, -50%)';
    button.style.zIndex = '9999';
    button.style.padding = '10px 20px';
    button.style.fontSize = '14px';
    button.style.backgroundColor = 'red';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';
    button.style.fontWeight = 'bold';
    button.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
    document.body.appendChild(button);
    return button;
}

function toggleMusic() {
    const musicButton = document.getElementById('musicButton');
    if (musicPlaying) {
        backgroundMusic.pause();
        musicButton.style.backgroundColor = 'red';
        musicPlaying = false;
    } else {
        backgroundMusic.play().catch(error => {
            console.error('Error playing music:', error);
            alert('Unable to play music. Please check your browser settings.');
        });
        musicButton.style.backgroundColor = 'green';
        musicPlaying = true;
    }
}

function initializeMusic() {
    backgroundMusic = new Audio('1. MultiTone - 120 bpm - 001 2.mp3');
    backgroundMusic.loop = true;
    const musicButton = createMusicButton();
    
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            toggleMusic();
        }
    });

    document.addEventListener('click', (event) => {
        if (event.target !== musicButton) {
            toggleMusic();
        }
    });

    musicButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleMusic();
    });
}

function initializeMobileControls() {
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        const joystickContainer = document.getElementById('joystick');
        joystick = nipplejs.create({
            zone: joystickContainer,
            mode: 'static',
            position: { left: '50%', top: '50%' },
            color: 'white'
        });

        joystick.on('move', (evt, data) => {
            const forward = data.vector.y;
            const side = data.vector.x;

            moveForward = forward > 0;
            moveBackward = forward < 0;
            moveLeft = side < 0;
            moveRight = side > 0;
        });

        joystick.on('end', () => {
            moveForward = moveBackward = moveLeft = moveRight = false;
        });

        let touchStartX, touchStartY;
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].pageX;
            touchStartY = e.touches[0].pageY;
        });

        document.addEventListener('touchmove', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.touches[0].pageX;
            const touchEndY = e.touches[0].pageY;

            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;

            camera.rotation.y -= dx * 0.002;
            camera.rotation.x -= dy * 0.002;

            camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));

            touchStartX = touchEndX;
            touchStartY = touchEndY;
        });
    }
}

function autoCameraMovement() {
    camera.rotation.y += 0.0005;
    camera.position.y += Math.sin(Date.now() * 0.001) * 0.01;
}

// Modify createEnemy to accept mutations
function createEnemy(mutations = null) {
    console.log('Creating enemy totem...');
    
    const totemGroup = new THREE.Group();
    
    // Apply mutations if provided
    const height = mutations ? mutations.height : 24;
    const color = mutations ? mutations.color : new THREE.Color(0xA0522D);
    const complexity = mutations ? mutations.complexity : 12;
    const text = mutations ? mutations.textContent : 'MADE IN CHINA';
    
    // Create base geometry with mutations
    const bodyGeometry = new THREE.BoxGeometry(8, height, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: color,
        roughness: 0.8,
        metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Add decorative elements based on complexity
    for(let i = 0; i < complexity; i++) {
        const size = 1.6 * (1 + Math.sin(i / complexity * Math.PI));
        const carving = new THREE.Mesh(
            new THREE.BoxGeometry(size, size, size),
            new THREE.MeshPhongMaterial({ 
                color: color.clone().offsetHSL(Math.random() * 0.1, 0, 0)
            })
        );
        carving.position.set(
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * height,
            4.4
        );
        carving.rotation.set(
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
        );
        body.add(carving);
    }
    
    // Create text with mutations
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;
    context.fillStyle = 'white';
    context.fillRect(0, 0, 512, 128);
    context.font = 'bold 64px Arial';
    context.fillStyle = 'red';
    context.textAlign = 'center';
    context.fillText(text, 256, 80);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textGeometry = new THREE.PlaneGeometry(8, 2);
    const textMaterial = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, height/3, 4.4);
    
    totemGroup.add(body);
    totemGroup.add(textMesh);
    
    // Position with some randomness
    const angle = Math.random() * Math.PI * 2;
    const radius = 50 + Math.random() * 50;
    totemGroup.position.set(
        Math.cos(angle) * radius,
        12,
        Math.sin(angle) * radius
    );
    
    // Animation data with mutations
    totemGroup.userData = {
        rotationSpeed: mutations ? mutations.rotationSpeed : (Math.random() - 0.5) * 0.02,
        floatOffset: Math.random() * Math.PI * 2,
        originalY: totemGroup.position.y,
        generation: Evolution.generation
    };
    
    scene.add(totemGroup);
    enemies.push(totemGroup);
    console.log('Enemy totem created successfully');
    return totemGroup;
}

// Update the enemy update function to handle new behaviors
function updateEnemies() {
    const time = performance.now() * 0.001;
    enemies.forEach((enemy, index) => {
        const mutation = enemy.userData;
        
        // Basic rotation and floating
        enemy.rotation.y += mutation.rotationSpeed;
        enemy.position.y = mutation.originalY + 
            Math.sin(time + mutation.floatOffset) * 2;
            
        // Handle behavioral patterns
        if (mutation.behaviorPattern) {
            switch(mutation.behaviorPattern.movePattern) {
                case 'circular':
                    enemy.position.x = Math.cos(time * mutation.behaviorPattern.speed) * mutation.behaviorPattern.interactionRadius;
                    enemy.position.z = Math.sin(time * mutation.behaviorPattern.speed) * mutation.behaviorPattern.interactionRadius;
                    break;
                case 'sine':
                    enemy.position.x += Math.sin(time * mutation.behaviorPattern.speed) * 0.1;
                    break;
                case 'spiral':
                    const radius = (Math.sin(time * 0.5) + 1) * mutation.behaviorPattern.interactionRadius;
                    enemy.position.x = Math.cos(time * mutation.behaviorPattern.speed) * radius;
                    enemy.position.z = Math.sin(time * mutation.behaviorPattern.speed) * radius;
                    break;
                case 'chase':
                    if (camera) {
                        const dirToPlayer = new THREE.Vector3().subVectors(camera.position, enemy.position);
                        dirToPlayer.normalize();
                        enemy.position.add(dirToPlayer.multiplyScalar(mutation.behaviorPattern.speed * 0.1));
                    }
                    break;
            }
        }
        
        // Update parasites
        enemy.children.forEach(child => {
            if (child.userData.pulseFreq) {
                const scale = child.userData.originalScale * (1 + Math.sin(time * child.userData.pulseFreq) * 0.2);
                child.scale.set(scale, scale, scale);
            }
        });
        
        // Update symbiotic connections
        if (enemy.userData.symbioticPartner && enemy.userData.symbioticConnection) {
            const points = [
                enemy.position,
                enemy.userData.symbioticPartner.position
            ];
            enemy.userData.symbioticConnection.geometry.setFromPoints(points);
            
            // Apply symbiotic effects
            if (enemy.userData.symbioticEffect) {
                const effect = enemy.userData.symbioticEffect;
                const scale = 1 + Math.sin(time * effect.pulseRate) * 0.1;
                enemy.scale.setScalar(scale * effect.scale);
                
                if (effect.colorShift) {
                    const hue = (time * 0.1) % 1;
                    enemy.children[0].material.color.setHSL(hue, 1, 0.5);
                }
            }
        }
        
        // Always face camera with text
        enemy.children[1].lookAt(camera.position);
    });
}

function animate() {
    requestAnimationFrame(animate);
    
    const time = performance.now() * 0.001;
    
    if (controls.isLocked) {
        const delta = (time - prevTime) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        prevTime = time;
        
        updateEnemies();
        BackgroundSystem.update(time);
    }
    
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start evolution process
setInterval(() => {
    Evolution.evolve();
}, 30000);  // Evolve every 30 seconds

// Initialize the game when the page loads
init();

// Add new evolutionary systems
const EvolutionaryCore = {
    // 3. Architectural Evolution System
    Architecture: {
        styles: ['brutalist', 'postmodern', 'deconstructivist', 'metabolist', 'hyperreal'],
        currentEra: 0,
        mutationRate: 0.15,
        
        evolveStyle() {
            const style = {
                form: this.styles[Math.floor(Math.random() * this.styles.length)],
                complexity: Math.random() * 0.8 + 0.2,
                verticalityBias: Math.sin(this.currentEra * 0.1) * 0.5 + 0.5,
                density: Math.random() * 0.7 + 0.3,
                decay: Math.random() < 0.3
            };
            
            if (style.decay) {
                style.decayPattern = {
                    rate: Math.random() * 0.1,
                    type: ['erosion', 'collapse', 'overgrowth'][Math.floor(Math.random() * 3)],
                    affects: ['structure', 'texture', 'color'][Math.floor(Math.random() * 3)]
                };
            }
            
            return style;
        },
        
        applyStyle(building, style) {
            const geometry = new THREE.BoxGeometry(
                20 * (1 + style.complexity),
                40 * (1 + style.verticalityBias),
                20 * (1 + style.complexity)
            );
            
            if (style.form === 'deconstructivist') {
                this.deformGeometry(geometry, style.complexity);
            }
            
            const material = building.material;
            material.roughness = style.complexity;
            material.metalness = style.form === 'brutalist' ? 0.8 : 0.2;
            
            if (style.decay) {
                this.applyDecay(building, style.decayPattern);
            }
        },
        
        deformGeometry(geometry, amount) {
            const positions = geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += (Math.random() - 0.5) * amount * 10;
                positions[i + 1] += (Math.random() - 0.5) * amount * 10;
                positions[i + 2] += (Math.random() - 0.5) * amount * 10;
            }
            geometry.computeVertexNormals();
        },
        
        applyDecay(building, pattern) {
            switch (pattern.type) {
                case 'erosion':
                    building.material.displacementScale = pattern.rate * 5;
                    break;
                case 'collapse':
                    building.rotation.z += pattern.rate;
                    break;
                case 'overgrowth':
                    building.material.color.setHSL(0.3, pattern.rate, 0.5);
                    break;
            }
        }
    },

    // 4. Social Network Evolution
    SocialNetwork: {
        nodes: new Map(),
        connections: [],
        
        createNode(entity) {
            const node = {
                entity: entity,
                connections: [],
                influence: Math.random(),
                ideology: {
                    collectivism: Math.random(),
                    progress: Math.random(),
                    tradition: Math.random()
                }
            };
            this.nodes.set(entity.uuid, node);
            return node;
        },
        
        evolveNetwork() {
            // Form new connections
            this.nodes.forEach((node1, id1) => {
                this.nodes.forEach((node2, id2) => {
                    if (id1 !== id2 && Math.random() < 0.1) {
                        const compatibility = this.calculateCompatibility(node1, node2);
                        if (compatibility > 0.7) {
                            this.formConnection(node1, node2, compatibility);
                        }
                    }
                });
            });
            
            // Evolve ideologies
            this.nodes.forEach(node => {
                node.connections.forEach(connection => {
                    this.exchangeIdeologies(node, connection.target, connection.strength);
                });
            });
        },
        
        calculateCompatibility(node1, node2) {
            return 1 - Math.abs(node1.ideology.collectivism - node2.ideology.collectivism) *
                Math.abs(node1.ideology.progress - node2.ideology.progress) *
                Math.abs(node1.ideology.tradition - node2.ideology.tradition);
        },
        
        formConnection(node1, node2, strength) {
            const connection = {
                source: node1,
                target: node2,
                strength: strength,
                type: strength > 0.9 ? 'strong' : 'weak'
            };
            node1.connections.push(connection);
            node2.connections.push({...connection, source: node2, target: node1});
            this.connections.push(connection);
            
            // Visualize connection
            const line = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints([
                    node1.entity.position,
                    node2.entity.position
                ]),
                new THREE.LineBasicMaterial({
                    color: new THREE.Color().setHSL(strength, 1, 0.5),
                    transparent: true,
                    opacity: strength
                })
            );
            scene.add(line);
            connection.visual = line;
        },
        
        exchangeIdeologies(node1, node2, strength) {
            ['collectivism', 'progress', 'tradition'].forEach(aspect => {
                const diff = node2.ideology[aspect] - node1.ideology[aspect];
                node1.ideology[aspect] += diff * strength * 0.1;
                node2.ideology[aspect] -= diff * strength * 0.1;
            });
        }
    },

    // 5. Economic Evolution System
    Economy: {
        resources: new Map(),
        transactions: [],
        marketPressure: 0,
        
        initializeMarket() {
            this.resources.set('space', { value: 1.0, volatility: 0.2 });
            this.resources.set('authenticity', { value: 1.0, volatility: 0.4 });
            this.resources.set('cultural_capital', { value: 1.0, volatility: 0.3 });
        },
        
        evolveMarket() {
            // Update resource values
            this.resources.forEach((resource, key) => {
                resource.value *= 1 + (Math.random() - 0.5) * resource.volatility;
                resource.value = Math.max(0.1, Math.min(10, resource.value));
            });
            
            // Update market pressure
            this.marketPressure = Math.sin(Date.now() * 0.0001) * 0.5 + 0.5;
            
            // Affect entity behaviors
            enemies.forEach(enemy => {
                this.applyEconomicPressure(enemy);
            });
        },
        
        applyEconomicPressure(entity) {
            const spaceValue = this.resources.get('space').value;
            const authenticity = this.resources.get('authenticity').value;
            
            // Scale based on market values
            entity.scale.setScalar(1 + (spaceValue - 1) * 0.2);
            
            // Modify behavior based on authenticity value
            if (entity.userData.behaviorPattern) {
                entity.userData.behaviorPattern.speed *= 1 + (authenticity - 1) * 0.1;
            }
            
            // Apply market pressure effects
            if (this.marketPressure > 0.8) {
                entity.material.emissive.setScalar(this.marketPressure * 0.2);
            }
        },
        
        recordTransaction(buyer, seller, resource, amount) {
            this.transactions.push({
                timestamp: Date.now(),
                buyer: buyer.uuid,
                seller: seller.uuid,
                resource: resource,
                amount: amount,
                price: this.resources.get(resource).value
            });
        }
    },

    // 6. Memetic Evolution System
    Memetics: {
        memes: [],
        activeMemes: new Set(),
        
        createMeme(content, type = 'visual') {
            return {
                content: content,
                type: type,
                strength: Math.random(),
                mutation_rate: 0.1,
                spread_rate: Math.random() * 0.3,
                carriers: new Set(),
                generation: 0,
                parent: null
            };
        },
        
        evolveMemes() {
            // Spread existing memes
            this.activeMemes.forEach(meme => {
                enemies.forEach(enemy => {
                    if (!meme.carriers.has(enemy) && Math.random() < meme.spread_rate) {
                        this.infectWithMeme(enemy, meme);
                    }
                });
                
                // Possible mutation
                if (Math.random() < meme.mutation_rate) {
                    const mutatedMeme = this.mutateMeme(meme);
                    this.activeMemes.add(mutatedMeme);
                }
            });
        },
        
        mutateMeme(parentMeme) {
            const meme = this.createMeme(parentMeme.content, parentMeme.type);
            meme.parent = parentMeme;
            meme.generation = parentMeme.generation + 1;
            
            // Mutate properties
            meme.strength = parentMeme.strength * (0.8 + Math.random() * 0.4);
            meme.spread_rate = parentMeme.spread_rate * (0.8 + Math.random() * 0.4);
            
            // Mutate content based on type
            if (meme.type === 'visual') {
                meme.content = this.mutateVisualMeme(parentMeme.content);
            } else if (meme.type === 'behavioral') {
                meme.content = this.mutateBehavioralMeme(parentMeme.content);
            }
            
            return meme;
        },
        
        mutateVisualMeme(content) {
            // Modify visual properties
            return {
                ...content,
                color: content.color.clone().offsetHSL(Math.random() * 0.1, 0, 0),
                scale: content.scale * (0.9 + Math.random() * 0.2),
                complexity: content.complexity * (0.9 + Math.random() * 0.2)
            };
        },
        
        mutateBehavioralMeme(content) {
            // Modify behavior patterns
            return {
                ...content,
                frequency: content.frequency * (0.9 + Math.random() * 0.2),
                amplitude: content.amplitude * (0.9 + Math.random() * 0.2),
                pattern: content.pattern.map(p => p * (0.9 + Math.random() * 0.2))
            };
        },
        
        infectWithMeme(entity, meme) {
            meme.carriers.add(entity);
            
            // Apply meme effects
            if (meme.type === 'visual') {
                this.applyVisualMeme(entity, meme);
            } else if (meme.type === 'behavioral') {
                this.applyBehavioralMeme(entity, meme);
            }
        },
        
        applyVisualMeme(entity, meme) {
            if (entity.material) {
                entity.material.color.lerp(meme.content.color, meme.strength);
                entity.scale.multiplyScalar(1 + (meme.content.scale - 1) * meme.strength);
            }
        },
        
        applyBehavioralMeme(entity, meme) {
            if (entity.userData.behaviorPattern) {
                entity.userData.behaviorPattern.frequency *= 1 + (meme.content.frequency - 1) * meme.strength;
                entity.userData.behaviorPattern.amplitude *= 1 + (meme.content.amplitude - 1) * meme.strength;
            }
        }
    },

    // 7. Environmental Evolution System
    Environment: {
        conditions: {
            pressure: 1.0,
            entropy: 0.0,
            chaos: 0.0
        },
        
        zones: [],
        activeEffects: new Set(),
        
        createZone(position, radius, type) {
            const zone = {
                position: position.clone(),
                radius: radius,
                type: type,
                strength: Math.random(),
                evolution: 0,
                affects: new Set()
            };
            this.zones.push(zone);
            
            // Visualize zone
            const geometry = new THREE.SphereGeometry(radius, 32, 32);
            const material = new THREE.MeshBasicMaterial({
                color: this.getZoneColor(type),
                transparent: true,
                opacity: 0.2
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);
            scene.add(mesh);
            zone.visual = mesh;
            
            return zone;
        },
        
        evolveEnvironment() {
            // Update global conditions
            this.conditions.entropy += 0.001;
            this.conditions.chaos = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
            this.conditions.pressure = Math.cos(Date.now() * 0.0005) * 0.3 + 0.7;
            
            // Evolve zones
            this.zones.forEach(zone => {
                zone.evolution += 0.01;
                zone.strength = 0.5 + Math.sin(zone.evolution) * 0.5;
                
                // Apply zone effects
                enemies.forEach(enemy => {
                    const distance = enemy.position.distanceTo(zone.position);
                    if (distance < zone.radius) {
                        this.applyZoneEffect(enemy, zone, 1 - (distance / zone.radius));
                    }
                });
                
                // Zone visual effects
                zone.visual.material.opacity = 0.2 * zone.strength;
                zone.visual.scale.setScalar(1 + Math.sin(zone.evolution * 2) * 0.1);
            });
            
            // Create new zones occasionally
            if (Math.random() < 0.01) {
                const position = new THREE.Vector3(
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200,
                    (Math.random() - 0.5) * 200
                );
                const type = ['pressure', 'entropy', 'chaos'][Math.floor(Math.random() * 3)];
                this.createZone(position, 20 + Math.random() * 30, type);
            }
            
            // Remove old zones
            this.zones = this.zones.filter(zone => {
                if (zone.evolution > Math.PI * 2) {
                    scene.remove(zone.visual);
                    return false;
                }
                return true;
            });
        },
        
        getZoneColor(type) {
            switch(type) {
                case 'pressure': return 0xff0000;
                case 'entropy': return 0x00ff00;
                case 'chaos': return 0x0000ff;
                default: return 0xffffff;
            }
        },
        
        applyZoneEffect(entity, zone, intensity) {
            switch(zone.type) {
                case 'pressure':
                    entity.scale.multiplyScalar(1 - intensity * 0.1);
                    if (entity.material) {
                        entity.material.emissive.setScalar(intensity * 0.5);
                    }
                    break;
                    
                case 'entropy':
                    if (entity.userData.behaviorPattern) {
                        entity.userData.behaviorPattern.speed *= 1 + intensity * 0.2;
                    }
                    entity.rotation.x += intensity * 0.01;
                    break;
                    
                case 'chaos':
                    entity.position.add(new THREE.Vector3(
                        (Math.random() - 0.5) * intensity,
                        (Math.random() - 0.5) * intensity,
                        (Math.random() - 0.5) * intensity
                    ));
                    break;
            }
            
            zone.affects.add(entity);
        }
    }
};

// Initialize all evolutionary systems
function initializeEvolutionSystems() {
    EvolutionaryCore.Economy.initializeMarket();
    
    // Start evolution cycles
    setInterval(() => {
        EvolutionaryCore.Architecture.currentEra++;
        EvolutionaryCore.SocialNetwork.evolveNetwork();
        EvolutionaryCore.Economy.evolveMarket();
        EvolutionaryCore.Memetics.evolveMemes();
        EvolutionaryCore.Environment.evolveEnvironment();
    }, 1000);
}