'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-bg via-secondary-bg to-primary-bg overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-primary-accent rounded-full mix-blend-multiply filter blur-xl animate-pulse-delayed"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent-hover rounded-full mix-blend-multiply filter blur-xl animate-pulse-delayed animation-delay-2000"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-accent rounded-full mix-blend-multiply filter blur-xl animate-pulse-delayed animation-delay-4000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-primary-text mb-6 leading-tight">
              Streamline Rorschach Scoring with{' '}
              <span className="text-gradient">
                InkSight
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-secondary-text mb-12 max-w-4xl mx-auto leading-relaxed">
              Our secure platform simplifies test administration, automates complex Exner scoring, 
              and helps you generate comprehensive psychological reports faster than ever before.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/form"
                className="btn btn-primary btn-lg hover-lift"
              >
                Start Free Trial
              </Link>
              <Link
                href="/patients"
                className="btn btn-outline btn-lg hover-lift"
              >
                View Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-primary-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-primary-text mb-4">
              Get from Test to Insights in 3 Simple Steps
            </h2>
            <p className="text-xl text-secondary-text max-w-3xl mx-auto">
              Our streamlined process makes psychological testing more efficient than ever
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: "💻",
                title: "Administer",
                description: "Conduct tests seamlessly with our user-friendly digital interface, capturing every response accurately."
              },
              {
                icon: "🧠",
                title: "Score",
                description: "Our advanced algorithms instantly process the data, applying the complete Exner scoring system without manual effort."
              },
              {
                icon: "📊",
                title: "Analyze",
                description: "Generate detailed, professional reports with all 7 key sections, ready for clinical interpretation and patient records."
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center text-3xl mx-auto mb-6 shadow-lg">
                  {step.icon}
                </div>
                <h3 className="text-2xl font-bold text-primary-text mb-4">{step.title}</h3>
                <p className="text-secondary-text leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-secondary-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-primary-text mb-4">
              Everything You Need for Modern Psychological Practice
            </h2>
            <p className="text-xl text-secondary-text max-w-3xl mx-auto">
              Comprehensive tools designed specifically for mental health professionals
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: "📋",
                title: "Test Administration",
                description: "Create and administer psychological tests with our intuitive digital interface. Record responses and analyze data in real-time with professional-grade accuracy."
              },
              {
                icon: "👥",
                title: "Patient Management",
                description: "Maintain a comprehensive database of patients and their test results. Access historical data and track progress over time with secure, organized records."
              },
              {
                icon: "📈",
                title: "Data Analysis",
                description: "Analyze test responses with advanced algorithms and AI-powered insights. Generate comprehensive reports based on the latest psychological research and scoring systems."
              },
              {
                icon: "🔒",
                title: "Secure Storage",
                description: "Store sensitive patient information with enterprise-grade security. Maintain full confidentiality with encrypted data storage."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="card hover-lift"
              >
                <div className="w-16 h-16 bg-gradient-primary rounded-lg flex items-center justify-center text-2xl mb-6">
                  {feature.icon}
                </div>
                <h3 className="card-title">{feature.title}</h3>
                <p className="card-body">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Credibility Section */}
      <section className="py-20 bg-primary-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-primary-text mb-4">
              Designed for Professionals, Built on Trust
            </h2>
            <p className="text-xl text-secondary-text max-w-3xl mx-auto">
              Join thousands of mental health professionals who trust InkSight with their practice
            </p>
          </motion.div>
          
          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {[
              {
                quote: "InkSight has transformed my workflow. The time I save on Rorschach scoring is invaluable, allowing me more time to focus on my patients.",
                author: "Dr. Alisha Sharma",
                title: "Clinical Psychologist"
              },
              {
                quote: "The accuracy of the Exner scoring system implementation is impressive. It's like having a senior psychologist review every assessment.",
                author: "Dr. Michael Chen",
                title: "Research Psychologist"
              },
              {
                quote: "Finally, a platform that understands the needs of mental health professionals. The security and reliability give me complete peace of mind.",
                author: "Dr. Sarah Johnson",
                title: "Private Practice"
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="card hover-lift"
              >
                <div className="text-secondary-text mb-4 italic">"{testimonial.quote}"</div>
                <div className="font-semibold text-primary-text">{testimonial.author}</div>
                <div className="text-sm text-primary-accent">{testimonial.title}</div>
              </motion.div>
            ))}
          </div>
          
          {/* Trust Badges */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="flex flex-wrap justify-center gap-8">
              {[
                { text: "Secure & Reliable", icon: "🛡️" },
                { text: "SSL Encrypted", icon: "🔐" },
                { text: "Clinical & Research Use", icon: "🏥" },
                { text: "Professional Grade", icon: "✅" }
              ].map((badge, index) => (
                <div key={index} className="flex items-center gap-2 bg-secondary-bg px-4 py-2 rounded-full border border-accent-border hover:border-primary-accent transition-colors">
                  <span className="text-lg">{badge.icon}</span>
                  <span className="text-sm font-medium text-primary-text">{badge.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-primary-text mb-6">
              Ready to Transform Your Practice?
            </h2>
            <p className="text-xl text-primary-text mb-8 opacity-90">
              Join thousands of professionals who have already modernized their psychological testing workflow
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/form"
                className="btn btn-lg bg-primary-text text-primary-accent hover:bg-gray-50 hover-lift"
              >
                Start Free Trial
              </Link>
              <Link
                href="/patients"
                className="btn btn-outline btn-lg border-primary-text text-primary-text hover:bg-primary-text hover:text-primary-accent hover-lift"
              >
                Schedule Demo
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
