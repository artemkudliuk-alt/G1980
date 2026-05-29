/* ==========================================================================
   GV TRADING - SCROLL-DRIVEN TIMELINE & DUAL-MODE KINETIC PHYSICS ENGINE (V6)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const mq = window.matchMedia("(max-width: 768px)");
    
    let activeEngine = null; // 'desktop' or 'mobile'
    
    // Desktop engine state and references
    let desktopScrollHandler = null;
    let desktopResizeHandler = null;
    let desktopMouseMoveHandler = null;
    let desktopMouseLeaveHandler = null;
    let desktopHoverHandlers = [];
    let physicsRafId = null;
    let idleTimeout = null;
    let hoverResetTimeout = null;
    
    // Mobile engine state and references
    let mobileObserver = null;
    let mobileResizeHandler = null;
    let mobileOrientationHandler = null;
    
    // Shared elements
    const timelineSections = document.querySelectorAll('.timeline-section');
    const mediaAssets = document.querySelectorAll('.media-asset');
    
    function handleViewportChange(e) {
        if (e.matches) {
            // Screen is mobile
            if (activeEngine === 'desktop') {
                destroyDesktopEngine();
            }
            if (activeEngine !== 'mobile') {
                initializeMobileEngine();
            }
        } else {
            // Screen is desktop
            if (activeEngine === 'mobile') {
                destroyMobileEngine();
            }
            if (activeEngine !== 'desktop') {
                initializeDesktopEngine();
            }
        }
    }
    
    // Register Media Query change listener
    mq.addEventListener('change', handleViewportChange);
    
    // Initial runtime bootstrap
    handleViewportChange(mq);
    
    function destroyDesktopEngine() {
        activeEngine = null;
        
        if (desktopScrollHandler) {
            window.removeEventListener('scroll', desktopScrollHandler);
            desktopScrollHandler = null;
        }
        if (desktopResizeHandler) {
            window.removeEventListener('resize', desktopResizeHandler);
            desktopResizeHandler = null;
        }
        if (desktopMouseMoveHandler) {
            window.removeEventListener('mousemove', desktopMouseMoveHandler);
            desktopMouseMoveHandler = null;
        }
        if (desktopMouseLeaveHandler) {
            document.removeEventListener('mouseleave', desktopMouseLeaveHandler);
            desktopMouseLeaveHandler = null;
        }
        
        desktopHoverHandlers.forEach(({ element, type, handler }) => {
            element.removeEventListener(type, handler);
        });
        desktopHoverHandlers = [];
        
        if (physicsRafId) {
            cancelAnimationFrame(physicsRafId);
            physicsRafId = null;
        }
        
        clearTimeout(idleTimeout);
        clearTimeout(hoverResetTimeout);
        
        timelineSections.forEach(section => {
            section.classList.remove('active');
        });
        
        const timelineFill = document.getElementById('timeline-fill');
        if (timelineFill) {
            timelineFill.style.height = '0px';
        }
    }
    
    function destroyMobileEngine() {
        activeEngine = null;
        
        if (mobileObserver) {
            mobileObserver.disconnect();
            mobileObserver = null;
        }
        
        if (mobileResizeHandler) {
            window.removeEventListener('resize', mobileResizeHandler);
            mobileResizeHandler = null;
        }
        if (mobileOrientationHandler) {
            window.removeEventListener('orientationchange', mobileOrientationHandler);
            mobileOrientationHandler = null;
        }
        
        timelineSections.forEach(section => {
            section.classList.remove('is-active');
        });
    }
    
    function initializeMobileEngine() {
        activeEngine = 'mobile';
        
        // Pre-activate first step immediately to prevent empty layout
        activateMobileStep(0);
        
        function rebuildObserver() {
            if (mobileObserver) {
                mobileObserver.disconnect();
            }
            
            // rootMargin: -49.5% to create a robust 1% center viewport intersection band
            mobileObserver = new IntersectionObserver((entries) => {
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
                rootMargin: "-49.5% 0px -49.5% 0px",
                threshold: 0
            });
            
            timelineSections.forEach(section => {
                mobileObserver.observe(section);
            });
        }
        
        rebuildObserver();
        
        mobileResizeHandler = rebuildObserver;
        mobileOrientationHandler = rebuildObserver;
        
        window.addEventListener('resize', mobileResizeHandler);
        window.addEventListener('orientationchange', mobileOrientationHandler);
        
        function activateMobileStep(activeIndex) {
            timelineSections.forEach((section, idx) => {
                if (idx === activeIndex) {
                    section.classList.add('is-active');
                } else {
                    section.classList.remove('is-active');
                }
            });
            
            const activeSection = timelineSections[activeIndex];
            if (activeSection) {
                const targetAsset = activeSection.getAttribute('data-asset');
                if (targetAsset) {
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
        activeEngine = 'desktop';
        
        const timelineFill = document.getElementById('timeline-fill');
        const mediaContainer = document.getElementById('media-container');

        let activeAssetId = 'industrial-engines';
        let currentActiveIndex = -1;
        let isHovering = false;

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

        function switchActiveAsset(assetId) {
            if (assetId === activeAssetId) return;

            mediaAssets.forEach(asset => {
                if (asset.id === `img-${assetId}`) {
                    asset.classList.add('active');
                } else {
                    asset.classList.remove('active');
                }
            });
            activeAssetId = assetId;
        }

        desktopScrollHandler = handleScrollUpdate;
        desktopResizeHandler = handleScrollUpdate;
        
        window.addEventListener('scroll', desktopScrollHandler);
        window.addEventListener('resize', desktopResizeHandler);
        
        handleScrollUpdate();

        // Hover bindings
        timelineSections.forEach((section, idx) => {
            const enterHandler = () => {
                isHovering = true;
                clearTimeout(hoverResetTimeout);
                activateTimelineStep(idx);
                hoverResetTimeout = setTimeout(() => {
                    isHovering = false;
                }, 100);
            };
            
            const leaveHandler = () => {
                clearTimeout(hoverResetTimeout);
                isHovering = false;
            };
            
            section.addEventListener('mouseenter', enterHandler);
            section.addEventListener('mouseleave', leaveHandler);
            
            desktopHoverHandlers.push({ element: section, type: 'mouseenter', handler: enterHandler });
            desktopHoverHandlers.push({ element: section, type: 'mouseleave', handler: leaveHandler });
        });

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

        const mouseMoveHandler = (e) => {
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
        };

        const mouseLeaveHandler = () => {
            clearTimeout(idleTimeout);
            decayToIdle();
        };

        function decayToIdle() {
            targetX = 0;
            targetY = 0;
            targetRotX = 0;
            targetRotY = 0;
        }

        desktopMouseMoveHandler = mouseMoveHandler;
        desktopMouseLeaveHandler = mouseLeaveHandler;
        
        window.addEventListener('mousemove', desktopMouseMoveHandler);
        document.addEventListener('mouseleave', desktopMouseLeaveHandler);

        function updatePhysics(time) {
            if (activeEngine !== 'desktop') return;
            
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

            if (mediaContainer) {
                mediaContainer.style.transform = `translate3d(${finalX.toFixed(2)}px, ${finalY.toFixed(2)}px, 0) rotateX(${finalRotX.toFixed(2)}deg) rotateY(${finalRotY.toFixed(2)}deg)`;
            }
            
            physicsRafId = requestAnimationFrame(updatePhysics);
        }

        physicsRafId = requestAnimationFrame(updatePhysics);
    }
});
