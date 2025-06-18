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
    description: 'Perfect for self-starters who want AI coaching support',
    features: [
      '50 AI coaching credits',
      'Access to 4 AI specialist coaches',
      'Session summaries & goals',
      'Human coach marketplace access',
      'Basic progress tracking',
      'Email support'
    ],
    icon: Sparkles,
    color: 'border-blue-200',
    buttonColor: 'bg-blue-600 hover:bg-blue-700',
    popular: false
  },
  {
    name: 'Coaching Starter',
    price: '$69',
    period: '/month',
    description: 'Ideal for hybrid support with AI and human coaching',
    features: [
      '200 AI coaching credits',
      '1 human group session monthly',
      'All AI specialist coaches',
      'Personalized video previews',
      'Advanced progress analytics',
      'Priority scheduling',
      'Phone & chat support'
    ],
    icon: Crown,
    color: 'border-green-200 ring-2 ring-green-200',
    buttonColor: 'bg-green-600 hover:bg-green-700',
    popular: true
  },
  {
    name: 'Coaching Accelerator',
    price: '$129',
    period: '/month',
    description: 'Maximum progress with frequent human coaching',
    features: [
      '600 total coaching credits',
      'Unlimited AI coaching sessions',
      '4 human coaching sessions',
      'Priority coach matching',
      'Custom goal setting',
      'White-glove onboarding',
      'Dedicated success manager'
    ],
    icon: Rocket,
    color: 'border-purple-200',
    buttonColor: 'bg-purple-600 hover:bg-purple-700',
    popular: false
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Choose Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Coaching Journey
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Start with a free trial, then select the plan that fits your growth goals.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card key={index} className={`relative ${plan.color} hover:shadow-lg transition-all duration-300`}>
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-600 text-white px-4 py-1">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plan.color.includes('green') ? 'bg-green-100' : plan.color.includes('purple') ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    <plan.icon className={`w-6 h-6 ${plan.color.includes('green') ? 'text-green-600' : plan.color.includes('purple') ? 'text-purple-600' : 'text-blue-600'}`} />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline justify-center space-x-2">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${plan.buttonColor} text-white`}
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
            All plans include a 7-day free trial. No credit card required.
          </p>
          <Button variant="outline" size="lg" asChild>
            <Link href="/discovery">
              Try Free Demo
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}