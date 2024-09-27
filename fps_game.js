// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load the background texture
const textureLoader = new THREE.TextureLoader();
const backgroundTexture = textureLoader.load('lacanian_desire_background.jpg', () => {
    const backgroundMesh = new THREE.Mesh(
        new THREE.SphereGeometry(400, 60, 40), // Reduced size from 500 to 400
        new THREE.MeshBasicMaterial({ 
            map: backgroundTexture, 
            side: THREE.BackSide, 
            transparent: true, 
            opacity: 0.8 
        })
    );
    backgroundMesh.position.set(0, 50, 0); // Moved the sphere up by 50 units
    scene.add(backgroundMesh);
}, undefined, (error) => {
    console.error('An error occurred while loading the background texture:', error);
});

// Set up camera position
camera.position.set(0, 1.6, 0);

// Create a simple floor
const floorGeometry = new THREE.PlaneGeometry(20, 20);
const floorMaterial = new THREE.MeshBasicMaterial({ color: 0xcccccc, transparent: true, opacity: 0.5 });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.5;
scene.add(floor);

// Create point cloud nexuses
const nexuses = [];
const nexusCount = 7;
const nodeCount = 400; // Increased from 60 to 400

let backgroundMusic;
let musicPlaying = false;

function createMusicButton() {
    const button = document.createElement('button');
    button.id = 'musicButton';
    button.textContent = 'Oor zo iteraties een huisje leeg hoe klinkt dat?';
    button.style.position = 'fixed';
    button.style.top = '50%';
    button.style.left = '50%';
    button.style.transform = 'translate(-50%, -50%)';
    button.style.zIndex = '9999';
    button.style.padding = '15px 30px';
    button.style.fontSize = '18px';
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
    
    // Add event listener for Escape key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            toggleMusic();
        }
    });

    // Keep click functionality as well
    musicButton.addEventListener('click', toggleMusic);
}

function init() {
    // Existing initialization code...
    
    initializeMusic();
    
    // Rest of the initialization code...
}

// Ensure the DOM is fully loaded before running the init function
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

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

    // Update nexus positions and interactions
    nexuses.forEach((nexus, index) => {
        // Move nexus
        nexus.position.add(nexus.userData.velocity);

        // Bounce off boundaries
        if (Math.abs(nexus.position.x) > 10 || Math.abs(nexus.position.y) > 5 || Math.abs(nexus.position.z) > 10) {
            nexus.userData.velocity.multiplyScalar(-1);
        }

        // Simulate face-like movements
        const time = Date.now() * 0.001;
        const positions = nexus.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] += Math.sin(time + i) * 0.002;
            positions[i + 1] += Math.cos(time + i) * 0.002;
            positions[i + 2] += Math.sin(time + i + Math.PI) * 0.002;
        }
        nexus.geometry.attributes.position.needsUpdate = true;

        // Interact with player
        const distanceToPlayer = nexus.position.distanceTo(camera.position);
        if (distanceToPlayer < 2) {
            const repelForce = camera.position.clone().sub(nexus.position).normalize().multiplyScalar(0.01);
            nexus.userData.velocity.sub(repelForce);
        }

        // Interact with other nexuses
        nexuses.forEach((otherNexus, otherIndex) => {
            if (index !== otherIndex) {
                const distance = nexus.position.distanceTo(otherNexus.position);
                if (distance < 2) {
                    const attractForce = otherNexus.position.clone().sub(nexus.position).normalize().multiplyScalar(0.001);
                    nexus.userData.velocity.add(attractForce);
                }
            }
        });

        // Apply some drag to prevent excessive speeds
        nexus.userData.velocity.multiplyScalar(0.99);
    });

    renderer.render(scene, camera);
}
animate();

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Make sure to call init() at the end of the file if it's not already being called
init();