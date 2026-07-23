import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Award,
  Gem,
  Hammer,
  Sparkles,
  Star,
  Heart,
  type LucideIcon,
} from "lucide-react";
import type { IconName } from "./site-content.defaults";

const MAP: Record<IconName, LucideIcon> = {
  Truck,
  ShieldCheck,
  RotateCcw,
  Award,
  Gem,
  Hammer,
  Sparkles,
  Star,
  Heart,
};

export function SiteIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[(name as IconName)] ?? Sparkles;
  return <Icon className={className} />;
}