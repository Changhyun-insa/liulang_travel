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
        const productDetailMatch = path.match(/^\/product\/(\d+)\/?$/);

        if (path === '/' || path === '/index.html') {
            contentPath = 'main.html';
            imagePrefix = ''; // Images are in the root asset folder
        } else if (path === '/product' || path === '/product/') {
            contentPath = '/product/main.html';
            imagePrefix = '';
        } else if (productDetailMatch) {
            const productId = productDetailMatch[1];
            contentPath = `/product/${productId}/main.html`;
            imagePrefix = `/product/${productId}/`;
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

                if (productDetailMatch) {
                    window.scrollTo(0, 0);
                }

                const shareFab = document.getElementById('share-button');
                if (productDetailMatch) {
                    shareFab.style.display = 'flex';
                } else {
                    shareFab.style.display = 'none';
                }

                const soldOutProducts = ['1']; // 판매 종료 상품 ID 목록

                // 판매 종료된 상품 페이지 처리
                if (productDetailMatch && soldOutProducts.includes(productDetailMatch[1])) {
                    // 공유 버튼 비활성화
                    if (shareFab) {
                        shareFab.style.display = 'none';
                    }

                    // sold-out-detail 클래스 추가
                    const mainElement = mainContentDiv.querySelector('main');
                    const stickyFooter = mainContentDiv.querySelector('.sticky-footer');
                    if (mainElement) {
                        mainElement.classList.add('sold-out-detail');
                    }
                    if (stickyFooter) {
                        stickyFooter.classList.add('sold-out-detail');
                    }
                }

                // 상품 목록 페이지에서 판매 종료된 상품 처리 및 재정렬
                if (path === '/product' || path === '/product/') {
                    const productList = document.querySelector('.product-list');
                    if (productList) {
                        const items = Array.from(productList.querySelectorAll('li'));
                        const soldOutItems = [];
                        const availableItems = [];

                        items.forEach(item => {
                            const anchor = item.querySelector('a');
                            if (anchor) {
                                const match = anchor.href.match(/\/product\/(\d+)/);
                                if (match && soldOutProducts.includes(match[1])) {
                                    item.classList.add('sold-out');
                                    soldOutItems.push(item);
                                } else {
                                    availableItems.push(item);
                                }
                            } else {
                                availableItems.push(item);
                            }
                        });

                        // Clear the list and append sorted items
                        productList.innerHTML = '';
                        availableItems.forEach(item => productList.appendChild(item));
                        soldOutItems.forEach(item => productList.appendChild(item));
                    }
                }

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

        // 판매 종료된 상품 링크 클릭 방지
        if (anchor.closest('.sold-out')) {
            e.preventDefault();
            showToast('해당 상품은 판매가 종료되었습니다.');
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
     * 동적인 sticky footer의 높이를 감지하여 레이아웃을 조정합니다.
     * 이 함수 하나로 메인 푸터 가려짐 문제와 FAB 위치 문제를 모두 해결합니다.
     * - SPA 페이지 전환 시: MutationObserver가 #main-content의 변경을 감지하여 로직을 재실행합니다.
     * - 푸터 높이 변경 시: ResizeObserver가 실시간으로 푸터 높이를 감지하여 스타일을 조절합니다.
     * - 브라우저 창 크기 변경 시: resize 이벤트를 통해 반응형으로 위치를 재계산합니다.
     */
    function initializeStickyFooterLayoutManager() {
        const body = document.body;
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        let footerResizeObserver = null;

        const adjustLayout = () => {
            const stickyFooter = document.querySelector('.sticky-footer');

            // 이전 Observer가 있다면 연결을 해제합니다.
            if (footerResizeObserver) {
                footerResizeObserver.disconnect();
                footerResizeObserver = null;
            }

            if (stickyFooter) {
                // 실제 스타일을 조정하는 함수
                const performAdjustment = () => {
                    const footerHeight = stickyFooter.offsetHeight;
                    // 1. FAB 위치 조정을 위해 CSS 변수에 높이 값을 설정합니다.
                    document.documentElement.style.setProperty('--sticky-footer-height', `${footerHeight}px`);
                    // 2. 메인 푸터가 가려지지 않도록 body의 하단에 padding을 추가합니다.
                    body.style.paddingBottom = `${footerHeight}px`;
                };

                // ResizeObserver로 푸터 높이의 실시간 변경을 감지합니다. (예: 텍스트 줄바꿈)
                footerResizeObserver = new ResizeObserver(performAdjustment);
                footerResizeObserver.observe(stickyFooter);

                // 초기 실행
                performAdjustment();
            } else {
                // sticky-footer가 없는 페이지에서는 변수와 padding을 초기화합니다.
                document.documentElement.style.setProperty('--sticky-footer-height', '0px');
                body.style.paddingBottom = '0px';
            }
        };

        // 페이지 콘텐츠가 변경될 때(SPA 네비게이션) 레이아웃을 다시 조정합니다.
        new MutationObserver(adjustLayout).observe(mainContent, { childList: true });

        // 브라우저 창 크기가 변경될 때 레이아웃을 다시 조정합니다.
        window.addEventListener('resize', adjustLayout);

        // 최초 로드 시 실행합니다.
        adjustLayout();
    }

    initializeStickyFooterLayoutManager();

    // This function shows a toast notification
    function showToast(message) {
        // Remove any existing toasts to prevent stacking
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = 'toast-notification';
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.classList.add('show'), 10);

        // Start fade out after 2.5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            // Remove the element from DOM after transition ends
            toast.addEventListener('transitionend', () => toast.remove());
        }, 2500);
    }

    // Use event delegation on the document for dynamically loaded share buttons.
    document.addEventListener('click', function(event) {
        const shareButton = event.target.closest('#share-button');
        if (shareButton) {
            event.preventDefault(); // Prevent default anchor behavior
            navigator.clipboard.writeText(window.location.href)
                .then(() => {
                    showToast('현재 링크가 복사되었습니다.\n공유를 원하시는 곳에 붙여넣어 보세요!😘');
                    
                    // Temporarily change appearance
                    shareButton.style.backgroundImage = 'none';
                    shareButton.innerHTML = '❤️';
                    
                    setTimeout(() => {
                        // Restore original appearance
                        shareButton.innerHTML = '';
                        shareButton.style.backgroundImage = ''; // Reverts to stylesheet's value
                    }, 2000);
                })
                .catch(err => {
                    console.error('클립보드 복사 실패:', err);
                    showToast('클립보드 복사에 실패했습니다.😭');
                });
        }
    });

    // --- Payment Modal Logic (Dynamic) ---
    document.addEventListener('click', function(event) {
        const paymentModal = document.getElementById('payment-modal');
        if (!paymentModal) return;

        const purchaseButton = event.target.closest('.purchase-button');
        const closeButton = event.target.closest('.payment-modal-close');
        const tab = event.target.closest('.payment-tab');

        // --- Open Modal ---
        if (purchaseButton) {
            const productDetailMatch = window.location.pathname.match(/\/product\/(\d+)/);
            if (!productDetailMatch) {
                console.error("Could not determine product ID for payment modal.");
                showToast("결제 정보를 불러올 수 없습니다.");
                return;
            }
            const productId = productDetailMatch[1];
            
            paymentModal.dataset.productId = productId;

            const paymentImage = document.getElementById('payment-image');
            paymentImage.src = `/product/${productId}/kakao_income.png`;
            
            paymentModal.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
            paymentModal.querySelector('.payment-tab[data-payment="kakao"]').classList.add('active');

            paymentModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }

        // --- Close Modal ---
        if (closeButton) {
            paymentModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }

        // --- Switch Tabs ---
        if (tab) {
            const productId = paymentModal.dataset.productId;
            if (!productId) return;

            const paymentImage = document.getElementById('payment-image');
            const paymentMethod = tab.dataset.payment;
            const imagePaths = {
                kakao: `/product/${productId}/kakao_income.png`,
                toss: `/product/${productId}/toss_income.png`
            };

            if (paymentImage && imagePaths[paymentMethod]) {
                paymentImage.src = imagePaths[paymentMethod];

                paymentModal.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            }
        }
    });

    // Close modal when clicking on the background
    window.addEventListener('click', (event) => {
        const paymentModal = document.getElementById('payment-modal');
        if (event.target === paymentModal) {
            paymentModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });
});