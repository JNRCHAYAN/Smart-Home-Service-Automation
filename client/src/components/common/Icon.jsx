import {
  Wrench, Droplet, Zap, Sparkles, Hammer, Truck, Car, Scissors,
  Wifi, MapPin, Star, Clock, Phone, CheckCircle2, AlertTriangle,
  X, ChevronLeft, ChevronRight, ArrowRight, ShieldCheck, Home,
  User, LogOut, Calendar, LayoutDashboard, Inbox, ListChecks,
  Search, Plus, CreditCard, Send, Menu, Loader2, RefreshCw,
  CircleDollarSign, Ban, Bot, Minimize2, MessageSquare,
  Settings2, Bell, Receipt
} from 'lucide-react';

const MAP = {
  wrench: Wrench,
  droplet: Droplet,
  zap: Zap,
  sparkles: Sparkles,
  hammer: Hammer,
  truck: Truck,
  car: Car,
  scissors: Scissors,
  wifi: Wifi,
  mappin: MapPin,
  star: Star,
  clock: Clock,
  phone: Phone,
  check: CheckCircle2,
  alert: AlertTriangle,
  x: X,
  chevronleft: ChevronLeft,
  chevronright: ChevronRight,
  arrowright: ArrowRight,
  shield: ShieldCheck,
  home: Home,
  user: User,
  logout: LogOut,
  calendar: Calendar,
  dashboard: LayoutDashboard,
  inbox: Inbox,
  list: ListChecks,
  search: Search,
  plus: Plus,
  card: CreditCard,
  send: Send,
  menu: Menu,
  loader: Loader2,
  refresh: RefreshCw,
  dollar: CircleDollarSign,
  ban: Ban,
  bot: Bot,
  minimize: Minimize2,
  messagesquare: MessageSquare,
  settings: Settings2,
  bell: Bell,
  invoice: Receipt
};

export default function Icon({ name, size = 20, className = '', ...props }) {
  const Cmp = MAP[name] || Maple;
  return <Cmp size={size} className={className} {...props} />;
}

function Maple(props) {
  return <Wrench {...props} />;
}
