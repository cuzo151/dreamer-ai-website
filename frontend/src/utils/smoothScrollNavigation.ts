// Smooth scroll navigation and user journey enhancement utilities

export interface NavigationItem {
  id: string;
  label: string;
  section: string;
  order: number;
  required?: boolean;
}

export interface UserJourneyStep {
  step: number;
  section: string;
  title: string;
  description: string;
  cta?: string;
  nextStep?: string;
  completed: boolean;
  timestamp?: number;
}

/**
 * Enhanced smooth scroll navigation with user journey tracking
 */
export class SmoothScrollNavigation {
  private currentSection = '';
  private journeySteps: Map<string, UserJourneyStep> = new Map();
  private sectionObserver: IntersectionObserver | null = null;
  private navigationItems: NavigationItem[] = [
    { id: 'hero', label: 'Home', section: 'hero', order: 1, required: true },
    { id: 'video-showcase', label: 'Demo', section: 'video-showcase', order: 2 },
    { id: 'about', label: 'About', section: 'about', order: 3 },
    { id: 'industry-use-cases', label: 'Solutions', section: 'industry-use-cases', order: 4 },
    { id: 'capabilities', label: 'Capabilities', section: 'capabilities', order: 5 },
    { id: 'case-studies', label: 'Case Studies', section: 'case-studies', order: 6 },
    { id: 'ai-tools', label: 'AI Tools', section: 'ai-tools', order: 7 },
    { id: 'dashboard', label: 'Analytics', section: 'dashboard', order: 8 },
    { id: 'interactive', label: 'Try Demo', section: 'interactive', order: 9 },
    { id: 'contact', label: 'Contact', section: 'contact', order: 10 }
  ];

  constructor() {
    this.initializeJourney();
    this.setupSectionObserver();
    this.bindScrollEvents();
  }

  private initializeJourney() {
    const journeyData: UserJourneyStep[] = [
      {
        step: 1,
        section: 'hero',
        title: 'Welcome to Dreamer AI',
        description: 'Discover how AI can transform your business operations',
        cta: 'Explore Solutions',
        nextStep: 'video-showcase',
        completed: false
      },
      {
        step: 2,
        section: 'video-showcase',
        title: 'See AI in Action',
        description: 'Watch our AI solutions solve real business challenges',
        cta: 'Learn More About Us',
        nextStep: 'about',
        completed: false
      },
      {
        step: 3,
        section: 'about',
        title: 'Our Story',
        description: 'Learn about our mission to democratize AI for businesses',
        cta: 'View Industry Solutions',
        nextStep: 'industry-use-cases',
        completed: false
      },
      {
        step: 4,
        section: 'industry-use-cases',
        title: 'Industry Solutions',
        description: 'Explore AI applications tailored to your industry',
        cta: 'See Our Capabilities',
        nextStep: 'capabilities',
        completed: false
      },
      {
        step: 5,
        section: 'capabilities',
        title: 'Our AI Capabilities',
        description: 'Discover the full range of AI services we offer',
        cta: 'Read Success Stories',
        nextStep: 'case-studies',
        completed: false
      },
      {
        step: 6,
        section: 'case-studies',
        title: 'Success Stories',
        description: 'See how we\'ve helped other businesses succeed with AI',
        cta: 'Explore AI Tools',
        nextStep: 'ai-tools',
        completed: false
      },
      {
        step: 7,
        section: 'ai-tools',
        title: 'AI Tools Showcase',
        description: 'Discover our comprehensive suite of AI tools',
        cta: 'View Analytics',
        nextStep: 'dashboard',
        completed: false
      },
      {
        step: 8,
        section: 'dashboard',
        title: 'Performance Analytics',
        description: 'See the impact of AI on business metrics',
        cta: 'Try Interactive Demo',
        nextStep: 'interactive',
        completed: false
      },
      {
        step: 9,
        section: 'interactive',
        title: 'Interactive Demo',
        description: 'Experience our AI capabilities firsthand',
        cta: 'Schedule Consultation',
        nextStep: 'contact',
        completed: false
      },
      {
        step: 10,
        section: 'contact',
        title: 'Start Your AI Journey',
        description: 'Get in touch to discuss your AI transformation',
        cta: 'Contact Us Today',
        completed: false
      }
    ];

    journeyData.forEach(step => {
      this.journeySteps.set(step.section, step);
    });
  }

  private setupSectionObserver() {
    if ('IntersectionObserver' in window) {
      this.sectionObserver = new IntersectionObserver(
        this.handleSectionIntersection.bind(this),
        {
          root: null,
          rootMargin: '-20% 0px -60% 0px',
          threshold: 0.1
        }
      );

      // Observe all sections
      this.navigationItems.forEach(item => {
        const element = document.getElementById(item.id);
        if (element) {
          this.sectionObserver?.observe(element);
        }
      });
    }
  }

  private handleSectionIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const sectionId = entry.target.id;
        this.updateCurrentSection(sectionId);
        this.markStepCompleted(sectionId);
        this.updateNavigationState(sectionId);
      }
    });
  }

  private bindScrollEvents() {
    let scrollTimeout: NodeJS.Timeout;
    
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackScrollProgress();
      }, 100);
    });
  }

  private trackScrollProgress() {
    const scrolled = window.pageYOffset;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const scrollProgress = Math.min(scrolled / maxScroll, 1);

    // Update scroll indicator
    const indicator = document.querySelector('.scroll-progress');
    if (indicator) {
      (indicator as HTMLElement).style.transform = `scaleX(${scrollProgress})`;
    }

    // Track engagement milestones
    if (scrollProgress > 0.25 && !this.hasTrackedMilestone('25_percent')) {
      this.trackEngagementMilestone('25_percent', 'Scrolled 25%');
    }
    if (scrollProgress > 0.5 && !this.hasTrackedMilestone('50_percent')) {
      this.trackEngagementMilestone('50_percent', 'Scrolled 50%');
    }
    if (scrollProgress > 0.75 && !this.hasTrackedMilestone('75_percent')) {
      this.trackEngagementMilestone('75_percent', 'Scrolled 75%');
    }
    if (scrollProgress > 0.9 && !this.hasTrackedMilestone('90_percent')) {
      this.trackEngagementMilestone('90_percent', 'Scrolled 90%');
    }
  }

  private trackedMilestones = new Set<string>();
  private hasTrackedMilestone(milestone: string): boolean {
    return this.trackedMilestones.has(milestone);
  }

  private trackEngagementMilestone(milestone: string, description: string) {
    this.trackedMilestones.add(milestone);
    
    if (typeof gtag !== 'undefined') {
      gtag('event', 'scroll_milestone', {
        event_category: 'engagement',
        event_label: milestone,
        custom_parameter_1: description
      });
    }
  }

  scrollToSection(sectionId: string, offset = 80): Promise<void> {
    return new Promise((resolve) => {
      const element = document.getElementById(sectionId);
      if (!element) {
        resolve();
        return;
      }

      const targetPosition = element.offsetTop - offset;
      const startPosition = window.pageYOffset;
      const distance = targetPosition - startPosition;
      const duration = Math.min(Math.abs(distance) / 2, 800); // Max 800ms
      
      let startTime: number | null = null;

      const animation = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const progress = Math.min(timeElapsed / duration, 1);
        
        // Easing function (easeInOutCubic)
        const easeProgress = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        window.scrollTo(0, startPosition + distance * easeProgress);
        
        if (progress < 1) {
          requestAnimationFrame(animation);
        } else {
          this.updateCurrentSection(sectionId);
          resolve();
        }
      };

      requestAnimationFrame(animation);

      // Track navigation event
      if (typeof gtag !== 'undefined') {
        gtag('event', 'smooth_scroll_navigation', {
          event_category: 'navigation',
          event_label: sectionId
        });
      }
    });
  }

  private updateCurrentSection(sectionId: string) {
    if (this.currentSection !== sectionId) {
      this.currentSection = sectionId;
      this.broadcastSectionChange(sectionId);
    }
  }

  private markStepCompleted(sectionId: string) {
    const step = this.journeySteps.get(sectionId);
    if (step && !step.completed) {
      step.completed = true;
      step.timestamp = Date.now();
      this.saveUserProgress();
      
      // Track step completion
      if (typeof gtag !== 'undefined') {
        gtag('event', 'journey_step_completed', {
          event_category: 'user_journey',
          event_label: sectionId,
          value: step.step
        });
      }
    }
  }

  private updateNavigationState(sectionId: string) {
    // Update active navigation item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-section') === sectionId) {
        item.classList.add('active');
      }
    });

    // Show next step hint if available
    this.showNextStepHint(sectionId);
  }

  private showNextStepHint(currentSection: string) {
    const currentStep = this.journeySteps.get(currentSection);
    if (currentStep && currentStep.nextStep) {
      const nextStep = this.journeySteps.get(currentStep.nextStep);
      if (nextStep) {
        // This could trigger a subtle UI hint about the next step
        this.broadcastNextStepHint(nextStep);
      }
    }
  }

  private broadcastSectionChange(sectionId: string) {
    window.dispatchEvent(new CustomEvent('sectionChange', { 
      detail: { 
        section: sectionId,
        step: this.journeySteps.get(sectionId)
      }
    }));
  }

  private broadcastNextStepHint(nextStep: UserJourneyStep) {
    window.dispatchEvent(new CustomEvent('nextStepHint', { 
      detail: nextStep
    }));
  }

  getCurrentSection(): string {
    return this.currentSection;
  }

  getJourneyProgress(): { completed: number; total: number; percentage: number } {
    const completed = Array.from(this.journeySteps.values()).filter(step => step.completed).length;
    const total = this.journeySteps.size;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  }

  getNextSection(): string | null {
    const currentNavItem = this.navigationItems.find(item => item.section === this.currentSection);
    if (currentNavItem) {
      const nextItem = this.navigationItems.find(item => item.order === currentNavItem.order + 1);
      return nextItem ? nextItem.section : null;
    }
    return null;
  }

  getPreviousSection(): string | null {
    const currentNavItem = this.navigationItems.find(item => item.section === this.currentSection);
    if (currentNavItem) {
      const prevItem = this.navigationItems.find(item => item.order === currentNavItem.order - 1);
      return prevItem ? prevItem.section : null;
    }
    return null;
  }

  navigateNext(): Promise<void> {
    const nextSection = this.getNextSection();
    if (nextSection) {
      return this.scrollToSection(nextSection);
    }
    return Promise.resolve();
  }

  navigatePrevious(): Promise<void> {
    const previousSection = this.getPreviousSection();
    if (previousSection) {
      return this.scrollToSection(previousSection);
    }
    return Promise.resolve();
  }

  private saveUserProgress() {
    try {
      const progressData = Array.from(this.journeySteps.entries()).reduce((acc, [key, value]) => {
        acc[key] = {
          completed: value.completed,
          timestamp: value.timestamp
        };
        return acc;
      }, {} as Record<string, { completed: boolean; timestamp?: number }>);

      localStorage.setItem('dreamer-ai-journey-progress', JSON.stringify(progressData));
    } catch (error) {
      console.warn('Failed to save user progress:', error);
    }
  }

  loadUserProgress() {
    try {
      const saved = localStorage.getItem('dreamer-ai-journey-progress');
      if (saved) {
        const progressData = JSON.parse(saved);
        Object.entries(progressData).forEach(([sectionId, data]) => {
          const step = this.journeySteps.get(sectionId);
          if (step) {
            step.completed = (data as any).completed;
            step.timestamp = (data as any).timestamp;
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load user progress:', error);
    }
  }

  createNavigationMenu(): NavigationItem[] {
    return this.navigationItems.map(item => ({
      ...item,
      completed: this.journeySteps.get(item.section)?.completed || false
    })) as (NavigationItem & { completed: boolean })[];
  }

  // Keyboard navigation
  enableKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
      // Only handle navigation if no input is focused
      if (document.activeElement?.tagName === 'INPUT' || 
          document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
        case 'j':
          e.preventDefault();
          this.navigateNext();
          break;
        case 'ArrowUp':
        case 'k':
          e.preventDefault();
          this.navigatePrevious();
          break;
        case 'Home':
          e.preventDefault();
          this.scrollToSection('hero');
          break;
        case 'End':
          e.preventDefault();
          this.scrollToSection('contact');
          break;
      }
    });
  }

  destroy() {
    this.sectionObserver?.disconnect();
    window.removeEventListener('scroll', this.trackScrollProgress);
  }
}

// Create and export the global navigation instance
export const smoothNavigation = new SmoothScrollNavigation();

// Initialize on DOM content loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    smoothNavigation.loadUserProgress();
    smoothNavigation.enableKeyboardNavigation();
  });
} else {
  smoothNavigation.loadUserProgress();
  smoothNavigation.enableKeyboardNavigation();
}

declare global {
  function gtag(...args: any[]): void;
}