'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-800 shadow-xl rounded-lg overflow-hidden"
      >
        <div className="p-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Psychological Testing System</h1>
          <p className="text-xl text-gray-300 mb-8">
            A comprehensive platform for administering and analyzing psychological tests
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mt-8">
            <Link
              href="/form"
              className="px-6 py-3 bg-indigo-600 text-white rounded-md text-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              New Test
            </Link>
            <Link
              href="/patients"
              className="px-6 py-3 bg-gray-700 text-white rounded-md text-lg font-medium hover:bg-gray-600 transition-colors"
            >
              View Patients
            </Link>
          </div>
        </div>
        
        <div className="bg-gray-700 p-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-2">Test Administration</h3>
                <p className="text-gray-300">
                  Create and administer psychological tests with a user-friendly interface.
                  Record responses and analyze data in real-time.
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-2">Patient Management</h3>
                <p className="text-gray-300">
                  Maintain a comprehensive database of patients and their test results.
                  Access historical data and track progress over time.
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-2">Data Analysis</h3>
                <p className="text-gray-300">
                  Analyze test responses with advanced algorithms.
                  Generate insights and recommendations based on test data.
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold text-white mb-2">Secure Storage</h3>
                <p className="text-gray-300">
                  Store sensitive patient information securely.
                  Maintain confidentiality and compliance with privacy regulations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
