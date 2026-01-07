// Smooth scroll animations and interactions
document.addEventListener('DOMContentLoaded', function () {
  // Intersection Observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');

        // Add staggered animation for layer features
        const features = entry.target.querySelectorAll(
          '.feature-item, .module-item, .guardrail-item'
        );
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
  layerSections.forEach((section) => {
    observer.observe(section);

    // Initially hide feature items for staggered animation
    const features = section.querySelectorAll('.feature-item, .module-item, .guardrail-item');
    features.forEach((feature) => {
      feature.style.opacity = '0';
      feature.style.transform = 'translateX(-20px)';
      feature.style.transition = 'all 0.5s ease';
    });
  });

  // Observe feature cards
  const featureCards = document.querySelectorAll('.feature-card');
  featureCards.forEach((card) => {
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
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        const offsetTop = target.offsetTop - 80; // Account for fixed navbar
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth',
        });
      }
    });
  });

  // Layer progression animation - simplified
  const layerProgressObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    },
    {
      threshold: 0.3,
      rootMargin: '0px 0px -100px 0px',
    }
  );

  // Observe layers for progression animation
  layerSections.forEach((section) => {
    layerProgressObserver.observe(section);
    section.style.opacity = '0';
    section.style.transform = 'translateY(30px)';
    section.style.transition = 'all 0.6s ease';
  });

  // Interactive hover effects for visual cards
  const visualCards = document.querySelectorAll('.visual-card');
  visualCards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.02)';
      card.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.15)';
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)';
      card.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.1)';
    });
  });

  // Result section counter animation
  const resultSection = document.querySelector('.result-section');
  const resultObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
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
    },
    { threshold: 0.5 }
  );

  if (resultSection) {
    resultObserver.observe(resultSection);

    // Initially hide result items
    const resultItems = resultSection.querySelectorAll('.result-item');
    resultItems.forEach((item) => {
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

// Contact form handling
document.addEventListener('DOMContentLoaded', function () {
  const contactForm = document.querySelector('.demo-request-form');

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(contactForm);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        company: formData.get('company'),
        plan: formData.get('plan'),
        message: formData.get('message'),
      };

      // Show loading state
      const submitButton = contactForm.querySelector('button[type="submit"]');
      const originalText = submitButton.textContent;
      submitButton.textContent = 'Sending...';
      submitButton.disabled = true;

      // Simulate form submission (replace with actual endpoint)
      setTimeout(() => {
        // Create mailto link with form data
        const subject = encodeURIComponent(`Lattice Demo Request - ${data.plan} Plan`);
        const body = encodeURIComponent(`
Name: ${data.name}
Email: ${data.email}
Company: ${data.company}
Interested Plan: ${data.plan}

Message:
${data.message}

---
This is an automated message from the Lattice website contact form.
                `);

        const mailtoLink = `mailto:bhavdeepsachdeva@gmail.com?subject=${subject}&body=${body}`;

        // Open email client
        window.location.href = mailtoLink;

        // Show success message
        showFormMessage(
          "Thank you! Your demo request has been sent. We'll get back to you within 24 hours.",
          'success'
        );

        // Reset form
        contactForm.reset();

        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
      }, 1000);
    });
  }

  function showFormMessage(message, type) {
    // Remove existing message
    const existingMessage = document.querySelector('.form-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    // Create new message
    const messageDiv = document.createElement('div');
    messageDiv.className = `form-message form-message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
            padding: 1rem;
            border-radius: 6px;
            margin-top: 1rem;
            font-weight: 500;
            ${
              type === 'success'
                ? 'background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.2);'
                : 'background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2);'
            }
        `;

    // Insert message after form
    contactForm.parentNode.insertBefore(messageDiv, contactForm.nextSibling);

    // Remove message after 5 seconds
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }
});

// Pricing card animations
document.addEventListener('DOMContentLoaded', function () {
  const pricingCards = document.querySelectorAll('.pricing-card');

  const pricingObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, index * 150);
        }
      });
    },
    { threshold: 0.2 }
  );

  pricingCards.forEach((card) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'all 0.6s ease';
    pricingObserver.observe(card);
  });
});

// Testimonial animations
document.addEventListener('DOMContentLoaded', function () {
  const testimonialCards = document.querySelectorAll('.testimonial-card');

  const testimonialObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateX(0)';
          }, index * 200);
        }
      });
    },
    { threshold: 0.3 }
  );

  testimonialCards.forEach((card) => {
    card.style.opacity = '0';
    card.style.transform = 'translateX(-30px)';
    card.style.transition = 'all 0.6s ease';
    testimonialObserver.observe(card);
  });
});

// FAQ animations
document.addEventListener('DOMContentLoaded', function () {
  const faqItems = document.querySelectorAll('.faq-item');

  const faqObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, index * 100);
        }
      });
    },
    { threshold: 0.5 }
  );

  faqItems.forEach((item) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'all 0.5s ease';
    faqObserver.observe(item);
  });
});
