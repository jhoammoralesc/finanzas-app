import { defineFunction } from '@aws-amplify/backend';

export const whatsappProcessor = defineFunction({
  name: 'whatsapp-processor',
  entry: './handler.ts',
  environment: {
    WHATSAPP_TOKEN: 'your-whatsapp-token',
    VERIFY_TOKEN: 'your-verify-token',
  },
});
