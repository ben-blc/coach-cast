'use client';

import { Navbar } from '@/components/sections/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, Lock, Database, Users, Mail } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600">
            Your privacy is important to us. This policy explains how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Information We Collect</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Personal Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Name and email address when you create an account</li>
                  <li>Profile information you choose to provide</li>
                  <li>Payment information for subscription services</li>
                  <li>Communication preferences and settings</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Coaching Session Data</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Session transcripts and recordings (with your consent)</li>
                  <li>Session duration and frequency</li>
                  <li>Goals and progress tracking information</li>
                  <li>Feedback and ratings you provide</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Technical Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Device information and browser type</li>
                  <li>IP address and location data</li>
                  <li>Usage patterns and feature interactions</li>
                  <li>Performance and error logs</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="w-5 h-5" />
                <span>How We Use Your Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Provide and improve our coaching services</li>
                <li>Personalize your coaching experience</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send important updates and notifications</li>
                <li>Analyze usage patterns to enhance our platform</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Information Sharing</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">We Do Not Sell Your Data</h3>
                <p className="text-gray-700">
                  We never sell, rent, or trade your personal information to third parties for marketing purposes.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Limited Sharing</h3>
                <p className="text-gray-700 mb-2">We may share your information only in these specific circumstances:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>With your chosen coaches (only relevant session data)</li>
                  <li>With service providers who help us operate our platform</li>
                  <li>When required by law or to protect our rights</li>
                  <li>In connection with a business transfer or merger</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Data Security</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Secure data centers and infrastructure</li>
                  <li>Employee training on data protection</li>
                </ul>
                <p className="text-gray-700">
                  While we strive to protect your information, no method of transmission over the internet 
                  is 100% secure. We cannot guarantee absolute security.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">You have the following rights regarding your personal information:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><strong>Access:</strong> Request a copy of your personal data</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal data</li>
                  <li><strong>Portability:</strong> Export your data in a machine-readable format</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Restriction:</strong> Limit how we process your information</li>
                </ul>
                <p className="text-gray-700">
                  To exercise these rights, please contact us using the information provided below.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We retain your personal information for as long as necessary to provide our services 
                and fulfill the purposes outlined in this policy. Specifically:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
                <li>Account information: Until you delete your account</li>
                <li>Session data: For the duration of your subscription plus 2 years</li>
                <li>Payment information: As required by law and payment processors</li>
                <li>Marketing data: Until you opt out or we no longer need it</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Third-Party Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-700">
                  Our platform integrates with third-party services to provide enhanced functionality:
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li><strong>ElevenLabs:</strong> AI voice technology for coaching sessions</li>
                  <li><strong>Supabase:</strong> Database and authentication services</li>
                  <li><strong>Stripe:</strong> Payment processing</li>
                  <li><strong>Cal.com:</strong> Scheduling services</li>
                </ul>
                <p className="text-gray-700">
                  These services have their own privacy policies, and we encourage you to review them.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to This Policy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We may update this privacy policy from time to time. We will notify you of any 
                material changes by posting the new policy on this page and updating the "Last updated" 
                date. We encourage you to review this policy periodically.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Contact Us</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have any questions about this privacy policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> privacy@coachcast.com<br />
                  <strong>Address:</strong> Coach Cast Privacy Team<br />
                  123 Innovation Drive<br />
                  Tech City, TC 12345
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}