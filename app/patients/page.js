'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import DataLoader from '../components/DataLoader';
import { api } from '../lib/api';
import { collection, getDocs } from 'firebase/firestore';
import { patientsCollectionRef } from '../lib/firestoreHelpers';
import RequireAuth from '../components/RequireAuth';

function PatientList() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(patientsCollectionRef());
        const data = snap.docs.map(d => d.data());
        setPatients(data);
      } catch (error) {
        console.error('Error fetching patients:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, []);

  const handleDeletePatient = async (patientId, patientName) => {
    if (!confirm(`Are you sure you want to delete patient "${patientName}" (ID: ${patientId})? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(patientId);
      
      // Delete from Firestore
      const { deleteDoc, doc } = await import('firebase/firestore');
      await deleteDoc(doc(patientsCollectionRef(), String(patientId)));
      
      // Also try to delete from MongoDB backend
      try {
        await api.deletePatient(patientId);
      } catch (e) {
        console.warn('Backend deletion failed (continuing):', e?.message || e);
      }
      
      // Remove from local state
      setPatients(patients.filter(p => p.patient_id !== patientId));
      
      alert(`Patient "${patientName}" deleted successfully.`);
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert(`Error deleting patient: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Function to format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white mb-6">Patients</h1>
            
            {loading ? (
              <div className="py-8">
                <DataLoader message="Loading patients..." />
              </div>
            ) : error ? (
              <div className="bg-red-800 text-white p-4 rounded-md">
                <p>Error loading patients: {error}</p>
                <p className="mt-2">Make sure the backend server is running</p>
              </div>
            ) : patients.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-300 text-lg">No patients found.</p>
                <Link href="/form" className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Add New Patient
                </Link>
              </div>
            ) : (
              <div className="overflow-hidden shadow-md rounded-lg">
                <table className="min-w-full divide-y divide-gray-600">
                  <thead className="bg-gray-700">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Patient ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Age/Gender
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Test Date
                      </th>
                      <th scope="col" className="relative px-6 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-700 divide-y divide-gray-600">
                    {patients.map((patient) => (
                      <tr 
                        key={patient.patient_id} 
                        className="hover:bg-gray-600 cursor-pointer transition-colors"
                        onClick={() => window.location.href = `/patients/${patient.patient_id}`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{patient.patient_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{patient.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{patient.age} / {patient.gender}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">{formatDate(patient.test_date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <Link 
                              href={`/patients/${patient.patient_id}`}
                              className="text-indigo-400 hover:text-indigo-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </Link>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePatient(patient.patient_id, patient.name);
                              }}
                              disabled={deletingId === patient.patient_id}
                              className="text-red-400 hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === patient.patient_id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function PatientsPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<DataLoader message="Loading patients..." />}>
        <PatientList />
      </Suspense>
    </RequireAuth>
  );
}