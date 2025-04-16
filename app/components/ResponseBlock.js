'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Listbox } from '@headlessui/react';
import { ChevronUpDownIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import config from '../config';

// Position options
const positionOptions = ['^', '<', '>', 'v', '.'];

// Determinant options with nested structure
const determinantOptions = [
  { id: 'F', name: 'F - Form' },
  {
    id: 'Movement',
    name: 'Movement Response',
    children: [
      { id: 'M', name: 'M - Human Movement' },
      { id: 'FM', name: 'FM - Animal Movement' },
      { id: 'm', name: 'm - Inanimate Movement' }
    ]
  },
  {
    id: 'Chromatic',
    name: 'Chromatic Colors',
    children: [
      { id: 'C', name: 'C - Pure Colors' },
      { id: 'CF', name: 'CF - Color Form' },
      { id: 'FC', name: 'FC - Form Color' },
      { id: 'Cn', name: 'Cn - Color Naming' }
    ]
  },
  {
    id: 'Achromatic',
    name: 'Achromatic Color (C)',
    children: [
      { id: 'C\'', name: 'C\' - Pure Achromatic Color' },
      { id: 'C\'F', name: 'C\'F - Achromatic Color Form' },
      { id: 'FC\'', name: 'FC\' - Form Achromatic Color' }
    ]
  },
  {
    id: 'ShadingTexture',
    name: 'Shading Texture',
    children: [
      { id: 'LT', name: 'LT - Pure Texture' },
      { id: 'TF', name: 'TF - Texture Form' },
      { id: 'FT', name: 'FT - Form Texture' }
    ]
  },
  {
    id: 'ShadingVista',
    name: 'Shading Dimensions / Vista (V)',
    children: [
      { id: 'V', name: 'V - Pure Vista' },
      { id: 'VF', name: 'VF - Vista Form' },
      { id: 'FV', name: 'FV - Form Vista' }
    ]
  },
  {
    id: 'ShadingDiffuse',
    name: 'Shading Diffuse (Y)',
    children: [
      { id: 'Y', name: 'Y - Pure Diffuse' },
      { id: 'YF', name: 'YF - Shading Form' },
      { id: 'FY', name: 'FY - Form Shading' }
    ]
  },
  { id: 'FD', name: 'FD - Form Dimension' },
  {
    id: 'PairsReflections',
    name: 'Pairs and Reflections',
    children: [
      { id: 'Pair', name: 'Pair Response' },
      { id: 'rF', name: 'rF - Reflection Form' },
      { id: 'Fr', name: 'Fr - Form Reflection' }
    ]
  }
];

// Content options with nested structure
const contentOptions = [
  { id: 'H', name: 'H - Whole Human' },
  { id: 'Hf', name: 'H - Whole Human Fictional/Mythological' },
  { id: 'Hd', name: 'Hd - Human Details' },
  { id: 'Hdf', name: 'Hd - Human Details Fictional/Mythological' },
  { id: 'Hx', name: 'Hx - Human Experience' },
  { id: 'A', name: 'A - Whole Animal' },
  { id: 'Af', name: 'A - Whole Animal Fictional/Mythological' },
  { id: 'Ad', name: 'Ad - Animal Details' },
  { id: 'Adf', name: 'Ad - Animal Details Fictional/Mythological' },
  { id: 'An', name: 'An - Anatomy' },
  { id: 'Art', name: 'Art - Art' },
  { id: 'Ay', name: 'Ay - Anthropology' },
  { id: 'Bl', name: 'Bl - Blood' },
  { id: 'Bt', name: 'Bt - Botany' },
  { id: 'Cg', name: 'Cg - Clothing' },
  { id: 'Cl', name: 'Cl - Clouds' },
  { id: 'Ex', name: 'Ex - Explosion' },
  { id: 'Fi', name: 'Fi - Fire' },
  { id: 'Fd', name: 'Fd - Food' },
  { id: 'Ge', name: 'Ge - Geography' },
  { id: 'Hh', name: 'Hh - Household' },
  { id: 'Ls', name: 'Ls - Landscape' },
  { id: 'Na', name: 'Na - Nature' },
  { id: 'Sc', name: 'Sc - Science' },
  { id: 'Sx', name: 'Sx - Sex' },
  { id: 'Xy', name: 'Xy - X-ray' }
];

// DQ options
const dqOptions = ['+', 'o', 'v', '(v/+)'];

// Z-score options
const zScoreOptions = ['ZW', 'ZA', 'ZD', 'ZS'];

// Special Score options with nested structure
const specialScoreOptions = [
  {
    id: 'UnusualVerbalization',
    name: 'Unusual Verbalization',
    children: [
      {
        id: 'DV',
        name: 'DV - Deviant Verbalization',
        children: [
          { id: 'DV1', name: 'DV' },
          { id: 'DR', name: 'DR' }
        ]
      },
      {
        id: 'IC',
        name: 'IC - Incompatible',
        children: [
          { id: 'INCOM', name: 'INCOM' },
          { id: 'FABCOM', name: 'FABCOM' },
          { id: 'CONTAM', name: 'CONTAM' }
        ]
      },
      {
        id: 'IL',
        name: 'IL - Illogical',
        children: [
          { id: 'ALOG', name: 'ALOG' }
        ]
      }
    ]
  },
  {
    id: 'Perseveration',
    name: 'Perseveration',
    children: [
      { id: 'PSV1', name: 'Within Card Perseveration' },
      { id: 'PSV2', name: 'Content Perseveration' },
      { id: 'PSV3', name: 'Mechanical Perseveration' }
    ]
  },
  {
    id: 'SpecialContent',
    name: 'Special Content Characteristic',
    children: [
      { id: 'AB', name: 'AB - Abstract Content' },
      { id: 'AG', name: 'AG - Aggressive Movement' },
      { id: 'COP', name: 'COP - Cooperative Movement' },
      { id: 'MOR', name: 'MOR - Morbid Content' }
    ]
  },
  {
    id: 'HumanRepresentation',
    name: 'Human Representation Responses',
    children: [
      { id: 'GHR', name: 'GHR - Good Human Representation' },
      { id: 'PHR', name: 'PHR - Poor Human Representation' }
    ]
  },
  { id: 'PER', name: 'PER - Personalized Responses' },
  {
    id: 'SpecialColor',
    name: 'Special Color Phenomenon',
    children: [
      { id: 'CP', name: 'Color Projection' }
    ]
  }
];

const ResponseBlock = ({ id, onRemove, imageId, onResponseSubmit }) => {
  const [position, setPosition] = useState('');
  const [responseText, setResponseText] = useState('');
  const [location, setLocation] = useState('');
  const [fq, setFq] = useState('');
  const [numResponses, setNumResponses] = useState(1);
  const [determinants, setDeterminants] = useState([]);
  const [content, setContent] = useState([]);
  const [dq, setDq] = useState('');
  const [zScore, setZScore] = useState('');
  const [specialScore, setSpecialScore] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analysisMessage, setAnalysisMessage] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  
  // Selection menus state
  const [showDeterminantMenu, setShowDeterminantMenu] = useState(false);
  const [showContentMenu, setShowContentMenu] = useState(false);
  const [showSpecialScoreMenu, setShowSpecialScoreMenu] = useState(false);
  
  // Refs for dropdown containers
  const determinantMenuRef = useRef(null);
  const contentMenuRef = useRef(null);
  const specialScoreMenuRef = useRef(null);
  
  // Store previous imageId to detect changes
  const prevImageIdRef = useRef(imageId);

  // Reset all fields when imageId changes
  useEffect(() => {
    if (prevImageIdRef.current !== imageId) {
      // Clear all form fields
      clearForm();
      // Update the ref
      prevImageIdRef.current = imageId;
    }
  }, [imageId]);

  // Close dropdowns when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Close determinant menu if clicked outside
      if (
        showDeterminantMenu && 
        determinantMenuRef.current && 
        !determinantMenuRef.current.contains(event.target)
      ) {
        setShowDeterminantMenu(false);
      }
      
      // Close content menu if clicked outside
      if (
        showContentMenu && 
        contentMenuRef.current && 
        !contentMenuRef.current.contains(event.target)
      ) {
        setShowContentMenu(false);
      }
      
      // Close special score menu if clicked outside
      if (
        showSpecialScoreMenu && 
        specialScoreMenuRef.current && 
        !specialScoreMenuRef.current.contains(event.target)
      ) {
        setShowSpecialScoreMenu(false);
      }
    }
    
    // Add event listener
    document.addEventListener('mousedown', handleClickOutside);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDeterminantMenu, showContentMenu, showSpecialScoreMenu]);

  const clearForm = () => {
    setPosition('');
    setResponseText('');
    setLocation('');
    setFq('');
    setNumResponses(1);
    setDeterminants([]);
    setContent([]);
    setDq('');
    setZScore('');
    setSpecialScore([]);
    setAnalysisMessage('');
    setSubmitMessage('');
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleResponseTextChange = (e) => {
    const value = e.target.value;
    setResponseText(value);
    
    setAnalysisMessage('');
  };

  const handleAnalyzeResponse = async () => {
    if (!responseText.trim()) {
      setAnalysisMessage('Please enter a response text first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisMessage('Analyzing response...');

    try {
      const response = await fetch(`${config.apiUrl}/analyze-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response_text: responseText,
          image_id: imageId,
        }),
      });

      const data = await response.json();

      if (data.match_found) {
        setLocation(data.location);
        setFq(data.fq);
        setAnalysisMessage('Analysis complete! Location and FQ updated. Please fill in remaining fields and submit.');
      } else {
        setAnalysisMessage('No match found in the reference data.');
      }
    } catch (error) {
      console.error('Error analyzing response:', error);
      setAnalysisMessage('Error analyzing response. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitResponse = () => {
    // Validation
    if (!responseText.trim()) {
      setSubmitMessage('Please enter a response text and analyze it first.');
      return;
    }
    
    if (!position) {
      setSubmitMessage('Please select a position before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('Submitting response...');

    // Create response entry object according to backend model
    const responseEntry = {
      position,
      response_text: responseText,
      number_of_responses: parseInt(numResponses) || 1,
      determinants,
      content,
      dq,
      z_score: zScore,
      special_score: specialScore,
      location,
      fq
    };

    // Pass the response to the parent component for collection
    onResponseSubmit(id, responseEntry);
    
    setIsSubmitting(false);
    setSubmitMessage('Response recorded successfully! You can add more responses or proceed to the next image.');
  };

  // Helper function to handle determinant selection
  const toggleDeterminant = (determinantId) => {
    // If already selected, remove it
    if (determinants.includes(determinantId)) {
      setDeterminants(determinants.filter(d => d !== determinantId));
    } else {
      // Otherwise add it
      setDeterminants([...determinants, determinantId]);
    }
    // Close the dropdown after selection (unless it's a parent category)
    if (!determinantOptions.find(opt => opt.id === determinantId && opt.children)) {
      setShowDeterminantMenu(false);
    }
  };

  // Helper function to handle content selection
  const toggleContent = (contentId) => {
    if (content.includes(contentId)) {
      setContent(content.filter(c => c !== contentId));
    } else {
      setContent([...content, contentId]);
    }
    // Close the dropdown after selection
    setShowContentMenu(false);
  };

  // Helper function to handle special score selection
  const toggleSpecialScore = (scoreId) => {
    if (specialScore.includes(scoreId)) {
      setSpecialScore(specialScore.filter(s => s !== scoreId));
    } else {
      setSpecialScore([...specialScore, scoreId]);
    }
    // Close the dropdown after selection (unless it's a parent category)
    if (!specialScoreOptions.some(opt => 
        opt.id === scoreId && opt.children || 
        opt.children && opt.children.some(child => 
            child.id === scoreId && child.children
        )
    )) {
      setShowSpecialScoreMenu(false);
    }
  };

  // Helper function to render nested options
  const renderNestedOptions = (options, toggleFn, selectedValues) => {
    return options.map(option => {
      if (option.children) {
        return (
          <div key={option.id} className="mb-3">
            <div className="text-sm font-medium text-gray-200 mb-1">{option.name}</div>
            <div className="pl-3 border-l border-gray-500">
              {renderNestedOptions(option.children, toggleFn, selectedValues)}
            </div>
          </div>
        );
      } else {
        return (
          <div key={option.id} className="flex items-center mb-2">
            <input
              type="checkbox"
              id={`option-${option.id}`}
              checked={selectedValues.includes(option.id)}
              onChange={() => toggleFn(option.id)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded mr-2"
            />
            <label htmlFor={`option-${option.id}`} className="text-sm text-gray-200">
              {option.name}
            </label>
          </div>
        );
      }
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="p-4 bg-gray-700 rounded-lg mb-4 relative"
      data-response-block="true"
    >
      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(id)}
        className="absolute top-2 right-2 text-gray-400 hover:text-white focus:outline-none"
        aria-label="Remove response"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>

      {/* Expand/Collapse button */}
      <button
        type="button"
        onClick={toggleExpand}
        className="absolute top-2 right-10 text-gray-400 hover:text-white focus:outline-none"
        aria-label={isExpanded ? 'Collapse' : 'Expand'}
      >
        {isExpanded ? (
          <span className="text-sm">Collapse</span>
        ) : (
          <span className="text-sm">Expand</span>
        )}
      </button>

      <div className={`space-y-4 ${isExpanded ? '' : 'hidden'}`}>
        {/* Position and Response Text */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Position
            </label>
            <Listbox value={position} onChange={setPosition}>
              <div className="relative">
                <Listbox.Button className="relative w-full py-2 pl-3 pr-10 bg-gray-600 border border-gray-500 rounded-md text-left text-white cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500">
                  <span className="block truncate">{position || "Select"}</span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </span>
                </Listbox.Button>
                <Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-700 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none">
                  {positionOptions.map((pos) => (
                    <Listbox.Option
                      key={pos}
                      value={pos}
                      className={({ active }) =>
                        `${active ? 'text-white bg-indigo-600' : 'text-gray-200'} 
                        cursor-default select-none relative py-2 pl-10 pr-4`
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={`${selected ? 'font-medium' : 'font-normal'} block truncate`}>
                            {pos}
                          </span>
                          {selected && (
                            <span
                              className={`${active ? 'text-white' : 'text-indigo-600'} 
                              absolute inset-y-0 left-0 flex items-center pl-3`}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </div>
            </Listbox>
            <input type="hidden" name="position" value={position} />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Response
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                name="responseText"
                value={responseText}
                onChange={handleResponseTextChange}
                className="flex-grow px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter response text"
              />
              <button
                type="button"
                onClick={handleAnalyzeResponse}
                disabled={isAnalyzing}
                className={`px-4 py-2 rounded-md bg-blue-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
            <AnimatePresence>
              {analysisMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 text-sm text-blue-300"
                >
                  {analysisMessage}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Location and Form Quality */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Location
            </label>
            <div 
              className="px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white"
              data-field="location"
            >
              {location || "Auto-filled from reference data"}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-1">
              Form Quality (FQ)
            </label>
            <div 
              className="px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white"
              data-field="fq"
            >
              {fq || "Auto-filled from reference data"}
            </div>
          </div>
        </div>

        {/* Number of Responses */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Number of Responses
          </label>
          <input
            type="number"
            name="numResponses"
            value={numResponses}
            onChange={(e) => setNumResponses(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            min="1"
            max="99"
          />
        </div>

        {/* Determinants */}
        <div ref={determinantMenuRef}>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Determinants
          </label>
          <div 
            className="px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white cursor-pointer flex justify-between items-center"
            onClick={() => setShowDeterminantMenu(!showDeterminantMenu)}
          >
            <span>{determinants.length > 0 ? determinants.join(', ') : 'Select determinants'}</span>
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          {showDeterminantMenu && (
            <div className="mt-1 p-3 bg-gray-800 border border-gray-500 rounded-md max-h-60 overflow-y-auto">
              {renderNestedOptions(determinantOptions, toggleDeterminant, determinants)}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowDeterminantMenu(false)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div ref={contentMenuRef}>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Content
          </label>
          <div 
            className="px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white cursor-pointer flex justify-between items-center"
            onClick={() => setShowContentMenu(!showContentMenu)}
          >
            <span>{content.length > 0 ? content.join(', ') : 'Select content'}</span>
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          {showContentMenu && (
            <div className="mt-1 p-3 bg-gray-800 border border-gray-500 rounded-md max-h-60 overflow-y-auto">
              {contentOptions.map(option => (
                <div key={option.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`content-${option.id}`}
                    checked={content.includes(option.id)}
                    onChange={() => toggleContent(option.id)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-500 rounded mr-2"
                  />
                  <label htmlFor={`content-${option.id}`} className="text-sm text-gray-200">
                    {option.name}
                  </label>
                </div>
              ))}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowContentMenu(false)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Developmental Quality */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Developmental Quality (DQ)
          </label>
          <select
            name="dq"
            value={dq}
            onChange={(e) => setDq(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select DQ</option>
            {dqOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Z-Score */}
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Z-Score
          </label>
          <select
            name="zScore"
            value={zScore}
            onChange={(e) => setZScore(e.target.value)}
            className="w-full px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select Z-Score</option>
            {zScoreOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        {/* Special Scores */}
        <div ref={specialScoreMenuRef}>
          <label className="block text-sm font-medium text-gray-200 mb-1">
            Special Scores
          </label>
          <div 
            className="px-4 py-2 rounded-md bg-gray-600 border border-gray-500 text-white cursor-pointer flex justify-between items-center"
            onClick={() => setShowSpecialScoreMenu(!showSpecialScoreMenu)}
          >
            <span>{specialScore.length > 0 ? specialScore.join(', ') : 'Select special scores'}</span>
            <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
          </div>
          
          {showSpecialScoreMenu && (
            <div className="mt-1 p-3 bg-gray-800 border border-gray-500 rounded-md max-h-60 overflow-y-auto">
              {renderNestedOptions(specialScoreOptions, toggleSpecialScore, specialScore)}
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => setShowSpecialScoreMenu(false)}
                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Submit Response Button */}
        <div>
          <button
            type="button"
            onClick={handleSubmitResponse}
            disabled={isSubmitting}
            className={`w-full px-4 py-3 rounded-md bg-green-600 text-white font-medium focus:outline-none focus:ring-2 focus:ring-green-500 ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'
            }`}
          >
            {isSubmitting ? 'Submitting...' : 'Record Response'}
          </button>
          <AnimatePresence>
            {submitMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`mt-2 text-sm ${
                  submitMessage.includes('Error') ? 'text-red-300' : 'text-green-300'
                }`}
              >
                {submitMessage}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {!isExpanded && (
        <div className="py-2">
          <span className="text-gray-300 font-medium">Response: </span>
          <span className="text-white">{responseText || "(Empty)"}</span>
          {location && (
            <>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-gray-300 font-medium">Location: </span>
              <span className="text-white">{location}</span>
            </>
          )}
          {fq && (
            <>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-gray-300 font-medium">FQ: </span>
              <span className="text-white">{fq}</span>
            </>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ResponseBlock; 