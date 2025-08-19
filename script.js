document.addEventListener('DOMContentLoaded', () => {
    // Modal functionality
    const modal = document.getElementById("standard-terms-modal");
    const btn = document.getElementById("open-standard-terms");
    const closeBtn = document.querySelector(".close-button");
    const modalContent = document.querySelector(".modal-content");

    if (btn) {
        btn.onclick = function(e) {
            e.preventDefault();
            if (modal) {
                modal.style.display = "block";
                document.body.style.overflow = "hidden";
            }
        }
    }

    if (closeBtn) {
        closeBtn.onclick = function() {
            if (modal) {
                modal.style.display = "none";
                document.body.style.overflow = "auto";
            }
        }
    }

    // Keep close button fixed on scroll
    if (modalContent) {
        modalContent.addEventListener('scroll', () => {
            if (closeBtn) {
                const topOffset = 1.5 * 16; // 1.5rem in pixels (assuming 1rem = 16px)
                closeBtn.style.top = `${modalContent.scrollTop + topOffset}px`;
            }
        });
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

    // Close modal when clicking outside
    window.addEventListener('click', e => {
        if (e.target == modal) {
            modal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });

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
            if (this.id === 'open-standard-terms' || this.classList.contains('dropdown-toggle')) {
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
