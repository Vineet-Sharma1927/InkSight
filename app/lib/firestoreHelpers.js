'use client';

import { collection, doc } from 'firebase/firestore';
import { auth, db } from './firebaseClient';

export function patientsCollectionRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');
  return collection(doc(collection(db, 'doctors'), uid), 'patients');
}

export function doctorDocRef(uid) {
  return doc(collection(db, 'doctors'), uid);
}


