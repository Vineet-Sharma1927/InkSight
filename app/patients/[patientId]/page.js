'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import DataLoader from '../../components/DataLoader';
import ResponseSummaryTable from '../../components/ResponseSummaryTable';
import { api } from '../../lib/api';

const PatientDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const { patientId } = params;
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [viewMode, setViewMode] = useState('detailed'); // Options: 'detailed' or 'summary'

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        const data = await api.getPatientById(patientId);
        setPatient(data);
        
        // If there are responses, select the first image by default
        if (data.responses && data.responses.length > 0) {
          setSelectedImage(data.responses[0].image_number);
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleBackClick = () => {
    router.push('/patients');
  };

  // Get the responses for the selected image
  const selectedImageResponses = patient?.responses?.find(r => r.image_number === selectedImage)?.entries || [];

  // Toggle between detailed and summary view
  const toggleViewMode = () => {
    setViewMode(viewMode === 'detailed' ? 'summary' : 'detailed');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <button
            onClick={handleBackClick}
            className="flex items-center text-indigo-400 hover:text-indigo-300"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
            </svg>
            Back to Patients
          </button>
        </div>

        {loading ? (
          <div className="bg-gray-800 rounded-lg">
            <DataLoader message="Loading patient data..." />
          </div>
        ) : error ? (
          <div className="bg-red-800 text-white p-6 rounded-lg">
            <p className="text-xl">Error loading patient data: {error}</p>
            <p className="mt-2">Make sure the backend server is running and the patient ID is correct.</p>
            <button
              onClick={handleBackClick}
              className="mt-4 bg-white text-red-800 px-4 py-2 rounded-md hover:bg-gray-200"
            >
              Return to Patients List
            </button>
          </div>
        ) : patient ? (
          <>
            {/* View Toggle Button */}
            <div className="mb-4">
              <button
                onClick={toggleViewMode}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
              >
                {viewMode === 'detailed' ? 'View Summary Table' : 'View Detailed Format'}
              </button>
            </div>

            {viewMode === 'detailed' ? (
              // Detailed view (original)
              <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                {/* Patient Information Header */}
                <div className="bg-gray-700 p-6">
                  <h1 className="text-3xl font-bold text-white">{patient.name}</h1>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
                    <div>
                      <span className="font-medium">Patient ID:</span> {patient.patient_id}
                    </div>
                    <div>
                      <span className="font-medium">Age/Gender:</span> {patient.age} / {patient.gender}
                    </div>
                    <div>
                      <span className="font-medium">Test Date:</span> {formatDate(patient.test_date)}
                    </div>
                  </div>
                  {(patient.examiner_name || patient.test_location || patient.test_duration) && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-300">
                      {patient.examiner_name && (
                        <div>
                          <span className="font-medium">Examiner:</span> {patient.examiner_name}
                        </div>
                      )}
                      {patient.test_location && (
                        <div>
                          <span className="font-medium">Location:</span> {patient.test_location}
                        </div>
                      )}
                      {patient.test_duration && (
                        <div>
                          <span className="font-medium">Duration:</span> {patient.test_duration}
                        </div>
                      )}
                    </div>
                  )}
                  {patient.test_conditions && (
                    <div className="mt-4 text-gray-300">
                      <span className="font-medium">Test Conditions:</span> {patient.test_conditions}
                    </div>
                  )}
                  {patient.test_notes && (
                    <div className="mt-2 text-gray-300">
                      <span className="font-medium">Notes:</span> {patient.test_notes}
                    </div>
                  )}
                </div>

                {/* Responses Section */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Responses</h2>
                  
                  {/* Image Selection */}
                  {patient.responses && patient.responses.length > 0 ? (
                    <>
                      <div className="mb-6">
                        <div className="text-sm text-gray-400 mb-2">Select Image:</div>
                        <div className="flex flex-wrap gap-2">
                          {patient.responses.map((response) => (
                            <button
                              key={response.image_number}
                              onClick={() => setSelectedImage(response.image_number)}
                              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                selectedImage === response.image_number
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              }`}
                            >
                              Image {response.image_number}
                              {response.entries?.length > 0 && (
                                <span className="ml-2 bg-gray-800 text-xs px-2 py-1 rounded-full">
                                  {response.entries.length}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Responses for Selected Image */}
                      <div className="space-y-6">
                        {selectedImageResponses.length > 0 ? (
                          <div className="divide-y divide-gray-700">
                            {selectedImageResponses.map((entry, index) => (
                              <div key={index} className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <div className="text-sm text-gray-400">Response</div>
                                    <div className="font-medium text-white">{entry.response_text}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-400">Position</div>
                                    <div className="text-white">{entry.position}</div>
                                  </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  <div>
                                    <div className="text-sm text-gray-400">Location</div>
                                    <div className="text-white">{entry.location}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-400">Form Quality</div>
                                    <div className="text-white">{entry.fq}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-400">DQ</div>
                                    <div className="text-white">{entry.dq || "—"}</div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-400">Z-Score</div>
                                    <div className="text-white">{entry.z_score || "—"}</div>
                                  </div>
                                </div>
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div>
                                    <div className="text-sm text-gray-400">Determinants</div>
                                    <div className="text-white">
                                      {entry.determinants && entry.determinants.length 
                                        ? entry.determinants.join(', ') 
                                        : "—"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-400">Content</div>
                                    <div className="text-white">
                                      {entry.content && entry.content.length 
                                        ? entry.content.join(', ') 
                                        : "—"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm text-gray-400">Special Scores</div>
                                    <div className="text-white">
                                      {entry.special_score && entry.special_score.length 
                                        ? entry.special_score.join(', ') 
                                        : "—"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-gray-700 rounded-lg">
                            <p className="text-gray-400">No responses recorded for this image.</p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 bg-gray-700 rounded-lg">
                      <p className="text-gray-400">No responses recorded for this patient.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Summary table view
              <ResponseSummaryTable patient={patient} />
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-gray-800 rounded-lg">
            <p className="text-gray-300 text-lg">Patient not found.</p>
            <button
              onClick={handleBackClick}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Return to Patients List
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PatientDetailPage; 