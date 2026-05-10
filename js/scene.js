import * as THREE from 'three';

// Global Three.js objects
let scene, camera, renderer;
let canvas;

// Scene configuration
const sceneConfig = {
    backgroundColor: 0x666666,
    fogColor: 0x666666,
    fogNear: 15,
    fogFar: 60
};

/**
 * Initialize the Three.js scene
 */
export function initScene(container) {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(sceneConfig.backgroundColor);
    scene.fog = new THREE.Fog(sceneConfig.fogColor, sceneConfig.fogNear, sceneConfig.fogFar);

    // Create camera
    camera = new THREE.PerspectiveCamera(
        60,
        container.clientWidth / container.clientHeight,
        0.1,
        1000
    );
    camera.position.set(5, 3, 5);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // Create environment map for reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    // Create a simple gradient environment
    const envScene = new THREE.Scene();
    const envGeometry = new THREE.SphereGeometry(500, 32, 32);
    const envMaterial = new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        color: 0x888888
    });
    const envMesh = new THREE.Mesh(envGeometry, envMaterial);
    envScene.add(envMesh);

    // Add gradient colors to environment
    const envCanvas = document.createElement('canvas');
    envCanvas.width = 1024;
    envCanvas.height = 512;
    const ctx = envCanvas.getContext('2d');

    const gradient = ctx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, '#444444');
    gradient.addColorStop(0.4, '#555555');
    gradient.addColorStop(0.6, '#666666');
    gradient.addColorStop(1, '#777777');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);

    const envTexture = new THREE.CanvasTexture(envCanvas);
    envTexture.mapping = THREE.EquirectangularReflectionMapping;

    const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;
    scene.environment = envMap;

    envTexture.dispose();
    pmremGenerator.dispose();

    // Add canvas to container
    canvas = renderer.domElement;
    canvas.id = 'three-canvas';
    container.appendChild(canvas);

    // Add lights
    setupLighting();

    // Add floor
    createFloor();

    // Add garage environment
    createGarage();

    // Handle window resize
    window.addEventListener('resize', () => onWindowResize(container));
}

/**
 * Setup scene lighting
 */
function setupLighting() {
    // Ambient light - soft overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    ambientLight.name = 'ambientLight';
    scene.add(ambientLight);

    // Main directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    // Spot light - focused illumination
    const spotLight = new THREE.SpotLight(0xffffff, 1.0);
    spotLight.position.set(0, 10, 0);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.3;
    spotLight.decay = 1;
    spotLight.distance = 30;
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    spotLight.name = 'spotLight';
    scene.add(spotLight);

    // Add a target for the spot light
    const spotLightTarget = new THREE.Object3D();
    spotLightTarget.position.set(0, 0, 0);
    scene.add(spotLightTarget);
    spotLight.target = spotLightTarget;

    // Hemisphere light for better ambient
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x666666, 0.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    // Additional point lights to illuminate the car from different angles
    const pointLight1 = new THREE.PointLight(0xffffff, 0.4, 20);
    pointLight1.position.set(-5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xffffff, 0.4, 20);
    pointLight2.position.set(5, 5, -5);
    scene.add(pointLight2);

    const pointLight3 = new THREE.PointLight(0xffffff, 0.3, 15);
    pointLight3.position.set(0, 3, 8);
    scene.add(pointLight3);

    // Fill light from below for car underside reflection
    const fillLight = new THREE.PointLight(0xffffff, 0.3, 10);
    fillLight.position.set(0, 1, 0);
    scene.add(fillLight);
}

/**
 * Create floor
 */
function createFloor() {
    const floorGeometry = new THREE.PlaneGeometry(40, 40);

    // Garage floor - concrete texture with slight variation
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.9,
        metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    floor.name = 'floor';
    scene.add(floor);
}

/**
 * Create garage environment
 */
function createGarage() {
    // Create wall texture
    const wallCanvas = document.createElement('canvas');
    wallCanvas.width = 256;
    wallCanvas.height = 256;
    const wallCtx = wallCanvas.getContext('2d');

    // Draw concrete-like texture
    wallCtx.fillStyle = '#5a5a5a';
    wallCtx.fillRect(0, 0, 256, 256);

    // Add noise/texture
    for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const gray = Math.floor(Math.random() * 40) + 70;
        wallCtx.fillStyle = `rgb(${gray}, ${gray}, ${gray})`;
        wallCtx.fillRect(x, y, 2, 2);
    }

    // Add some lines for panels
    wallCtx.strokeStyle = '#4a4a4a';
    wallCtx.lineWidth = 2;
    for (let y = 0; y < 256; y += 64) {
        wallCtx.beginPath();
        wallCtx.moveTo(0, y);
        wallCtx.lineTo(256, y);
        wallCtx.stroke();
    }

    const wallTexture = new THREE.CanvasTexture(wallCanvas);
    wallTexture.wrapS = THREE.RepeatWrapping;
    wallTexture.wrapT = THREE.RepeatWrapping;

    // Garage walls (back and sides)
    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.9,
        metalness: 0.1
    });

    // Back wall - left part (to the left of garage door)
    const backWallLeftGeometry = new THREE.BoxGeometry(7, 8, 0.5);
    const backWallLeft = new THREE.Mesh(backWallLeftGeometry, wallMaterial);
    backWallLeft.position.set(-6.5, 4, -8);
    backWallLeft.receiveShadow = true;
    backWallLeft.name = 'backWall';
    scene.add(backWallLeft);

    // Back wall - right part (to the right of garage door)
    const backWallRight = new THREE.Mesh(backWallLeftGeometry, wallMaterial);
    backWallRight.position.set(6.5, 4, -8);
    backWallRight.receiveShadow = true;
    scene.add(backWallRight);

    // Back wall - top part (above garage door opening)
    const backWallTopGeometry = new THREE.BoxGeometry(6, 4, 0.5);
    const backWallTop = new THREE.Mesh(backWallTopGeometry, wallMaterial);
    backWallTop.position.set(0, 6, -8);
    backWallTop.receiveShadow = true;
    scene.add(backWallTop);

    // Bottom part (below garage door - the door frame)
    const backWallBottomGeometry = new THREE.BoxGeometry(6, 0.1, 0.5);
    const backWallBottom = new THREE.Mesh(backWallBottomGeometry, wallMaterial);
    backWallBottom.position.set(0, 0.05, -8);
    backWallBottom.receiveShadow = true;
    scene.add(backWallBottom);

    // Left wall
    const leftWallGeometry = new THREE.BoxGeometry(0.5, 8, 16);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.position.set(-10, 4, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    rightWall.position.set(10, 4, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Ceiling
    const ceilingGeometry = new THREE.BoxGeometry(20, 0.3, 16);
    const ceiling = new THREE.Mesh(ceilingGeometry, wallMaterial);
    ceiling.position.set(0, 8, 0);
    ceiling.receiveShadow = true;
    scene.add(ceiling);

    // Garage door (movable)
    createGarageDoor();
}

/**
 * Create garage door
 */
function createGarageDoor() {
    const doorGroup = new THREE.Group();
    doorGroup.name = 'garageDoor';

    // Door panels
    const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2c2c2c,
        roughness: 0.6,
        metalness: 0.4
    });

    const panelWidth = 6;
    const panelHeight = 4;
    const panelDepth = 0.2;

    // Create single panel matching the door opening
    const panelGeometry = new THREE.BoxGeometry(panelWidth, panelHeight, panelDepth);
    const panel = new THREE.Mesh(panelGeometry, doorMaterial);
    panel.position.set(0, panelHeight / 2, 0);
    panel.castShadow = true;
    panel.receiveShadow = true;
    doorGroup.add(panel);

    // Add horizontal bars for detail
    const barMaterial = new THREE.MeshStandardMaterial({
        color: 0x888888,
        roughness: 0.3,
        metalness: 0.7
    });

    const barGeometry = new THREE.BoxGeometry(panelWidth + 0.2, 0.15, panelDepth + 0.1);
    const bar = new THREE.Mesh(barGeometry, barMaterial);
    bar.position.set(0, panelHeight / 2, 0);
    doorGroup.add(bar);

    // Position the door - place it to cover the opening when closed
    doorGroup.position.set(0, 0, -7.75);
    scene.add(doorGroup);
}

/**
 * Handle window resize
 */
function onWindowResize(container) {
    if (!camera || !renderer) return;

    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

/**
 * Get the scene
 */
export function getScene() {
    return scene;
}

/**
 * Get the camera
 */
export function getCamera() {
    return camera;
}

/**
 * Get the renderer
 */
export function getRenderer() {
    return renderer;
}

/**
 * Get the canvas element
 */
export function getCanvas() {
    return canvas;
}
