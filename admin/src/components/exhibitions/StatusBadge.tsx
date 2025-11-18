import React from 'react';
import { Tag, Tooltip } from 'antd';
import type { Exhibition, ExhibitionStatus } from '../../types/exhibitions';
import { getStatusInfo, calculateExhibitionStatus } from '../../utils/exhibitionStatusHelper';

interface StatusBadgeProps {
  status: ExhibitionStatus;
  exhibition?: Exhibition;
  size?: 'default' | 'small';
  showTooltip?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  exhibition,
  size = 'default',
  showTooltip = true
}) => {
  const statusCalc = exhibition ? calculateExhibitionStatus(exhibition) : null;
  
  // Use computed status if available
  const displayStatus = statusCalc?.computed || status;
  const displayInfo = getStatusInfo(displayStatus);

  const badge = (
    <Tag 
      color={displayInfo.color} 
      style={{
        borderRadius: '6px',
        fontWeight: 500,
        fontSize: size === 'small' ? '11px' : '12px',
        padding: size === 'small' ? '2px 6px' : '4px 8px',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        margin: 0,
      }}
    >
      <span>{displayInfo.icon}</span>
      {displayInfo.text}
    </Tag>
  );

  if (showTooltip && statusCalc) {
    return (
      <Tooltip title={statusCalc.message}>
        {badge}
      </Tooltip>
    );
  }

  return badge;
};

export default StatusBadge;
