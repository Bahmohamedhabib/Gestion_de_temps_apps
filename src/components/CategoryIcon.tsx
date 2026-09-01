import React from 'react';
import {
  Briefcase,
  User,
  ShoppingCart,
  Heart,
  FolderKanban,
  GraduationCap,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { CategoryId } from '../types';

interface Props {
  category: CategoryId;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<Props> = ({ category, size = 18, className = '' }) => {
  switch (category) {
    case 'work':
      return <Briefcase size={size} className={className} />;
    case 'personal':
      return <User size={size} className={className} />;
    case 'shopping':
      return <ShoppingCart size={size} className={className} />;
    case 'health':
      return <Heart size={size} className={className} />;
    case 'project':
      return <FolderKanban size={size} className={className} />;
    case 'study':
      return <GraduationCap size={size} className={className} />;
    default:
      return <Tag size={size} className={className} />;
  }
};
