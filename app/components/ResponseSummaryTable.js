'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, ChevronUpIcon, ArrowDownTrayIcon, PrinterIcon } from '@heroicons/react/24/outline';

/**
 * Format arrays into comma-separated strings
 * @param {Array} arr - Array to format
 * @returns {String} Comma-separated string or empty string if array is empty
 */
const formatArray = (arr) => {
  if (!arr || arr.length === 0) return '-';
  return arr.join(', ');
};

/**
 * A single response row component
 */
const ResponseRow = ({ entry, isEven }) => {
  return (
    <motion.tr 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={`${isEven ? 'bg-gray-700' : 'bg-gray-800'} hover:bg-gray-600 transition-colors duration-200`}
    >
      <td className="px-4 py-3 text-sm text-center">{entry.position || '-'}</td>
      <td className="px-4 py-3 text-sm">{entry.response_text || '-'}</td>
      <td className="px-4 py-3 text-sm text-center">{entry.number_of_responses || 1}</td>
      <td className="px-4 py-3 text-sm">{formatArray(entry.determinants)}</td>
      <td className="px-4 py-3 text-sm">{formatArray(entry.content)}</td>
      <td className="px-4 py-3 text-sm text-center">{entry.dq || '-'}</td>
      <td className="px-4 py-3 text-sm text-center">{entry.z_score || '-'}</td>
      <td className="px-4 py-3 text-sm">{formatArray(entry.special_score)}</td>
      <td className="px-4 py-3 text-sm text-center">{entry.location || '-'}</td>
      <td className="px-4 py-3 text-sm text-center">{entry.fq || '-'}</td>
    </motion.tr>
  );
};

/**
 * Image section component (collapsible)
 */
const ImageSection = ({ imageData, imageNumber }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!imageData?.entries || imageData.entries.length === 0) {
    return null;
  }

  return (
    <div className="mb-6 bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div 
        className="flex items-center justify-between px-6 py-4 bg-gray-700 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-white">Image {imageNumber}</h3>
        <button className="text-gray-300 hover:text-white">
          {isExpanded ? (
            <ChevronUpIcon className="h-5 w-5" />
          ) : (
            <ChevronDownIcon className="h-5 w-5" />
          )}
        </button>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-900 text-gray-300 text-xs uppercase">
                    <th className="px-4 py-3 text-center">Position</th>
                    <th className="px-4 py-3">Response</th>
                    <th className="px-4 py-3 text-center">Num</th>
                    <th className="px-4 py-3">Determinants</th>
                    <th className="px-4 py-3">Content</th>
                    <th className="px-4 py-3 text-center">DQ</th>
                    <th className="px-4 py-3 text-center">Z-Score</th>
                    <th className="px-4 py-3">Special Score</th>
                    <th className="px-4 py-3 text-center">Location</th>
                    <th className="px-4 py-3 text-center">FQ</th>
                  </tr>
                </thead>
                <tbody>
                  {imageData.entries.map((entry, index) => (
                    <ResponseRow 
                      key={index} 
                      entry={entry} 
                      isEven={index % 2 === 0} 
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Responsive summary table component
 */
const ResponseSummaryTable = ({ patient }) => {
  // Handle printing the summary
  const handlePrint = () => {
    window.print();
  };

  // Handle downloading as PDF
  const handleDownload = async () => {
    // Note: In a production app, you would use a library like jsPDF or html2pdf
    // This is a placeholder for the download functionality
    alert('PDF download functionality would be implemented here');
  };

  // Get all image responses, sorted by image number
  const imageResponses = [...(patient?.responses || [])]
    .sort((a, b) => a.image_number - b.image_number);

  if (!patient || !imageResponses.length) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <p className="text-white text-center">No response data available.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Patient Information Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-t-lg p-6 shadow-lg mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Test Results Summary</h2>
            <div className="flex space-x-2">
              <button 
                onClick={handlePrint}
                className="flex items-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium text-white shadow"
              >
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print Report
              </button>
              <button 
                onClick={handleDownload}
                className="flex items-center px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm font-medium text-white shadow"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Save as PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-sm">
            <div>
              <span className="font-medium text-gray-200">Patient Name:</span> {patient.name}
            </div>
            <div>
              <span className="font-medium text-gray-200">Patient ID:</span> {patient.patient_id}
            </div>
            {patient.age && (
              <div>
                <span className="font-medium text-gray-200">Age:</span> {patient.age}
              </div>
            )}
            {patient.gender && (
              <div>
                <span className="font-medium text-gray-200">Gender:</span> {patient.gender}
              </div>
            )}
            {patient.test_date && (
              <div>
                <span className="font-medium text-gray-200">Test Date:</span> {new Date(patient.test_date).toLocaleDateString()}
              </div>
            )}
            {patient.examiner_name && (
              <div>
                <span className="font-medium text-gray-200">Examiner:</span> {patient.examiner_name}
              </div>
            )}
          </div>
        </div>

        {/* Response Sections */}
        <div className="space-y-4 mb-8">
          <h3 className="text-xl font-medium px-4">Responses by Image</h3>
          
          {/* Image Sections */}
          <div>
            {imageResponses.map((imageData) => (
              <ImageSection 
                key={imageData.image_number} 
                imageData={imageData} 
                imageNumber={imageData.image_number} 
              />
            ))}
          </div>
        </div>

        {/* Summary Statistics (optional) */}
        <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-xl font-medium mb-4">Summary Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-4 rounded">
              <p className="text-gray-400 text-sm">Total Responses</p>
              <p className="text-2xl font-bold">{imageResponses.reduce((sum, img) => sum + img.entries.length, 0)}</p>
            </div>
            <div className="bg-gray-700 p-4 rounded">
              <p className="text-gray-400 text-sm">Images Used</p>
              <p className="text-2xl font-bold">{imageResponses.length}</p>
            </div>
            {/* Add more statistics as needed */}
          </div>
        </div>

        {/* Print-specific styles */}
        <style jsx global>{`
          @media print {
            body {
              background-color: white;
              color: black;
            }
            button, .no-print {
              display: none !important;
            }
            .bg-gray-900, .bg-gray-800, .bg-gray-700, .bg-gray-600 {
              background-color: white !important;
              color: black !important;
            }
            .bg-gradient-to-r {
              background: white !important;
              color: black !important;
              border: 1px solid #eee;
            }
            th, td {
              border: 1px solid #ddd;
              color: black !important;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9 !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ResponseSummaryTable; 