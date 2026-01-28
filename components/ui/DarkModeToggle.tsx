'use client';

import { useEffect, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useInvert } from '@/components/Providers';
import { useSidebarSettings } from '@/contexts/UserSettingsContext';
import type { SidebarSettingsValue } from '@/components/lib/graphql/settings';

/**
 * Animated Dark Mode Toggle
 * A beautiful sun/moon morphing toggle with spring physics animation
 * Based on: https://jfelix.info/blog/using-react-spring-to-animate-svg-icons-dark-mode-toggle
 * Package: https://github.com/JoseRFelix/react-toggle-dark-mode
 *
 * Persists dark mode preference to SIDEBAR_SETTINGS via the settings API
 */

const properties = {
  dark: {
    r: 9,
    transform: 'rotate(40deg)',
    cx: 12,
    cy: 4,
    opacity: 0,
  },
  light: {
    r: 5,
    transform: 'rotate(90deg)',
    cx: 30,
    cy: 0,
    opacity: 1,
  },
  springConfig: { mass: 4, tension: 250, friction: 35 },
};

export default function DarkModeToggle() {
  const { inverted, toggle, setInverted } = useInvert();
  const { settings, saveSettings, isInitialized } = useSidebarSettings();
  const hasLoadedFromSettings = useRef(false);

  // Load dark mode state from settings on mount
  useEffect(() => {
    if (isInitialized && !hasLoadedFromSettings.current && settings?.darkMode !== undefined) {
      hasLoadedFromSettings.current = true;
      if (settings.darkMode !== inverted) {
        setInverted(settings.darkMode);
      }
    }
  }, [isInitialized, settings, inverted, setInverted]);

  // Save to settings when toggled
  const handleToggle = async () => {
    const newValue = !inverted;
    toggle();

    // Save to SIDEBAR_SETTINGS (user's personal settings)
    try {
      const newSettings: SidebarSettingsValue = {
        groups: settings?.groups || [],
        darkMode: newValue,
      };
      await saveSettings(newSettings, 'my');
    } catch (error) {
      console.error('Failed to save dark mode setting:', error);
    }
  };

  const { r, transform, cx, cy, opacity } = properties[inverted ? 'dark' : 'light'];

  const svgContainerProps = useSpring({
    transform,
    config: properties.springConfig,
  });

  const centerCircleProps = useSpring({
    r,
    config: properties.springConfig,
  });

  const maskedCircleProps = useSpring({
    cx,
    cy,
    config: properties.springConfig,
  });

  const linesProps = useSpring({
    opacity,
    config: properties.springConfig,
  });

  return (
    <button
      onClick={handleToggle}
      className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
      title={inverted ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={inverted ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{ filter: inverted ? 'invert(1) hue-rotate(180deg)' : '' }}
    >
      <animated.svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
        style={svgContainerProps}
      >
        <mask id="darkModeToggleMask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <animated.circle
            cx={maskedCircleProps.cx}
            cy={maskedCircleProps.cy}
            r="9"
            fill="black"
          />
        </mask>

        <animated.circle
          cx="12"
          cy="12"
          r={centerCircleProps.r}
          fill="currentColor"
          mask="url(#darkModeToggleMask)"
        />

        <animated.g stroke="currentColor" style={linesProps}>
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </animated.g>
      </animated.svg>
    </button>
  );
}
