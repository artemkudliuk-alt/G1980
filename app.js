/* ==========================================================================
   GV TRADING - SCROLL-DRIVEN TIMELINE & DUAL-MODE KINETIC PHYSICS ENGINE (V6)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;

    if (isMobile) {
        // --- MOBILE NATIVE ENGINE ---
        initializeMobileEngine();
    } else {
        // --- DESKTOP KINETIC ENGINE ---
        initializeDesktopEngine();
    }

    function initializeMobileEngine() {
        const timelineSections = document.querySelectorAll('.timeline-section');
        const mediaAssets = document.querySelectorAll('.media-asset');

        // Preload and activate first step immediately on load to prevent blank layout
        activateMobileStep(0);

        // IntersectionObserver using standard rootMargin centered line
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const idx = parseInt(entry.target.getAttribute('data-index'));
                    if (!isNaN(idx)) {
                        activateMobileStep(idx);
                    }
                }
            });
        }, {
            root: null,
            rootMargin: "-50% 0px -50% 0px", // Center trigger
            threshold: 0
        });

        // Observe each narrative section
        timelineSections.forEach(section => {
            observer.observe(section);
        });

        function activateMobileStep(activeIndex) {
            // 1. Remove .is-active from all sections, and add to current active index
            timelineSections.forEach((section, idx) => {
                if (idx === activeIndex) {
                    section.classList.add('is-active');
                } else {
                    section.classList.remove('is-active');
                }
            });

            // 2. Read targeted step data-asset value
            const activeSection = timelineSections[activeIndex];
            if (activeSection) {
                const targetAsset = activeSection.getAttribute('data-asset');
                if (targetAsset) {
                    // 3. Class switching on existing images only (No reload, no recreate)
                    mediaAssets.forEach(asset => {
                        if (asset.id === `img-${targetAsset}`) {
                            asset.classList.add('active');
                        } else {
                            asset.classList.remove('active');
                        }
                    });
                }
            }
        }
    }

    function initializeDesktopEngine() {
        const timelineSections = document.querySelectorAll('.timeline-section');
        const timelineFill = document.getElementById('timeline-fill');
        const mediaContainer = document.getElementById('media-container');

        let activeAssetId = 'industrial-engines';
        let idleTimeout = null;
        let currentActiveIndex = -1;
        let isHovering = false;
        let hoverResetTimeout = null;

        function handleScrollUpdate() {
            if (isHovering) return;
            
            const triggerPoint = window.innerHeight / 2;
            let activeIndex = 0;
            let minDifference = Infinity;

            timelineSections.forEach((section, idx) => {
                const rect = section.getBoundingClientRect();
                const referenceCoord = rect.top + rect.height / 2;
                const difference = Math.abs(triggerPoint - referenceCoord);

                if (difference < minDifference) {
                    minDifference = difference;
                    activeIndex = idx;
                }
            });

            if (activeIndex !== currentActiveIndex) {
                activateTimelineStep(activeIndex);
            }
        }

        function activateTimelineStep(activeIndex) {
            currentActiveIndex = activeIndex;

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

            const activeSection = timelineSections[activeIndex];
            if (activeSection && timelineFill) {
                const activeNodeOffset = activeSection.offsetTop + 14; 
                timelineFill.style.height = `${activeNodeOffset}px`;
            }
        }

        timelineSections.forEach((section, idx) => {
            section.addEventListener('mouseenter', () => {
                isHovering = true;
                clearTimeout(hoverResetTimeout);
                activateTimelineStep(idx);
                hoverResetTimeout = setTimeout(() => {
                    isHovering = false;
                }, 100);
            });

            section.addEventListener('mouseleave', () => {
                clearTimeout(hoverResetTimeout);
                isHovering = false;
            });
        });

        function switchActiveAsset(assetId) {
            if (assetId === activeAssetId) return;

            const currentActive = document.querySelector('.media-asset.active');
            if (currentActive) {
                currentActive.classList.remove('active');
            }

            const nextActive = document.getElementById(`img-${assetId}`);
            if (nextActive) {
                nextActive.classList.add('active');
                activeAssetId = assetId;
            }
        }

        window.addEventListener('scroll', handleScrollUpdate);
        window.addEventListener('resize', handleScrollUpdate);
        handleScrollUpdate();

        // Dual-Mode Kinetic Physics Engine
        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;
        let targetRotX = 0;
        let targetRotY = 0;
        let currentRotX = 0;
        let currentRotY = 0;

        const maxSweepTranslation = 25;
        const maxSweepRotation = 6;
        const lerpFactor = 0.045;

        window.addEventListener('mousemove', (e) => {
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            
            const normX = (e.clientX - centerX) / centerX;
            const normY = (e.clientY - centerY) / centerY;

            targetX = normX * maxSweepTranslation;
            targetY = normY * maxSweepTranslation;
            targetRotX = -normY * maxSweepRotation;
            targetRotY = normX * maxSweepRotation;

            clearTimeout(idleTimeout);
            idleTimeout = setTimeout(decayToIdle, 2000);
        });

        document.addEventListener('mouseleave', () => {
            clearTimeout(idleTimeout);
            decayToIdle();
        });

        function decayToIdle() {
            targetX = 0;
            targetY = 0;
            targetRotX = 0;
            targetRotY = 0;
        }

        function updatePhysics(time) {
            currentX += (targetX - currentX) * lerpFactor;
            currentY += (targetY - currentY) * lerpFactor;
            currentRotX += (targetRotX - currentRotX) * lerpFactor;
            currentRotY += (targetRotY - currentRotY) * lerpFactor;

            const breatheX = Math.sin(time * 0.0012) * 15;
            const breatheY = Math.cos(time * 0.0008) * 10;
            const breatheRotX = Math.sin(time * 0.0006) * 1.5;
            const breatheRotY = Math.cos(time * 0.0009) * 1.5;

            const finalX = currentX + breatheX;
            const finalY = currentY + breatheY;
            const finalRotX = currentRotX + breatheRotX;
            const finalRotY = currentRotY + breatheRotY;

            mediaContainer.style.transform = `translate3d(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px, 0) rotateX(${finalRotX.toFixed(2)}deg) rotateY(${finalRotY.toFixed(2)}deg)`;
            requestAnimationFrame(updatePhysics);
        }

        requestAnimationFrame(updatePhysics);
    }
});
