'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ResponseBlock from './ResponseBlock';
import NavigationGuard from './NavigationGuard';
import { api } from '../lib/api';
import { setDoc, doc } from 'firebase/firestore';
import { patientsCollectionRef } from '../lib/firestoreHelpers';

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

  // Submit all data to Firestore under the current doctor's scope
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
      // Write to Firestore at doctors/{uid}/patients/{patient_id}
      const patientsCol = patientsCollectionRef();
      const patientDocRef = doc(patientsCol, String(patientData.patient_id));
      await setDoc(patientDocRef, patientData, { merge: true });

      // Also send to backend (Mongo) if available
      try {
        await api.submitPatient(patientData);
      } catch (e) {
        console.warn('Mongo submit failed (continuing):', e?.message || e);
      }

      // Show success status with link to results
      setSubmissionStatus({
        success: true,
        message: `Test completed! Patient data saved with ID: ${patientData.patient_id}`,
        patientId: patientData.patient_id
      });
      
      return patientData;
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
    <div className="min-h-screen bg-primary-bg py-12 px-4 sm:px-6 lg:px-8">
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
          className="card shadow-xl overflow-hidden"
        >
          <div className="px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-primary-text">Psychological Test Form</h1>
              <p className="mt-2 text-secondary-text">Complete the assessment for each image</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Patient Information */}
              <div className="mb-8 p-6 bg-primary-bg rounded-lg border border-accent-border">
                <h2 className="text-xl font-semibold text-primary-text mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-primary-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  Patient Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">
                      Patient Name *
                    </label>
                    <input
                      type="text"
                      name="patientName"
                      value={formData.patientName}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Patient ID *
                    </label>
                    <input
                      type="text"
                      name="patientId"
                      value={formData.patientId}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Age *
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                      min="1"
                      max="120"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="form-select"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">
                      Test Date *
                    </label>
                    <input
                      type="date"
                      name="testDate"
                      value={formData.testDate}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Examiner Name
                    </label>
                    <input
                      type="text"
                      name="examinerName"
                      value={formData.examinerName}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Test Location
                    </label>
                    <input
                      type="text"
                      name="testLocation"
                      value={formData.testLocation}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Test Duration
                    </label>
                    <input
                      type="text"
                      name="testDuration"
                      value={formData.testDuration}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g. 45 minutes"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Test Conditions
                    </label>
                    <input
                      type="text"
                      name="testConditions"
                      value={formData.testConditions}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="e.g. Quiet room, good lighting"
                    />
                  </div>
                  <div>
                    <label className="form-label">
                      Test Notes
                    </label>
                    <textarea
                      name="testNotes"
                      value={formData.testNotes}
                      onChange={handleInputChange}
                      rows="3"
                      className="form-input"
                      placeholder="Additional notes about the test"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Current Image Section */}
              <div className="mb-8 p-6 bg-primary-bg rounded-lg border border-accent-border">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-primary-text flex items-center">
                    <svg className="w-5 h-5 mr-2 text-primary-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    Image {currentImage} Responses
                  </h2>
                  <div className="px-3 py-1 bg-gradient-primary rounded-md text-sm text-primary-text font-medium">
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
                  className="w-full py-3 px-4 border-2 border-dashed border-accent-border rounded-lg text-secondary-text hover:border-primary-accent hover:text-primary-accent hover:bg-primary-accent hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center group"
                >
                  <svg className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                  className={`btn btn-primary btn-lg flex-1 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover-lift'}`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {currentImage === totalImages ? 'Completing...' : 'Saving...'}
                    </div>
                  ) : (
                    currentImage === totalImages ? 'Complete Test' : 'Save Responses'
                  )}
                </button>

                {showNextImageButton && (
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="btn btn-outline btn-lg flex-1 hover-lift flex items-center justify-center"
                  >
                    Next Image
                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </button>
                )}
              </div>

              {/* Submission Status */}
              {submissionStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-6 p-4 rounded-lg border ${
                    submissionStatus.success 
                      ? 'bg-success bg-opacity-20 border-success text-success' 
                      : 'bg-error bg-opacity-20 border-error text-error'
                  }`}
                >
                  <div className="flex items-center">
                    {submissionStatus.success ? (
                      <svg className="w-5 h-5 mr-2 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 mr-2 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    )}
                    <p className="font-medium">{submissionStatus.message}</p>
                  </div>
                  {submissionStatus.success && submissionStatus.patientId && (
                    <div className="mt-3">
                      <a 
                        href={`/patients/${submissionStatus.patientId}`}
                        className="btn btn-sm bg-success text-white hover:bg-success hover:bg-opacity-80 transition-colors"
                      >
                        View Patient Details
                      </a>
                    </div>
                  )}
                </motion.div>
              )}
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PsychologicalTestForm; 