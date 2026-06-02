import { Bell, Inbox, Mail, MessageCircle, Smartphone } from 'lucide-react';

const iconMap = {
  sms: Smartphone,
  email: Mail,
  whatsapp: MessageCircle,
  push: Bell,
  in_app: Inbox,
};

const allChannels = ['sms', 'email', 'whatsapp', 'push', 'in_app'];

export default function ChannelIcons({ channels = [], size = 'sm' }) {
  const normalized = new Set((channels || []).map((item) => String(item).toLowerCase()));
  const iconSize = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5';

  return (
    <div className="flex items-center gap-2">
      {allChannels.map((channel) => {
        const Icon = iconMap[channel];
        const active = normalized.has(channel);

        return (
          <span
            key={channel}
            title={channel.replaceAll('_', ' ')}
            className={`inline-flex rounded-full border px-2 py-1 ${
              active ? 'border-accent/30 bg-accent/15 text-accent' : 'border-white/10 bg-white/5 text-white/30'
            }`}
          >
            <Icon className={iconSize} />
          </span>
        );
      })}
    </div>
  );
}
