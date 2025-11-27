/**
 * Optimized Icon Imports
 * 
 * Import only the icons we actually use instead of the entire lucide-react library.
 * This significantly reduces bundle size on old hardware.
 * 
 * Usage:
 * import { Calendar, Users, CheckCircle } from '@/lib/icons';
 */

// ✅ Import ONLY the icons used in the application
export {
  // Common UI icons
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  CheckCircle2,
  Info,
  Loader2,
  X,
  XCircle,
  
  // Navigation icons
  Menu,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  
  // Form icons
  Calendar,
  Clock,
  MapPin,
  Users,
  User,
  Building2,
  Mail,
  Phone,
  Smartphone,
  
  // Action icons
  Download,
  Upload,
  Search,
  Filter,
  RefreshCw,
  Settings,
  Edit,
  Trash2,
  Plus,
  Minus,
  
  // Status icons
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  
  // Communication icons
  MessageCircle,
  MessageSquare,
  Send,
  
  // Business icons
  DollarSign,
  CreditCard,
  
  // Media icons
  Image,
  FileText,
  File,
  
  // Misc icons
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  HelpCircle,
  Zap,
} from 'lucide-react';

// Re-export the type for convenience
export type { LucideIcon } from 'lucide-react';

