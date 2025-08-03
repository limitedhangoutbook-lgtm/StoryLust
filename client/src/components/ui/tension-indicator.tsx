/**
 * Tension Indicator - Visual component showing story emotional state
 * Part of Phase 2: Enhanced UX Components
 */

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface TensionIndicatorProps {
  level: number; // 0-100
  category: 'low' | 'building' | 'high' | 'climax';
  visualCue: string;
  className?: string;
  showLabel?: boolean;
  animated?: boolean;
}

export function TensionIndicator({ 
  level, 
  category, 
  visualCue, 
  className,
  showLabel = true,
  animated = true 
}: TensionIndicatorProps) {
  const [displayLevel, setDisplayLevel] = useState(0);

  // Animate level changes
  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => setDisplayLevel(level), 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayLevel(level);
    }
  }, [level, animated]);

  const getCategoryColor = () => {
    switch (category) {
      case 'low': return 'bg-blue-500';
      case 'building': return 'bg-amber-500';
      case 'high': return 'bg-orange-500';
      case 'climax': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryText = () => {
    switch (category) {
      case 'low': return 'Calm';
      case 'building': return 'Rising';
      case 'high': return 'Intense';
      case 'climax': return 'Peak';
      default: return 'Unknown';
    }
  };

  const getPulseIntensity = () => {
    if (category === 'climax') return 'animate-pulse';
    if (category === 'high') return 'animate-pulse [animation-duration:2s]';
    return '';
  };

  return (
    <div className={cn('flex items-center space-x-3', className)}>
      {/* Visual tension indicator */}
      <div className="relative">
        {/* Background circle */}
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
          {/* Fill circle based on tension level */}
          <div 
            className={cn(
              'absolute bottom-0 left-0 right-0 transition-all duration-500 ease-out rounded-full',
              getCategoryColor(),
              getPulseIntensity()
            )}
            style={{ 
              height: `${displayLevel}%`,
              borderRadius: displayLevel > 50 ? '50%' : '0 0 50% 50%'
            }}
          />
          
          {/* Glow effect for high tension */}
          {category === 'climax' && (
            <div className="absolute inset-0 rounded-full bg-red-500 opacity-30 animate-ping" />
          )}
        </div>

        {/* Numeric level (small) */}
        <div className="absolute -top-1 -right-1 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-800 text-xs rounded-full w-4 h-4 flex items-center justify-center font-mono">
          {Math.round(displayLevel)}
        </div>
      </div>

      {/* Label and description */}
      {showLabel && (
        <div className="flex flex-col">
          <span className={cn(
            'text-sm font-medium',
            category === 'climax' && 'text-red-600 dark:text-red-400',
            category === 'high' && 'text-orange-600 dark:text-orange-400',
            category === 'building' && 'text-amber-600 dark:text-amber-400',
            category === 'low' && 'text-blue-600 dark:text-blue-400'
          )}>
            {getCategoryText()}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Tension Level
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Mini tension indicator for compact spaces
 */
export function MiniTensionIndicator({ level, category, className }: Omit<TensionIndicatorProps, 'visualCue' | 'showLabel'>) {
  return (
    <TensionIndicator 
      level={level}
      category={category}
      visualCue=""
      className={className}
      showLabel={false}
      animated={false}
    />
  );
}

/**
 * Tension wave visualization for story overview
 */
interface TensionWaveProps {
  tensionHistory: number[];
  currentPage: number;
  className?: string;
}

export function TensionWave({ tensionHistory, currentPage, className }: TensionWaveProps) {
  const maxTension = Math.max(...tensionHistory, 1);
  
  return (
    <div className={cn('w-full h-16 bg-gray-100 dark:bg-gray-800 rounded-lg relative overflow-hidden', className)}>
      {/* Wave path */}
      <svg className="w-full h-full" viewBox={`0 0 ${tensionHistory.length * 10} 64`} preserveAspectRatio="none">
        <path
          d={tensionHistory.map((tension, index) => {
            const x = index * 10;
            const y = 64 - (tension / maxTension) * 64;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')}
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-rose-500"
        />
        
        {/* Fill area under curve */}
        <path
          d={`${tensionHistory.map((tension, index) => {
            const x = index * 10;
            const y = 64 - (tension / maxTension) * 64;
            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
          }).join(' ')} L ${(tensionHistory.length - 1) * 10} 64 L 0 64 Z`}
          fill="currentColor"
          className="text-rose-500 opacity-20"
        />
      </svg>

      {/* Current position indicator */}
      <div 
        className="absolute top-0 bottom-0 w-0.5 bg-rose-600 z-10"
        style={{ left: `${(currentPage / tensionHistory.length) * 100}%` }}
      >
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-rose-600 rounded-full" />
      </div>

      {/* Tension level labels */}
      <div className="absolute top-1 left-2 text-xs text-gray-500 dark:text-gray-400">
        High
      </div>
      <div className="absolute bottom-1 left-2 text-xs text-gray-500 dark:text-gray-400">
        Low
      </div>
    </div>
  );
}