import { Truck, ShieldCheck, RotateCcw, Award, Gem, Hammer, Sparkles, Star, Heart, BadgeCheck, PackageCheck, Recycle, Clock, type LucideIcon } from "lucide-react";
import type { IconName } from "./site-content.defaults";

const ICON_MAP: Record<IconName, LucideIcon> = {
  Truck,
  ShieldCheck,
  RotateCcw,
  Award,
  Gem,
  Hammer,
  Sparkles,
  Star,
  Heart,
  BadgeCheck,
  PackageCheck,
  Recycle,
  Clock,
};

export function getIcon(name: string | undefined): LucideIcon {
  if (name && (name as IconName) in ICON_MAP) return ICON_MAP[name as IconName];
  return Sparkles;
}
