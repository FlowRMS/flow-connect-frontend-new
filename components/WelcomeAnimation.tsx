'use client';

import { useState, useEffect } from 'react';
import { useOrgName } from './hooks/useOrgName';
import Image from 'next/image';

// ============================================================================
// Floating CRM Icons - Soft parallax effect
// ============================================================================

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

const CRMIcons = {
  Chart: ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 3v18h18" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 16l4-4 4 4 5-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Users: ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <circle cx="17" cy="7" r="3" />
      <path d="M21 21v-2a3 3 0 0 0-2-2.83" />
    </svg>
  ),
  Dollar: ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v12M9 9.5c0-1.38 1.34-2.5 3-2.5s3 1.12 3 2.5-1.34 2.5-3 2.5-3 1.12-3 2.5 1.34 2.5 3 2.5" />
    </svg>
  ),
  Mail: ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 6l-10 7L2 6" />
    </svg>
  ),
  Calendar: ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  Target: ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Briefcase: ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  TrendUp: ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 7l-8.5 8.5-5-5L2 17" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 7h6v6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  Star: ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Building: ({ className, style }: IconProps) => (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
    </svg>
  ),
};

// CRM tag colors - matching app's color scheme
const tagColors = {
  blue: { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', icon: '#3b82f6' },
  green: { bg: 'rgba(34, 197, 94, 0.15)', border: 'rgba(34, 197, 94, 0.3)', icon: '#22c55e' },
  purple: { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)', icon: '#a855f7' },
  amber: { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', icon: '#f59e0b' },
  rose: { bg: 'rgba(244, 63, 94, 0.15)', border: 'rgba(244, 63, 94, 0.3)', icon: '#f43f5e' },
  cyan: { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.3)', icon: '#06b6d4' },
  indigo: { bg: 'rgba(99, 102, 241, 0.15)', border: 'rgba(99, 102, 241, 0.3)', icon: '#6366f1' },
  emerald: { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', icon: '#10b981' },
  orange: { bg: 'rgba(249, 115, 22, 0.15)', border: 'rgba(249, 115, 22, 0.3)', icon: '#f97316' },
  pink: { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)', icon: '#ec4899' },
};

// Icon positions with glassmorphism styling and 3D rotations
const floatingIconConfigs = [
  { Icon: CRMIcons.Chart, x: '6%', y: '15%', rotateZ: -12, rotateX: 15, rotateY: -20, delay: 0, size: 'lg', color: 'blue' },
  { Icon: CRMIcons.Users, x: '85%', y: '12%', rotateZ: 10, rotateX: -10, rotateY: 25, delay: 0.15, size: 'lg', color: 'purple' },
  { Icon: CRMIcons.Dollar, x: '4%', y: '72%', rotateZ: 15, rotateX: 20, rotateY: 15, delay: 0.3, size: 'lg', color: 'emerald' },
  { Icon: CRMIcons.Mail, x: '88%', y: '68%', rotateZ: -8, rotateX: -15, rotateY: -18, delay: 0.2, size: 'md', color: 'rose' },
  { Icon: CRMIcons.Calendar, x: '12%', y: '42%', rotateZ: 6, rotateX: 12, rotateY: 22, delay: 0.4, size: 'md', color: 'amber' },
  { Icon: CRMIcons.Target, x: '82%', y: '40%', rotateZ: -15, rotateX: -18, rotateY: -12, delay: 0.1, size: 'lg', color: 'cyan' },
  { Icon: CRMIcons.Briefcase, x: '8%', y: '85%', rotateZ: 12, rotateX: 8, rotateY: -15, delay: 0.35, size: 'md', color: 'indigo' },
  { Icon: CRMIcons.TrendUp, x: '22%', y: '8%', rotateZ: 5, rotateX: -12, rotateY: 18, delay: 0.25, size: 'md', color: 'green' },
  { Icon: CRMIcons.Star, x: '72%', y: '6%', rotateZ: -10, rotateX: 15, rotateY: -22, delay: 0.45, size: 'md', color: 'orange' },
  { Icon: CRMIcons.Building, x: '86%', y: '85%', rotateZ: 8, rotateX: -8, rotateY: 12, delay: 0.5, size: 'md', color: 'pink' },
];

const sizeClasses = {
  sm: { container: 'w-10 h-10 md:w-12 md:h-12', icon: 'w-5 h-5 md:w-6 md:h-6' },
  md: { container: 'w-12 h-12 md:w-14 md:h-14', icon: 'w-6 h-6 md:w-7 md:h-7' },
  lg: { container: 'w-14 h-14 md:w-16 md:h-16', icon: 'w-7 h-7 md:w-8 md:h-8' },
};

// ============================================================================
// Main Component
// ============================================================================

interface WelcomeAnimationProps {
  onComplete: () => void;
}

export default function WelcomeAnimation({ onComplete }: WelcomeAnimationProps) {
  const { orgName, isLoading } = useOrgName();
  const [phase, setPhase] = useState<'enter' | 'logo' | 'text' | 'org' | 'exit'>('enter');
  const [isVisible, setIsVisible] = useState(true);

  // ============================================================================
  // ANIMATION TIMING - Adjust these values to change animation duration
  // Total duration = LOGO_DELAY + TEXT_DELAY + ORG_DELAY + HOLD_DELAY + EXIT_DELAY
  // Current total: 100 + 600 + 800 + 1800 + 500 = 3800ms (~3.8 seconds)
  // ============================================================================
  const LOGO_DELAY = 100;    // Time before logo appears
  const TEXT_DELAY = 600;    // Time before "Welcome to" appears
  const ORG_DELAY = 800;     // Time before org name appears
  const HOLD_DELAY = 2000;   // Time to hold the complete animation for reading
  const EXIT_DELAY = 800;    // Fade out duration

  useEffect(() => {
    if (isLoading) return;

    const sequence = async () => {
      // Phase 1: Logo fades in
      await delay(LOGO_DELAY);
      setPhase('logo');

      // Phase 2: "Welcome to" text reveals
      await delay(TEXT_DELAY);
      setPhase('text');

      // Phase 3: Org name reveals
      await delay(ORG_DELAY);
      setPhase('org');

      // Hold for reading
      await delay(HOLD_DELAY);

      // Exit
      setPhase('exit');
      await delay(EXIT_DELAY);

      setIsVisible(false);
      onComplete();
    };

    sequence();
  }, [isLoading, onComplete]);

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  if (!isVisible) return null;

  const showIcons = phase !== 'enter';
  const showLogo = phase !== 'enter';
  const showWelcome = phase === 'text' || phase === 'org' || phase === 'exit';
  const showOrg = phase === 'org' || phase === 'exit';
  const isExiting = phase === 'exit';

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-opacity duration-500 ease-out ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'var(--background, #ffffff)' }}
    >
      {/* Subtle radial gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.04) 0%, transparent 60%)',
        }}
      />

      {/* Floating CRM Icons with Glassmorphism & 3D Effect */}
      {floatingIconConfigs.map(({ Icon, x, y, rotateZ, rotateX, rotateY, delay, size, color }, index) => {
        const colorScheme = tagColors[color as keyof typeof tagColors];
        const sizeConfig = sizeClasses[size as keyof typeof sizeClasses];

        return (
          <div
            key={index}
            className={`absolute ${sizeConfig.container} rounded-2xl flex items-center justify-center transition-all duration-700 ease-out`}
            style={{
              left: x,
              top: y,
              transform: `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`,
              transformStyle: 'preserve-3d',
              opacity: showIcons ? 1 : 0,
              background: `linear-gradient(135deg, ${colorScheme.bg} 0%, rgba(255,255,255,0.1) 100%)`,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1px solid ${colorScheme.border}`,
              boxShadow: `
                0 8px 32px rgba(0, 0, 0, 0.12),
                0 2px 8px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.5),
                inset 0 -1px 0 rgba(0, 0, 0, 0.05)
              `,
              animation: showIcons ? `float3d 6s ease-in-out ${delay}s infinite` : 'none',
            }}
          >
            <Icon
              className={sizeConfig.icon}
              style={{ color: colorScheme.icon }}
            />
          </div>
        );
      })}

      {/* Central Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
        {/* Logo */}
        <div
          className={`mb-8 transition-all duration-700 ease-out ${
            showLogo ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
          }`}
        >
          <div className="w-16 h-16 md:w-20 md:h-20">
            <Image
              src="/flow-logo.png"
              alt="Flow Logo"
              width={80}
              height={80}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </div>

        {/* Welcome to - Clip reveal from bottom */}
        <div className="overflow-hidden">
          <p
            className={`text-sm md:text-base text-gray-400 font-light tracking-[0.2em] uppercase transition-all duration-700 ease-out ${
              showWelcome ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}
          >
            Welcome to
          </p>
        </div>

        {/* FlowCRM - Clip reveal with slight scale */}
        <div className="overflow-hidden mt-2">
          <h1
            className={`text-3xl md:text-5xl font-semibold text-gray-900 tracking-tight transition-all duration-700 ease-out delay-100 ${
              showWelcome ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}
          >
            FlowRMS
          </h1>
        </div>

        {/* Elegant divider line */}
        <div
          className={`h-px mt-6 mb-4 bg-gradient-to-r from-transparent via-gray-300 to-transparent transition-all duration-700 ease-out ${
            showOrg ? 'w-24 md:w-32 opacity-100' : 'w-0 opacity-0'
          }`}
        />

        {/* Organization Name - Fade up reveal */}
        <div className="overflow-hidden">
          <p
            className={`text-xl md:text-3xl text-gray-700 font-bold tracking-wide uppercase transition-all duration-700 ease-out ${
              showOrg ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
            }`}
          >
            {orgName || 'Your Organization'}
          </p>
        </div>
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes float3d {
          0%, 100% {
            transform: perspective(800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) rotateZ(var(--rz, 0deg)) translateY(0) translateZ(0);
          }
          50% {
            transform: perspective(800px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) rotateZ(var(--rz, 0deg)) translateY(-10px) translateZ(8px);
          }
        }
      `}</style>
    </div>
  );
}
