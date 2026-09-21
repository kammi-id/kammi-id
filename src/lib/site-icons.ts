import {
  Link01Icon,
  InstagramIcon,
  NewTwitterIcon,
  YoutubeIcon,
  TelegramIcon,
  Facebook01Icon,
  Linkedin01Icon,
  TiktokIcon,
  WhatsappIcon,
  UserAdd01Icon,
  ArrowRight01Icon,
  Mail01Icon,
  CallIcon,
  Calendar01Icon,
  Home01Icon,
  InformationCircleIcon
} from '@hugeicons/core-free-icons'

export const SITE_ICONS = [
  { value: 'link', label: 'Tautan', icon: Link01Icon },
  { value: 'join', label: 'Bergabung', icon: UserAdd01Icon },
  { value: 'arrow', label: 'Panah kanan', icon: ArrowRight01Icon },
  { value: 'mail', label: 'Email', icon: Mail01Icon },
  { value: 'phone', label: 'Telepon', icon: CallIcon },
  { value: 'calendar', label: 'Kalender', icon: Calendar01Icon },
  { value: 'home', label: 'Beranda', icon: Home01Icon },
  { value: 'info', label: 'Informasi', icon: InformationCircleIcon },
  { value: 'instagram', label: 'Instagram', icon: InstagramIcon },
  { value: 'x', label: 'Twitter / X', icon: NewTwitterIcon },
  { value: 'youtube', label: 'YouTube', icon: YoutubeIcon },
  { value: 'telegram', label: 'Telegram', icon: TelegramIcon },
  { value: 'facebook', label: 'Facebook', icon: Facebook01Icon },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin01Icon },
  { value: 'tiktok', label: 'TikTok', icon: TiktokIcon },
  { value: 'whatsapp', label: 'WhatsApp', icon: WhatsappIcon }
]

export const siteIcon = (name?: string) =>
  SITE_ICONS.find((icon) => icon.value === name)?.icon ?? Link01Icon
