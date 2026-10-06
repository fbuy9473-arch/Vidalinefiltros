import React from 'react';
import logoImg from '../assets/vidaline-logo-transparent.png';
import iconImg from '../assets/vidaline-icon-transparent.png';

interface VidalineLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtext?: boolean;
  className?: string;
  variant?: 'full' | 'icon-only';
}

export const VidalineLogo: React.FC<VidalineLogoProps> = ({
  size = 'md',
  className = '',
  variant = 'full',
}) => {
  // Height sizing for full logo
  const fullHeightClass =
    size === 'sm'
      ? 'h-8'
      : size === 'md'
      ? 'h-11'
      : size === 'lg'
      ? 'h-14'
      : 'h-18';

  // Sizing for icon-only
  const iconSizeClass =
    size === 'sm'
      ? 'w-8 h-8'
      : size === 'md'
      ? 'w-10 h-10'
      : size === 'lg'
      ? 'w-14 h-14'
      : 'w-20 h-20';

  if (variant === 'icon-only') {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      >
        <img
          src={iconImg}
          alt="Vidaline Filtros"
          className={`${iconSizeClass} object-contain transition-transform duration-300 hover:scale-105 drop-shadow-[0_0_12px_rgba(0,198,255,0.4)]`}
          loading="eager"
        />
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center select-none cursor-pointer group ${className}`}
    >
      <img
        src={logoImg}
        alt="Vidaline Filtros - Filtrando o melhor da vida"
        className={`${fullHeightClass} w-auto object-contain max-w-full transition-all duration-300 group-hover:brightness-110 drop-shadow-[0_0_15px_rgba(0,198,255,0.25)]`}
        loading="eager"
      />
    </div>
  );
};
