import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getCamera, getRenderer } from './scene.js';

let orbitControls;

// Camera view presets
const cameraViews = {
    default: {
        position: { x: 5, y: 3, z: 5 },
        target: { x: 0, y: 0, z: 0 }
    },
    front: {
        position: { x: 0, y: 2, z: 6 },
        target: { x: 0, y: 0, z: 0 }
    },
    back: {
        position: { x: 0, y: 2, z: -6 },
        target: { x: 0, y: 0, z: 0 }
    },
    left: {
        position: { x: -6, y: 2, z: 0 },
        target: { x: 0, y: 0, z: 0 }
    },
    right: {
        position: { x: 6, y: 2, z: 0 },
        target: { x: 0, y: 0, z: 0 }
    },
    top: {
        position: { x: 0, y: 8, z: 0.1 },
        target: { x: 0, y: 0, z: 0 }
    }
};

/**
 * Initialize controls
 */
export function initControls() {
    const camera = getCamera();
    const renderer = getRenderer();

    if (!camera || !renderer) {
        console.error('Camera or renderer not initialized');
        return;
    }

    // Create OrbitControls
    orbitControls = new OrbitControls(camera, renderer.domElement);
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;
    orbitControls.screenSpacePanning = false;
    orbitControls.minDistance = 2;
    orbitControls.maxDistance = 20;
    orbitControls.maxPolarAngle = Math.PI / 2;
    orbitControls.enablePan = true;
    orbitControls.panSpeed = 0.5;
    orbitControls.rotateSpeed = 0.5;
    orbitControls.enableZoom = false;

    // Custom wheel event handler for finer control
    const canvas = renderer.domElement;
    canvas.addEventListener('wheel', (event) => {
        event.preventDefault();

        const zoomFactor = 0.05;
        const delta = event.deltaY > 0 ? 1 + zoomFactor : 1 - zoomFactor;

        const camera = getCamera();
        if (camera && orbitControls) {
            const newDistance = camera.position.distanceTo(orbitControls.target) * delta;

            // Clamp to min/max distance
            const clampedDistance = Math.max(orbitControls.minDistance, Math.min(orbitControls.maxDistance, newDistance));

            // Get direction from target to camera
            const direction = new THREE.Vector3();
            direction.subVectors(camera.position, orbitControls.target).normalize();

            // Move camera
            camera.position.copy(orbitControls.target).addScaledVector(direction, clampedDistance);

            orbitControls.update();
        }
    }, { passive: false });

    // Set initial view
    resetCamera('default');

    console.log('Controls initialized');
}

/**
 * Reset camera to a specific view
 */
export function resetCamera(viewName = 'default') {
    const camera = getCamera();
    if (!camera) return;

    const view = cameraViews[viewName];
    if (!view) {
        console.warn(`View "${viewName}" not found, using default`);
        return;
    }

    // Smooth transition
    animateCameraTo(view.position, view.target);
}

/**
 * Animate camera to a position
 */
function animateCameraTo(targetPosition, targetLookAt) {
    const camera = getCamera();
    if (!camera || !orbitControls) return;

    const startPosition = {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
    };

    const startTarget = {
        x: orbitControls.target.x,
        y: orbitControls.target.y,
        z: orbitControls.target.z
    };

    const duration = 1000;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        // Interpolate position
        camera.position.x = startPosition.x + (targetPosition.x - startPosition.x) * eased;
        camera.position.y = startPosition.y + (targetPosition.y - startPosition.y) * eased;
        camera.position.z = startPosition.z + (targetPosition.z - startPosition.z) * eased;

        // Interpolate target
        orbitControls.target.x = startTarget.x + (targetLookAt.x - startTarget.x) * eased;
        orbitControls.target.y = startTarget.y + (targetLookAt.y - startTarget.y) * eased;
        orbitControls.target.z = startTarget.z + (targetLookAt.z - startTarget.z) * eased;

        orbitControls.update();

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    animate();
}

/**
 * Get the orbit controls instance
 */
export function getControls() {
    return orbitControls;
}

/**
 * Enable/disable controls
 */
export function setControlsEnabled(enabled) {
    if (orbitControls) {
        orbitControls.enabled = enabled;
    }
}

/**
 * Set camera zoom
 */
export function setZoom(minDistance, maxDistance) {
    if (orbitControls) {
        orbitControls.minDistance = minDistance;
        orbitControls.maxDistance = maxDistance;
    }
}

// Export functions to global scope
window.initControls = initControls;
window.resetCamera = resetCamera;
window.getControls = getControls;
window.setControlsEnabled = setControlsEnabled;
window.setZoom = setZoom;
