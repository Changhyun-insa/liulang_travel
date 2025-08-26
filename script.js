document.addEventListener('DOMContentLoaded', () => {
    // Handle redirect from 404.html
    (function() {
        const redirect = sessionStorage.getItem('redirect');
        if (redirect) {
            sessionStorage.removeItem('redirect');
            if (redirect !== window.location.pathname) {
                history.replaceState(null, '', redirect);
            }
        }
    })();

    // Function to load modal content
    async function loadModal(modalId, filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            document.body.insertAdjacentHTML('beforeend', html);
            console.log(`Modal ${modalId} loaded from ${filePath}`);
        } catch (error) {
            console.error(`Could not load modal ${modalId} from ${filePath}:`, error);
        }
    }

    // Function to initialize modal functionality after content is loaded
    function initializeModals() {
        const standardModal = document.getElementById("standard-terms-modal");
        const specialModal = document.getElementById("special-terms-modal");
        const openStandardBtn = document.getElementById("open-standard-terms");
        const openSpecialBtn = document.getElementById("open-special-terms");
        const closeBtns = document.querySelectorAll(".close-button");

        function openModal(modal) {
            if (modal) {
                modal.style.display = "block";
                document.body.style.overflow = "hidden";
            }
        }

        function closeModal(modal) {
            if (modal) {
                modal.style.display = "none";
                document.body.style.overflow = "auto";
            }
        }

        // Function to handle close button positioning on scroll
        function setupModalScroll(modal) {
            const modalContent = modal.querySelector(".modal-content");
            const closeBtn = modal.querySelector(".close-button");

            if (modalContent && closeBtn) {
                modalContent.addEventListener('scroll', () => {
                    const topOffset = 1.5 * 16; // 1.5rem in pixels
                    closeBtn.style.top = `${modalContent.scrollTop + topOffset}px`;
                });
            }
        }

        if (openStandardBtn) {
            openStandardBtn.onclick = function(e) {
                e.preventDefault();
                openModal(standardModal);
            }
        }

        if (openSpecialBtn) {
            openSpecialBtn.onclick = function(e) {
                e.preventDefault();
                openModal(specialModal);
            }
        }

        closeBtns.forEach(btn => {
            btn.onclick = function() {
                // Find the parent modal and close it
                const modal = btn.closest('.modal');
                closeModal(modal);
            }
        });

        window.addEventListener('click', e => {
            if (e.target == standardModal) {
                closeModal(standardModal);
            }
            if (e.target == specialModal) {
                closeModal(specialModal);
            }
        });

        // Setup scroll behavior for each modal
        if (standardModal) {
            setupModalScroll(standardModal);
        }
        if (specialModal) {
            setupModalScroll(specialModal);
        }
    }

    // Load modals and then initialize their functionality
    Promise.all([
        loadModal('standard-terms-modal', '/terms/modal_standard_terms.html'),
        loadModal('special-terms-modal', '/terms/modal_special_terms.html')
    ]).then(() => {
        initializeModals();
    });

    // Client-side routing
    async function handleRouting() {
        const mainContentDiv = document.getElementById('main-content');
        const path = window.location.pathname;
        let contentPath = '';
        let imagePrefix = '';

        if (path === '/' || path === '/index.html') {
            contentPath = 'main.html';
            imagePrefix = ''; // Images are in the root asset folder
        } else if (path === '/product' || path === '/product/') {
            contentPath = '/product/main.html';
            imagePrefix = '';
        } else if (path === '/product/1' || path === '/product/1/') {
            contentPath = '/product/1/main.html';
            imagePrefix = '/product/1/'; // Images are in product/1 folder
        } else {
            // If path is not recognized, redirect to root
            history.replaceState(null, '', '/');
            handleRouting(); // Re-run routing for the new path
            return;
        }

        if (contentPath) {
            try {
                const response = await fetch(contentPath);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const html = await response.text();
                
                // Parse the fetched HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const fetchedBodyContent = doc.body.innerHTML;

                // Adjust image paths
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = fetchedBodyContent;
                tempDiv.querySelectorAll('img').forEach(img => {
                    const src = img.getAttribute('src');
                    if (src && !src.startsWith('http') && !src.startsWith('/')) {
                        img.setAttribute('src', `${imagePrefix}${src}`);
                    }
                });
                mainContentDiv.innerHTML = tempDiv.innerHTML;

            } catch (error) {
                console.error('Error loading content:', error);
                // Optionally, redirect to a 404 page or show an error message
            }
        }
    }

    // Call routing handler on initial load
    handleRouting();

    // Listen for popstate event (back/forward button)
    window.addEventListener('popstate', handleRouting);

    // Intercept link clicks for SPA navigation
    document.body.addEventListener('click', e => {
        const anchor = e.target.closest('a');

        if (!anchor) {
            return;
        }

        const href = anchor.getAttribute('href');
        const target = anchor.getAttribute('target');
        const isExternal = href?.startsWith('http') || target === '_blank';
        const isSpecialLink = href?.startsWith('#') || href?.startsWith('tel:') || href?.startsWith('mailto:');

        if (href && !isExternal && !isSpecialLink) {
            e.preventDefault();
            history.pushState(null, '', href);
            handleRouting();
        }
    });

    // Mobile menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (!link.classList.contains('dropdown-toggle')) {
                if (navMenu && menuToggle && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    menuToggle.classList.remove('active');
                }
            }
        });
    });

    // Smooth scroll behavior for internal links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            if (this.id === 'open-standard-terms' || this.id === 'open-special-terms' || this.classList.contains('dropdown-toggle')) {
                return; // Handled by other listeners
            }
            
            const targetId = this.getAttribute('href');
            if (targetId && targetId.length > 1) {
                const target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    /**
     * sticky-footer의 존재 여부와 높이에 따라 카카오톡 FAB의 위치를 동적으로 관리합니다.
     * - SPA 페이지 전환 시: MutationObserver가 #main-content의 변경을 감지하여 로직을 재실행합니다.
     * - 푸터 높이 변경 시: ResizeObserver가 실시간으로 푸터 높이를 감지하여 FAB 위치를 조절합니다.
     * - 브라우저 창 크기 변경 시: resize 이벤트를 통해 반응형으로 위치를 재계산합니다.
     */
    function initializeFabPositionManager() {
        const fab = document.querySelector('.kakao-fab');
        if (!fab) return;

        let footerResizeObserver = null;

        const updateFabPosition = () => {
            const footer = document.querySelector('.sticky-footer');

            // 이전에 연결된 ResizeObserver가 있다면 해제합니다.
            if (footerResizeObserver) {
                footerResizeObserver.disconnect();
            }

            if (footer) {
                // sticky-footer가 존재하면 높이 변경을 감지합니다.
                footerResizeObserver = new ResizeObserver(() => {
                    const footerHeight = footer.offsetHeight;
                    const margin = window.innerWidth <= 768 ? 20 : 40; // 푸터와 버튼 사이의 여백
                    fab.style.bottom = `${footerHeight + margin}px`;
                });
                footerResizeObserver.observe(footer);

                // 초기 위치를 즉시 설정합니다.
                const footerHeight = footer.offsetHeight;
                const margin = window.innerWidth <= 768 ? 20 : 40;
                fab.style.bottom = `${footerHeight + margin}px`;
            } else {
                // sticky-footer가 없으면 기본 위치로 리셋합니다.
                const defaultBottom = window.innerWidth <= 768 ? '20px' : '40px';
                fab.style.bottom = defaultBottom;
            }
        };

        // #main-content의 내용이 변경될 때마다(페이지 이동 시) 위치를 다시 계산합니다.
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            new MutationObserver(updateFabPosition).observe(mainContent, { childList: true });
        }

        window.addEventListener('resize', updateFabPosition);
        updateFabPosition(); // 페이지 최초 로드 시 실행
    }

    initializeFabPositionManager();
});