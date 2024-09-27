const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load the background texture
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('lacanian_desire_background.jpg', () => {
    const backgroundMesh = new THREE.Mesh(
        new THREE.SphereGeometry(500, 60, 40),
        new THREE.MeshBasicMaterial({ map: backgroundTexture, side: THREE.BackSide })
    );
    scene.add(backgroundMesh);
}, undefined, (error) => {
    console.error('An error occurred while loading the background texture:', error);
});

// Set up camera position
camera.position.set(0, 1.6, 0); // Set initial position to simulate standing height

// Create a simple floor
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.5;
scene.add(floor);

// Set up controls
const moveSpeed = 0.1;
const rotateSpeed = 0.02;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

function onKeyDown(event) {
    switch (event.code) {
        case 'KeyW': moveForward = true; break;
        case 'KeyS': moveBackward = true; break;
        case 'KeyA': moveLeft = true; break;
        case 'KeyD': moveRight = true; break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW': moveForward = false; break;
        case 'KeyS': moveBackward = false; break;
        case 'KeyA': moveLeft = false; break;
        case 'KeyD': moveRight = false; break;
    }
}

// Mouse look controls
let isMouseLocked = false;
renderer.domElement.addEventListener('click', () => {
    if (!isMouseLocked) {
        renderer.domElement.requestPointerLock();
    }
});

document.addEventListener('pointerlockchange', () => {
    isMouseLocked = document.pointerLockElement === renderer.domElement;
});

document.addEventListener('mousemove', (event) => {
    if (isMouseLocked) {
        camera.rotation.y -= event.movementX * rotateSpeed;
        camera.rotation.x -= event.movementY * rotateSpeed;
        camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x));
    }
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    // Update camera position based on WASD input
    const direction = new THREE.Vector3();
    const sideDirection = new THREE.Vector3();
    camera.getWorldDirection(direction);
    sideDirection.crossVectors(direction, camera.up);

    if (moveForward) camera.position.addScaledVector(direction, moveSpeed);
    if (moveBackward) camera.position.addScaledVector(direction, -moveSpeed);
    if (moveLeft) camera.position.addScaledVector(sideDirection, -moveSpeed);
    if (moveRight) camera.position.addScaledVector(sideDirection, moveSpeed);

    renderer.render(scene, camera);
}
animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});