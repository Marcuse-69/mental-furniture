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
const nodeCount = 60;

function createNexus() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(nodeCount * 3);
    const colors = new Float32Array(nodeCount * 3);

    for (let i = 0; i < nodeCount * 3; i += 3) {
        positions[i] = Math.random() * 2 - 1;
        positions[i + 1] = Math.random() * 2 - 1;
        positions[i + 2] = Math.random() * 2 - 1;

        colors[i] = Math.random();
        colors[i + 1] = Math.random();
        colors[i + 2] = Math.random();
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({ size: 0.05, vertexColors: true });
    const nexus = new THREE.Points(geometry, material);
    nexus.position.set(Math.random() * 10 - 5, Math.random() * 4 + 1, Math.random() * 10 - 5);
    nexus.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02
    );
    scene.add(nexus);
    return nexus;
}

for (let i = 0; i < nexusCount; i++) {
    nexuses.push(createNexus());
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