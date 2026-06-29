import * as Icons from 'lucide-react';
import { Box } from 'lucide-react';

type IconName = keyof typeof Icons;

export function getIcon(name?: string) {
  if (!name) return Box;
  const Icon = (Icons as Record<string, unknown>)[name];
  return (Icon as React.ComponentType<{ size?: number; className?: string }>) || Box;
}

export type { IconName };
