const themes = {
  blue: {
    accent: "border-t-4 border-t-blue-500",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    valueColor: "text-blue-700",
    badge: "bg-blue-50 text-blue-600",
  },
  amber: {
    accent: "border-t-4 border-t-amber-500",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    valueColor: "text-amber-700",
    badge: "bg-amber-50 text-amber-600",
  },
  green: {
    accent: "border-t-4 border-t-green-500",
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    valueColor: "text-green-700",
    badge: "bg-green-50 text-green-600",
  },
  red: {
    accent: "border-t-4 border-t-red-500",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    valueColor: "text-red-700",
    badge: "bg-red-50 text-red-600",
  },
  purple: {
    accent: "border-t-4 border-t-purple-500",
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    valueColor: "text-purple-700",
    badge: "bg-purple-50 text-purple-600",
  },
};

export default function DashboardCard({ title, value, color = "blue", icon, subtitle }) {
  const t = themes[color] || themes.blue;

  return (
    <div
      className={`
        bg-white rounded-xl shadow-md
        hover:shadow-xl hover:-translate-y-1
        transition-all duration-200
        ${t.accent}
        overflow-hidden
      `}
    >
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-gray-500 text-sm font-medium uppercase tracking-wide">
              {title}
            </p>
            <p className={`text-4xl font-bold mt-2 ${t.valueColor}`}>
              {value}
            </p>
            {subtitle && (
              <p className="text-gray-400 text-xs mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`${t.iconBg} ${t.iconColor} p-3 rounded-xl ml-4 flex-shrink-0`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
}