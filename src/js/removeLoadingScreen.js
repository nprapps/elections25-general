const boardTypes = {
    'board-president': ['board-president', 'results-board-display'],
    'board-senate': ['balance-of-power-senate', 'results-board-display'],
    'board-house': ['balance-of-power-house', 'results-board-display'],
    'board-governor': ['results-board-display']
};

(function () {
    const CHECK_INTERVAL = 80;
    const MAX_WAIT_TIME = 25000; //25 seconds
    let checkCount = 0;
    let successiveReadyChecks = 0;
    const REQUIRED_SUCCESSIVE_CHECKS = 3;
    const startTime = Date.now();

    /**
     * Functions to create and remove a loading screen overlay into the main content area. 
     * To create, we first look for main.app.constrained, then the loading screen is inserted as the first child of the main element. 
     * the main content's position is set to relative for proper overlay positioning.
     * 
     * @returns {void}
     */
    function createLoadingScreen() {
        const mainContent = document.querySelector('main.app.constrained');
        if (!mainContent) return;

        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'page-loadingScreen';
        mainContent.style.position = 'relative';
        mainContent.insertBefore(loadingScreen, mainContent.firstChild);
    }

    function removeLoadingScreen() {
        const loadingScreen = document.getElementById('page-loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.1s ease-out';

            setTimeout(() => {
                loadingScreen.remove();
                // Reset main's position if needed
            }, 50);
        } else {
            console.log('Loading screen element not found');
        }
    }

    /**
     * Determines which selectors should be checked based on the page content.
     * Checks for either BOP embed wrapper or specific board types (president, senate, house, governor).
     * 
     * @returns {string[]} Array of html elements that need to be checked to see if they're rendered 
     */
    function determineRequiredSelectors() {
        const bopWrapper = document.getElementById('bop-embed-wrapper');
        if (bopWrapper) return ['bop-embed-wrapper', 'bop-wrapper'];

        const presidentWrapper = document.getElementById('president-wrapper');
        if (presidentWrapper) return ['president-wrapper', 'board-president'];

        return Object.entries(boardTypes)
            .filter(([selector]) => document.querySelector(selector))
            .flatMap(([boardType, selectors]) => [boardType, ...selectors]);
    };


    /**
     * Checks to see  all required elements are properly rendered and visible on the page.
     * 
     * The function handles three types of selectors:
     * 1. board-* selectors: Checked directly at document level
     * 2. bop-* selectors: Searched by ID
     * 3. Child elements: Searched within their board parent context
     * 
     * @returns {boolean} Returns true if all required content is ready and rendered,
     *                    false if any required element is missing or not properly rendered
     */
    function isContentReady() {
        const requiredSelectors = determineRequiredSelectors();

        return requiredSelectors.every(selector => {
            // Get the target element based on selector type
            const element = (() => {
                if (selector.startsWith('board-')) {
                    return document.querySelector(selector);
                }

                if (selector.includes('bop-')) {
                    return document.getElementById(selector);
                }

                if (selector.includes('president-')) {
                  return document.getElementById(selector);
              }

              // For child elements, find within board parent
                const boardParent = document.querySelector(
                    Object.keys(boardTypes).find(board =>
                        document.querySelector(board)
                    )
                );
                return boardParent?.querySelector(selector);
            })();

            // Check if element exists and is properly rendered
            if (!element?.innerHTML?.trim()) {
                return false;
            }

            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();

            return !(
                style.display === 'none' ||
                style.visibility === 'hidden' ||
                rect.width === 0 ||
                rect.height === 0
            );
        });
    }

    /**
     * Uses a successive check system to ensure content stability before removal.
     * Will force remove the loading screen if maximum wait time is exceeded.
     * 
     * 
     * @requires REQUIRED_SUCCESSIVE_CHECKS - Number of successful checks needed
     * @requires MAX_WAIT_TIME - Maximum milliseconds to wait. after its done, hide the loading screen regardless
     * @requires CHECK_INTERVAL - Milliseconds between checks 
     */
    function checkAndRemoveLoadingScreen() {
        checkCount++;

        if (isContentReady()) {
            successiveReadyChecks++;
            if (successiveReadyChecks >= REQUIRED_SUCCESSIVE_CHECKS) {
                removeLoadingScreen();
                return;
            }
        } else {
            // Reset the counter if any check fails
            if (successiveReadyChecks > 0) {
                successiveReadyChecks = 0;
            }
        }

        // Check if we've exceeded maximum wait time
        if (Date.now() - startTime > MAX_WAIT_TIME) {
            console.warn('Loading screen timeout: removing after maximum wait time');
            removeLoadingScreen();
            return;
        }

        // Continue checking
        requestAnimationFrame(() => {
            setTimeout(checkAndRemoveLoadingScreen, CHECK_INTERVAL);
        });
    }

    /**
     * Initialize the loading screen system based on document ready state
     * Handles both cases where DOM is still loading or already complete
     */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('DOMContentLoaded fired, starting checks...');
            createLoadingScreen();
            checkAndRemoveLoadingScreen();
        });
    } else {
        createLoadingScreen();
        checkAndRemoveLoadingScreen();
    }
})();