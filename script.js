document.addEventListener('DOMContentLoaded', () => {
    // Modal functionality
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

});