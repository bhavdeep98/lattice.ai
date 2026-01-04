// Smooth scroll animations and interactions
document.addEventListener('DOMContentLoaded', function() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Add staggered animation for layer features
                const features = entry.target.querySelectorAll('.feature-item, .module-item, .guardrail-item');
                features.forEach((feature, index) => {
                    setTimeout(() => {
                        feature.style.opacity = '1';
                        feature.style.transform = 'translateX(0)';
                    }, index * 100);
                });
            }
        });
    }, observerOptions);

    // Observe all layer sections
    const layerSections = document.querySelectorAll('.layer-section');
    layerSections.forEach(section => {
        observer.observe(section);
        
        // Initially hide feature items for staggered animation
        const features = section.querySelectorAll('.feature-item, .module-item, .guardrail-item');
        features.forEach(feature => {
            feature.style.opacity = '0';
            feature.style.transform = 'translateX(-20px)';
            feature.style.transition = 'all 0.5s ease';
        });
    });

    // Observe feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        observer.observe(card);
    });

    // Navbar scroll effect
    let lastScrollTop = 0;
    const navbar = document.querySelector('.nav');
    
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            // Scrolling down
            navbar.style.transform = 'translateY(-100%)';
        } else {
            // Scrolling up
            navbar.style.transform = 'translateY(0)';
        }
        
        // Add background blur when scrolled
        if (scrollTop > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.backdropFilter = 'blur(10px)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        }
        
        lastScrollTop = scrollTop;
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Parallax effect for hero section
    const hero = document.querySelector('.hero');
    const heroCode = document.querySelector('.hero-code');
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        if (heroCode && scrolled < hero.offsetHeight) {
            heroCode.style.transform = `translateY(${rate}px)`;
        }
    });

    // Code typing animation
    const codeContent = document.querySelector('.code-content pre code');
    if (codeContent) {
        const originalText = codeContent.innerHTML;
        codeContent.innerHTML = '';
        
        let i = 0;
        const typeWriter = () => {
            if (i < originalText.length) {
                codeContent.innerHTML += originalText.charAt(i);
                i++;
                setTimeout(typeWriter, 20);
            }
        };
        
        // Start typing animation after a delay
        setTimeout(typeWriter, 1000);
    }

    // Layer progression animation
    const layerProgressObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const layerNumber = entry.target.dataset.layer;
                
                // Add progressive reveal effect
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) scale(1)';
                }, layerNumber * 200);
                
                // Animate visual cards with different effects based on layer
                const visualCard = entry.target.querySelector('.visual-card');
                if (visualCard) {
                    setTimeout(() => {
                        switch(layerNumber) {
                            case '1':
                                visualCard.style.animation = 'slideInLeft 0.8s ease forwards';
                                break;
                            case '2':
                                visualCard.style.animation = 'slideInRight 0.8s ease forwards';
                                break;
                            case '3':
                                visualCard.style.animation = 'scaleIn 0.8s ease forwards';
                                break;
                        }
                    }, layerNumber * 300);
                }
            }
        });
    }, {
        threshold: 0.3,
        rootMargin: '0px 0px -100px 0px'
    });

    // Observe layers for progression animation
    layerSections.forEach(section => {
        layerProgressObserver.observe(section);
        section.style.opacity = '0';
        section.style.transform = 'translateY(50px) scale(0.95)';
        section.style.transition = 'all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    });

    // Interactive hover effects for visual cards
    const visualCards = document.querySelectorAll('.visual-card');
    visualCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'scale(1.05) rotateY(5deg)';
            card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.2)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'scale(1) rotateY(0deg)';
            card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
        });
    });

    // Result section counter animation
    const resultSection = document.querySelector('.result-section');
    const resultObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const resultItems = entry.target.querySelectorAll('.result-item');
                resultItems.forEach((item, index) => {
                    setTimeout(() => {
                        item.style.opacity = '1';
                        item.style.transform = 'translateY(0) scale(1)';
                    }, index * 150);
                });
            }
        });
    }, { threshold: 0.5 });

    if (resultSection) {
        resultObserver.observe(resultSection);
        
        // Initially hide result items
        const resultItems = resultSection.querySelectorAll('.result-item');
        resultItems.forEach(item => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(30px) scale(0.8)';
            item.style.transition = 'all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        });
    }

    // Add scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #007AFF, #5856D6);
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInLeft {
        from {
            opacity: 0;
            transform: translateX(-50px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateX(0) scale(1);
        }
    }

    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(50px) scale(0.9);
        }
        to {
            opacity: 1;
            transform: translateX(0) scale(1);
        }
    }

    @keyframes scaleIn {
        from {
            opacity: 0;
            transform: scale(0.8) rotateY(10deg);
        }
        to {
            opacity: 1;
            transform: scale(1) rotateY(0deg);
        }
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .feature-card {
        animation: fadeInUp 0.6s ease forwards;
        opacity: 0;
    }

    .feature-card:nth-child(1) { animation-delay: 0.1s; }
    .feature-card:nth-child(2) { animation-delay: 0.2s; }
    .feature-card:nth-child(3) { animation-delay: 0.3s; }
    .feature-card:nth-child(4) { animation-delay: 0.4s; }
`;
document.head.appendChild(style);