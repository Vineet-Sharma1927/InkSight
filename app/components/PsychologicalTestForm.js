'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResponseBlock from './ResponseBlock';
import NavigationGuard from './NavigationGuard';

const PsychologicalTestForm = () => {
  const [responses, setResponses] = useState([{ id: 1 }]);
  const [currentImage, setCurrentImage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNextImageButton, setShowNextImageButton] = useState(false);
  const [formData, setFormData] = useState({
    patientName: '',
    patientId: '',
    age: '',
    gender: '',
    testDate: '',
    examinerName: '',
    testLocation: '',
    testDuration: '',
    testConditions: '',
    testNotes: '',
  });
  const [imageResponses, setImageResponses] = useState({});
  const [patientResponses, setPatientResponses] = useState([]);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [formIsDirty, setFormIsDirty] = useState(false);

  const totalImages = 10; // Total number of images in the test

  // Track form changes to set the dirty state
  useEffect(() => {
    const hasFormData = Object.values(formData).some(value => 
      typeof value === 'string' ? value.trim() !== '' : Boolean(value)
    );
    const hasResponses = Object.keys(imageResponses).length > 0;
    
    // Log state for debugging
    console.log('Form dirty state changed:', { hasFormData, hasResponses });
    
    setFormIsDirty(hasFormData || hasResponses);
  }, [formData, imageResponses]);

  // Force the dirty state to be cleared when test completes successfully
  useEffect(() => {
    if (submissionStatus?.success) {
      setFormIsDirty(false);
    }
  }, [submissionStatus]);

  const addResponse = () => {
    const newId = responses.length > 0 ? Math.max(...responses.map(r => r.id)) + 1 : 1;
    setResponses([...responses, { id: newId }]);
  };

  const removeResponse = (id) => {
    setResponses(responses.filter(response => response.id !== id));
    
    // Also remove from the current image responses
    setImageResponses(prev => {
      const current = { ...prev };
      if (current[currentImage]) {
        current[currentImage] = current[currentImage].filter(r => r.id !== id);
      }
      return current;
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle response submission from ResponseBlock
  const handleResponseSubmit = (responseId, responseData) => {
    // Store the response with its ID in the current image responses
    setImageResponses(prev => {
      const current = { ...prev };
      if (!current[currentImage]) {
        current[currentImage] = [];
      }
      
      // Find if this response already exists
      const existingIndex = current[currentImage].findIndex(r => r.id === responseId);
      if (existingIndex >= 0) {
        // Replace existing response
        current[currentImage][existingIndex] = { id: responseId, ...responseData };
      } else {
        // Add new response
        current[currentImage].push({ id: responseId, ...responseData });
      }
      
      return current;
    });
  };
      
  // Save the current image responses and update patientResponses
  const saveCurrentImageResponses = () => {
    try {
      // Get responses for current image
      const currentImageResponseEntries = imageResponses[currentImage] || [];
      
      // Map to format expected by backend, removing the frontend-specific id
      const entries = currentImageResponseEntries.map(({ id, ...rest }) => rest);
      
      // Create image response object
      const imageResponse = {
        image_number: currentImage,
        entries: entries
      };
      
      // Update the patientResponses state with the new image response
      setPatientResponses(prev => {
        const existingIndex = prev.findIndex(r => r.image_number === currentImage);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = imageResponse;
          return updated;
        } else {
          return [...prev, imageResponse];
        }
      });
      
      return true;
    } catch (error) {
      console.error("Error saving responses:", error);
      return false;
    }
  };

  // Submit all data to the backend
  const submitToDatabase = async () => {
    try {
      // Convert form data to patient data structure
      const patientData = {
        patient_id: formData.patientId,
        name: formData.patientName,
        age: parseInt(formData.age),
        gender: formData.gender,
        test_date: new Date(formData.testDate).toISOString(),
        examiner_name: formData.examinerName,
        test_location: formData.testLocation,
        test_duration: formData.testDuration,
        test_conditions: formData.testConditions,
        test_notes: formData.testNotes,
        responses: patientResponses
      };
      
      // Send data to the backend
      const response = await fetch('http://localhost:8000/submit-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Show success status with link to results
      setSubmissionStatus({
        success: true,
        message: `Test completed! Patient data saved with ID: ${result.patient_id}`,
        patientId: result.patient_id
      });
      
      return result;
    } catch (error) {
      console.error("Error submitting to database:", error);
      
      // Show error status
      setSubmissionStatus({
        success: false,
        message: `Error saving data: ${error.message}`
      });
      
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Check if all required fields are filled
    const requiredFields = ['patientName', 'patientId', 'age', 'gender', 'testDate'];
    const isFormValid = requiredFields.every(field => formData[field].trim() !== '');
    
    // Check if we have any responses for the current image
    const hasResponses = (imageResponses[currentImage]?.length || 0) > 0;

    if (!isFormValid || !hasResponses) {
      alert('Please fill in all required fields and add at least one response.');
      setIsSubmitting(false);
      return;
    }

    try {
      // Save current image responses
      const saved = saveCurrentImageResponses();
      
      if (!saved) {
        throw new Error("Failed to save current image responses");
      }
      
      // If this is the last image, submit the entire test
      if (currentImage === totalImages) {
        // Submit all data to the backend
        const result = await submitToDatabase();
        
        if (result) {
          // Reset form for a new test
          setFormData({
            patientName: '',
            patientId: '',
            age: '',
            gender: '',
            testDate: '',
            examinerName: '',
            testLocation: '',
            testDuration: '',
            testConditions: '',
            testNotes: '',
          });
          const newId = Date.now();
          setResponses([{ id: newId }]);
          setCurrentImage(1);
          setShowNextImageButton(false);
          setImageResponses({});
          setPatientResponses([]);
        }
      } else {
        // Show the next image button
        setShowNextImageButton(true);
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      alert(`Error submitting form: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextImage = async () => {
    if (currentImage < totalImages) {
      try {
        // Save current image responses first
        saveCurrentImageResponses();
        
        // Increment to the next image
        setCurrentImage(currentImage + 1);
        
        // Clear responses completely and create a fresh one
        // Using a unique timestamp as part of the ID to ensure React treats this as a completely new component
        const newId = Date.now();
        setResponses([{ id: newId }]);
        
        // Reset UI state
        setShowNextImageButton(false);
      } catch (error) {
        console.error("Error moving to next image:", error);
        alert("There was an error moving to the next image. Please try again.");
      }
    }
  };

  // Check if the current image has any responses saved
  const hasCurrentImageResponses = (imageResponses[currentImage]?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      {/* Add NavigationGuard */}
      <NavigationGuard 
        isDirty={formIsDirty && !submissionStatus?.success} 
        message="You have unsaved test data. If you leave now, your progress will be lost. Are you sure you want to continue?" 
      />

      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-800 shadow-xl rounded-lg overflow-hidden"
        >
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white">Psychological Test Form</h1>
              <p className="mt-2 text-gray-400">Complete the assessment for each image</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Patient Information */}
              <div className="mb-8 p-6 bg-gray-700 rounded-lg">
                <h2 className="text-xl font-semibold text-white mb-4">Patient Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Patient Name *
                  </label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Patient ID *
                  </label>
                  <input
                    type="text"
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Age *
                  </label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required
                      min="1"
                    max="120"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Gender *
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Test Date *
                  </label>
                  <input
                    type="date"
                    name="testDate"
                    value={formData.testDate}
                    onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                    Examiner Name
                  </label>
                  <input
                    type="text"
                    name="examinerName"
                    value={formData.examinerName}
                    onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                    Test Location
                  </label>
                  <input
                    type="text"
                    name="testLocation"
                    value={formData.testLocation}
                    onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                    Test Duration
                  </label>
                  <input
                    type="text"
                    name="testDuration"
                    value={formData.testDuration}
                    onChange={handleInputChange}
                      className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g. 45 minutes"
                  />
                </div>
              </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Test Conditions
                  </label>
                  <input
                    type="text"
                    name="testConditions"
                    value={formData.testConditions}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g. Quiet room, good lighting"
                  />
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Test Notes
                  </label>
                  <textarea
                    name="testNotes"
                    value={formData.testNotes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Additional notes about the test"
                  ></textarea>
                </div>
              </div>

              {/* Current Image Section */}
              <div className="mb-8 p-6 bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Image {currentImage} Responses</h2>
                  <div className="px-3 py-1 bg-indigo-600 rounded-md text-sm text-white">
                    {currentImage} of {totalImages}
                  </div>
                </div>

                {/* Response Blocks */}
                <div className="space-y-4 mb-6">
                <AnimatePresence>
                  {responses.map((response) => (
                    <ResponseBlock
                      key={response.id}
                      id={response.id}
                        onRemove={removeResponse}
                      imageId={currentImage}
                        onResponseSubmit={handleResponseSubmit}
                    />
                  ))}
                </AnimatePresence>
              </div>

                {/* Add Response Button */}
                <button
                  type="button"
                  onClick={addResponse}
                  className="w-full py-2 px-4 border border-dashed border-gray-500 rounded-md text-gray-300 hover:bg-gray-600 hover:text-white transition-colors duration-200 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add Another Response
                </button>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 py-3 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : currentImage === totalImages
                      ? 'Complete Test'
                      : 'Save Responses'}
                </button>

              {showNextImageButton && (
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center justify-center"
                  >
                    Next Image
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </button>
                )}
              </div>

              {/* Submission Status */}
              {submissionStatus && (
                <div className={`mt-6 p-4 rounded-md ${submissionStatus.success ? 'bg-green-700' : 'bg-red-700'}`}>
                  <p className="text-white">{submissionStatus.message}</p>
                  {submissionStatus.success && submissionStatus.patientId && (
                    <div className="mt-3">
                      <a 
                        href={`/patients/${submissionStatus.patientId}`}
                        className="inline-block px-4 py-2 bg-white text-green-700 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        View Patient Details
                      </a>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PsychologicalTestForm; 