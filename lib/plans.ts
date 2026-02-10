// Plan configuration - shared between client and server
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 2000, // $20.00 in cents
    priceDisplay: '$20',
    stripePriceId: 'price_1SzOSW10lfaHTvjChFIZfZn5',
    interval: 'month' as const,
    credits: 50,
    features: [
      'AI Music Generation',
      'AI Image Generation',
      'AI Video Generation',
      'AI 3D Generation',
      'Automated Calendar',
      'Gamified Goals',
    ],
    creditsLabel: '50 AI Credits / month',
    founderCall: '1-on-1 call with founder',
  },
  pro: {
    name: 'Pro',
    price: 9000, // $90.00 in cents
    priceDisplay: '$90',
    stripePriceId: 'price_1SzOSx10lfaHTvjC91bNznnr',
    interval: 'month' as const,
    credits: 500,
    features: [
      'AI Music Generation',
      'AI Image Generation',
      'AI Video Generation',
      'AI 3D Generation',
      'Automated Calendar',
      'Gamified Goals',
    ],
    creditsLabel: '500 AI Credits / month',
    founderCall: '1-on-1 call with founder',
    badge: 'Best Value',
  },
} as const;

export type PlanKey = keyof typeof PLANS;
