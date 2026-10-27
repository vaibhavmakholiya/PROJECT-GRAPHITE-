import { ISanchayRepository } from './repository';
import { mockRepository } from './mockRepository';
import { FirebaseRepository } from './firebaseRepository';

let firebaseRepoInstance: FirebaseRepository | null = null;
let activeRepo: ISanchayRepository | null = null;

export function getRepository(): ISanchayRepository {
  if (activeRepo) {
    return activeRepo;
  }

  // Select data provider based on environment variable (mock vs firebase)
  const provider = import.meta.env?.VITE_DATA || 'mock';
  if (provider === 'firebase') {
    if (!firebaseRepoInstance) {
      firebaseRepoInstance = new FirebaseRepository();
    }
    return firebaseRepoInstance;
  }

  return mockRepository;
}

export function setRepository(repo: ISanchayRepository): void {
  activeRepo = repo;
}

export const repository = getRepository();

export * from './repository';
export { mockRepository, FirebaseRepository };
