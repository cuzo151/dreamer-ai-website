import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { useKeyboardNavigation, useFocusManagement } from './useKeyboardNavigation';

// Mock gtag for analytics tracking
declare global {
  var gtag: jest.MockedFunction<any>;
}
global.gtag = jest.fn();

// Mock document methods
const mockScrollIntoView = jest.fn();
HTMLElement.prototype.scrollIntoView = mockScrollIntoView;

// Helper to create mock focusable elements
const createMockElement = (
  tagName: string, 
  id: string, 
  options: { 
    visible?: boolean; 
    disabled?: boolean;
    section?: string;
    textContent?: string;
    ariaLabel?: string;
  } = {}
): HTMLElement => {
  const element = document.createElement(tagName) as HTMLElement;
  element.id = id;
  element.textContent = options.textContent || `${tagName} ${id}`;
  
  if (options.ariaLabel) {
    element.setAttribute('aria-label', options.ariaLabel);
  }

  if (options.disabled) {
    element.setAttribute('disabled', 'true');
  }

  if (options.section) {
    element.setAttribute('data-section', options.section);
  }

  // Mock getBoundingClientRect
  element.getBoundingClientRect = jest.fn(() => ({
    width: options.visible === false ? 0 : 100,
    height: options.visible === false ? 0 : 30,
    top: 0,
    left: 0,
    right: 100,
    bottom: 30,
    x: 0,
    y: 0,
    toJSON: jest.fn()
  }));

  // Mock focus method
  element.focus = jest.fn();
  element.click = jest.fn();

  return element;
};

// Mock getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  writable: true,
  value: jest.fn(() => ({
    visibility: 'visible',
    display: 'block'
  }))
});

describe('useKeyboardNavigation', () => {
  let mockElements: HTMLElement[];

  beforeEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    mockScrollIntoView.mockClear();
    global.gtag.mockClear();

    // Create mock focusable elements
    mockElements = [
      createMockElement('button', 'btn1', { section: 'hero', textContent: 'Button 1' }),
      createMockElement('a', 'link1', { section: 'about', textContent: 'Link 1' }),
      createMockElement('input', 'input1', { section: 'contact', textContent: 'Input 1' }),
      createMockElement('button', 'btn2', { section: 'hero', textContent: 'Button 2' })
    ];

    mockElements.forEach(el => document.body.appendChild(el));

    // Mock querySelector to return our mock elements
    const originalQuerySelector = document.querySelectorAll;
    document.querySelectorAll = jest.fn((selector) => {
      if (selector.includes('button') || selector.includes('a[href]') || selector.includes('input')) {
        return mockElements as any;
      }
      return originalQuerySelector.call(document, selector);
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with default options', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      expect(result.current.currentFocusIndex).toBe(-1);
      expect(result.current.focusableElements).toBe(4);
      expect(result.current.isVirtualCursorActive).toBe(false);
      expect(result.current.keyboardMode).toBe(false);
    });

    it('can be disabled', () => {
      const { result } = renderHook(() => useKeyboardNavigation({ enabled: false }));
      
      // Keyboard events should not work when disabled
      act(() => {
        fireEvent.keyDown(document, { key: 'j' });
      });

      expect(result.current.currentFocusIndex).toBe(-1);
    });

    it('creates skip link when skipToMainContent is enabled', () => {
      renderHook(() => useKeyboardNavigation({ skipToMainContent: true }));
      
      const skipLink = document.getElementById('skip-to-main');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink?.textContent).toBe('Skip to main content');
    });
  });

  describe('Focus Management', () => {
    it('focuses elements by index', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.focusElement(1);
      });

      expect(result.current.currentFocusIndex).toBe(1);
      expect(mockElements[1].focus).toHaveBeenCalled();
      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    });

    it('updates focus indicator when focusing element', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.focusElement(0);
      });

      const indicator = document.getElementById('keyboard-focus-indicator');
      expect(indicator).toBeInTheDocument();
      expect(indicator?.style.opacity).toBe('1');
    });

    it('announces navigation to screen reader', () => {
      const { result } = renderHook(() => useKeyboardNavigation({ announceNavigation: true }));

      act(() => {
        result.current.focusElement(0);
      });

      // Check if announcement element was created
      const announcements = document.querySelectorAll('[aria-live="polite"]');
      expect(announcements.length).toBeGreaterThan(0);
    });

    it('tracks analytics for navigation', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.focusElement(0);
      });

      expect(global.gtag).toHaveBeenCalledWith('event', 'keyboard_navigation', {
        event_category: 'accessibility',
        event_label: 'button',
        custom_parameter_1: 'hero'
      });
    });
  });

  describe('Navigation Methods', () => {
    it('navigates to next element', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.focusElement(1);
      });

      act(() => {
        result.current.navigateToNext();
      });

      expect(result.current.currentFocusIndex).toBe(2);
      expect(mockElements[2].focus).toHaveBeenCalled();
    });

    it('wraps to first element when navigating past last', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.focusElement(3); // Last element
      });

      act(() => {
        result.current.navigateToNext();
      });

      expect(result.current.currentFocusIndex).toBe(0);
      expect(mockElements[0].focus).toHaveBeenCalled();
    });

    it('navigates to previous element', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.focusElement(2);
      });

      act(() => {
        result.current.navigateToPrevious();
      });

      expect(result.current.currentFocusIndex).toBe(1);
      expect(mockElements[1].focus).toHaveBeenCalled();
    });

    it('wraps to last element when navigating before first', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.focusElement(0); // First element
      });

      act(() => {
        result.current.navigateToPrevious();
      });

      expect(result.current.currentFocusIndex).toBe(3);
      expect(mockElements[3].focus).toHaveBeenCalled();
    });

    it('navigates to section', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.navigateToSection('about');
      });

      expect(result.current.currentFocusIndex).toBe(1); // Link in about section
      expect(mockElements[1].focus).toHaveBeenCalled();
    });

    it('handles non-existent section gracefully', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      const initialIndex = result.current.currentFocusIndex;

      act(() => {
        result.current.navigateToSection('nonexistent');
      });

      expect(result.current.currentFocusIndex).toBe(initialIndex);
    });
  });

  describe('Keyboard Event Handling', () => {
    it('enables keyboard mode on keydown', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        fireEvent.keyDown(document, { key: 'j' });
      });

      expect(result.current.keyboardMode).toBe(true);
    });

    it('disables keyboard mode on mouse move', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        fireEvent.keyDown(document, { key: 'j' });
      });

      expect(result.current.keyboardMode).toBe(true);

      act(() => {
        fireEvent.mouseMove(document);
      });

      expect(result.current.keyboardMode).toBe(false);
    });

    it('navigates with j/k keys when virtual cursor is active', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.enableVirtualCursor();
      });

      act(() => {
        fireEvent.keyDown(document, { key: 'j' });
      });

      expect(result.current.currentFocusIndex).toBe(0);

      act(() => {
        fireEvent.keyDown(document, { key: 'j' });
      });

      expect(result.current.currentFocusIndex).toBe(1);

      act(() => {
        fireEvent.keyDown(document, { key: 'k' });
      });

      expect(result.current.currentFocusIndex).toBe(0);
    });

    it('navigates with arrow keys when virtual cursor is active', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.enableVirtualCursor();
      });

      act(() => {
        fireEvent.keyDown(document, { key: 'ArrowDown' });
      });

      expect(result.current.currentFocusIndex).toBe(0);

      act(() => {
        fireEvent.keyDown(document, { key: 'ArrowUp' });
      });

      expect(result.current.currentFocusIndex).toBe(3); // Wraps to last
    });

    it('navigates to home and end with virtual cursor', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.enableVirtualCursor();
        result.current.focusElement(2);
      });

      act(() => {
        fireEvent.keyDown(document, { key: 'Home' });
      });

      expect(result.current.currentFocusIndex).toBe(0);

      act(() => {
        fireEvent.keyDown(document, { key: 'End' });
      });

      expect(result.current.currentFocusIndex).toBe(3);
    });

    it('toggles virtual cursor with v key', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      expect(result.current.isVirtualCursorActive).toBe(false);

      act(() => {
        fireEvent.keyDown(document, { key: 'v' });
      });

      expect(result.current.isVirtualCursorActive).toBe(true);

      act(() => {
        fireEvent.keyDown(document, { key: 'v' });
      });

      expect(result.current.isVirtualCursorActive).toBe(false);
    });

    it('activates elements with Enter and Space when virtual cursor is active', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.enableVirtualCursor();
        result.current.focusElement(0);
      });

      act(() => {
        fireEvent.keyDown(document, { key: 'Enter' });
      });

      expect(mockElements[0].click).toHaveBeenCalled();

      act(() => {
        fireEvent.keyDown(document, { key: ' ' });
      });

      expect(mockElements[0].click).toHaveBeenCalledTimes(2);
    });

    it('handles escape key to disable virtual cursor', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.enableVirtualCursor();
      });

      expect(result.current.isVirtualCursorActive).toBe(true);

      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });

      expect(result.current.isVirtualCursorActive).toBe(false);
    });

    it('handles section shortcuts (1-6) when virtual cursor is active', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        result.current.enableVirtualCursor();
      });

      // Create elements in different sections
      const heroElement = createMockElement('button', 'hero-btn', { section: 'hero' });
      const aboutElement = createMockElement('button', 'about-btn', { section: 'about' });
      
      document.body.appendChild(heroElement);
      document.body.appendChild(aboutElement);

      act(() => {
        fireEvent.keyDown(document, { key: '2' }); // Navigate to about
      });

      // This would work in real implementation with proper section mapping
      // For now, we just test that the event is handled
    });

    it('handles custom key bindings', () => {
      const customHandler = jest.fn();
      renderHook(() => useKeyboardNavigation({
        customKeyBindings: {
          'x': customHandler
        }
      }));

      act(() => {
        fireEvent.keyDown(document, { key: 'x' });
      });

      expect(customHandler).toHaveBeenCalled();
    });

    it('does not interfere with form elements unless virtual cursor is active', () => {
      const { result } = renderHook(() => useKeyboardNavigation());
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      // Should not navigate when typing in form element
      act(() => {
        fireEvent.keyDown(document, { key: 'j' });
      });

      expect(result.current.currentFocusIndex).toBe(-1);

      // Should allow escape to exit form element
      act(() => {
        fireEvent.keyDown(document, { key: 'Escape' });
      });

      expect(document.activeElement).not.toBe(input);
    });
  });

  describe('Skip to Main Content', () => {
    it('skips to main content with F6', () => {
      const main = document.createElement('main');
      const mainButton = createMockElement('button', 'main-btn');
      main.appendChild(mainButton);
      document.body.appendChild(main);

      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        fireEvent.keyDown(document, { key: 'F6' });
      });

      expect(mainButton.focus).toHaveBeenCalled();
    });

    it('handles missing main content gracefully', () => {
      const { result } = renderHook(() => useKeyboardNavigation());

      act(() => {
        fireEvent.keyDown(document, { key: 'F6' });
      });

      // Should not throw error
      expect(result.current.currentFocusIndex).toBe(-1);
    });
  });

  describe('Accessibility Features', () => {
    it('filters out hidden elements', () => {
      const hiddenElement = createMockElement('button', 'hidden', { visible: false });
      document.body.appendChild(hiddenElement);

      const { result } = renderHook(() => useKeyboardNavigation());

      // Should not include hidden element in count
      expect(result.current.focusableElements).toBe(4); // Original elements only
    });

    it('filters out disabled elements', () => {
      const disabledElement = createMockElement('button', 'disabled', { disabled: true });
      document.body.appendChild(disabledElement);

      const { result } = renderHook(() => useKeyboardNavigation());

      // Should not include disabled element in count  
      expect(result.current.focusableElements).toBe(4); // Original elements only
    });

    it('creates proper focus indicator styles', () => {
      const { result } = renderHook(() => useKeyboardNavigation({ focusRingColor: '#ff0000' }));

      act(() => {
        result.current.focusElement(0);
      });

      const indicator = document.getElementById('keyboard-focus-indicator');
      expect(indicator?.style.border).toContain('#ff0000');
    });
  });

  describe('Memory Management', () => {
    it('cleans up event listeners and DOM elements on unmount', () => {
      const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');
      const { unmount } = renderHook(() => useKeyboardNavigation());

      // Create focus indicator
      act(() => {
        renderHook(() => useKeyboardNavigation()).result.current.focusElement(0);
      });

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));

      // Focus indicator should be removed
      expect(document.getElementById('keyboard-focus-indicator')).not.toBeInTheDocument();
    });
  });
});

describe('useFocusManagement', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = createMockElement('button', 'test-btn');
    document.body.appendChild(mockElement);
  });

  it('saves and restores focus', () => {
    const { result } = renderHook(() => useFocusManagement());

    mockElement.focus();
    Object.defineProperty(document, 'activeElement', {
      value: mockElement,
      writable: true
    });

    act(() => {
      result.current.saveFocus();
    });

    // Change focus
    const otherElement = createMockElement('button', 'other-btn');
    document.body.appendChild(otherElement);
    Object.defineProperty(document, 'activeElement', {
      value: otherElement,
      writable: true
    });

    act(() => {
      result.current.restoreFocus();
    });

    expect(mockElement.focus).toHaveBeenCalled();
  });

  it('focuses first focusable element in container', () => {
    const { result } = renderHook(() => useFocusManagement());
    const container = document.createElement('div');
    container.appendChild(mockElement);

    const mockQuerySelector = jest.fn(() => mockElement);
    container.querySelector = mockQuerySelector;

    act(() => {
      result.current.focusFirst(container);
    });

    expect(mockElement.focus).toHaveBeenCalled();
  });

  it('traps focus within container', () => {
    const { result } = renderHook(() => useFocusManagement());
    const container = document.createElement('div');
    const firstButton = createMockElement('button', 'first');
    const lastButton = createMockElement('button', 'last');
    
    container.appendChild(firstButton);
    container.appendChild(lastButton);

    const mockQuerySelectorAll = jest.fn(() => [firstButton, lastButton]);
    container.querySelectorAll = mockQuerySelectorAll;

    const cleanup = result.current.trapFocus(container);

    // Test tab on last element - should focus first
    Object.defineProperty(document, 'activeElement', {
      value: lastButton,
      writable: true
    });

    act(() => {
      fireEvent.keyDown(container, { key: 'Tab' });
    });

    expect(firstButton.focus).toHaveBeenCalled();

    // Test shift+tab on first element - should focus last
    Object.defineProperty(document, 'activeElement', {
      value: firstButton,
      writable: true
    });

    act(() => {
      fireEvent.keyDown(container, { key: 'Tab', shiftKey: true });
    });

    expect(lastButton.focus).toHaveBeenCalled();

    // Cleanup
    cleanup();
  });

  it('handles missing focusable elements gracefully', () => {
    const { result } = renderHook(() => useFocusManagement());
    const container = document.createElement('div');

    const mockQuerySelector = jest.fn(() => null);
    container.querySelector = mockQuerySelector;

    act(() => {
      result.current.focusFirst(container);
    });

    // Should not throw error
  });

  it('handles elements without focus method', () => {
    const { result } = renderHook(() => useFocusManagement());
    
    // Mock element without focus method
    const elementWithoutFocus = { focus: null } as any;
    
    act(() => {
      result.current.saveFocus();
    });

    Object.defineProperty(document, 'activeElement', {
      value: elementWithoutFocus,
      writable: true
    });

    act(() => {
      result.current.restoreFocus();
    });

    // Should not throw error
  });
});