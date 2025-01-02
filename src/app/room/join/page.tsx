import { Suspense } from 'react';
import ClientJoin from './ClientJoin';

export default function JoinRoomPage() {
    return (
        <Suspense fallback={<p>Loading...</p>}>
            <ClientJoin />
        </Suspense>
    );
}
