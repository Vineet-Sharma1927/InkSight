'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

// Calculate Exner system ratios/indices from pre-counted totals
function calculateRorschachRatios(summaryStatistics) {
  if (!summaryStatistics || typeof summaryStatistics !== 'object') {
    return { error: 'Invalid input. Expected an object.' };
  }

  const round2 = (n) => Number.isFinite(n) ? Math.round((n + Number.EPSILON) * 100) / 100 : n;
  const formatNumber = (n) => {
    if (!Number.isFinite(n)) return String(n);
    const v = round2(n);
    return Number.isInteger(v) ? String(v) : String(v);
  };

  const total_responses = Number(summaryStatistics.total_responses) || 0;

  const det = summaryStatistics.determinant_counts || {};
  const M  = Number(det.M)  || 0;
  const FC = Number(det.FC) || 0;
  const CF = Number(det.CF) || 0;
  const C  = Number(det.C)  || 0;
  const F  = Number(det.F)  || 0;

  const reflection_count = Number(summaryStatistics.reflection_count) || 0;

  const group = summaryStatistics.responses_by_card_group || {};
  const responses_cards_1_to_7  = Number(group.cards_1_to_7)  || 0;
  const responses_cards_8_to_10 = Number(group.cards_8_to_10) || 0;

  if (total_responses === 0) {
    return { error: 'Total responses cannot be zero.' };
  }

  const SumC_raw = (0.5 * FC) + (1.0 * CF) + (1.5 * C);
  const SumC = round2(SumC_raw);

  const EB = `${formatNumber(M)} : ${formatNumber(SumC)}`;

  const EA = round2(M + SumC);

  const lambdaDenominator = total_responses - F;
  const Lambda = lambdaDenominator === 0 ? Infinity : round2(F / lambdaDenominator);

  const afrDenominator = responses_cards_1_to_7;
  const Afr = afrDenominator === 0 ? Infinity : round2(responses_cards_8_to_10 / afrDenominator);

  const EgocentricityIndex = round2((2 * reflection_count) / total_responses);

  return { EB, EA, SumC, Lambda, Afr, EgocentricityIndex };
}

const SummaryStatistics = ({ patientId }) => {
  const [statistics, setStatistics] = useState(null);
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ratios, setRatios] = useState(null);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const [stats, pat] = await Promise.all([
          api.getSummaryStatistics(patientId),
          api.getPatientById(patientId)
        ]);
        setStatistics(stats);
        setPatient(pat);

        // Build inputs for ratios
        const determinant_counts = stats?.determinant_totals || {};
        const reflection_count = (Number(determinant_counts.rF) || 0) + (Number(determinant_counts.Fr) || 0);

        // Count responses per card groups from patient data
        let cards_1_to_7 = 0;
        let cards_8_to_10 = 0;
        if (Array.isArray(pat?.responses)) {
          for (const img of pat.responses) {
            const count = Array.isArray(img?.entries) ? img.entries.length : 0;
            if (Number(img?.image_number) >= 1 && Number(img?.image_number) <= 7) cards_1_to_7 += count;
            else if (Number(img?.image_number) >= 8 && Number(img?.image_number) <= 10) cards_8_to_10 += count;
          }
        }

        const ratiosInput = {
          total_responses: Number(stats?.total_responses) || 0,
          determinant_counts: {
            M: Number(determinant_counts.M) || 0,
            FC: Number(determinant_counts.FC) || 0,
            CF: Number(determinant_counts.CF) || 0,
            C: Number(determinant_counts.C) || 0,
            F: Number(determinant_counts.F) || 0,
          },
          reflection_count,
          responses_by_card_group: {
            cards_1_to_7,
            cards_8_to_10,
          },
        };

        setRatios(calculateRorschachRatios(ratiosInput));
      } catch (error) {
        console.error('Error fetching summary statistics:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchStatistics();
    }
  }, [patientId]);

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-700 rounded"></div>
            <div className="h-3 bg-gray-700 rounded w-5/6"></div>
            <div className="h-3 bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-800 text-white p-4 rounded-lg">
        <p>Error loading statistics: {error}</p>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const formatCounts = (counts) => {
    if (!counts || Object.keys(counts).length === 0) {
      return <span className="text-gray-400">No data</span>;
    }
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a) // Sort by count descending
      .map(([key, count]) => (
        <div key={key} className="flex justify-between items-center py-1">
          <span className="text-gray-300">{key}</span>
          <span className="text-white font-medium">{count}</span>
        </div>
      ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800 rounded-lg shadow-xl overflow-hidden"
    >
      <div className="bg-gray-700 p-6">
        <h2 className="text-2xl font-bold text-white">Summary Statistics</h2>
        <p className="text-gray-300 mt-1">Overview of all responses and their classifications</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Responses */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Total Responses</h3>
            <div className="text-3xl font-bold text-indigo-400">{statistics.total_responses}</div>
          </div>

          {/* Popular Responses */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-2">Popular Responses</h3>
            <div className="text-3xl font-bold text-green-400">{statistics.popular_responses}</div>
            <div className="text-sm text-gray-400 mt-1">
              {statistics.total_responses > 0 
                ? `${((statistics.popular_responses / statistics.total_responses) * 100).toFixed(1)}% of total`
                : '0% of total'
              }
            </div>
          </div>

          {/* Location Totals */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Location Totals</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {formatCounts(statistics.location_totals)}
            </div>
          </div>

          {/* Determinant Totals */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Determinant Totals</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {formatCounts(statistics.determinant_totals)}
            </div>
          </div>

          {/* DQ Totals */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-3">Developmental Quality (DQ) Totals</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {formatCounts(statistics.dq_totals)}
            </div>
          </div>
        </div>

        {/* Content Totals - Full Width */}
        <div className="mt-6 bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Content Totals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(statistics.content_totals)
              .sort(([,a], [,b]) => b - a) // Sort by count descending
              .map(([key, count]) => (
                <div key={key} className="flex justify-between items-center py-2 px-3 bg-gray-800 rounded">
                  <span className="text-gray-300 text-sm">{key}</span>
                  <span className="text-white font-medium">{count}</span>
                </div>
              ))}
          </div>
          {Object.keys(statistics.content_totals).length === 0 && (
            <div className="text-gray-400 text-center py-4">No content data available</div>
          )}
        </div>

        {/* Ratios and Indices */}
        {ratios && !ratios.error && (
          <div className="mt-6 bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Ratios and Indices</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded">
                <div className="text-white font-semibold">Experience Balance (EB)</div>
                <div className="text-gray-400 text-sm mt-1">M : SumC</div>
                <div className="text-indigo-300 font-medium mt-2">{ratios.EB}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <div className="text-white font-semibold">Experience Actual (EA)</div>
                <div className="text-gray-400 text-sm mt-1">M + SumC</div>
                <div className="text-indigo-300 font-medium mt-2">{ratios.EA}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <div className="text-white font-semibold">Weighted Sum of Color (SumC)</div>
                <div className="text-gray-400 text-sm mt-1">0.5×FC + 1.0×CF + 1.5×C</div>
                <div className="text-indigo-300 font-medium mt-2">{ratios.SumC}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <div className="text-white font-semibold">Lambda (L)</div>
                <div className="text-gray-400 text-sm mt-1">F / (R − F)</div>
                <div className="text-indigo-300 font-medium mt-2">{Number.isFinite(ratios.Lambda) ? ratios.Lambda : '∞'}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <div className="text-white font-semibold">Affective Ratio (Afr)</div>
                <div className="text-gray-400 text-sm mt-1">VIII–X / I–VII</div>
                <div className="text-indigo-300 font-medium mt-2">{Number.isFinite(ratios.Afr) ? ratios.Afr : '∞'}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded">
                <div className="text-white font-semibold">Egocentricity Index</div>
                <div className="text-gray-400 text-sm mt-1">(2 × reflections) / R</div>
                <div className="text-indigo-300 font-medium mt-2">{ratios.EgocentricityIndex}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SummaryStatistics;
