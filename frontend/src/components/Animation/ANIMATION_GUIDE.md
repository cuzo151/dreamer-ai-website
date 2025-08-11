# Animation Guide for Dreamer AI Solutions Website

## Overview

This guide documents the animation system implemented for the Dreamer AI Solutions website. The animations enhance user experience while maintaining performance and accessibility.

## Animation Components

### 1. AnimatedSection
Provides fade-in animations for content sections with intersection observer.

**Usage:**
```tsx
<AnimatedSection animation="fadeInUp" delay={0.3}>
  <h1>Your content here</h1>
</AnimatedSection>
```

**Props:**
- `animation`: 'fadeIn' | 'fadeInUp' | 'fadeInDown' | 'slideInLeft' | 'slideInRight' | 'scale'
- `delay`: number (in seconds)
- `duration`: number (in seconds)

### 2. AnimatedCard
Animated card component with hover effects.

**Usage:**
```tsx
<AnimatedCard delay={0.1} className="p-6 bg-white">
  <h3>Card Content</h3>
</AnimatedCard>
```

### 3. AnimatedButton
Enhanced button with multiple variants and animations.

**Usage:**
```tsx
<AnimatedButton variant="primary" size="medium" onClick={handleClick}>
  Click Me
</AnimatedButton>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost'
- `size`: 'small' | 'medium' | 'large'
- `fullWidth`: boolean

### 4. AnimatedBackground
Dynamic background animations.

**Usage:**
```tsx
<AnimatedBackground variant="gradient" className="absolute inset-0" />
```

**Variants:**
- `gradient`: Animated gradient background
- `shapes`: Floating geometric shapes
- `particles`: Rising particle effects

### 5. LoadingAnimation
Various loading indicators.

**Usage:**
```tsx
<LoadingAnimation variant="spinner" size="medium" color="#0096FF" />
```

**Variants:**
- `spinner`: Rotating spinner
- `dots`: Bouncing dots
- `pulse`: Pulsing circle

### 6. ParallaxSection
Parallax scrolling effects.

**Usage:**
```tsx
<ParallaxSection speed={0.5} offset={[0, 100]}>
  <img src="hero-image.jpg" />
</ParallaxSection>
```

### 7. ScrollIndicator
Progress bar showing scroll position.

## Custom Hooks

### useIntersectionObserver
Detects when elements enter the viewport.

```tsx
const { ref, isVisible } = useIntersectionObserver({
  threshold: 0.1,
  freezeOnceVisible: true
});
```

### useParallax
Creates parallax scrolling effects.

```tsx
const { ref, parallaxOffset } = useParallax({
  speed: 0.5,
  offset: 0
});
```

### useReducedMotion
Respects user's motion preferences.

```tsx
const prefersReducedMotion = useReducedMotion();
```

## Animation Features

### 1. Smooth Scroll Animations
- Elements fade in as they enter the viewport
- Staggered animations for lists
- Intersection Observer for performance

### 2. Hero Section Parallax
- Background elements move at different speeds
- Text elements have subtle parallax
- Responsive to scroll position

### 3. Hover Effects
- Service cards scale and lift on hover
- Buttons have gradient transitions
- Navigation links have underline animations

### 4. Loading Animations
- Initial page load animation
- Form submission states
- Async operation indicators

### 5. Navigation Enhancements
- Header transparency changes on scroll
- Mobile menu animations
- Smooth transitions between states

### 6. Micro-interactions
- Button press effects
- Icon rotations
- Color transitions

### 7. Background Elements
- Animated gradients
- Floating shapes
- Particle effects

## Performance Considerations

1. **Reduced Motion Support**
   - All animations respect `prefers-reduced-motion`
   - Graceful fallbacks for accessibility

2. **Optimization Techniques**
   - Using CSS transforms for better performance
   - Intersection Observer for lazy animations
   - RequestAnimationFrame for smooth updates

3. **Mobile Performance**
   - Simplified animations on mobile devices
   - Touch-optimized interactions
   - Reduced particle counts

## Best Practices

1. **Keep animations subtle**
   - Animations should enhance, not distract
   - Use appropriate timing (0.3-0.6s for most)

2. **Consistent timing**
   - Similar animations use similar durations
   - Stagger delays incrementally (0.1s)

3. **Accessibility first**
   - Always check `prefersReducedMotion`
   - Provide animation controls
   - Ensure content is readable during animations

4. **Performance monitoring**
   - Test on low-end devices
   - Monitor frame rates
   - Use Chrome DevTools Performance tab

## Adding New Animations

1. Create component in `/components/Animation/`
2. Use Framer Motion for complex animations
3. Include `useReducedMotion` hook
4. Export from `index.ts`
5. Document usage in this guide

## Troubleshooting

### Animation not working
- Check if element is in viewport
- Verify animation classes are applied
- Check browser console for errors

### Performance issues
- Reduce animation complexity
- Use `will-change` CSS property sparingly
- Optimize image sizes

### Accessibility concerns
- Test with `prefers-reduced-motion` enabled
- Ensure animations don't cause motion sickness
- Provide alternative interactions