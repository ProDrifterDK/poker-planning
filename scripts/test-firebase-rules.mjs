import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, set, update } from 'firebase/database';

const root = new URL('../', import.meta.url);
const projectId = process.env.GCLOUD_PROJECT || 'demo-poker-planning-rules';

const testEnv = await initializeTestEnvironment({
  projectId,
  database: {
    rules: readFileSync(fileURLToPath(new URL('database.rules.json', root)), 'utf8'),
  },
  firestore: {
    rules: readFileSync(fileURLToPath(new URL('firestore.rules', root)), 'utf8'),
  },
});

try {
  const alice = testEnv.authenticatedContext('alice', { email: 'alice@example.com' });
  const bob = testEnv.authenticatedContext('bob', { email: 'bob@example.com' });
  const charlie = testEnv.authenticatedContext('charlie', { email: 'charlie@example.com' });
  const aliceDb = alice.database();
  const bobDb = bob.database();
  const charlieDb = charlie.database();
  const aliceFirestore = alice.firestore();

  await assertFails(
    set(ref(aliceDb, 'rooms/direct-room/metadata'), {
      creatorId: 'alice',
      creatorPlan: 'enterprise',
      title: 'Client-created room',
    })
  );

  await assertFails(
    set(ref(aliceDb, 'rooms/direct-room/sessions/session-client'), {
      active: true,
      reveal: false,
    })
  );

  await assertFails(
    set(ref(aliceDb, 'rooms/direct-room/participants/participant-client'), {
      firebaseUid: 'alice',
      participantId: 'participant-client',
      role: 'moderator',
      active: true,
    })
  );

  await testEnv.withSecurityRulesDisabled(async (admin) => {
    const adminDb = admin.database();
    await set(ref(adminDb, 'rooms/backend-room/metadata'), {
      active: true,
      creatorId: 'alice',
      title: 'Backend-created room',
    });
    await set(ref(adminDb, 'rooms/backend-room/memberUids/alice'), true);
    await set(ref(adminDb, 'rooms/backend-room/memberUids/bob'), true);
    await set(ref(adminDb, 'rooms/backend-room/sessions/session-backend'), {
      active: true,
      reveal: false,
      currentIssueId: null,
      startedAt: 123456,
    });
    await set(ref(adminDb, 'rooms/backend-room/participants/participant-alice'), {
      firebaseUid: 'alice',
      participantId: 'participant-alice',
      role: 'moderator',
      active: true,
      name: 'Alice',
    });
    await set(ref(adminDb, 'rooms/backend-room/participants/participant-bob'), {
      firebaseUid: 'bob',
      participantId: 'participant-bob',
      role: 'participant',
      active: true,
      name: 'Bob',
    });
  });

  await assertFails(
    update(ref(aliceDb, 'rooms/backend-room/metadata'), {
      creatorPlan: 'enterprise',
    })
  );

  await assertFails(
    set(ref(aliceDb, 'rooms/backend-room/sessions/session-client'), {
      active: true,
      reveal: false,
    })
  );

  await assertFails(
    set(ref(charlieDb, 'rooms/backend-room/participants/participant-charlie'), {
      firebaseUid: 'charlie',
      participantId: 'participant-charlie',
      role: 'participant',
      active: true,
      name: 'Charlie',
    })
  );

  await assertSucceeds(
    update(ref(aliceDb, 'rooms/backend-room/sessions/session-backend'), {
      reveal: true,
      currentIssueId: 'issue-1',
      timerEnabled: true,
      timerDuration: 60,
      timerStartedAt: 123999,
    })
  );

  await assertFails(
    update(ref(charlieDb, 'rooms/backend-room/sessions/session-backend'), {
      reveal: false,
    })
  );

  await assertSucceeds(
    update(ref(bobDb, 'rooms/backend-room/sessions/session-backend'), {
      reveal: false,
      timerStartedAt: null,
    })
  );

  await assertSucceeds(
    update(ref(aliceDb, 'rooms/backend-room'), {
      reveal: true,
      currentIssueId: 'issue-1',
      timerStartedAt: null,
    })
  );

  await assertSucceeds(
    set(ref(aliceDb, 'rooms/backend-room/issues/issue-1'), {
      key: 'PROJ-1',
      summary: 'Backend-member issue',
      status: 'pending',
    })
  );

  await assertSucceeds(
    update(ref(aliceDb, 'rooms/backend-room/participants/participant-alice'), {
      estimation: 5,
      firebaseUid: 'alice',
      participantId: 'participant-alice',
      role: 'moderator',
      active: true,
      lastActive: 123456,
    })
  );

  await assertFails(
    update(ref(aliceDb, 'rooms/backend-room/participants/participant-alice'), {
      firebaseUid: 'alice',
      participantId: 'participant-alice',
      role: 'owner',
    })
  );

  await assertFails(
    update(ref(aliceDb, 'rooms/backend-room/participants/participant-alice'), {
      firebaseUid: 'alice',
      participantId: 'participant-alice',
      role: 'moderator',
      active: false,
      lastActive: 123456,
    })
  );

  await assertSucceeds(
    update(ref(bobDb, 'rooms/backend-room/participants/participant-bob'), {
      estimation: 8,
      firebaseUid: 'bob',
      participantId: 'participant-bob',
      role: 'participant',
      active: true,
      lastActive: 123457,
    })
  );

  await assertFails(
    update(ref(bobDb, 'rooms/backend-room/participants/participant-bob'), {
      active: false,
      firebaseUid: 'bob',
      participantId: 'participant-bob',
      role: 'participant',
      lastActive: 123458,
    })
  );

  await assertFails(
    update(ref(aliceDb, 'rooms/backend-room/participants/participant-bob'), {
      active: false,
      removed: true,
    })
  );

  await testEnv.withSecurityRulesDisabled(async (admin) => {
    await update(ref(admin.database(), 'rooms/backend-room/participants/participant-bob'), {
      active: false,
      removed: true,
      lastActive: 123459,
    });
  });

  await assertFails(
    update(ref(bobDb, 'rooms/backend-room/participants/participant-bob'), {
      active: true,
      removed: false,
      firebaseUid: 'bob',
      participantId: 'participant-bob',
      role: 'participant',
      lastActive: 123460,
    })
  );

  await assertFails(
    setDoc(doc(aliceFirestore, 'rooms', 'direct-room'), {
      active: true,
      createdBy: 'alice',
      creatorPlan: 'enterprise',
    })
  );

  await testEnv.withSecurityRulesDisabled(async (admin) => {
    await setDoc(doc(admin.firestore(), 'rooms', 'backend-room'), {
      active: true,
      createdBy: 'alice',
    });
  });

  await assertFails(updateDoc(doc(aliceFirestore, 'rooms', 'backend-room'), { active: false }));

  console.log('Firebase room rules passed: direct room writes denied and participant lifecycle flags are backend-owned.');
} finally {
  await testEnv.cleanup();
}
