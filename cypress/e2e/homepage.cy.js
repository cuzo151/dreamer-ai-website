describe('Homepage E2E Tests', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Page Load and Performance', () => {
    it('should load the homepage successfully', () => {
      cy.get('[data-testid="hero-section"]').should('be.visible');
      cy.contains('Dreamer AI Solutions').should('be.visible');
      cy.measurePerformance('Homepage Load');
    });

    it('should have all main sections', () => {
      const sections = [
        'hero-section',
        'capabilities-section',
        'interactive-section',
        'video-showcase-section',
        'contact-section',
        'footer-section'
      ];

      for (const section of sections) {
        cy.get(`[data-testid="${section}"]`).should('exist');
      }
    });
  });

  describe('Navigation', () => {
    it('should navigate to different sections via navbar', () => {
      // Test navigation links
      const navItems = [
        { link: 'capabilities', section: 'capabilities' },
        { link: 'demos', section: 'interactive' },
        { link: 'showcase', section: 'video-showcase' },
        { link: 'contact', section: 'contact' }
      ];

      for (const { link, section } of navItems) {
        cy.get(`[data-testid="nav-${link}"]`).click();
        cy.url().should('include', `#${section}`);
        cy.get(`#${section}`).should('be.visible');
        cy.shouldBeVisibleInViewport(`#${section}`);
      }
    });

    it('should handle smooth scrolling', () => {
      cy.get('[data-testid="nav-contact"]').click();
      cy.wait(1000); // Wait for smooth scroll
      cy.window().then((win) => {
        expect(win.scrollY).to.be.greaterThan(100);
      });
    });

    it('should show sticky navbar on scroll', () => {
      cy.scrollTo(0, 500);
      cy.get('[data-testid="navbar"]').should('have.class', 'sticky');
      cy.get('[data-testid="navbar"]').should('have.css', 'position', 'fixed');
    });
  });

  describe('Hero Section', () => {
    it('should display hero content correctly', () => {
      cy.get('[data-testid="hero-title"]').should('contain', 'Transform Your Law Firm');
      cy.get('[data-testid="hero-subtitle"]').should('contain', 'AI-Powered');
      cy.get('[data-testid="hero-cta-primary"]').should('be.visible');
      cy.get('[data-testid="hero-cta-secondary"]').should('be.visible');
    });

    it('should handle CTA button clicks', () => {
      // Primary CTA
      cy.get('[data-testid="hero-cta-primary"]').click();
      cy.get('[data-testid="auth-modal"]').should('be.visible');
      cy.get('[data-testid="close-modal"]').click();

      // Secondary CTA
      cy.get('[data-testid="hero-cta-secondary"]').click();
      cy.url().should('include', '#interactive');
    });

    it('should play background video', () => {
      cy.get('[data-testid="hero-video"]').should('exist');
      cy.get('[data-testid="hero-video"]').should('have.prop', 'paused', false);
    });
  });

  describe('Capabilities Section', () => {
    it('should display all capability cards', () => {
      const capabilities = [
        'Legal Document Automation',
        'Voice Transcription',
        'Intelligent Lead Generation',
        'Advanced Analytics'
      ];

      for (const capability of capabilities) {
        cy.contains(capability).should('be.visible');
      }
    });

    it('should animate cards on hover', () => {
      cy.get('[data-testid="capability-card"]').first().trigger('mouseenter');
      cy.get('[data-testid="capability-card"]').first().should('have.class', 'hover:scale-105');
    });

    it('should show learn more buttons', () => {
      cy.get('[data-testid="capability-card"]').each(($card) => {
        cy.wrap($card).find('[data-testid="learn-more-button"]').should('exist');
      });
    });
  });

  describe('Interactive Demos Section', () => {
    it('should switch between different demos', () => {
      cy.scrollTo('#interactive');

      // Test demo switching
      const demos = ['document', 'voice', 'voiceclone', 'leads'];
      
      for (const demo of demos) {
        cy.get(`[data-testid="demo-button-${demo}"]`).click();
        cy.get(`[data-testid="demo-content-${demo}"]`).should('be.visible');
      }
    });

    it('should handle document analysis demo', () => {
      cy.scrollTo('#interactive');
      cy.get('[data-testid="demo-button-document"]').click();

      // Enter sample text
      cy.get('[data-testid="document-input"]').type('This is a sample legal document for analysis.');
      
      // Mock API response
      cy.mockApiResponse('POST', 'showcase/analyze-document', {
        analysis: 'Document type: Legal Contract',
        confidence: 0.95,
        key_terms: ['agreement', 'party', 'terms']
      });

      // Analyze
      cy.get('[data-testid="analyze-button"]').click();
      
      // Check results
      cy.get('[data-testid="demo-result"]').should('be.visible');
      cy.get('[data-testid="demo-result"]').should('contain', 'Legal Contract');
    });

    it('should handle lead generation demo', () => {
      cy.scrollTo('#interactive');
      cy.get('[data-testid="demo-button-leads"]').click();

      // Fill form
      cy.get('[data-testid="company-type-input"]').type('Law Firms');
      cy.get('[data-testid="industry-select"]').select('Legal Services');
      cy.get('[data-testid="size-select"]').select('11-50');

      // Generate leads
      cy.get('[data-testid="generate-leads-button"]').click();

      // Check results
      cy.get('[data-testid="demo-result"]').should('be.visible');
      cy.get('[data-testid="lead-card"]').should('have.length.greaterThan', 0);
    });
  });

  describe('Video Showcase Section', () => {
    it('should display video thumbnails', () => {
      cy.scrollTo('#video-showcase');
      cy.get('[data-testid="video-thumbnail"]').should('have.length.greaterThan', 0);
    });

    it('should play video on click', () => {
      cy.scrollTo('#video-showcase');
      cy.get('[data-testid="video-thumbnail"]').first().click();
      cy.get('[data-testid="video-modal"]').should('be.visible');
      cy.get('[data-testid="video-player"]').should('exist');
    });

    it('should close video modal', () => {
      cy.scrollTo('#video-showcase');
      cy.get('[data-testid="video-thumbnail"]').first().click();
      cy.get('[data-testid="close-video-modal"]').click();
      cy.get('[data-testid="video-modal"]').should('not.exist');
    });
  });

  describe('Contact Section', () => {
    it('should display contact form', () => {
      cy.scrollTo('#contact');
      cy.get('[data-testid="contact-form"]').should('be.visible');
    });

    it('should submit contact form successfully', () => {
      cy.scrollTo('#contact');

      // Mock API response
      cy.mockApiResponse('POST', 'contact/submit', {
        success: true,
        message: 'Thank you for your inquiry'
      });

      // Fill form
      cy.fillForm({
        name: 'John Doe',
        email: 'john@example.com',
        company: 'Test Law Firm',
        message: 'I would like to learn more about your services'
      });

      cy.get('[data-testid="inquiry-type-select"]').select('demo');
      cy.submitForm();

      // Check success message
      cy.shouldShowSuccessMessage('Thank you for contacting us');
    });

    it('should validate required fields', () => {
      cy.scrollTo('#contact');
      cy.submitForm();

      // Check validation messages
      cy.get('[data-testid="name-error"]').should('be.visible');
      cy.get('[data-testid="email-error"]').should('be.visible');
      cy.get('[data-testid="message-error"]').should('be.visible');
    });

    it('should display contact information', () => {
      cy.scrollTo('#contact');
      cy.contains('support@dreamerai.io').should('be.visible');
      cy.contains('jlasalle@dreamerai.io').should('be.visible');
    });
  });

  describe('Footer', () => {
    it('should display footer links', () => {
      cy.scrollTo('bottom');
      
      const footerLinks = [
        'About Us',
        'Services',
        'Privacy Policy',
        'Terms of Service'
      ];

      for (const link of footerLinks) {
        cy.contains(link).should('be.visible');
      }
    });

    it('should display social media links', () => {
      cy.scrollTo('bottom');
      
      const socialLinks = ['linkedin', 'twitter', 'github'];
      for (const social of socialLinks) {
        cy.get(`[data-testid="social-${social}"]`).should('be.visible');
      }
    });

    it('should show copyright information', () => {
      cy.scrollTo('bottom');
      cy.contains('© 2024 Dreamer AI Solutions').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should work on mobile devices', () => {
      cy.viewport('iphone-x');

      // Check mobile menu
      cy.get('[data-testid="mobile-menu-button"]').should('be.visible');
      cy.get('[data-testid="desktop-nav"]').should('not.be.visible');

      // Open mobile menu
      cy.get('[data-testid="mobile-menu-button"]').click();
      cy.get('[data-testid="mobile-menu"]').should('be.visible');

      // Navigate via mobile menu
      cy.get('[data-testid="mobile-nav-contact"]').click();
      cy.url().should('include', '#contact');
    });

    it('should work on tablet devices', () => {
      cy.viewport('ipad-2');

      // Check layout
      cy.get('[data-testid="hero-section"]').should('be.visible');
      cy.get('[data-testid="capability-card"]').should('have.length.greaterThan', 0);
    });

    it('should handle orientation changes', () => {
      cy.viewport('ipad-2', 'portrait');
      cy.get('[data-testid="hero-section"]').should('be.visible');

      cy.viewport('ipad-2', 'landscape');
      cy.get('[data-testid="hero-section"]').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      cy.get('h1').should('have.length', 1);
      cy.get('h2').should('have.length.greaterThan', 0);
    });

    it('should have alt text for images', () => {
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    });

    it('should have proper form labels', () => {
      cy.scrollTo('#contact');
      
      cy.get('label[for="name"]').should('exist');
      cy.get('label[for="email"]').should('exist');
      cy.get('label[for="message"]').should('exist');
    });

    it('should be keyboard navigable', () => {
      // Tab through navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'nav-capabilities');
      
      cy.focused().tab();
      cy.focused().should('have.attr', 'data-testid', 'nav-demos');
    });
  });

  describe('Animations and Interactions', () => {
    it('should animate elements on scroll', () => {
      // Scroll to trigger animations
      cy.scrollTo('#capabilities');
      cy.wait(500);
      
      cy.get('[data-testid="capability-card"]').first()
        .should('have.class', 'animate-in');
    });

    it('should handle parallax effects', () => {
      const initialPosition = 0;
      
      cy.window().then((win) => {
        const element = win.document.querySelector('[data-testid="parallax-element"]');
        if (element) {
          const {transform} = win.getComputedStyle(element);
          cy.scrollTo(0, 500);
          cy.wait(100);
          const newTransform = win.getComputedStyle(element).transform;
          expect(transform).to.not.equal(newTransform);
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      cy.mockApiResponse('POST', 'contact/submit', 
        { error: 'Service unavailable' }, 
        503
      );

      cy.scrollTo('#contact');
      cy.fillForm({
        name: 'Test User',
        email: 'test@example.com',
        message: 'Test message'
      });
      cy.submitForm();

      cy.shouldShowErrorMessage('Something went wrong');
    });

    it('should handle network errors', () => {
      cy.intercept('**/api/**', { forceNetworkError: true }).as('networkError');

      cy.scrollTo('#interactive');
      cy.get('[data-testid="demo-button-document"]').click();
      cy.get('[data-testid="document-input"]').type('Test');
      cy.get('[data-testid="analyze-button"]').click();

      cy.shouldShowErrorMessage('Network error');
    });
  });
});