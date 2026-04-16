import React from 'react';
import { useEffect, useState } from 'react';
import InventoryAlertsTab from '../../NewSuperAdmin/Sidebar/Inventory/InventoryAlertsTab';
import api from '../../../services/api';

const BM_InventoryAlertCenter: React.FC = () => {
  const [branchId, setBranchId] = useState<number | null>(null);

  useEffect(() => {
    api.get('/user')
      .then(res => setBranchId(res.data?.branch_id ?? null))
      .catch(() => setBranchId(null));
  }, []);

  const handleNavigate: React.ComponentProps<typeof InventoryAlertsTab>['onNavigate'] = (id) => {
    const next = id === 'raw_materials'
      ? 'inventory-list'
      : id === 'usage_report'
        ? 'inventory-report'
        : id === 'inv_overview'
          ? 'inventory-dashboard'
          : null;

    if (!next) return;
    window.dispatchEvent(new CustomEvent('bm-inventory-navigate', { detail: next }));
  };

  return <InventoryAlertsTab onNavigate={handleNavigate} fixedBranchId={branchId} />;
};

export default BM_InventoryAlertCenter;
