/**
 * Central icon registry. Every Lucide icon used in the app re-exports from here
 * so swapping the icon set later is a single-file change.
 *
 * Per brand-guideline §3.6: Lucide, stroke-width 1.75, currentColor.
 * Use the <Icon /> wrapper from "@/components/ui/Icon" to get the default props,
 * or import directly when you need to override stroke/size.
 */
export {
  // Navigation
  House,
  CalendarCheck,
  Tag,
  Users,
  User,
  // Common UI
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Plus,
  Minus,
  Search,
  Settings,
  LogOut,
  ArrowLeft,
  ArrowRight,
  // Class / schedule
  Calendar,
  Clock,
  MapPin,
  Phone,
  // Profile / rewards
  QrCode,
  Star,
  Heart,
  Trophy,
  Sparkles,
  Award,
  // Feedback
  CircleCheck,
  CircleAlert,
  CircleX,
  Info,
  Loader,
} from "lucide-react";
