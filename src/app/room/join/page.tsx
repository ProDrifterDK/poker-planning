'use client';

import { Suspense } from 'react';
import DirectJoin from './DirectJoin';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

export default function JoinRoomPage() {
    return (
        <ProtectedRoute>
            <Suspense fallback={<p>Loading...</p>}>
                <DirectJoin />
            </Suspense>
        </ProtectedRoute>
    );
}
