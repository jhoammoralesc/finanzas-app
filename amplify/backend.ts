import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { whatsappProcessor } from './functions/whatsapp-processor/resource';
import { financeAnalyzer } from './functions/finance-analyzer/resource';

export const backend = defineBackend({
  auth,
  data,
  whatsappProcessor,
  financeAnalyzer,
});
