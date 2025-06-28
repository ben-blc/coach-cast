'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Crown, Rocket } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: 'AI Explorer',
    price: '$25',
    period: '/month',
    description: 'Perfect for getting started with AI coaching',
    icon: Sparkles,
    features: [
      '50 AI coaching credits',
      'Access to all AI coaches',
      'Basic goal tracking',
      'Email support',
      'Session analytics'
    ],
    popular: false,
    color: 'from-brand-secondary to-brand-primary'
  },
  {
    name: 'Coaching Starter',
    price: '$99',
    period: '/month',
    description: 'Ideal for regular coaching sessions',
    icon: Crown,
    features: [
      '250 AI coaching credits',
      '1 human coaching session',
      'Priority support',
      'Advanced analytics',
      'Document sharing',
      'Goal tracking & progress reports'
    ],
    popular: true,
    color: 'from-semantic-positive to-brand-secondary'
  },
  {
    name: 'Coaching Accelerator',
    price: '$189',
    period: '/month',
    description: 'Maximum coaching with premium features',
    icon: Rocket,
    features: [
      '600 AI coaching credits',
      '2 human coaching sessions',
      'Premium features',
      'Priority scheduling',
      'Exclusive workshops',
      'Personal coaching consultant'
    ],
    popular: false,
    color: 'from-brand-primary to-content-dark'
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-content-dark mb-4">
            Choose Your{' '}
            <span className="text-semantic-positive">Coaching Journey</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start free. Upgrade when you're ready to unlock your full potential.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={index}
              className={`relative ${plan.popular ? 'border-2 border-semantic-positive ring-4 ring-semantic-positive/20 scale-105' : 'border border-gray-200'} hover:shadow-2xl transition-all duration-300 group`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-semantic-positive text-white px-4 py-1 text-sm font-semibold">
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-6 relative overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-5`}></div>
                <div className="relative z-10">
                  <div className="flex justify-center mb-4">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-br ${plan.color} shadow-lg`}>
                      <plan.icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-content-dark">
                    {plan.name}
                  </CardTitle>
                  <div className="flex items-baseline justify-center space-x-2 mt-4">
                    <span className="text-4xl font-bold text-content-dark">{plan.price}</span>
                    <span className="text-gray-600">{plan.period}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start space-x-3">
                      <div className="w-5 h-5 rounded-full bg-semantic-positive flex items-center justify-center mt-0.5 flex-shrink-0">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${plan.popular 
                    ? 'bg-semantic-positive hover:bg-semantic-positive/90 text-white' 
                    : 'bg-brand-primary hover:bg-brand-primary/90 text-white'
                  } font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl`}
                  size="lg" 
                  asChild
                >
                  <Link href="/auth?mode=signup">
                    Get Started
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            All plans include access to our full coaching platform and 24/7 support.
          </p>
          <p className="text-sm text-gray-500">
            Secure payments powered by Stripe. Cancel anytime.
          </p>
        </div>
      </div>
    </section>
  );
}