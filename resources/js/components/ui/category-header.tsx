import type { LucideIcon } from 'lucide-react';

interface CategoryHeaderProps {
  title: string;
  description: string;
  targetAudience: string;
  icon: LucideIcon;
  color: string;
}

export function CategoryHeader({ title, description, targetAudience, icon: Icon, color }: CategoryHeaderProps) {
  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200',
      orange: 'bg-orange-50 text-orange-700 border-orange-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className={`rounded-xl border-2 ${getColorClasses(color)} p-6 mb-8`}>
      <div className="flex items-start gap-4">
        <div className="p-3 bg-white rounded-lg shadow-sm">
          <Icon className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold mb-2">{title}</h2>
          <p className="text-lg mb-3">{description}</p>
          <p className="text-sm opacity-80">
            <span className="font-semibold">Target Audience:</span> {targetAudience}
          </p>
        </div>
      </div>
    </div>
  );
}