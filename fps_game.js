// Set up the scene, camera, and renderer
let scene, camera, renderer, platform;
const nexuses = [];
const nexusCount = 7;
const nodeCount = 400;

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    createPlatform();
    createNexuses();

    // Position camera
    camera.position.set(0, 5, 10);
    camera.lookAt(scene.position);

    // Add a debug cube
    const debugGeometry = new THREE.BoxGeometry(1, 1, 1);
    const debugMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const debugCube = new THREE.Mesh(debugGeometry, debugMaterial);
    scene.add(debugCube);

    animate();
}

function createPlatform() {
    const geometry = new THREE.BoxGeometry(20, 0.1, 20);
    const texture = new THREE.TextureLoader().load('f8c98706b7f2db9449662a4339d6269d.gif', 
        () => {
            console.log('Texture loaded successfully');
        },
        undefined,
        (error) => {
            console.error('Error loading texture:', error);
        }
    );
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 1);

    const material = new THREE.MeshBasicMaterial({ map: texture });
    platform = new THREE.Mesh(geometry, material);
    platform.position.y = -2;
    scene.add(platform);
    console.log('Platform added to scene');
}

function createNexuses() {
    // ... existing nexus creation code ...
}

function animate() {
    requestAnimationFrame(animate);

    // ... existing animation code ...

    renderer.render(scene, camera);
}

// Call init to start the scene
init();

// Add window resize handler
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Add a key press handler to move the camera
document.addEventListener('keydown', onDocumentKeyDown, false);

function onDocumentKeyDown(event) {
    const keyCode = event.which;
    if (keyCode == 87) { // W key
        camera.position.z -= 0.1;
    } else if (keyCode == 83) { // S key
        camera.position.z += 0.1;
    } else if (keyCode == 65) { // A key
        camera.position.x -= 0.1;
    } else if (keyCode == 68) { // D key
        camera.position.x += 0.1;
    }
}

console.log('Script loaded and init called');