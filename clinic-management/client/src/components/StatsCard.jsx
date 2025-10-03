import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue', 
  change, 
  changeType = 'neutral' 
}) => {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive':
        return <TrendingUp size={16} />;
      case 'negative':
        return <TrendingDown size={16} />;
      default:
        return <Minus size={16} />;
    }
  };

  const getChangeClass = () => {
    switch (changeType) {
      case 'positive':
        return 'stat-change positive';
      case 'negative':
        return 'stat-change negative';
      default:
        return 'stat-change';
    }
  };

  return (
    <div className="stat-card">
      <div className="stat-header">
        <div>
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
        </div>
        <div className={`stat-icon ${color}`}>
          <Icon size={20} />
        </div>
      </div>
      {change && (
        <div className={getChangeClass()}>
          {getChangeIcon()}
          {change}
        </div>
      )}
    </div>
  );
};

export default StatsCard;