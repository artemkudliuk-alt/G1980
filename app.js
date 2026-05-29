/* ==========================================================================
   GV TRADING - SCROLL-DRIVEN TIMELINE & DUAL-MODE KINETIC PHYSICS ENGINE (V6)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // DOM ELEMENTS
    // ----------------------------------------------------
    const timelineSections = document.querySelectorAll('.timeline-section');
    const timelineFill = document.getElementById('timeline-fill');
    const mediaContainer = document.getElementById('media-container');
    const fullscreenGallery = document.getElementById('media-station'); // Wrapper that receives transforms

    let activeAssetId = 'industrial-engines'; // Default starter asset on load
    let idleTimeout = null;

    // ----------------------------------------------------
    // SCROLL-DRIVEN DYNAMIC TIMELINE INTERACTION
    // ----------------------------------------------------
    
    // ----------------------------------------------------
    // SCROLL-DRIVEN & HOVER-DRIVEN INTERACTIVE TIMELINE STUB
    // ----------------------------------------------------
    let currentActiveIndex = -1;
    let isHovering = false; // Flag to temporarily override scroll tracker when user actively hovers
    let hoverResetTimeout = null;
    
    function handleScrollUpdate() {
        if (isHovering) return; // Skip scroll updates during active hover overrides to prevent jitter
        
        const viewportWidth = window.innerWidth;
        const viewportCenter = window.innerHeight / 2;
        
        let activeIndex = 0;
        let minDifference = Infinity;

        // B2B Section Closest-to-Center Tracking
        timelineSections.forEach((section, idx) => {
            const rect = section.getBoundingClientRect();
            const sectionCenter = rect.top + (rect.height / 2);
            const difference = Math.abs(viewportCenter - sectionCenter);

            if (difference < minDifference) {
                minDifference = difference;
                activeIndex = idx;
            }
        });

        // Trigger activation if index changes (includes initial load when currentActiveIndex = -1)
        if (activeIndex !== currentActiveIndex) {
            activateTimelineStep(activeIndex);
        }
    }

    /**
     * Activates a specific step in the timeline
     * @param {number} activeIndex 
     */
    function activateTimelineStep(activeIndex) {
        currentActiveIndex = activeIndex;

        // Highlight typography steps, nodes, and bullets
        timelineSections.forEach((section, idx) => {
            if (idx === activeIndex) {
                section.classList.add('active');
                const targetAsset = section.getAttribute('data-asset');
                if (targetAsset) {
                    switchActiveAsset(targetAsset);
                }
            } else {
                section.classList.remove('active');
            }
        });

        // Animate Timeline SVG Progress Path Fill to active node center
        const activeSection = timelineSections[activeIndex];
        if (activeSection && timelineFill) {
            const activeNodeOffset = activeSection.offsetTop + 14; 
            timelineFill.style.height = `${activeNodeOffset}px`;
        }
    }

    // Connect Hybrid Hover (mouseenter) triggers to each text row
    timelineSections.forEach((section, idx) => {
        section.addEventListener('mouseenter', () => {
            isHovering = true;
            clearTimeout(hoverResetTimeout);

            // Instantly activate hovered B2B step
            activateTimelineStep(idx);

            // Re-enable scroll loop tracking after a brief delay if mouse stops
            hoverResetTimeout = setTimeout(() => {
                isHovering = false;
            }, 100);
        });

        section.addEventListener('mouseleave', () => {
            clearTimeout(hoverResetTimeout);
            isHovering = false;
        });
    });

    /**
     * Crossfades active asset layered PNG/WebP images
     * @param {string} assetId 
     */
    function switchActiveAsset(assetId) {
        if (assetId === activeAssetId) return;

        // Fade out previous active image
        const currentActive = document.querySelector('.media-asset.active');
        if (currentActive) {
            currentActive.classList.remove('active');
        }

        // Fade in new target active image
        const nextActive = document.getElementById(`img-${assetId}`);
        if (nextActive) {
            nextActive.classList.add('active');
            activeAssetId = assetId;
        }
    }

    // Connect Scroll Track Event Listeners
    window.addEventListener('scroll', handleScrollUpdate);
    window.addEventListener('resize', handleScrollUpdate);
    
    // Run initial trigger to set starting active step (Step 01 on load)
    handleScrollUpdate();

    // ----------------------------------------------------
    // DUAL-MODE KINETIC PHYSICS ENGINE (LERP & ZERO-G DRIFT)
    // ----------------------------------------------------
    
    // Physics Registers
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    // Constants
    const maxSweepTranslation = 25; // 25px max displacement on X and Y
    const maxSweepRotation = 6;     // 6 degrees subtle pitch & yaw tilt
    const lerpFactor = 0.045;       // Strict easing damping coefficient (factor: 0.04 - 0.05)

    // Capture cursor coordinates anywhere in the viewport window
    window.addEventListener('mousemove', (e) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        
        // Normalize coordinates from center (-1.0 to 1.0)
        const normX = (e.clientX - centerX) / centerX;
        const normY = (e.clientY - centerY) / centerY;

        // Map mouse movements to panning and tilt limits
        targetX = normX * maxSweepTranslation;
        targetY = normY * maxSweepTranslation;
        targetRotX = -normY * maxSweepRotation;
        targetRotY = normX * maxSweepRotation;

        // Reset idle timer
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(decayToIdle, 2000);
    });

    // Detect when cursor completely exits the document viewport
    document.addEventListener('mouseleave', () => {
        clearTimeout(idleTimeout);
        decayToIdle();
    });

    /**
     * Decays cursor targets to zero, smoothly sliding coordinates back to 
     * center so they transition to the idle breathing drift without snaps.
     */
    function decayToIdle() {
        targetX = 0;
        targetY = 0;
        targetRotX = 0;
        targetRotY = 0;
    }

    // Detect layout boundary to handle mobile behavior
    let isMobile = window.innerWidth < 1024;
    window.addEventListener('resize', () => {
        isMobile = window.innerWidth < 1024;
    });

    /**
     * High-performance requestAnimationFrame loop running at device refresh rate
     * @param {number} time timestamp
     */
    function updatePhysics(time) {
        if (!isMobile) {
            // Apply Linear Interpolation (LERP) for strict inertial damping (0.045 factor)
            currentX += (targetX - currentX) * lerpFactor;
            currentY += (targetY - currentY) * lerpFactor;
            currentRotX += (targetRotX - currentRotX) * lerpFactor;
            currentRotY += (targetRotY - currentRotY) * lerpFactor;

            // Zero-G Autonomous Breathing & Drift Wave Offsets (active even when idle/leaved)
            const breatheX = Math.sin(time * 0.0012) * 15;   // Floating Y-drift up to 15px X-drift
            const breatheY = Math.cos(time * 0.0008) * 10;   // Floating Y-drift up to 10px Y-drift
            const breatheRotX = Math.sin(time * 0.0006) * 1.5; // Idle pitch sway up to 1.5 degrees
            const breatheRotY = Math.cos(time * 0.0009) * 1.5; // Idle yaw sway up to 1.5 degrees

            // Merge active mouse displacement with autonomous drift wave
            const finalX = currentX + breatheX;
            const finalY = currentY + breatheY;
            const finalRotX = currentRotX + breatheRotX;
            const finalRotY = currentRotY + breatheRotY;

            // Apply GPU-accelerated 3D transform on the sticky left media panel wrapper
            mediaContainer.style.transform = `translate3d(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px, 0) rotateX(${finalRotX.toFixed(2)}deg) rotateY(${finalRotY.toFixed(2)}deg)`;
        } else {
            // Mobile: Bypassed cursor calculations, saving mobile GPU resources
            mediaContainer.style.transform = 'none';
        }

        // Loop animation frame
        requestAnimationFrame(updatePhysics);
    }

    // Initialize physics loop
    requestAnimationFrame(updatePhysics);
});
