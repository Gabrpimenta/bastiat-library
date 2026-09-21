import * as migration_20260921_043758_initial from './20260921_043758_initial';

export const migrations = [
  {
    up: migration_20260921_043758_initial.up,
    down: migration_20260921_043758_initial.down,
    name: '20260921_043758_initial',
  },
];
