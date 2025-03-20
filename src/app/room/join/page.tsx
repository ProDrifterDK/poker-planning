'use client';

import { Suspense } from 'react';
import ClientJoin from './ClientJoin';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function JoinRoomPage() {
    return (
        <ProtectedRoute>
            <Suspense fallback={<p>Loading...</p>}>
                <ClientJoin />
            </Suspense>
        </ProtectedRoute>
    );
}
