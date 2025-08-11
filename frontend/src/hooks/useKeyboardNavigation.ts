import { useEffect, useCallback, useRef, useState } from 'react';

interface KeyboardNavigationOptions {
  enabled?: boolean;
  focusableElementsSelector?: string;
  skipToMainContent?: boolean;
  announceNavigation?: boolean;
  customKeyBindings?: Record<string, () => void>;
  focusRingColor?: string;
  enableVirtualCursor?: boolean;
}

interface FocusableElement {
  element: HTMLElement;
  index: number;
  section?: string;
}

export const useKeyboardNavigation = (options: KeyboardNavigationOptions = {}) => {
  const {
    enabled = true,
    focusableElementsSelector = `
      a[href], 
      button:not([disabled]), 
      input:not([disabled]), 
      textarea:not([disabled]), 
      select:not([disabled]), 
      [tabindex]:not([tabindex="-1"]):not([disabled]),
      [role="button"]:not([disabled]),
      [role="link"]:not([disabled])
    `,
    skipToMainContent = true,
    announceNavigation = true,
    customKeyBindings = {},
    focusRingColor = '#0096FF',
    enableVirtualCursor = true
  } = options;

  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);
  const [focusableElements, setFocusableElements] = useState<FocusableElement[]>([]);
  const [isVirtualCursorActive, setIsVirtualCursorActive] = useState(false);
  const [keyboardMode, setKeyboardMode] = useState(false);
  
  const focusIndicatorRef = useRef<HTMLDivElement | null>(null);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  // Screen reader announcements
  const announceToScreenReader = useCallback((message: string) => {
    if (!announceNavigation) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    announcement.textContent = message;
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [announceNavigation]);

  // Update focusable elements
  const updateFocusableElements = useCallback(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(focusableElementsSelector)
    ).filter(element => {
      // Filter out hidden elements
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        !element.hasAttribute('aria-hidden')
      );
    });

    const focusableList: FocusableElement[] = elements.map((element, index) => {
      // Determine section based on closest section element or data attribute
      const section = element.closest('[data-section]')?.getAttribute('data-section') ||
                     element.closest('section')?.id ||
                     'main';

      return { element, index, section };
    });

    setFocusableElements(focusableList);
  }, [focusableElementsSelector]);

  // Create focus indicator
  const createFocusIndicator = useCallback(() => {
    if (focusIndicatorRef.current) return focusIndicatorRef.current;

    const indicator = document.createElement('div');
    indicator.id = 'keyboard-focus-indicator';
    indicator.style.cssText = `
      position: absolute;
      pointer-events: none;
      border: 2px solid ${focusRingColor};
      border-radius: 4px;
      background: transparent;
      box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.5), 0 0 8px ${focusRingColor}40;
      z-index: 9999;
      opacity: 0;
      transition: all 0.15s ease-in-out;
      box-sizing: border-box;
    `;

    document.body.appendChild(indicator);
    focusIndicatorRef.current = indicator;
    return indicator;
  }, [focusRingColor]);

  // Update focus indicator position
  const updateFocusIndicator = useCallback((element: HTMLElement) => {
    const indicator = createFocusIndicator();
    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset;
    const scrollY = window.pageYOffset;

    indicator.style.left = `${rect.left + scrollX - 2}px`;
    indicator.style.top = `${rect.top + scrollY - 2}px`;
    indicator.style.width = `${rect.width + 4}px`;
    indicator.style.height = `${rect.height + 4}px`;
    indicator.style.opacity = '1';

    // Hide after delay when not in virtual cursor mode
    if (!isVirtualCursorActive) {
      setTimeout(() => {
        if (indicator.style.opacity === '1') {
          indicator.style.opacity = '0';
        }
      }, 2000);
    }
  }, [createFocusIndicator, isVirtualCursorActive]);

  // Focus element with visual indication
  const focusElement = useCallback((index: number, announceChange = true) => {
    if (index < 0 || index >= focusableElements.length) return;

    const { element, section } = focusableElements[index];
    
    // Scroll element into view
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest'
    });

    // Focus the element
    element.focus();
    lastFocusedElement.current = element;

    // Update visual indicator
    updateFocusIndicator(element);

    // Update state
    setCurrentFocusIndex(index);

    // Announce to screen reader
    if (announceChange) {
      const elementType = element.tagName.toLowerCase();
      const elementText = element.textContent?.trim() || 
                         element.getAttribute('aria-label') || 
                         element.getAttribute('title') || 
                         'Interactive element';
      
      announceToScreenReader(
        `${elementType === 'a' ? 'Link' : elementType === 'button' ? 'Button' : 'Element'}: ${elementText}${section ? ` in ${section} section` : ''}`
      );
    }

    // Track analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'keyboard_navigation', {
        event_category: 'accessibility',
        event_label: element.tagName.toLowerCase(),
        custom_parameter_1: section || 'unknown'
      });
    }
  }, [focusableElements, updateFocusIndicator, announceToScreenReader]);

  // Navigate to next/previous element
  const navigateToNext = useCallback(() => {
    const nextIndex = (currentFocusIndex + 1) % focusableElements.length;
    focusElement(nextIndex);
  }, [currentFocusIndex, focusableElements.length, focusElement]);

  const navigateToPrevious = useCallback(() => {
    const prevIndex = currentFocusIndex <= 0 
      ? focusableElements.length - 1 
      : currentFocusIndex - 1;
    focusElement(prevIndex);
  }, [currentFocusIndex, focusableElements.length, focusElement]);

  // Navigate by section
  const navigateToSection = useCallback((sectionName: string) => {
    const sectionElements = focusableElements.filter(
      ({ section }) => section === sectionName
    );

    if (sectionElements.length > 0) {
      const firstElementIndex = focusableElements.indexOf(sectionElements[0]);
      focusElement(firstElementIndex);
      announceToScreenReader(`Navigated to ${sectionName} section`);
    }
  }, [focusableElements, focusElement, announceToScreenReader]);

  // Skip to main content function
  const skipToMainContentFn = useCallback(() => {
    const mainContent = document.querySelector('main') || 
                       document.querySelector('[role="main"]') ||
                       document.querySelector('#main');

    if (mainContent) {
      const firstFocusableInMain = mainContent.querySelector<HTMLElement>(focusableElementsSelector);
      if (firstFocusableInMain) {
        const index = focusableElements.findIndex(({ element }) => element === firstFocusableInMain);
        if (index !== -1) {
          focusElement(index);
          announceToScreenReader('Skipped to main content');
        }
      }
    }
  }, [focusableElements, focusElement, announceToScreenReader, focusableElementsSelector]);

  // Keyboard event handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Detect keyboard usage
    setKeyboardMode(true);

    // Don't interfere with form inputs (unless virtual cursor is active)
    const activeElement = document.activeElement as HTMLElement;
    const isFormElement = activeElement && (
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName) ||
      activeElement.contentEditable === 'true'
    );

    if (isFormElement && !isVirtualCursorActive) {
      // Allow Escape to exit form elements
      if (event.key === 'Escape') {
        activeElement.blur();
        event.preventDefault();
      }
      return;
    }

    // Handle custom key bindings first
    const customHandler = customKeyBindings[event.key];
    if (customHandler) {
      event.preventDefault();
      customHandler();
      return;
    }

    // Standard navigation keys
    switch (event.key) {
      case 'Tab':
        if (!isVirtualCursorActive) return; // Let browser handle normal tab navigation
        event.preventDefault();
        if (event.shiftKey) {
          navigateToPrevious();
        } else {
          navigateToNext();
        }
        break;

      case 'ArrowDown':
      case 'j':
        if (isVirtualCursorActive) {
          event.preventDefault();
          navigateToNext();
        }
        break;

      case 'ArrowUp':
      case 'k':
        if (isVirtualCursorActive) {
          event.preventDefault();
          navigateToPrevious();
        }
        break;

      case 'Home':
        if (isVirtualCursorActive) {
          event.preventDefault();
          focusElement(0);
        }
        break;

      case 'End':
        if (isVirtualCursorActive) {
          event.preventDefault();
          focusElement(focusableElements.length - 1);
        }
        break;

      case 'Enter':
      case ' ':
        if (isVirtualCursorActive && currentFocusIndex >= 0) {
          event.preventDefault();
          const { element } = focusableElements[currentFocusIndex];
          element.click();
        }
        break;

      case 'Escape':
        setIsVirtualCursorActive(false);
        if (focusIndicatorRef.current) {
          focusIndicatorRef.current.style.opacity = '0';
        }
        announceToScreenReader('Virtual cursor disabled');
        break;

      case 'F6':
        event.preventDefault();
        skipToMainContentFn();
        break;

      case 'v':
        if (event.ctrlKey || event.metaKey) return; // Don't interfere with paste
        if (!isFormElement) {
          event.preventDefault();
          setIsVirtualCursorActive(!isVirtualCursorActive);
          announceToScreenReader(
            `Virtual cursor ${!isVirtualCursorActive ? 'enabled' : 'disabled'}`
          );
        }
        break;

      // Section navigation shortcuts
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
        if (isVirtualCursorActive && !isFormElement) {
          event.preventDefault();
          const sectionMap = {
            '1': 'hero',
            '2': 'about',
            '3': 'capabilities',
            '4': 'dashboard',
            '5': 'interactive',
            '6': 'contact'
          };
          const section = sectionMap[event.key as keyof typeof sectionMap];
          if (section) {
            navigateToSection(section);
          }
        }
        break;
    }
  }, [
    enabled,
    isVirtualCursorActive,
    currentFocusIndex,
    focusableElements,
    customKeyBindings,
    navigateToNext,
    navigateToPrevious,
    focusElement,
    skipToMainContentFn,
    navigateToSection,
    announceToScreenReader
  ]);

  // Mouse detection to disable keyboard mode
  const handleMouseMove = useCallback(() => {
    setKeyboardMode(false);
  }, []);

  // Initialize and cleanup
  useEffect(() => {
    if (!enabled) return;

    // Initial setup
    updateFocusableElements();

    // Add keyboard shortcuts help
    if (skipToMainContent) {
      createSkipLink();
    }

    // Event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Update focusable elements on DOM changes
    const observer = new MutationObserver(updateFocusableElements);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-hidden', 'hidden', 'disabled', 'tabindex']
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousemove', handleMouseMove);
      observer.disconnect();
      
      // Cleanup focus indicator
      if (focusIndicatorRef.current) {
        document.body.removeChild(focusIndicatorRef.current);
        focusIndicatorRef.current = null;
      }
    };
  }, [enabled, handleKeyDown, handleMouseMove, updateFocusableElements, skipToMainContent]);

  // Create skip link for accessibility
  const createSkipLink = () => {
    const existingSkipLink = document.getElementById('skip-to-main');
    if (existingSkipLink) return;

    const skipLink = document.createElement('a');
    skipLink.id = 'skip-to-main';
    skipLink.href = '#main';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'sr-only-until-focus';
    skipLink.style.cssText = `
      position: absolute;
      left: -10000px;
      top: auto;
      width: 1px;
      height: 1px;
      overflow: hidden;
      z-index: 10000;
      background: ${focusRingColor};
      color: white;
      padding: 8px 16px;
      text-decoration: none;
      border-radius: 4px;
      font-weight: bold;
    `;

    skipLink.addEventListener('focus', () => {
      skipLink.style.left = '10px';
      skipLink.style.top = '10px';
      skipLink.style.width = 'auto';
      skipLink.style.height = 'auto';
    });

    skipLink.addEventListener('blur', () => {
      skipLink.style.left = '-10000px';
      skipLink.style.top = 'auto';
      skipLink.style.width = '1px';
      skipLink.style.height = '1px';
    });

    skipLink.addEventListener('click', (e) => {
      e.preventDefault();
      skipToMainContentFn();
    });

    document.body.insertBefore(skipLink, document.body.firstChild);
  };

  return {
    currentFocusIndex,
    focusableElements: focusableElements.length,
    isVirtualCursorActive,
    keyboardMode,
    focusElement: (index: number) => focusElement(index, false),
    navigateToNext,
    navigateToPrevious,
    navigateToSection,
    skipToMainContent: skipToMainContentFn,
    enableVirtualCursor: () => setIsVirtualCursorActive(true),
    disableVirtualCursor: () => setIsVirtualCursorActive(false)
  };
};

// Hook for focus management
export const useFocusManagement = () => {
  const focusedElementRef = useRef<HTMLElement | null>(null);
  
  const saveFocus = useCallback(() => {
    focusedElementRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (focusedElementRef.current && typeof focusedElementRef.current.focus === 'function') {
      focusedElementRef.current.focus();
    }
  }, []);

  const focusFirst = useCallback((container: HTMLElement) => {
    const firstFocusable = container.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusable) {
      firstFocusable.focus();
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    saveFocus,
    restoreFocus,
    focusFirst,
    trapFocus
  };
};

declare global {
  function gtag(...args: any[]): void;
}

export default useKeyboardNavigation;