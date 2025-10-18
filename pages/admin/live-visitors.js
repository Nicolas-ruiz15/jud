import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import OptimizedLiveVisitorsSystem from '../../components/admin/OptimizedLiveVisitorsSystem'; // IMPORTAR
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLiveVisitorsPage() {
  const { user } = useAdminAuth();

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <AdminLayout title="Visitantes en Tiempo Real">
      <OptimizedLiveVisitorsSystem />
    </AdminLayout>
  );
}