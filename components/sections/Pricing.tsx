'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'Free Trial',
    price: '$0',
    period: '/month',
    description: 'Get started with AI coaching',
    features: [
      '7 minutes of AI coaching',
      'Access to all AI coaches',
      'Basic goal tracking',
      'Email support'
    ],
    popular: true
  },
  {
    name: 'AI Explorer',
    price: '$25',
    period: '/month',
    description: 'Regular AI coaching sessions',
    features: [
      '50 AI coaching credits',
      'Advanced analytics',
      'Priority support',
      'Goal tracking'
    ],
    popular: false
  },
  {
    name: 'Coaching Pro',
    price: '$99',
    period: '/month',
    description: 'Full coaching experience',
    features: [
      'Unlimited AI coaching',
      '1 human coaching session',
      'Premium features',
      'Priority scheduling'
    ],
    popular: false
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Simple{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free. Upgrade when you're ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${plan.popular ? 'border-green-200 ring-2 ring-green-200' : 'border-gray-200'} hover:shadow-lg transition-shadow`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-600 text-white px-4 py-1">
                    Free Now
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <div className="flex items-baseline justify-center space-x-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full" 
                  asChild
                  variant={index === 0 ? "default" : "outline"}
                  disabled={index > 0}
                >
                  <Link href="/auth?mode=signup">
                    {index === 0 ? 'Start Free' : 'Coming Soon'}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600">
            All users currently get free access during beta.
          </p>
        </div>
      </div>
    </section>
  );
}