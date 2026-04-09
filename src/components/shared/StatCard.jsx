import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/lib/ThemeContext';

export default function StatCard({ icon: Icon, label, value, subtitle, color = 'cyan' }) {
  const { theme } = useTheme();
  const colorMap = {
    cyan: { bg: 'bg-cyan-50', icon: 'text-cyan-600', darkBg: 'bg-cyan-900/20', darkIcon: 'text-cyan-400' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', darkBg: 'bg-purple-900/20', darkIcon: 'text-purple-400' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', darkBg: 'bg-green-900/20', darkIcon: 'text-green-400' },
    orange: { bg: 'bg-orange-50', icon: 'text-orange-600', darkBg: 'bg-orange-900/20', darkIcon: 'text-orange-400' },
    darkBlue: { bg: 'bg-blue-50', icon: 'text-blue-700', darkBg: 'bg-blue-900/30', darkIcon: 'text-blue-400' },
  };

  const colors = colorMap[color];
  const bgClass = theme === 'dark' ? colors.darkBg : colors.bg;
  const iconClass = theme === 'dark' ? colors.darkIcon : colors.icon;
  const borderClass = theme === 'dark' ? 'border-2 border-cyan-400' : 'border-2 border-blue-900/40';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl p-6 ${bgClass} ${borderClass}`}
    >
      {Icon && <Icon className={`w-5 h-5 ${iconClass} mb-3`} />}
      <div className={`text-3xl font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'} mb-1`}>{value}</div>
      <div className={`text-xs font-mono uppercase tracking-wider ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'} font-semibold`}>{label}</div>
      {subtitle && <div className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-gray-400'} mt-1`}>{subtitle}</div>}
    </motion.div>
  );
}