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
    button.style.padding = '10px 20px'; // Reduced padding
    button.style.fontSize = '14px'; // Reduced font size
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

    // Add event listener for clicking anywhere on the screen
    document.addEventListener('click', (event) => {
        // Check if the click is not on the music button
        if (event.target !== musicButton) {
            toggleMusic();
        }
    });

    // Keep click functionality for the button as well
    musicButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent the document click event from firing
        toggleMusic();
    });
}

let camera, scene, renderer, controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
let prevTime = performance.now();
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let joystick;

function init() {
    // Existing initialization code...
    
    initializeMusic();
    initializeMobileControls();
    
    // Add automatic camera movement
    setInterval(autoCameraMovement, 50);
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

        // Touch-based camera rotation
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
    camera.rotation.y += 0.0005; // Slow rotation around Y-axis
    camera.position.y += Math.sin(Date.now() * 0.001) * 0.01; // Slight up and down movement
}

function animate() {
    requestAnimationFrame(animate);

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

    renderer.render(scene, camera);
}

// Handle window resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Make sure to call init() at the end of the file if it's not already being called
init();