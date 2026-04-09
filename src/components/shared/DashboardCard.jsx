import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function DashboardCard({ icon: Icon, title, description, action, color = 'cyan' }) {
  const colorMap = {
    cyan: { border: '#06b6d4', iconBg: 'bg-cyan-100', icon: 'text-cyan-600' },
    purple: { border: '#a855f7', iconBg: 'bg-purple-100', icon: 'text-purple-600' },
    green: { border: '#10b981', iconBg: 'bg-green-100', icon: 'text-green-600' },
    orange: { border: '#f97316', iconBg: 'bg-orange-100', icon: 'text-orange-600' },
  };

  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl p-8 bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      style={{ borderTop: `4px solid ${colors.border}` }}
    >
      {/* Decorative circle */}
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-15 pointer-events-none"
        style={{ background: colors.border }}
      />

      {/* Icon */}
      {Icon && (
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-6 ${colors.iconBg}`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">{description}</p>
        {action && (
          <a href="#" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: colors.border }}>
            {action}
            <ArrowRight className="w-4 h-4" />
          </a>
        )}
      </div>
    </motion.div>
  );
}