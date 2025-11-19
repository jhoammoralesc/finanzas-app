import { defineFunction } from '@aws-amplify/backend';

export const financeAnalyzer = defineFunction({
  name: 'finance-analyzer',
  entry: './handler.ts',
});
