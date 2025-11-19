import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  User: a
    .model({
      email: a.string().required(),
      phone: a.string().required(),
      firstName: a.string().required(),
      lastName: a.string().required(),
      whatsappNumber: a.string(),
      monthlyIncome: a.float(),
      currency: a.string().default('COP'),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  Transaction: a
    .model({
      userId: a.id().required(),
      amount: a.float().required(),
      type: a.enum(['INCOME', 'EXPENSE']),
      category: a.string().required(),
      subcategory: a.string(),
      description: a.string().required(),
      date: a.date().required(),
      source: a.enum(['MANUAL', 'WHATSAPP', 'BANK_IMPORT']),
      isRecurring: a.boolean().default(false),
      recurringFrequency: a.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']),
      tags: a.string().array(),
      location: a.string(),
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  Category: a
    .model({
      name: a.string().required(),
      type: a.enum(['INCOME', 'EXPENSE']),
      icon: a.string(),
      color: a.string(),
      isDefault: a.boolean().default(false),
      userId: a.id(),
    })
    .authorization((allow) => [allow.owner(), allow.publicApiKey().to(['read'])]),

  Budget: a
    .model({
      userId: a.id().required(),
      categoryId: a.id().required(),
      amount: a.float().required(),
      period: a.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
      startDate: a.date().required(),
      endDate: a.date().required(),
      spent: a.float().default(0),
      isActive: a.boolean().default(true),
    })
    .authorization((allow) => [allow.owner()]),

  FinancialGoal: a
    .model({
      userId: a.id().required(),
      name: a.string().required(),
      targetAmount: a.float().required(),
      currentAmount: a.float().default(0),
      targetDate: a.date(),
      category: a.string(),
      priority: a.enum(['LOW', 'MEDIUM', 'HIGH']),
      isCompleted: a.boolean().default(false),
    })
    .authorization((allow) => [allow.owner()]),

  WhatsAppMessage: a
    .model({
      userId: a.id().required(),
      messageId: a.string().required(),
      content: a.string().required(),
      processed: a.boolean().default(false),
      extractedData: a.json(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),

  FinancialReport: a
    .model({
      userId: a.id().required(),
      reportType: a.enum(['MONTHLY', 'WEEKLY', 'YEARLY', 'CUSTOM']),
      period: a.string().required(),
      data: a.json().required(),
      insights: a.string().array(),
      recommendations: a.string().array(),
      createdAt: a.datetime(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});
