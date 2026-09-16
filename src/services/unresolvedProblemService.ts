import { appendFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import type { UnresolvedConversation } from '../models/UnresolvedConversation';

function getLocalIsoTimestamp(): string {
  const now = new Date();

  const offsetMinutes = -now.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';

  const absoluteOffset = Math.abs(offsetMinutes);
  const offsetHours = Math.floor(absoluteOffset / 60);
  const offsetMins = absoluteOffset % 60;

  const pad = (value: number, length = 2) =>
    String(value).padStart(length, '0');

  return (
    `${now.getFullYear()}-` +
    `${pad(now.getMonth() + 1)}-` +
    `${pad(now.getDate())}T` +
    `${pad(now.getHours())}:` +
    `${pad(now.getMinutes())}:` +
    `${pad(now.getSeconds())}.` +
    `${pad(now.getMilliseconds(), 3)}` +
    `${sign}${pad(offsetHours)}:${pad(offsetMins)}`
  );
}

export async function saveUnresolvedProblem(
  conversationId: string,
  problem: UnresolvedConversation,
): Promise<void> {
  const unresolvedDirectory = path.join(process.cwd(), 'data', 'unresolved');

  const unresolvedFile = path.join(
    unresolvedDirectory,
    'unresolved-problems.jsonl',
  );

  await mkdir(unresolvedDirectory, { recursive: true });

  const record = {
    conversationId,
    user: problem.user,
    originalQuestion: problem.originalQuestion,
    rephrasedQuestion: problem.rephrasedQuestion ?? '',
    submittedAt: getLocalIsoTimestamp(),
  };

  await appendFile(unresolvedFile, `${JSON.stringify(record)}\n`, 'utf8');
}
