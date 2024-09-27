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
const nodeCount = 400; // Increased from 60 to 400

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Set up controls
    controls = new THREE.PointerLockControls(camera, renderer.domElement);
    scene.add(controls.getObject());

    document.addEventListener('click', () => {
        controls.lock();
    });

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // Create nexuses
    for (let i = 0; i < nexusCount; i++) {
        createNexus();
    }

    camera.position.y = 10;

    initializeMusic();
    initializeMobileControls();
    
    setInterval(autoCameraMovement, 50);

    animate();
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
    }

    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}