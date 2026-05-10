import * as THREE from 'three';
import { getScene } from './scene.js';

// Model management
let currentModel = null;
let currentCarId = 1;
let modelGroup = null;

// Car configurations
const carConfigs = {
    1: {
        name: 'Car 1 - Standard',
        color: 0xe74c3c,
        position: { x: 0, y: 0, z: 0 },
        description: 'Standard display model'
    },
    2: {
        name: 'Car 2 - Blue',
        color: 0x3498db,
        position: { x: 0, y: 0, z: 0 },
        description: 'Color variation'
    },
    3: {
        name: 'Car 3 - Sport',
        color: 0x2ecc71,
        position: { x: 0, y: 0, z: 0 },
        description: 'Sport model with animations'
    }
};

// Materials storage for color changes
const carMaterials = {
    1: { body: null, glass: null, wheel: null, light: null },
    2: { body: null, glass: null, wheel: null, light: null },
    3: { body: null, glass: null, wheel: null, light: null }
};

/**
 * Load a car model
 */
export async function loadModel(carId) {
    const scene = getScene();
    if (!scene) {
        console.error('Scene not initialized');
        return;
    }

    // Remove existing model
    if (modelGroup) {
        scene.remove(modelGroup);
        disposeObject(modelGroup);
    }

    // Try to load GLB model first
    const modelPath = `blend/car${carId}.glb`;

    try {
        console.log(`Attempting to load: ${modelPath}`);
        modelGroup = await loadGLBModel(modelPath, carId);
        scene.add(modelGroup);
        console.log(`Loaded GLB model: car${carId}.glb`);
    } catch (error) {
        // Fall back to placeholder
        console.warn(`GLB load failed: ${error.message}`);
        console.log(`Using placeholder car for car ${carId}`);
        modelGroup = createPlaceholderCar(carId);
        scene.add(modelGroup);
    }

    currentModel = modelGroup;
    currentCarId = carId;
    
    // Apply saved color if exists
    if (carMaterials[carId].body) {
        carMaterials[carId].body.color.setHex(carConfigs[carId].color);
    }

    // Debug: Log all stored materials
    console.log(`=== Built-in Model ${carId} Materials ===`);
    console.log('Body material:', carMaterials[carId].body);
    console.log('Glass material:', carMaterials[carId].glass);
    console.log('Wheel material:', carMaterials[carId].wheel);
    console.log('Light material:', carMaterials[carId].light);
    
    console.log(`Loaded model: ${carConfigs[carId].name}`);
    return modelGroup;
}

/**
 * Create a placeholder low-poly car
 */
function createPlaceholderCar(carId) {
    const group = new THREE.Group();
    const config = carConfigs[carId];

    // Create materials
    const bodyMaterial = new THREE.MeshStandardMaterial({
        color: config.color,
        roughness: 0.3,
        metalness: 0.8
    });

    const glassMaterial = new THREE.MeshStandardMaterial({
        color: 0x88ccff,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.6
    });

    const wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.9,
        metalness: 0.1
    });

    const lightMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffcc,
        emissive: 0xffffcc,
        emissiveIntensity: 1.0
    });

    // Store materials
    carMaterials[carId] = {
        body: bodyMaterial,
        glass: glassMaterial,
        wheel: wheelMaterial,
        light: lightMaterial
    };

    // Main body
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 1.2), bodyMaterial);
    body.position.y = 0.4;
    body.castShadow = true;
    body.receiveShadow = true;
    body.name = 'body';
    group.add(body);

    // Cabin
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 1.1), bodyMaterial);
    cabin.position.set(-0.2, 0.9, 0);
    cabin.castShadow = true;
    cabin.receiveShadow = true;
    cabin.name = 'body';
    group.add(cabin);

    // Windows
    const windows = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.35, 1.0), glassMaterial);
    windows.position.set(-0.2, 0.9, 0);
    windows.name = 'glass';
    group.add(windows);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.2, 16);
    const wheelPositions = [
        { x: 0.8, y: 0.15, z: 0.6 },
        { x: 0.8, y: 0.15, z: -0.6 },
        { x: -0.8, y: 0.15, z: 0.6 },
        { x: -0.8, y: 0.15, z: -0.6 }
    ];

    wheelPositions.forEach((pos, i) => {
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
        wheel.rotation.x = Math.PI / 2;
        wheel.position.set(pos.x, pos.y, pos.z);
        wheel.castShadow = true;
        wheel.name = 'wheel';
        group.add(wheel);
    });

    // Headlights
    const headlightGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.25);
    const headlightPositions = [
        { x: 1.25, y: 0.4, z: 0.4 },
        { x: 1.25, y: 0.4, z: -0.4 }
    ];

    headlightPositions.forEach(pos => {
        const headlight = new THREE.Mesh(headlightGeometry, lightMaterial);
        headlight.position.set(pos.x, pos.y, pos.z);
        headlight.name = 'light';
        group.add(headlight);
    });

    // Taillights
    const taillightMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        emissive: 0xff0000,
        emissiveIntensity: 0.5
    });

    headlightPositions.forEach(pos => {
        const taillight = new THREE.Mesh(headlightGeometry, taillightMaterial);
        taillight.position.set(-pos.x, pos.y, pos.z);
        taillight.name = 'light';
        group.add(taillight);
    });

    group.name = `car${carId}`;
    return group;
}

/**
 * Switch to a different car model
 */
export async function switchModel(carId) {
    if (carId === currentCarId) {
        console.log('Already displaying this car');
        return;
    }
    await loadModel(carId);
}

/**
 * Get the current model
 */
export function getCurrentModel() {
    return currentModel;
}

/**
 * Get current car ID
 */
export function getCurrentCarId() {
    return currentCarId;
}

/**
 * Set wireframe mode
 */
export function setWireframe(enabled) {
    if (!modelGroup) return;

    modelGroup.traverse((child) => {
        if (child.isMesh && child.material) {
            child.material.wireframe = enabled;
        }
    });

    console.log(`Wireframe mode: ${enabled ? 'ON' : 'OFF'}`);
}

/**
 * Dispose of an object and its children
 */
function disposeObject(object) {
    if (!object) return;

    object.traverse((child) => {
        if (child.isMesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
    });
}

/**
 * Classify mesh part type - FIRST check by name, then by material properties
 */
function getMeshPartType(child) {
    if (!child.isMesh || !child.material) return 'body';
    
    const name = child.name.toLowerCase();
    const mat = child.material;
    
    // STEP 1: Check by NAME first (most reliable)
    
    // Glass
    if (name.includes('glass') || name.includes('window') || 
        name.includes('glas') || name.includes('scheibe') ||
        name.includes('windshield') || name.includes('windscreen')) {
        return 'glass';
    }
    
    // Light
    if (name.includes('light') || name.includes('lamp') || 
        name.includes('leuchte') || name.includes('scheinwerfer') ||
        name.includes('headlight') || name.includes('taillight') ||
        name.includes('headlamp') || name.includes('taillamp')) {
        return 'light';
    }
    
    // Wheel
    if (name.includes('wheel') || name.includes('tire') || 
        name.includes('rim') || name.includes('rad') || name.includes('reifen') ||
        name.includes('hubcap')) {
        return 'wheel';
    }
    
    // STEP 2: Material properties as fallback
    
    // Glass - transparent with opacity < 0.8
    if (mat.transparent === true && mat.opacity !== undefined && mat.opacity < 0.8) {
        return 'glass';
    }
    
    // Light - HIGH emissive (>0.8) AND opaque (opacity >= 0.8 or not transparent)
    // This prevents transparent emissive meshes from being classified as light
    const isOpaque = !mat.transparent || (mat.opacity !== undefined && mat.opacity >= 0.8);
    if (isOpaque && mat.emissive && (mat.emissive.r > 0.8 && mat.emissive.g > 0.8 && mat.emissive.b > 0.8)) {
        return 'light';
    }
    
    // Wheel - very high metalness (>=0.9) AND low roughness (<0.5)
    if (mat.metalness !== undefined && mat.metalness >= 0.9 && mat.roughness !== undefined && mat.roughness < 0.5) {
        return 'wheel';
    }
    
    // Default: Body (most meshes should be body)
    return 'body';
}

/**
 * Load a GLB/GLTF model
 */
export async function loadGLBModel(path, carId) {
    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();

    return new Promise((resolve, reject) => {
        loader.load(path, (gltf) => {
            const model = gltf.scene;

            // First pass: collect all meshes and their properties
            const allMeshes = [];
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    allMeshes.push(child);
                }
            });

            console.log(`=== Model ${carId} - Total meshes: ${allMeshes.length} ===`);
            allMeshes.forEach((mesh, idx) => {
                const mat = mesh.material;
                console.log(`  [${idx}] "${mesh.name}" | metalness: ${mat.metalness} | roughness: ${mat.roughness} | transparent: ${mat.transparent} | opacity: ${mat.opacity} | emissive: ${mat.emissive ? `(${mat.emissive.r.toFixed(2)}, ${mat.emissive.g.toFixed(2)}, ${mat.emissive.b.toFixed(2)})` : 'none'}`);
            });

            // Create SHARED materials (one per type)
            const bodyMaterial = new THREE.MeshStandardMaterial({
                color: carConfigs[carId].color,
                metalness: 0.9,
                roughness: 0.2
            });

            const glassMaterial = new THREE.MeshStandardMaterial({
                color: 0x88ccff,
                metalness: 0.1,
                roughness: 0.1,
                transparent: true,
                opacity: 0.6
            });

            const wheelMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.8,
                metalness: 0.3
            });

            const lightMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffcc,
                emissive: 0xffffcc,
                emissiveIntensity: 1.0
            });

            // Reset materials for this car
            carMaterials[carId] = {
                body: bodyMaterial,
                glass: glassMaterial,
                wheel: wheelMaterial,
                light: lightMaterial
            };

            // Second pass: classify and assign materials
            const counts = { body: 0, glass: 0, wheel: 0, light: 0 };
            
            allMeshes.forEach((child) => {
                const partType = getMeshPartType(child);
                counts[partType]++;
                
                switch (partType) {
                    case 'glass':
                        child.material = glassMaterial;
                        break;
                    case 'light':
                        child.material = lightMaterial;
                        break;
                    case 'wheel':
                        child.material = wheelMaterial;
                        break;
                    default:
                        child.material = bodyMaterial;
                }
            });

            console.log('Classification result:', counts);
            console.log('Materials stored:', carMaterials[carId]);
            
            // Verify materials are actually applied
            let bodyMeshes = 0, glassMeshes = 0, wheelMeshes = 0, lightMeshes = 0;
            model.traverse((child) => {
                if (child.isMesh) {
                    if (child.material === bodyMaterial) bodyMeshes++;
                    if (child.material === glassMaterial) glassMeshes++;
                    if (child.material === wheelMaterial) wheelMeshes++;
                    if (child.material === lightMaterial) lightMeshes++;
                }
            });
            console.log(`Verification - Body meshes: ${bodyMeshes}, Glass: ${glassMeshes}, Wheel: ${wheelMeshes}, Light: ${lightMeshes}`);

            // Center model and place on ground
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            
            model.position.x = -center.x;
            model.position.z = -center.z;
            model.position.y = -box.min.y;

            model.name = `car${carId}`;
            resolve(model);
        }, undefined, (error) => {
            console.error('Error loading model:', error);
            reject(error);
        });
    });
}

/**
 * Change car body color
 */
export function changeCarColor(carId, color) {
    const mat = carMaterials[carId]?.body;
    if (mat) {
        mat.color.setHex(color);
        mat.needsUpdate = true;
        console.log(`[models.js] Body color changed to #${color.toString(16)}`, mat);
    } else {
        console.warn(`[models.js] No body material for car ${carId}`);
    }
}

/**
 * Change car light color
 */
export function changeLightColor(carId, color) {
    const mat = carMaterials[carId]?.light;
    if (mat) {
        mat.color.setHex(color);
        mat.emissive.setHex(color);
        mat.needsUpdate = true;
        console.log(`[models.js] Light color changed to #${color.toString(16)}`, mat);
    } else {
        console.warn(`[models.js] No light material for car ${carId}`);
    }
}

/**
 * Change car light intensity
 */
export function changeLightIntensity(carId, intensity) {
    const mat = carMaterials[carId]?.light;
    if (mat && mat.emissiveIntensity !== undefined) {
        mat.emissiveIntensity = intensity;
        mat.needsUpdate = true;
        console.log(`[models.js] Light intensity changed to ${intensity}`);
    } else {
        console.warn(`[models.js] No light material or no emissiveIntensity for car ${carId}`);
    }
}

/**
 * Change glass color
 */
export function changeGlassColor(carId, color) {
    const mat = carMaterials[carId]?.glass;
    if (mat) {
        mat.color.setHex(color);
        mat.needsUpdate = true;
        console.log(`[models.js] Glass color changed to #${color.toString(16)}`, mat);
    } else {
        console.warn(`[models.js] No glass material for car ${carId}`);
    }
}

/**
 * Change wheel color
 */
export function changeWheelColor(carId, color) {
    const mat = carMaterials[carId]?.wheel;
    if (mat) {
        mat.color.setHex(color);
        mat.needsUpdate = true;
        console.log(`[models.js] Wheel color changed to #${color.toString(16)}`, mat);
    } else {
        console.warn(`[models.js] No wheel material for car ${carId}`);
    }
}

/**
 * Get car configuration
 */
export function getCarConfig(carId) {
    return carConfigs[carId];
}
