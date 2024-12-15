// Set up the scene, camera, and renderer
let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let joystick;

let backgroundMusic;
let musicPlaying = false;

// Create point cloud nexuses
const nexuses = [];
const nexusCount = 7;
const nodeCount = 400;

// Add enemy-related variables
let enemies = [];
const ENEMY_COUNT = 5;

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

function createEnemy() {
    // Create totem group
    const totemGroup = new THREE.Group();
    
    // Create totem body (stack of boxes)
    const bodyGeometry = new THREE.BoxGeometry(2, 6, 2);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0xA0522D,
        roughness: 0.8,
        metalness: 0.2
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    // Add random carvings/patterns using multiple small boxes
    for(let i = 0; i < 8; i++) {
        const carving = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.4, 0.4),
            new THREE.MeshPhongMaterial({ color: 0x8B4513 })
        );
        carving.position.set(
            (Math.random() - 0.5) * 1.5,
            (Math.random() - 0.5) * 5,
            1.1
        );
        body.add(carving);
    }

    // Create "Made in China" text
    const loader = new THREE.TextureLoader();
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = 'white';
    context.fillRect(0, 0, 256, 64);
    context.font = 'bold 32px Arial';
    context.fillStyle = 'red';
    context.textAlign = 'center';
    context.fillText('MADE IN CHINA', 128, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const textGeometry = new THREE.PlaneGeometry(2, 0.5);
    const textMaterial = new THREE.MeshBasicMaterial({ 
        map: texture,
        transparent: true,
        opacity: 0.9
    });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    textMesh.position.set(0, 2, 1.1);
    
    // Add everything to the group
    totemGroup.add(body);
    totemGroup.add(textMesh);
    
    // Position the totem randomly in the world
    totemGroup.position.set(
        (Math.random() - 0.5) * 100,
        0,
        (Math.random() - 0.5) * 100
    );
    
    // Add animation data
    totemGroup.userData = {
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        floatOffset: Math.random() * Math.PI * 2,
        originalY: totemGroup.position.y
    };
    
    scene.add(totemGroup);
    enemies.push(totemGroup);
}

function updateEnemies() {
    const time = performance.now() * 0.001;
    enemies.forEach(enemy => {
        // Rotate around Y axis
        enemy.rotation.y += enemy.userData.rotationSpeed;
        
        // Float up and down
        enemy.position.y = enemy.userData.originalY + 
            Math.sin(time + enemy.userData.floatOffset) * 0.5;
            
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
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize the game when the page loads
init();