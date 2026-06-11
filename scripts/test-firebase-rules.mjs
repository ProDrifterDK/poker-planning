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
  const aliceDb = alice.database();
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
    await set(ref(admin.database(), 'rooms/backend-room/participants/participant-alice'), {
      firebaseUid: 'alice',
      participantId: 'participant-alice',
      role: 'moderator',
      active: true,
      name: 'Alice',
    });
  });

  await assertSucceeds(
    update(ref(aliceDb, 'rooms/backend-room/participants/participant-alice'), {
      active: false,
      firebaseUid: 'alice',
      participantId: 'participant-alice',
      role: 'moderator',
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

  console.log('Firebase room rules passed: direct room metadata/session/participant writes denied.');
} finally {
  await testEnv.cleanup();
}
