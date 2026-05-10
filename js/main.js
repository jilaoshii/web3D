/**
 * Main Entry Point
 * 3D Garage Showcase Application
 */

// Import modules
import * as THREE from 'three';
import { initScene, getScene, getCamera, getRenderer } from './scene.js';
import { loadModel, switchModel, getCurrentModel, setWireframe, changeCarColor, changeLightColor, changeLightIntensity, changeGlassColor, changeWheelColor } from './models.js';
import { initControls, resetCamera } from './controls.js';
import { initAnimations, playCarExitAnimation, playGarageDoorAnimation, stopAnimations, setAnimationCompleteCallback } from './animations.js';

// Global state
const AppState = {
    currentCar: 1,
    isWireframe: false,
    isAnimating: false,
    ambientLightIntensity: 0.5,
    spotLightIntensity: 1.0,
    lightIntensity: 1.0,
    lightColor: 0xffffcc,
    currentCameraView: 'default',
    currentCarColor: 0xe74c3c
};

// Store references for color changes
let currentModelMaterials = {
    body: null,
    glass: null,
    wheel: null,
    light: null
};

// Store the current custom model directly
let customModel = null;

// Initialize application
async function initApp() {
    console.log('Initializing 3D Garage Showcase...');

    // Get DOM elements
    const canvasContainer = document.getElementById('canvas-container');
    if (!canvasContainer) {
        console.error('Canvas container not found!');
        return;
    }

    // Initialize Three.js scene
    initScene(canvasContainer);

    // Initialize controls
    initControls();

    // Initialize animations
    initAnimations();

    // Set animation complete callback to sync state
    setAnimationCompleteCallback(() => {
        AppState.isAnimating = false;
    });

    // Load initial model
    try {
        await loadModel(1);
        updateStatusDisplay();
        updateLighting();
        updateMaterialReferences();
        changeCarColor(1, AppState.currentCarColor);
        changeLightColor(1, AppState.lightColor);
        changeLightIntensity(1, AppState.lightIntensity);
        changeGlassColor(1, parseInt('88ccff', 16));
        changeWheelColor(1, parseInt('333333', 16));
        updateColorControlsVisibility(1);
        console.log('Application initialized successfully!');
    } catch (error) {
        console.error('Failed to load initial model:', error);
    }

    // Setup event listeners
    setupEventListeners();

    // Start render loop
    animate();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    const scene = getScene();
    const camera = getCamera();
    const renderer = getRenderer();

    if (scene && camera && renderer) {
        renderer.render(scene, camera);
    }
}

// Update material references from the current model
function updateMaterialReferences() {
    const model = getCurrentModel();
    if (!model) return;

    currentModelMaterials = {
        body: null,
        glass: null,
        wheel: null,
        light: null
    };

    model.traverse((child) => {
        if (child.isMesh) {
            const name = child.name.toLowerCase();
            
            // Skip if already has a reference
            if (currentModelMaterials.body && currentModelMaterials.glass && 
                currentModelMaterials.wheel && currentModelMaterials.light) return;

            // Glass
            if (!currentModelMaterials.glass && (
                name.includes('glass') || name.includes('window') || 
                name.includes('glas') || name.includes('fenster')
            )) {
                currentModelMaterials.glass = child.material;
            }
            // Lights
            else if (!currentModelMaterials.light && (
                name.includes('light') || name.includes('lamp') || 
                name.includes('leuchte') || name.includes('scheinwerfer')
            )) {
                currentModelMaterials.light = child.material;
            }
            // Wheels
            else if (!currentModelMaterials.wheel && (
                name.includes('wheel') || name.includes('tire') || 
                name.includes('rim') || name.includes('rad')
            )) {
                currentModelMaterials.wheel = child.material;
            }
            // Body (default)
            else if (!currentModelMaterials.body) {
                currentModelMaterials.body = child.material;
            }
        }
    });

    console.log('Material references updated:', currentModelMaterials);
}

// Setup all event listeners
function setupEventListeners() {
    // Model selection buttons
    document.querySelectorAll('.car-select-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            // Clear active state from all car buttons
            document.querySelectorAll('.car-select-btn').forEach(b => {
                b.classList.remove('active');
            });
            // Set active state on clicked button
            e.target.classList.add('active');
            
            const carId = parseInt(e.target.dataset.car);
            
            // Remove custom model if exists
            if (customModel) {
                const scene = getScene();
                if (scene) {
                    scene.remove(customModel);
                    console.log('Removed custom model before switching');
                }
                customModel = null;
            }
            
            await switchModel(carId);
            AppState.currentCar = carId;
            updateStatusDisplay();
            updateMaterialReferences();
            // Apply current color settings to new car
            changeCarColor(carId, AppState.currentCarColor);
            changeGlassColor(carId, parseInt(document.getElementById('glass-color').value.replace('#', ''), 16));
            changeWheelColor(carId, parseInt(document.getElementById('wheel-color').value.replace('#', ''), 16));
            changeLightColor(carId, AppState.lightColor);
            changeLightIntensity(carId, AppState.lightIntensity);
            updateColorControlsVisibility(carId);
        });
    });

    // Model upload handler
    const modelUpload = document.getElementById('model-upload');
    if (modelUpload) {
        modelUpload.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (file) {
                const fileName = file.name.toLowerCase();
                
                // Check file extension
                if (fileName.endsWith('.blend')) {
                    alert('For .blend files, please export to .glb or .gltf format first using Blender.\n\nFile -> Export -> glTF 2.0 (.glb/.gltf)');
                    e.target.value = '';
                    return;
                }
                
                console.log('Loading custom model:', file.name);
                const url = URL.createObjectURL(file);
                const scene = getScene();
                
                // Remove ALL existing models from scene
                const existingBuiltinModel = getCurrentModel();
                if (existingBuiltinModel) {
                    scene.remove(existingBuiltinModel);
                    console.log('Removed existing built-in model');
                }
                if (customModel) {
                    scene.remove(customModel);
                    console.log('Removed existing custom model');
                    customModel = null;
                }
                
                try {
                    const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
                    const loader = new GLTFLoader();
                    
                    loader.load(url, (gltf) => {
                        const model = gltf.scene;
                        
                        // Apply shadows
                        model.traverse((child) => {
                            if (child.isMesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                        
                        // Center and position on ground
                        const box = new THREE.Box3().setFromObject(model);
                        const center = box.getCenter(new THREE.Vector3());
                        model.position.x = -center.x;
                        model.position.z = -center.z;
                        model.position.y = -box.min.y;
                        
                        scene.add(model);
                        customModel = model;
                        console.log('Custom model added to scene');
                        
                        // Update material references using unified classification
                        currentModelMaterials = { body: null, glass: null, wheel: null, light: null };
                        
                        model.traverse((child) => {
                            if (child.isMesh && child.material) {
                                const partType = getMeshPartType(child);
                                if (partType === 'glass' && !currentModelMaterials.glass) {
                                    currentModelMaterials.glass = child.material;
                                } else if (partType === 'light' && !currentModelMaterials.light) {
                                    currentModelMaterials.light = child.material;
                                } else if (partType === 'wheel' && !currentModelMaterials.wheel) {
                                    currentModelMaterials.wheel = child.material;
                                } else if (partType === 'body' && !currentModelMaterials.body) {
                                    currentModelMaterials.body = child.material;
                                }
                            }
                        });
                        
                        console.log('Custom model loaded:', file.name);
                        console.log('Materials found:', currentModelMaterials);
                        
                        // Debug: show all mesh classifications
                        const meshTypes = { body: 0, glass: 0, wheel: 0, light: 0 };
                        model.traverse((child) => {
                            if (child.isMesh) {
                                const type = getMeshPartType(child);
                                meshTypes[type]++;
                                const mat = child.material;
                                console.log(`  ${child.name}: ${type} (metalness=${mat.metalness}, transparent=${mat.transparent}, emissive=${mat.emissive ? mat.emissive.r : 0})`);
                            }
                        });
                        console.log('Mesh counts:', meshTypes);
                    }, undefined, (error) => {
                        console.error('Error loading model:', error);
                    });
                } catch (error) {
                    console.error('Failed to load model:', error);
                }
            }
        });
    }

    // Wireframe toggle
    const wireframeBtn = document.getElementById('wireframe-btn');
    if (wireframeBtn) {
        wireframeBtn.addEventListener('click', () => {
            AppState.isWireframe = !AppState.isWireframe;
            setWireframe(AppState.isWireframe);
            wireframeBtn.classList.toggle('active');
        });
    }

    // Lighting controls
    const ambientSlider = document.getElementById('ambient-light');
    if (ambientSlider) {
        ambientSlider.addEventListener('input', (e) => {
            AppState.ambientLightIntensity = parseFloat(e.target.value);
            updateLighting();
        });
    }

    const spotSlider = document.getElementById('spot-light');
    if (spotSlider) {
        spotSlider.addEventListener('input', (e) => {
            AppState.spotLightIntensity = parseFloat(e.target.value);
            updateLighting();
        });
    }

    // Camera view buttons
    document.querySelectorAll('.camera-view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            resetCamera(view);
            AppState.currentCameraView = view;
            updateStatusDisplay();
            updateActiveButton(e.target);
        });
    });

    // Garage door button
    const garageDoorBtn = document.getElementById('garage-door-btn');
    if (garageDoorBtn) {
        garageDoorBtn.addEventListener('click', () => {
            if (!AppState.isAnimating) {
                AppState.isAnimating = true;
                playGarageDoorAnimation(() => {
                    AppState.isAnimating = false;
                });
            }
        });
    }

    // Car exit button
    const carExitBtn = document.getElementById('car-exit-btn');
    if (carExitBtn) {
        carExitBtn.addEventListener('click', () => {
            if (!AppState.isAnimating) {
                AppState.isAnimating = true;
                playCarExitAnimation(() => {
                    AppState.isAnimating = false;
                });
            }
        });
    }

    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            stopAnimations();
            AppState.isAnimating = false;
            resetCamera('default');
            AppState.currentCameraView = 'default';
            updateStatusDisplay();
        });
    }

    // Unified function to classify mesh part type
    // STEP 1: Check by NAME first (most reliable)
    // STEP 2: Use MATERIAL PROPERTIES as fallback
    function getMeshPartType(mesh) {
        if (!mesh.isMesh || !mesh.material) return 'body';
        
        const name = mesh.name.toLowerCase();
        const mat = mesh.material;
        
        // STEP 1: Check by NAME first
        if (name.includes('glass') || name.includes('window') || 
            name.includes('glas') || name.includes('scheibe') ||
            name.includes('windshield') || name.includes('windscreen')) {
            return 'glass';
        }
        if (name.includes('light') || name.includes('lamp') || 
            name.includes('leuchte') || name.includes('scheinwerfer') ||
            name.includes('headlight') || name.includes('taillight') ||
            name.includes('headlamp') || name.includes('taillamp')) {
            return 'light';
        }
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
        
        // Light - HIGH emissive (>0.8) AND opaque
        const isOpaque = !mat.transparent || (mat.opacity !== undefined && mat.opacity >= 0.8);
        if (isOpaque && mat.emissive && (mat.emissive.r > 0.8 && mat.emissive.g > 0.8 && mat.emissive.b > 0.8)) {
            return 'light';
        }
        
        // Wheel - very high metalness AND low roughness
        if (mat.metalness !== undefined && mat.metalness >= 0.9 && mat.roughness !== undefined && mat.roughness < 0.5) {
            return 'wheel';
        }
        
        // Default: Body
        return 'body';
    }

    // Get all target models
    function getTargetModels() {
        const model = getCurrentModel();
        const models = model ? [model] : [];
        if (customModel && !models.includes(customModel)) {
            models.push(customModel);
        }
        return models;
    }

    // Car color picker - Body parts
    const colorInput = document.getElementById('car-color');
    const applyColorBtn = document.getElementById('apply-color-btn');
    if (colorInput && applyColorBtn) {
        applyColorBtn.addEventListener('click', () => {
            const color = colorInput.value;
            const colorHex = parseInt(color.replace('#', ''), 16);
            AppState.currentCarColor = colorHex;
            
            // Use models.js function for built-in models
            changeCarColor(AppState.currentCar, colorHex);
            
            // Also update custom model if present
            let customChanged = 0;
            if (customModel && customModel !== getCurrentModel()) {
                customModel.traverse((child) => {
                    if (child.isMesh && child.material && child.material.color) {
                        if (getMeshPartType(child) === 'body') {
                            child.material.color.setHex(colorHex);
                            customChanged++;
                        }
                    }
                });
            }
            
            console.log('Body color changed to:', color, '(built-in + custom:' + customChanged + ')');
        });
    }

    // Light color picker
    const lightColorInput = document.getElementById('light-color');
    const applyLightColorBtn = document.getElementById('apply-light-color-btn');
    if (lightColorInput && applyLightColorBtn) {
        applyLightColorBtn.addEventListener('click', () => {
            const color = lightColorInput.value;
            const colorHex = parseInt(color.replace('#', ''), 16);
            AppState.lightColor = colorHex;
            
            changeLightColor(AppState.currentCar, colorHex);
            
            let customChanged = 0;
            if (customModel && customModel !== getCurrentModel()) {
                customModel.traverse((child) => {
                    if (child.isMesh && child.material) {
                        if (getMeshPartType(child) === 'light') {
                            if (child.material.color) child.material.color.setHex(colorHex);
                            if (child.material.emissive) child.material.emissive.setHex(colorHex);
                            customChanged++;
                        }
                    }
                });
            }
            
            console.log('Light color changed to:', color, '(built-in + custom:' + customChanged + ')');
        });
    }

    // Light intensity slider
    const lightIntensitySlider = document.getElementById('light-intensity');
    if (lightIntensitySlider) {
        lightIntensitySlider.addEventListener('input', (e) => {
            AppState.lightIntensity = parseFloat(e.target.value);
            
            changeLightIntensity(AppState.currentCar, AppState.lightIntensity);
            
            let customChanged = 0;
            if (customModel && customModel !== getCurrentModel()) {
                customModel.traverse((child) => {
                    if (child.isMesh && child.material) {
                        if (getMeshPartType(child) === 'light') {
                            if (child.material.emissiveIntensity !== undefined) {
                                child.material.emissiveIntensity = AppState.lightIntensity;
                                customChanged++;
                            }
                        }
                    }
                });
            }
            
            const lightIntensityValue = document.getElementById('light-intensity-value');
            if (lightIntensityValue) {
                lightIntensityValue.textContent = AppState.lightIntensity.toFixed(1);
            }
            console.log('Light intensity:', AppState.lightIntensity, '(custom meshes:', customChanged + ')');
        });
    }

    // Glass color picker
    const glassColorInput = document.getElementById('glass-color');
    const applyGlassColorBtn = document.getElementById('apply-glass-color-btn');
    if (glassColorInput && applyGlassColorBtn) {
        applyGlassColorBtn.addEventListener('click', () => {
            const color = glassColorInput.value;
            const colorHex = parseInt(color.replace('#', ''), 16);
            
            changeGlassColor(AppState.currentCar, colorHex);
            
            let customChanged = 0;
            if (customModel && customModel !== getCurrentModel()) {
                customModel.traverse((child) => {
                    if (child.isMesh && child.material && child.material.color) {
                        if (getMeshPartType(child) === 'glass') {
                            child.material.color.setHex(colorHex);
                            customChanged++;
                        }
                    }
                });
            }
            
            console.log('Glass color changed to:', color, '(built-in + custom:' + customChanged + ')');
        });
    }

    // Wheel color picker
    const wheelColorInput = document.getElementById('wheel-color');
    const applyWheelColorBtn = document.getElementById('apply-wheel-color-btn');
    if (wheelColorInput && applyWheelColorBtn) {
        applyWheelColorBtn.addEventListener('click', () => {
            const color = wheelColorInput.value;
            const colorHex = parseInt(color.replace('#', ''), 16);
            
            changeWheelColor(AppState.currentCar, colorHex);
            
            let customChanged = 0;
            if (customModel && customModel !== getCurrentModel()) {
                customModel.traverse((child) => {
                    if (child.isMesh && child.material && child.material.color) {
                        if (getMeshPartType(child) === 'wheel') {
                            child.material.color.setHex(colorHex);
                            customChanged++;
                        }
                    }
                });
            }
            
            console.log('Wheel color changed to:', color, '(built-in + custom:' + customChanged + ')');
        });
    }
}

// Update lighting based on slider values
function updateLighting() {
    const scene = getScene();
    if (!scene) return;

    scene.traverse((object) => {
        if (object.isAmbientLight) {
            object.intensity = AppState.ambientLightIntensity;
        }
        if (object.isSpotLight) {
            object.intensity = AppState.spotLightIntensity;
        }
    });

    // Update display values
    const ambientValue = document.getElementById('ambient-value');
    const spotValue = document.getElementById('spot-value');

    if (ambientValue) ambientValue.textContent = AppState.ambientLightIntensity.toFixed(1);
    if (spotValue) spotValue.textContent = AppState.spotLightIntensity.toFixed(1);
}

// Update status display
function updateStatusDisplay() {
    const currentModelEl = document.getElementById('status-model');
    const wireframeEl = document.getElementById('status-wireframe');
    const cameraViewEl = document.getElementById('status-camera');

    if (currentModelEl) currentModelEl.textContent = `Car ${AppState.currentCar}`;
    if (wireframeEl) wireframeEl.textContent = AppState.isWireframe ? 'ON' : 'OFF';
    if (cameraViewEl) cameraViewEl.textContent = AppState.currentCameraView;
}

// Update color controls visibility based on model structure
function updateColorControlsVisibility(carId) {
    // Check if the model has glass/wheel/light meshes
    const model = getCurrentModel();
    if (!model) return;
    
    let glassCount = 0, wheelCount = 0, lightCount = 0;
    
    model.traverse((child) => {
        if (child.isMesh) {
            const mat = child.material;
            const name = child.name.toLowerCase();
            
            // Check by name
            if (name.includes('glass') || name.includes('window') || name.includes('glas')) {
                glassCount++;
            }
            if (name.includes('wheel') || name.includes('tire') || name.includes('rim')) {
                wheelCount++;
            }
            if (name.includes('light') || name.includes('lamp')) {
                lightCount++;
            }
            
            // Check by material properties
            if (mat.transparent && mat.opacity < 0.8) glassCount++;
            if (mat.emissive && mat.emissive.r > 0.8) lightCount++;
        }
    });
    
    // Show/hide controls based on mesh counts
    const glassSection = document.getElementById('glass-color-section');
    const wheelSection = document.getElementById('wheel-color-section');
    const lightColorSection = document.getElementById('light-color-section');
    const lightIntensitySection = document.getElementById('light-intensity-section');
    
    if (glassSection) glassSection.style.display = glassCount > 0 ? 'block' : 'none';
    if (wheelSection) wheelSection.style.display = wheelCount > 0 ? 'block' : 'none';
    if (lightColorSection) lightColorSection.style.display = lightCount > 0 ? 'block' : 'none';
    if (lightIntensitySection) lightIntensitySection.style.display = lightCount > 0 ? 'block' : 'none';
    
    console.log(`Color controls updated: glass=${glassCount}, wheel=${wheelCount}, light=${lightCount}`);
}

// Update active button state
function updateActiveButton(clickedBtn) {
    const group = clickedBtn.closest('.btn-group-custom');
    if (group) {
        group.querySelectorAll('.btn').forEach(btn => btn.classList.remove('active'));
    }
    clickedBtn.classList.add('active');
}

// Export for debugging
window.AppState = AppState;
window.App = {
    getState: () => AppState,
    switchModel: window.switchModel,
    setWireframe: window.setWireframe,
    updateLighting: updateLighting,
    resetCamera: () => resetCamera('default'),
    changeCarColor: window.changeCarColor,
    changeLightColor: window.changeLightColor,
    changeLightIntensity: window.changeLightIntensity,
    changeGlassColor: window.changeGlassColor,
    changeWheelColor: window.changeWheelColor,
    updateMaterialReferences: updateMaterialReferences
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);
