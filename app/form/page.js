'use client';

import { useEffect } from 'react';
import PsychologicalTestForm from '../components/PsychologicalTestForm';
import RequireAuth from '../components/RequireAuth';

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
    <RequireAuth>
      <div className="py-6">
        <PsychologicalTestForm />
      </div>
    </RequireAuth>
  );
} 