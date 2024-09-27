const canvas = document.getElementById('game-canvas');
const scoreElement = document.getElementById('score-value');

// Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(0, 1, 0);
scene.add(directionalLight);

// Player
const player = {
    x: 0,
    y: 1.6, // Eye level
    z: 5,
    rotationY: 0,
    speed: 0.1
};

// Weapon
const gunGeometry = new THREE.BoxGeometry(0.2, 0.2, 1);
const gunMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
const gun = new THREE.Mesh(gunGeometry, gunMaterial);
gun.position.set(0.5, -0.3, -0.5);
camera.add(gun);
scene.add(camera);

// Enemies
const enemies = [];
function createEnemy(x, z) {
    const enemyGeometry = new THREE.SphereGeometry(0.5);
    const enemyMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemy.position.set(x, 1, z);
    scene.add(enemy);
    enemies.push(enemy);
}

// Create some enemies
createEnemy(5, 0);
createEnemy(-5, -5);
createEnemy(0, 10);

// Load background texture
const textureLoader = new THREE.TextureLoader();
textureLoader.load('lacanian_desire_background.jpg', 
    (texture) => {
        console.log('Background texture loaded successfully');
        scene.background = texture;
        // Fix background orientation
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        texture.center.set(0.5, 0.5);
        texture.rotation = 0; // Remove rotation to fix upside-down issue
    },
    undefined,
    (error) => {
        console.error('Error loading background texture:', error);
        scene.background = new THREE.Color(0x000000);
    }
);

// Load 3D model (small man)
const loader = new THREE.OBJLoader();
loader.load('70bc2bd4108b_a_small_man_kneels_.obj', 
    (object) => {
        console.log('3D model loaded successfully');
        object.position.set(0, 0, 0);
        object.scale.set(0.1, 0.1, 0.1);
        scene.add(object);
    }, 
    (xhr) => {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    (error) => {
        console.error('An error occurred while loading the 3D model:', error);
    }
);

// Additional 3D objects
function createTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2);
    const leavesGeometry = new THREE.ConeGeometry(1, 2, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const leavesMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 });
    
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    
    trunk.position.set(x, 1, z);
    leaves.position.set(x, 3, z);
    
    scene.add(trunk);
    scene.add(leaves);
}

// Create some trees
createTree(8, 8);
createTree(-8, -8);
createTree(12, -12);

// Map (we'll use this for collision detection)
const map = [
    [1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,0,1],
    [1,0,1,0,0,0,0,1],
    [1,0,0,0,0,0,0,1],
    [1,0,0,0,0,1,0,1],
    [1,0,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,1]
];

function createWalls() {
    const wallGeometry = new THREE.BoxGeometry(1, 1, 1);
    const wallMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });

    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            if (map[y][x] === 1) {
                const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                wall.position.set(x - map[y].length / 2, 0.5, y - map.length / 2);
                scene.add(wall);
            }
        }
    }
}

createWalls();

// Update camera movement
let mouseX = 0;
let mouseY = 0;

document.addEventListener('mousemove', (event) => {
    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    
    player.rotationY -= movementX * 0.002;
    camera.rotation.x = Math.max(Math.min(camera.rotation.x - movementY * 0.002, Math.PI / 2), -Math.PI / 2);
});

function updateCamera() {
    camera.position.x = player.x;
    camera.position.y = player.y;
    camera.position.z = player.z;
    camera.rotation.y = player.rotationY;
}

function updateEnemies() {
    enemies.forEach(enemy => {
        const dx = player.x - enemy.position.x;
        const dz = player.z - enemy.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance < 10) {
            enemy.position.x += dx * 0.01;
            enemy.position.z += dz * 0.01;
        }
    });
}

function gameLoop() {
    updateCamera();
    updateEnemies();
    if (scene.background && scene.background.offset) {
        scene.background.offset.x += 0.0005;  // Adjust for desired speed
    }
    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', (event) => {
    const moveSpeed = player.speed;
    const forward = new THREE.Vector3(
        -Math.sin(player.rotationY),
        0,
        -Math.cos(player.rotationY)
    );
    const right = new THREE.Vector3(
        Math.cos(player.rotationY),
        0,
        -Math.sin(player.rotationY)
    );

    switch (event.key.toLowerCase()) {
        case 'w':
            player.x += forward.x * moveSpeed;
            player.z += forward.z * moveSpeed;
            break;
        case 's':
            player.x -= forward.x * moveSpeed;
            player.z -= forward.z * moveSpeed;
            break;
        case 'a':
            player.x -= right.x * moveSpeed;
            player.z -= right.z * moveSpeed;
            break;
        case 'd':
            player.x += right.x * moveSpeed;
            player.z += right.z * moveSpeed;
            break;
    }
});

gameLoop();

// Add this line at the end of the file
console.log('Scene children:', scene.children);