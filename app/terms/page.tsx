'use client';

import { Navbar } from '@/components/sections/Navbar';
import { Footer } from '@/components/sections/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Scale, CreditCard, Shield, AlertTriangle, Mail } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <FileText className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-xl text-gray-600">
            Please read these terms carefully before using our coaching platform.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scale className="w-5 h-5" />
                <span>Acceptance of Terms</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                By accessing or using Coach Cast ("the Service"), you agree to be bound by these Terms of Service 
                ("Terms"). If you disagree with any part of these terms, then you may not access the Service. 
                These Terms apply to all visitors, users, and others who access or use the Service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Description of Service</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-700">
                Coach Cast is a comprehensive coaching platform that provides:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>AI-powered coaching sessions using advanced voice technology</li>
                <li>Access to certified human coaches</li>
                <li>Personalized coaching experiences and progress tracking</li>
                <li>Video previews and scheduling tools</li>
                <li>Goal setting and achievement monitoring</li>
              </ul>
              <p className="text-gray-700">
                The Service is designed to support personal and professional development through 
                innovative technology and human expertise.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>User Accounts and Registration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Creation</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>You must provide accurate and complete information when creating an account</li>
                  <li>You are responsible for maintaining the security of your account credentials</li>
                  <li>You must be at least 18 years old to use the Service</li>
                  <li>One person may not maintain multiple accounts</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Account Responsibilities</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>You are responsible for all activities that occur under your account</li>
                  <li>Notify us immediately of any unauthorized use of your account</li>
                  <li>Keep your contact information current and accurate</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Subscription and Payment Terms</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Subscription Plans</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Free Trial: 7 minutes of AI coaching at no cost</li>
                  <li>AI Explorer: $25/month for 50 AI coaching credits</li>
                  <li>Coaching Starter: $99/month including live human sessions</li>
                  <li>Coaching Accelerator: $189/month for intensive coaching</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Payment Terms</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Subscriptions are billed monthly in advance</li>
                  <li>All fees are non-refundable except as required by law</li>
                  <li>We may change pricing with 30 days' notice</li>
                  <li>Failed payments may result in service suspension</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Cancellation</h3>
                <p className="text-gray-700">
                  You may cancel your subscription at any time. Cancellation will take effect at the end 
                  of your current billing period. You will retain access to paid features until the end 
                  of your billing period.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acceptable Use Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Permitted Uses</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Personal and professional development coaching</li>
                  <li>Goal setting and progress tracking</li>
                  <li>Engaging with AI and human coaches respectfully</li>
                  <li>Sharing feedback to improve the Service</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Prohibited Uses</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1">
                  <li>Using the Service for any illegal or unauthorized purpose</li>
                  <li>Harassing, abusing, or threatening coaches or other users</li>
                  <li>Attempting to gain unauthorized access to the Service</li>
                  <li>Sharing account credentials with others</li>
                  <li>Using the Service to provide coaching to others commercially</li>
                  <li>Reverse engineering or attempting to extract source code</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Privacy and Data Protection</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                Your privacy is important to us. Our collection and use of personal information is governed 
                by our Privacy Policy, which is incorporated into these Terms by reference. By using the Service, 
                you consent to the collection and use of your information as described in the Privacy Policy.
              </p>
              <p className="text-gray-700 mt-4">
                <strong>Session Recordings:</strong> AI coaching sessions may be recorded for quality assurance 
                and improvement purposes. You will be notified before any recording begins, and you may opt out 
                of recording while still using the Service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intellectual Property Rights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Our Content</h3>
                <p className="text-gray-700">
                  The Service and its original content, features, and functionality are owned by Coach Cast 
                  and are protected by international copyright, trademark, patent, trade secret, and other 
                  intellectual property laws.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Your Content</h3>
                <p className="text-gray-700">
                  You retain ownership of any content you provide to the Service. However, by using the Service, 
                  you grant us a limited license to use your content for the purpose of providing and improving 
                  the Service.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5" />
                <span>Disclaimers and Limitations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Service Disclaimer</h3>
                <p className="text-gray-700">
                  The Service is provided "as is" and "as available" without warranties of any kind. 
                  We do not guarantee that the Service will be uninterrupted, secure, or error-free.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Coaching Disclaimer</h3>
                <p className="text-gray-700">
                  Coach Cast provides coaching services for personal and professional development. 
                  Our services are not a substitute for professional medical, psychological, or therapeutic treatment. 
                  If you are experiencing mental health issues, please consult with a qualified healthcare professional.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Limitation of Liability</h3>
                <p className="text-gray-700">
                  To the maximum extent permitted by law, Coach Cast shall not be liable for any indirect, 
                  incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Termination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We may terminate or suspend your account and access to the Service immediately, without prior 
                notice or liability, for any reason, including if you breach these Terms. Upon termination, 
                your right to use the Service will cease immediately.
              </p>
              <p className="text-gray-700 mt-4">
                You may also terminate your account at any time by contacting us or using the account 
                deletion feature in your settings.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Governing Law</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
                in which Coach Cast operates, without regard to its conflict of law provisions. Any disputes 
                arising from these Terms or the Service shall be resolved through binding arbitration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">
                We reserve the right to modify or replace these Terms at any time. If a revision is material, 
                we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes 
                a material change will be determined at our sole discretion.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Contact Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> legal@coachcast.com<br />
                  <strong>Address:</strong> Coach Cast Legal Team<br />
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