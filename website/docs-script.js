// Documentation JavaScript functionality

document.addEventListener('DOMContentLoaded', function () {
  initializeSidebarNavigation();
  initializeTabSwitching();
  initializeCodeCopying();
  initializeSearch();
  initializeSmoothScrolling();
});

// Sidebar Navigation
function initializeSidebarNavigation() {
  const sidebarLinks = document.querySelectorAll('.sidebar-link');
  const sections = document.querySelectorAll('.docs-section');

  // Update active link based on scroll position
  function updateActiveLink() {
    let current = '';
    sections.forEach((section) => {
      const sectionTop = section.offsetTop - 150;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    sidebarLinks.forEach((link) => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  }

  // Initial call and scroll listener
  updateActiveLink();
  window.addEventListener('scroll', updateActiveLink);

  // Click handlers for sidebar links
  sidebarLinks.forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetSection = document.getElementById(targetId);

      if (targetSection) {
        const offsetTop = targetSection.offsetTop - 120;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth',
        });
      }
    });
  });
}

// Tab Switching for Installation
function initializeTabSwitching() {
  window.showTab = function (tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach((content) => {
      content.classList.remove('active');
    });

    // Remove active class from all buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach((btn) => {
      btn.classList.remove('active');
    });

    // Show selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
      selectedTab.classList.add('active');
    }

    // Add active class to clicked button
    const clickedButton = event.target;
    clickedButton.classList.add('active');
  };
}

// Code Copying Functionality
function initializeCodeCopying() {
  window.copyCode = function (button) {
    const codeBlock = button.closest('.code-block');
    const code = codeBlock.querySelector('pre code');

    if (code) {
      const text = code.textContent;

      // Use modern clipboard API if available
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            showCopyFeedback(button, 'Copied!');
          })
          .catch(() => {
            fallbackCopyText(text, button);
          });
      } else {
        fallbackCopyText(text, button);
      }
    }
  };

  function fallbackCopyText(text, button) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      showCopyFeedback(button, 'Copied!');
    } catch (err) {
      showCopyFeedback(button, 'Failed to copy');
    }

    document.body.removeChild(textArea);
  }

  function showCopyFeedback(button, message) {
    const originalText = button.textContent;
    button.textContent = message;
    button.style.background = '#10b981';

    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = '';
    }, 2000);
  }
}

// Search Functionality
function initializeSearch() {
  const searchInput = document.getElementById('docs-search');
  if (!searchInput) return;

  let searchTimeout;

  searchInput.addEventListener('input', function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(this.value.toLowerCase().trim());
    }, 300);
  });

  function performSearch(query) {
    const sections = document.querySelectorAll('.docs-section');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    if (!query) {
      // Show all sections and links
      sections.forEach((section) => {
        section.style.display = 'block';
      });
      sidebarLinks.forEach((link) => {
        link.style.display = 'block';
      });
      return;
    }

    // Search through sections
    sections.forEach((section) => {
      const content = section.textContent.toLowerCase();
      const title = section.querySelector('h1')?.textContent.toLowerCase() || '';

      if (content.includes(query) || title.includes(query)) {
        section.style.display = 'block';
        highlightSearchTerms(section, query);
      } else {
        section.style.display = 'none';
      }
    });

    // Update sidebar links
    sidebarLinks.forEach((link) => {
      const linkText = link.textContent.toLowerCase();
      const targetId = link.getAttribute('href').substring(1);
      const targetSection = document.getElementById(targetId);

      if (linkText.includes(query) || (targetSection && targetSection.style.display !== 'none')) {
        link.style.display = 'block';
      } else {
        link.style.display = 'none';
      }
    });
  }

  function highlightSearchTerms(element, query) {
    // Simple highlighting - in a production app, you'd want more sophisticated highlighting
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);

    const textNodes = [];
    let node;

    while ((node = walker.nextNode())) {
      if (node.parentElement.tagName !== 'CODE' && node.parentElement.tagName !== 'PRE') {
        textNodes.push(node);
      }
    }

    textNodes.forEach((textNode) => {
      const text = textNode.textContent;
      const regex = new RegExp(`(${query})`, 'gi');

      if (regex.test(text)) {
        const highlightedText = text.replace(regex, '<mark>$1</mark>');
        const span = document.createElement('span');
        span.innerHTML = highlightedText;
        textNode.parentNode.replaceChild(span, textNode);
      }
    });
  }
}

// Smooth Scrolling for Anchor Links
function initializeSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        const offsetTop = targetElement.offsetTop - 120;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth',
        });
      }
    });
  });
}

// Syntax highlighting disabled to prevent rendering issues
// Code blocks will use the default styling from CSS
function addSyntaxHighlighting() {
  // Syntax highlighting disabled - using clean code display instead
  return;
}

// Initialize syntax highlighting after DOM is loaded
document.addEventListener('DOMContentLoaded', addSyntaxHighlighting);

// Mobile menu functionality (if needed)
function initializeMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');

  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', function () {
      navLinks.classList.toggle('active');
      this.classList.toggle('active');
    });
  }
}

// Initialize mobile menu
document.addEventListener('DOMContentLoaded', initializeMobileMenu);

// Add scroll-to-top functionality
function addScrollToTop() {
  const scrollBtn = document.createElement('button');
  scrollBtn.innerHTML = '↑';
  scrollBtn.className = 'scroll-to-top';
  scrollBtn.style.cssText = `
        position: fixed;
        bottom: 2rem;
        right: 2rem;
        width: 3rem;
        height: 3rem;
        border-radius: 50%;
        background: #3b82f6;
        color: white;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1000;
    `;

  document.body.appendChild(scrollBtn);

  window.addEventListener('scroll', function () {
    if (window.scrollY > 500) {
      scrollBtn.style.opacity = '1';
    } else {
      scrollBtn.style.opacity = '0';
    }
  });

  scrollBtn.addEventListener('click', function () {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  });
}

// Initialize scroll to top
document.addEventListener('DOMContentLoaded', addScrollToTop);
