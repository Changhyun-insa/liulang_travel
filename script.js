document.addEventListener('DOMContentLoaded', () => {
    // --- UTILITY FUNCTIONS ---
    function showToast(message) {
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) {
            existingToast.remove();
        }
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = 'toast-notification';
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            toast.addEventListener('transitionend', () => toast.remove());
        }, 2500);
    }

    // --- MODAL HANDLING ---
    const modals = {};

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

    // --- LAYOUT MANAGEMENT ---
    function initializeStickyFooterLayoutManager() {
        const body = document.body;
        const mainContent = document.getElementById('main-content');
        if (!mainContent) return;

        let footerResizeObserver = null;

        const adjustLayout = () => {
            const stickyFooter = document.querySelector('.sticky-footer');
            if (footerResizeObserver) {
                footerResizeObserver.disconnect();
                footerResizeObserver = null;
            }
            if (stickyFooter) {
                const performAdjustment = () => {
                    const footerHeight = stickyFooter.offsetHeight;
                    document.documentElement.style.setProperty('--sticky-footer-height', `${footerHeight}px`);
                    body.style.paddingBottom = `${footerHeight}px`;
                };
                footerResizeObserver = new ResizeObserver(performAdjustment);
                footerResizeObserver.observe(stickyFooter);
                performAdjustment();
            } else {
                document.documentElement.style.setProperty('--sticky-footer-height', '0px');
                body.style.paddingBottom = '0px';
            }
        };

        new MutationObserver(adjustLayout).observe(mainContent, { childList: true });
        window.addEventListener('resize', adjustLayout);
        adjustLayout();
    }

    // --- ASYNC SETUP ---
    async function loadModal(modalId, filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const html = await response.text();
            document.body.insertAdjacentHTML('beforeend', html);
            const modal = document.getElementById(modalId);
            modals[modalId] = modal;
            setupModalScroll(modal); // Set up scroll behavior after loading
            console.log(`Modal ${modalId} loaded from ${filePath}`);
        } catch (error) {
            console.error(`Could not load modal ${modalId} from ${filePath}:`, error);
        }
    }

    // --- QR CODE DECODING ---
    function decodeQrCode(imageUrl) {
        const paymentLinkButton = document.getElementById('payment-link-button');
        paymentLinkButton.classList.remove('visible'); // Reset button state

        if (!imageUrl) {
            return;
        }

        const img = new Image();
        img.crossOrigin = "Anonymous";
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d', { willReadFrequently: true });
            canvas.width = img.width;
            canvas.height = img.height;
            context.drawImage(img, 0, 0, img.width, img.height);
            const imageData = context.getImageData(0, 0, img.width, img.height);
            
            const code = jsQR(imageData.data, imageData.width, imageData.height);

            if (code && code.data) {
                paymentLinkButton.href = code.data;
                paymentLinkButton.classList.add('visible');
            } else {
                console.log("No QR Code found in image: " + imageUrl);
            }
        };
        
        img.onerror = () => {
            console.error("Failed to load image for QR Code decoding: " + imageUrl);
        };

        img.src = imageUrl;
    }

    // --- ROUTING ---
    async function handleRouting() {
        const mainContentDiv = document.getElementById('main-content');
        const path = window.location.pathname;
        let contentPath = '';
        let imagePrefix = '';
        const productDetailMatch = path.match(/^\/product\/(\d+)\/?$/);

        if (path === '/' || path === '/index.html') {
            contentPath = 'main.html';
            imagePrefix = '';
        } else if (path === '/product' || path === '/product/') {
            contentPath = '/product/main.html';
            imagePrefix = '';
        } else if (productDetailMatch) {
            const productId = productDetailMatch[1];
            contentPath = `/product/${productId}/main.html`;
            imagePrefix = `/product/${productId}/`;
        } else {
            history.replaceState(null, '', '/');
            handleRouting();
            return;
        }

        if (contentPath) {
            try {
                const response = await fetch(contentPath);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const html = await response.text();
                
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const fetchedBodyContent = doc.body.innerHTML;

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

                // Post-render hooks
                const shareFab = document.getElementById('share-button');
                if (productDetailMatch) {
                    shareFab.style.display = 'flex';
                } else {
                    shareFab.style.display = 'none';
                }

                const soldOutProducts = ['1'];
                if (productDetailMatch && soldOutProducts.includes(productDetailMatch[1])) {
                    if (shareFab) {
                        shareFab.style.display = 'none';
                    }
                    const mainElement = mainContentDiv.querySelector('main');
                    const stickyFooter = mainContentDiv.querySelector('.sticky-footer');
                    if (mainElement) mainElement.classList.add('sold-out-detail');
                    if (stickyFooter) stickyFooter.classList.add('sold-out-detail');
                }

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
                        productList.innerHTML = '';
                        availableItems.forEach(item => productList.appendChild(item));
                        soldOutItems.forEach(item => productList.appendChild(item));
                    }
                }
            } catch (error) {
                console.error('Error loading content:', error);
            }
        }
    }

    // --- EVENT HANDLERS ---
    function handleShareButtonClick(button) {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                showToast('현재 링크가 복사되었습니다.\n공유를 원하시는 곳에 붙여넣어 보세요!😘');
                button.style.backgroundImage = 'none';
                button.innerHTML = '❤️';
                setTimeout(() => {
                    button.innerHTML = '';
                    button.style.backgroundImage = '';
                }, 2000);
            })
            .catch(err => {
                console.error('클립보드 복사 실패:', err);
                showToast('클립보드 복사에 실패했습니다.😭');
            });
    }

    function handlePaymentModal(target) {
        const paymentModal = document.getElementById('payment-modal');
        if (!paymentModal) return;

        const purchaseButton = target.closest('.purchase-button');
        const closeButton = target.closest('.payment-modal-close');
        const tab = target.closest('.payment-tab');

        if (purchaseButton) {
            const productDetailMatch = window.location.pathname.match(/\/product\/(\d+)/);
            if (!productDetailMatch) {
                showToast("결제 정보를 불러올 수 없습니다.");
                return;
            }
            const productId = productDetailMatch[1];
            paymentModal.dataset.productId = productId;
            const paymentImageKakao = document.getElementById('payment-image-kakao');
            const paymentImageToss = document.getElementById('payment-image-toss');

            paymentImageKakao.src = `/product/${productId}/kakao_income.png`;
            paymentImageToss.src = `/product/${productId}/toss_income.png`;

            paymentImageKakao.style.display = 'block';
            paymentImageToss.style.display = 'none';
            
            decodeQrCode(paymentImageKakao.src); // Decode QR from Kakao image initially

            paymentModal.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
            paymentModal.querySelector('.payment-tab[data-payment="kakao"]').classList.add('active');
            openModal(paymentModal);
        }

        if (closeButton) {
            closeModal(paymentModal);
        }

        if (tab) {
            const productId = paymentModal.dataset.productId;
            if (!productId) return;
            const paymentImageKakao = document.getElementById('payment-image-kakao');
            const paymentImageToss = document.getElementById('payment-image-toss');
            const paymentMethod = tab.dataset.payment;

            if (paymentMethod === 'kakao') {
                paymentImageKakao.style.display = 'block';
                paymentImageToss.style.display = 'none';
                decodeQrCode(paymentImageKakao.src);
            } else if (paymentMethod === 'toss') {
                paymentImageKakao.style.display = 'none';
                paymentImageToss.style.display = 'block';
                decodeQrCode(paymentImageToss.src);
            }

            paymentModal.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        }
    }

    function globalClickHandler(event) {
        const target = event.target;

        const shareButton = target.closest('#share-button');
        if (shareButton) {
            event.preventDefault();
            handleShareButtonClick(shareButton);
            return;
        }

        const purchaseButton = target.closest('.purchase-button');
        const paymentModalClose = target.closest('.payment-modal-close');
        const paymentTab = target.closest('.payment-tab');
        if (purchaseButton || paymentModalClose || paymentTab) {
            handlePaymentModal(target);
            return;
        }

        const openStandardTerms = target.closest('#open-standard-terms');
        if (openStandardTerms) {
            event.preventDefault();
            openModal(modals['standard-terms-modal']);
            return;
        }

        const openSpecialTerms = target.closest('#open-special-terms');
        if (openSpecialTerms) {
            event.preventDefault();
            openModal(modals['special-terms-modal']);
            return;
        }
        
        const closeButton = target.closest('.close-button');
        if (closeButton) {
            closeModal(target.closest('.modal'));
            return;
        }

        const menuToggle = target.closest('.menu-toggle');
        if (menuToggle) {
            const navMenu = document.getElementById('nav-menu');
            navMenu.classList.toggle('active');
            menuToggle.classList.toggle('active');
            return;
        }

        const anchor = target.closest('a');
        if (anchor) {
            if (anchor.closest('.sold-out')) {
                event.preventDefault();
                showToast('해당 상품은 판매가 종료되었습니다.');
                return;
            }

            const href = anchor.getAttribute('href');
            const isInternalPageLink = href && !href.startsWith('#') && !href.startsWith('http') && !href.startsWith('tel:') && !href.startsWith('mailto:') && anchor.target !== '_blank';

            if (isInternalPageLink) {
                event.preventDefault();
                history.pushState(null, '', href);
                handleRouting();
                return;
            }

            if (href && href.startsWith('#') && href.length > 1) {
                event.preventDefault();
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
                return;
            }
            
            if (anchor.classList.contains('nav-link') && !anchor.classList.contains('dropdown-toggle')) {
                const navMenu = document.getElementById('nav-menu');
                if (navMenu?.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    document.querySelector('.menu-toggle')?.classList.remove('active');
                }
            }
        }
    }

    // --- INITIALIZATION ---
    (function() {
        const redirect = sessionStorage.getItem('redirect');
        if (redirect) {
            sessionStorage.removeItem('redirect');
            if (redirect !== window.location.pathname) {
                history.replaceState(null, '', redirect);
            }
        }
    })();

    document.addEventListener('click', globalClickHandler);
    window.addEventListener('popstate', handleRouting);
    window.addEventListener('click', (event) => {
        if (event.target.matches('.modal')) {
            closeModal(event.target);
        }
    });

    initializeStickyFooterLayoutManager();

    Promise.all([
        loadModal('standard-terms-modal', '/terms/modal_standard_terms.html'),
        loadModal('special-terms-modal', '/terms/modal_special_terms.html')
    ]).then(() => {
        handleRouting();
    });
});