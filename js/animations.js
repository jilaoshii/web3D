import { getScene } from './scene.js';
import { getCurrentModel } from './models.js';
import { setControlsEnabled } from './controls.js';

let isAnimating = false;
let animationFrameId = null;
let onAnimationComplete = null;
let garageDoorState = 'closed'; // 'closed' or 'open'

/**
 * Initialize animations
 */
export function initAnimations() {
    console.log('Animations system initialized');
    // Reset garage door state
    garageDoorState = 'closed';
    const scene = getScene();
    if (scene) {
        const garageDoor = scene.getObjectByName('garageDoor');
        if (garageDoor) {
            garageDoor.position.y = 0;
        }
    }
}

/**
 * Set animation complete callback
 */
export function setAnimationCompleteCallback(callback) {
    onAnimationComplete = callback;
}

/**
 * Play garage door animation
 */
export function playGarageDoorAnimation(callback) {
    const scene = getScene();
    if (!scene) return;

    const garageDoor = scene.getObjectByName('garageDoor');
    if (!garageDoor) {
        console.warn('Garage door not found');
        return;
    }

    if (isAnimating) {
        console.log('Animation already in progress, skipping...');
        return;
    }

    // Cancel any ongoing animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    // Check current door state
    if (garageDoorState === 'closed') {
        openGarageDoor(garageDoor, callback);
    } else {
        closeGarageDoor(garageDoor, callback);
    }
}

function openGarageDoor(garageDoor, callback) {
    isAnimating = true;
    setControlsEnabled(false);

    const startY = 0;
    const endY = 4;
    const duration = 1500;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out cubic
        const eased = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentY = startY + (endY - startY) * eased;

        // Move the door group up
        garageDoor.position.y = currentY;

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            isAnimating = false;
            garageDoorState = 'open';
            setControlsEnabled(true);
            if (callback) callback();
            if (onAnimationComplete) onAnimationComplete();
        }
    }

    animate();
}

/**
 * Close garage door
 */
function closeGarageDoor(garageDoor, callback) {
    isAnimating = true;
    setControlsEnabled(false);

    const startY = 4;
    const endY = 0;
    const duration = 1500;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const eased = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        const currentY = startY + (endY - startY) * eased;
        garageDoor.position.y = currentY;

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            isAnimating = false;
            garageDoorState = 'closed';
            setControlsEnabled(true);
            if (callback) callback();
        }
    }

    animate();
}

/**
 * Play car exit animation
 */
export function playCarExitAnimation(callback) {
    let model = getCurrentModel();
    
    // If no model found, try to find in scene
    if (!model) {
        console.warn('No car model found via window.getCurrentModel()');
        const scene = getScene();
        if (scene) {
            // Find any group with car-related name
            scene.traverse((child) => {
                if (child.isGroup) {
                    const name = child.name.toLowerCase();
                    if (name.includes('car') || name.includes('vehicle') || 
                        name.includes('body') || name.includes('mesh')) {
                        if (!model) model = child;
                    }
                }
            });
        }
    }
    
    if (!model) {
        console.error('Car Exit animation: No car model found in scene!');
        return;
    }
    
    if (isAnimating) {
        console.log('Animation already in progress, skipping...');
        return;
    }
    
    console.log('Car Exit animation: Using model:', model.name);

    // Cancel any ongoing animation
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }

    isAnimating = true;
    setControlsEnabled(false);

    const startX = model.position.x;
    const startZ = model.position.z;
    const startY = model.position.y;
    // Car exits through the garage door (towards z = -15)
    const endX = 0;
    const endZ = -15;
    const duration = 4000;
    const startTime = Date.now();

    // Rotate car to face forward based on model orientation
    const startRotY = model.rotation.y;
    // Car 3 needs different rotation (model is inverted)
    const endRotY = model.name === 'car3' ? -Math.PI / 2 : Math.PI / 2;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out cubic
        const eased = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Move car forward
        model.position.x = startX + (endX - startX) * eased;
        model.position.z = startZ + (endZ - startZ) * eased;
        model.rotation.y = startRotY + (endRotY - startRotY) * eased;

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            console.log('Car exit complete, returning...');
            setTimeout(() => {
                returnCarToStart(model, startX, startZ, startY, startRotY, callback);
            }, 1000);
        }
    }

    animate();
}

/**
 * Return car to starting position
 */
function returnCarToStart(model, startX, startZ, startY, startRotY, callback) {
    const duration = 3000;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out cubic
        const eased = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        // Interpolate position
        model.position.x = -15 + (startX + 15) * eased;
        model.position.z = -15 + (startZ + 15) * eased;
        model.position.y = startY;
        model.rotation.y = startRotY;

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            model.position.x = startX;
            model.position.z = startZ;
            model.position.y = startY;
            model.rotation.y = startRotY;
            isAnimating = false;
            setControlsEnabled(true);
            if (callback) callback();
            if (onAnimationComplete) onAnimationComplete();
            console.log('Car returned to start position');
        }
    }

    animate();
}

/**
 * Stop all running animations
 */
export function stopAnimations() {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    isAnimating = false;
    setControlsEnabled(true);
}

/**
 * Set animation state (for external sync)
 */
export function setAnimationState(animating) {
    isAnimating = animating;
}

/**
 * Check if animation is running
 */
export function getIsAnimating() {
    return isAnimating;
}

/**
 * Rotate car 360 degrees
 */
export function playCarRotateAnimation() {
    const model = getCurrentModel();
    if (!model || isAnimating) return;

    isAnimating = true;
    setControlsEnabled(false);

    const duration = 2000;
    const startTime = Date.now();
    const startRotation = model.rotation.y;
    const endRotation = startRotation + Math.PI * 2;

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease in-out
        const eased = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        model.rotation.y = startRotation + (endRotation - startRotation) * eased;

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            model.rotation.y = startRotation;
            isAnimating = false;
            setControlsEnabled(true);
        }
    }

    animate();
}

/**
 * Bounce animation for car
 */
export function playCarBounceAnimation() {
    const model = getCurrentModel();
    if (!model || isAnimating) return;

    isAnimating = true;
    setControlsEnabled(false);

    const startY = model.position.y;
    const bounceHeight = 0.5;
    const duration = 500;
    const bounces = 3;
    const startTime = Date.now();

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * bounces), 1);

        // Bounce effect using sine
        const bounce = Math.sin(progress * Math.PI * bounces * 2) * bounceHeight * (1 - progress);

        model.position.y = startY + bounce;

        if (progress < 1) {
            animationFrameId = requestAnimationFrame(animate);
        } else {
            model.position.y = startY;
            isAnimating = false;
            setControlsEnabled(true);
        }
    }

    animate();
}
