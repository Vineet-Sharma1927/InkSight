'use client';

import { useEffect } from 'react';
import PsychologicalTestForm from '../components/PsychologicalTestForm';

export default function FormPage() {
  // Set the page title to make it clear users are in an active test
  useEffect(() => {
    const originalTitle = document.title;
    document.title = "Active Test - Psychological Assessment";
    
    return () => {
      document.title = originalTitle;
    };
  }, []);

  return (
    <div className="py-6">
      <PsychologicalTestForm />
    </div>
  );
} 