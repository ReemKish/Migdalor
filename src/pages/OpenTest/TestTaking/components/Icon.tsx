
import React from 'react';
import { BookOpen, Shield, Target, type LucideProps } from 'lucide-react';
import type { IconName } from '../types';

const iconMap = {
  BookOpen,
  Shield,
  Target,
};

interface DynamicIconProps extends LucideProps {
  name: IconName;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, ...props }) => {
  const IconComponent = iconMap[name];
  
  if (!IconComponent) {
    // Fallback icon or null
    return null;
  }
  
  return <IconComponent {...props} />;
};
