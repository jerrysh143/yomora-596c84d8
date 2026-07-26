import { Truck, ShieldCheck, RotateCcw, Award, Gem, Hammer, Sparkles, Star, Heart, type LucideIcon } from "lucide-react";
import type { IconName } from "./site-content.defaults";

export const ICON_MAP: Record<IconName, LucideIcon> = {
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

export function getIcon(name: string | undefined): LucideIcon {
  if (name && (name as IconName) in ICON_MAP) return ICON_MAP[name as IconName];
  return Sparkles;
}