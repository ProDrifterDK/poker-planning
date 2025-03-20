import React from 'react';
import { Metadata } from 'next';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Panel de Administración | Planning Poker Pro',
  description: 'Panel de administración para gestionar usuarios y configuraciones',
};

export default function AdminPage() {
  return <AdminDashboard />;
}