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

// Add evolutionary system
const Evolution = {
    generation: 0,
    mutationRate: 0.1,
    population: [],
    
    createMutatedTotem: function() {
        const baseTotem = enemies[Math.floor(Math.random() * enemies.length)];
        const mutation = {
            height: baseTotem.scale.y * (1 + (Math.random() - 0.5) * this.mutationRate),
            color: new THREE.Color(
                Math.random(),
                Math.random(),
                Math.random()
            ),
            complexity: Math.floor(Math.random() * 20) + 5,  // Number of decorative elements
            textContent: this.generateText(),
            rotationSpeed: (Math.random() - 0.5) * 0.04
        };
        return mutation;
    },
    
    generateText: function() {
        const phrases = [
            "MADE IN CHINA",
            "EXPORT QUALITY",
            "HANDLE WITH CARE",
            "FRAGILE DREAMS",
            "MASS PRODUCED",
            "AUTHENTIC COPY",
            "GENUINE FAKE"
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
    },
    
    evolve: function() {
        this.generation++;
        Monitor.log(`Starting evolution generation ${this.generation}`);
        
        // Create new enemy with mutations
        const mutation = this.createMutatedTotem();
        const newEnemy = createEnemy(mutation);
        
        // Remove oldest enemy if we're at capacity
        if (enemies.length > ENEMY_COUNT) {
            const oldest = enemies.shift();
            scene.remove(oldest);
        }
        
        // Increase mutation rate occasionally
        if (this.generation % 10 === 0) {
            this.mutationRate *= 1.1;
            Monitor.log(`Mutation rate increased to ${this.mutationRate}`);
        }
    }
};

function createBackground() {
    console.log('Creating moving background...');
    
    // Create a large plane for the background
    const geometry = new THREE.PlaneGeometry(2000, 2000);
    
    // Load the texture with proper error handling
    const textureLoader = new THREE.TextureLoader();
    textureLoader.crossOrigin = 'anonymous';  // Enable cross-origin loading
    
    textureLoader.load(
        'chinese-development.jpg',
        (texture) => {
            console.log('Background texture loaded successfully');
            
            // Make the texture repeat
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(2, 2);
            
            // Create material with the texture
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8
            });
            
            // Create the plane mesh
            backgroundPlane = new THREE.Mesh(geometry, material);
            
            // Position it behind everything
            backgroundPlane.position.z = -800;
            backgroundPlane.position.y = 0;
            
            // Tilt it slightly
            backgroundPlane.rotation.x = Math.PI * 0.1;
            
            scene.add(backgroundPlane);
            console.log('Background added to scene');
        },
        (progress) => {
            console.log('Loading background texture:', (progress.loaded / progress.total * 100) + '%');
        },
        (error) => {
            console.error('Error loading background texture:', error);
            // Try loading from absolute GitHub URL as fallback
            const githubUrl = 'https://raw.githubusercontent.com/Marcuse-69/mental-furniture/main/chinese-development.jpg';
            textureLoader.load(
                githubUrl,
                (texture) => {
                    console.log('Background texture loaded from GitHub');
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(2, 2);
                    
                    const material = new THREE.MeshBasicMaterial({
                        map: texture,
                        side: THREE.DoubleSide,
                        transparent: true,
                        opacity: 0.8
                    });
                    
                    backgroundPlane = new THREE.Mesh(geometry, material);
                    backgroundPlane.position.z = -800;
                    backgroundPlane.position.y = 0;
                    backgroundPlane.rotation.x = Math.PI * 0.1;
                    
                    scene.add(backgroundPlane);
                    console.log('Background added to scene from GitHub URL');
                },
                undefined,
                (secondError) => {
                    console.error('Failed to load background from GitHub:', secondError);
                }
            );
        }
    );
}

function updateBackground() {
    if (backgroundPlane && backgroundPlane.material.map) {
        try {
            // Scroll the texture more slowly
            backgroundPlane.material.map.offset.y += 0.0002;
            
            // Subtle rotation
            backgroundPlane.rotation.z += 0.0001;
            
            // Log successful update periodically
            if (Math.random() < 0.001) {  // Log roughly every 1000 frames
                console.log('Background updating successfully');
            }
        } catch (error) {
            console.error('Error updating background:', error);
        }
    }
}

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

function updateEnemies() {
    const time = performance.now() * 0.001;
    enemies.forEach((enemy, index) => {
        // Rotate around Y axis
        enemy.rotation.y += enemy.userData.rotationSpeed;
        
        // Float up and down with larger amplitude
        enemy.position.y = enemy.userData.originalY + 
            Math.sin(time + enemy.userData.floatOffset) * 2;  // Increased amplitude
            
        // Always face the camera
        enemy.children[1].lookAt(camera.position);
    });
}

function animate() {
    requestAnimationFrame(animate);

    if (controls.isLocked === true) {
        const time = performance.now();
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
        updateBackground();  // Add background update
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