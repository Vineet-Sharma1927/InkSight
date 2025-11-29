'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../lib/api';

// Generate comprehensive Rorschach report with 7 sections based on expert scoring methodology
function generateRorschachReport(data) {
  if (!data || typeof data !== 'object') {
    return { error: 'Invalid input. Expected an object.' };
  }

  const { R = 0 } = data;
  if (R === 0) return { error: "Total responses (R) cannot be zero." };

  // Helper function for checklists
  const runChecklist = (criteria, threshold) => {
    const flags_found = Object.values(criteria).filter(val => val === true).length;
    return { is_positive: flags_found >= threshold, flags_found, threshold };
  };

  // --- SECTION 1: CORE SECTION ---
  const sum_all_determinants = (data.SumC || 0) + (data.C_prime || 0) + (data.T || 0) + (data.V || 0) + (data.Y || 0);
  const es = (data.FM || 0) + (data.m || 0) + (data.Y || 0) + (data.V || 0) + (data.T || 0);
  const EA = (data.M || 0) + sum_all_determinants;
  const D = EA - es;
  const WSum6 = (2 * (data.DV || 0)) + (3 * (data.DR || 0)) + (4 * (data.INCOM || 0)) + (5 * (data.FABCOM || 0)) + (6 * (data.CONTAM || 0)) + (1 * (data.ALOG || 0));
  const AdjD = EA - (es + (WSum6 / 4));

  const core_section = {
    Lambda: (R - (data.PureF || 0)) === 0 ? Infinity : parseFloat(((data.PureF || 0) / (R - (data.PureF || 0))).toFixed(2)),
    EB: (sum_all_determinants === 0) ? Infinity : parseFloat(((data.M || 0) / sum_all_determinants).toFixed(2)),
    EBPer: (sum_all_determinants === 0) ? Infinity : parseFloat(((data.M || 0) / sum_all_determinants).toFixed(2)),
    EA: parseFloat(EA.toFixed(2)),
    es: parseFloat(es.toFixed(2)),
    D: parseFloat(D.toFixed(2)),
    AdjD: parseFloat(AdjD.toFixed(2))
  };

  // --- SECTION 2: IDEATION SECTION ---
  const pti_criteria = {
    XA_percent_lt_70: (data.XA_percent || 0) < 70,
    WDA_percent_lt_75: (data.WDA_percent || 0) < 75,
    X_minus_percent_gt_20: (data.X_minus_percent || 0) > 20,
    WSum6_gt_16: WSum6 > 16,
    M_minus_gt_0: (data.M_minus || 0) > 0
  };
  const EII = (WSum6 + (data.CriticalContents || 0) + (data.M_minus || 0) + (data.Level2_Special_Scores || 0)) / R;

  const ideation_section = {
    WSum6: parseFloat(WSum6.toFixed(2)),
    Intellectualization_Index: parseFloat((((2 * (data.AB || 0)) + (data.Art || 0) + (data.Ay || 0)) / R).toFixed(2)),
    PTI: runChecklist(pti_criteria, 3),
    Ego_Impairment_Index: parseFloat(EII.toFixed(2))
  };

  // --- SECTION 3: AFFECT SECTION ---
  // Update DEPI and SCON criteria with calculated values
  const updated_depi_criteria = {
    ...data.DEPI_criteria,
    SumShading_gt_EA: ((data.C_prime || 0) + (data.T || 0) + (data.V || 0) + (data.Y || 0)) > EA
  };
  
  const updated_scon_criteria = {
    ...data.SCON_criteria,
    es_gt_EA: es > EA,
    WSum6_gt_16: WSum6 > 16
  };

  const affect_section = {
    Affective_Ratio: parseFloat((sum_all_determinants / R).toFixed(2)),
    Isolation_Index: parseFloat((((data.V || 0) + (data.Y || 0) + (data.T || 0)) / R).toFixed(2)),
    DEPI: runChecklist(updated_depi_criteria, 5),
    SCON: runChecklist(updated_scon_criteria, 8)
  };

  // --- SECTION 4: MEDIATION SECTION ---
  // Primarily uses pre-calculated percentages.
  const mediation_section = {
    XA_percent: data.XA_percent || 0,
    WDA_percent: data.WDA_percent || 0,
    X_minus_percent: data.X_minus_percent || 0,
    // PTI is also relevant here but calculated in the Ideation section.
  };

  // --- SECTION 5: PROCESSING SECTION ---
  // Primarily descriptive, based on raw counts.
  const processing_section = {
    Lambda: core_section.Lambda, // Often considered a processing variable
    // Note: W:D:Dd ratios and Zd are typically direct inputs, not calculated here.
  };

  // --- SECTION 6: INTERPERSONAL SECTION ---
  const interpersonal_section = {
    // Human content ratios, COP, and AG are direct inputs.
    CDI: runChecklist(data.CDI_criteria || {}, 3),
    OBS: runChecklist(data.OBS_criteria || {}, 3)
  };

  // --- SECTION 7: SELF-PERCEPTION SECTION ---
  const egocentricity_numerator = (3 * (data.H || 0)) + (data.H_paren || 0) + (data.Hd || 0) + (data.Hd_paren || 0);
  const self_perception_section = {
    Egocentricity_Index: parseFloat((egocentricity_numerator / R).toFixed(2)),
    MOR: data.MOR || 0,
    Vista_Responses: data.V || 0
  };

  // --- FINAL OUTPUT STRUCTURE ---
  return {
    core_section,
    ideation_section,
    affect_section,
    mediation_section,
    processing_section,
    interpersonal_section,
    self_perception_section
  };
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

        // Build comprehensive Rorschach data structure for the new function
        const ratiosInput = {
          // General Counts
          R: Number(stats?.total_responses) || 0,
          PureF: Number(determinant_counts.F) || 0,

          // Determinant Sums
          M: Number(determinant_counts.M) || 0,
          FM: Number(determinant_counts.FM) || 0,
          m: Number(determinant_counts.m) || 0,
          SumC: (0.5 * (Number(determinant_counts.FC) || 0)) + (1.0 * (Number(determinant_counts.CF) || 0)) + (1.5 * (Number(determinant_counts.C) || 0)),
          C_prime: (0.5 * (Number(determinant_counts["FC'"]) || 0)) + (1.0 * (Number(determinant_counts["C'F"]) || 0)) + (1.5 * (Number(determinant_counts["C'"]) || 0)),
          T: (1.0 * (Number(determinant_counts.FT) || 0)) + (1.0 * (Number(determinant_counts.TF) || 0)) + (1.5 * (Number(determinant_counts.T) || 0)),
          V: (1.0 * (Number(determinant_counts.FV) || 0)) + (1.0 * (Number(determinant_counts.VF) || 0)) + (1.5 * (Number(determinant_counts.V) || 0)),
          Y: (1.0 * (Number(determinant_counts.FY) || 0)) + (1.0 * (Number(determinant_counts.YF) || 0)) + (1.5 * (Number(determinant_counts.Y) || 0)),

          // Special Scores (for WSum6 & EII)
          DV: Number(stats?.special_scores?.DV1) || 0,
          DR: Number(stats?.special_scores?.DR) || 0,
          INCOM: Number(stats?.special_scores?.INCOM) || 0,
          FABCOM: Number(stats?.special_scores?.FABCOM) || 0,
          CONTAM: Number(stats?.special_scores?.CONTAM) || 0,
          ALOG: Number(stats?.special_scores?.ALOG) || 0,
          M_minus: 0, // This would need to be calculated from M determinants with FQ-
          Level2_Special_Scores: 0, // Sum of level 2 special scores (DV2, DR2, INCOM2, FABCOM2, ALOG2, CONTAM2)

          // Content Counts
          AB: Number(stats?.special_scores?.AB) || 0,
          Art: Number(stats?.content_totals?.Art) || 0,
          Ay: Number(stats?.content_totals?.Ay) || 0,
          
          // Critical Contents = Bl + Fi + Ex + An + Sx + Xy + MOR
          CriticalContents: (Number(stats?.content_totals?.Bl) || 0) + 
                           (Number(stats?.content_totals?.Fi) || 0) + 
                           (Number(stats?.content_totals?.Ex) || 0) + 
                           (Number(stats?.content_totals?.An) || 0) + 
                           (Number(stats?.content_totals?.Sx) || 0) + 
                           (Number(stats?.content_totals?.Xy) || 0) + 
                           (Number(stats?.special_scores?.MOR) || 0),
          
          H: Number(stats?.content_totals?.H) || 0,
          H_paren: Number(stats?.content_totals?.["(H)"]) || 0,
          Hd: Number(stats?.content_totals?.Hd) || 0,
          Hd_paren: Number(stats?.content_totals?.["(Hd)"]) || 0,
          MOR: Number(stats?.special_scores?.MOR) || 0,
          COP: Number(stats?.special_scores?.COP) || 0,
          AG: Number(stats?.special_scores?.AG) || 0,

          // Form Quality Percentages (now calculated by backend)
          XA_percent: Number(stats?.form_quality?.XA_percent) || 0,
          WDA_percent: Number(stats?.form_quality?.WDA_percent) || 0,
          X_minus_percent: Number(stats?.form_quality?.X_minus_percent) || 0,
          X_plus_percent: Number(stats?.form_quality?.X_plus_percent) || 0,

          // Checklist Criteria Flags (booleans)
          DEPI_criteria: {
            COP_lt_2: (Number(stats?.special_scores?.COP) || 0) < 2,
            MOR_gt_2: (Number(stats?.special_scores?.MOR) || 0) > 2,
            SumV_gt_0: (Number(determinant_counts.V) || 0) + (Number(determinant_counts.FV) || 0) + (Number(determinant_counts.VF) || 0) > 0,
            Afr_lt_46: (cards_8_to_10 / Math.max(cards_1_to_7, 1)) < 0.46,
            SumShading_gt_EA: false, // Would need to calculate Sum_Shading and EA
            H_lt_2: ((Number(stats?.content_totals?.H) || 0) + (Number(stats?.content_totals?.["(H)"]) || 0)) < 2,
            R_lt_17: (Number(stats?.total_responses) || 0) < 17
          },
          SCON_criteria: {
            ZD_gt_3: false, // Would need actual ZD calculation
            EB_pervasive: false, // Would need actual EB calculation
            Afr_lt_44: (cards_8_to_10 / Math.max(cards_1_to_7, 1)) < 0.44,
            X_minus_percent_gt_20: (Number(stats?.form_quality?.X_minus_percent) || 0) > 20,
            S_gt_2: (Number(stats?.location_totals?.S) || 0) > 2,
            MOR_gt_2: (Number(stats?.special_scores?.MOR) || 0) > 2,
            es_gt_EA: false, // Will be calculated in the function
            H_lt_2: ((Number(stats?.content_totals?.H) || 0) + (Number(stats?.content_totals?.["(H)"]) || 0)) < 2,
            R_lt_17: (Number(stats?.total_responses) || 0) < 17,
            COP_lt_AG: (Number(stats?.special_scores?.COP) || 0) < (Number(stats?.special_scores?.AG) || 0),
            WSum6_gt_16: false, // Will be calculated in the function
            M_minus_gt_0: false // Would need M with FQ-
          },
          CDI_criteria: {
            SumV_gt_0: (Number(determinant_counts.V) || 0) + (Number(determinant_counts.FV) || 0) + (Number(determinant_counts.VF) || 0) > 0,
            COP_lt_2: (Number(stats?.special_scores?.COP) || 0) < 2,
            Afr_lt_44: (cards_8_to_10 / Math.max(cards_1_to_7, 1)) < 0.44,
            SumT_gt_1: (Number(determinant_counts.T) || 0) + (Number(determinant_counts.FT) || 0) + (Number(determinant_counts.TF) || 0) > 1,
            H_lt_2: ((Number(stats?.content_totals?.H) || 0) + (Number(stats?.content_totals?.["(H)"]) || 0)) < 2
          },
          OBS_criteria: {
            FQ_plus_gt_3: (Number(stats?.form_quality?.fq_totals?.['+']) || 0) > 3,
            X_plus_percent_gt_70: (Number(stats?.form_quality?.X_plus_percent) || 0) > 70,
            R_gt_16: (Number(stats?.total_responses) || 0) > 16,
            PureF_gt_5: (Number(determinant_counts.F) || 0) > 5,
            ZD_gt_3: false // Would need actual ZD calculation
          }
        };

        setRatios(generateRorschachReport(ratiosInput));
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
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-[#4A5568] rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-[#4A5568] rounded"></div>
            <div className="h-3 bg-[#4A5568] rounded w-5/6"></div>
            <div className="h-3 bg-[#4A5568] rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-[#EF4444] bg-[#2D3748]">
        <p className="text-[#EF4444]">Error loading statistics: {error}</p>
      </div>
    );
  }

  if (!statistics) {
    return null;
  }

  const formatCounts = (counts) => {
    if (!counts || Object.keys(counts).length === 0) {
      return <span className="text-[#A0AEC0]">No data</span>;
    }
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a) // Sort by count descending
      .map(([key, count]) => (
        <div key={key} className="flex justify-between items-center py-1">
          <span className="text-[#A0AEC0]">{key}</span>
          <span className="text-[#E2E8F0] font-medium">{count}</span>
        </div>
      ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card shadow-lg"
    >
      <div className="card-header bg-[#4A5568] rounded-t-lg -m-4 mb-4 p-4">
        <h2 className="card-title text-[#E2E8F0]">Summary Statistics</h2>
        <p className="text-[#A0AEC0] mt-1">Overview of all responses and their classifications</p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Responses */}
          <div className="card hover-lift">
            <h3 className="card-title text-[#E2E8F0] mb-2">Total Responses</h3>
            <div className="text-3xl font-bold text-[#8B5CF6]">{statistics.total_responses}</div>
          </div>

          {/* Popular Responses */}
          <div className="card hover-lift">
            <h3 className="card-title text-[#E2E8F0] mb-2">Popular Responses</h3>
            <div className="text-3xl font-bold text-[#10B981]">{statistics.popular_responses}</div>
            <div className="text-sm text-[#A0AEC0] mt-1">
              {statistics.total_responses > 0 
                ? `${((statistics.popular_responses / statistics.total_responses) * 100).toFixed(1)}% of total`
                : '0% of total'
              }
            </div>
          </div>

          {/* Location Totals */}
          <div className="card hover-lift">
            <h3 className="card-title text-[#E2E8F0] mb-3">Location Totals</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {formatCounts(statistics.location_totals)}
            </div>
          </div>

          {/* Determinant Totals */}
          <div className="card hover-lift">
            <h3 className="card-title text-[#E2E8F0] mb-3">Determinant Totals</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {formatCounts(statistics.determinant_totals)}
            </div>
          </div>

          {/* DQ Totals */}
          <div className="card hover-lift">
            <h3 className="card-title text-[#E2E8F0] mb-3">Developmental Quality (DQ) Totals</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {formatCounts(statistics.dq_totals)}
            </div>
          </div>

          {/* Form Quality Totals */}
          <div className="card hover-lift">
            <h3 className="card-title text-[#E2E8F0] mb-3">Form Quality (FQ) Totals</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {statistics.form_quality?.fq_totals && formatCounts(statistics.form_quality.fq_totals)}
            </div>
          </div>

          {/* Special Scores */}
          <div className="card hover-lift">
            <h3 className="card-title text-[#E2E8F0] mb-3">Special Scores</h3>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {formatCounts(statistics.special_scores)}
            </div>
          </div>
        </div>

        {/* Form Quality Percentages - Full Width */}
        <div className="mt-6 card hover-lift">
          <h3 className="card-title text-[#E2E8F0] mb-3">Form Quality Percentages (Exner)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex justify-between items-center py-2 px-3 bg-[#1A202C] rounded">
              <span className="text-[#A0AEC0] text-sm">XA% (Extended Accuracy)</span>
              <span className="text-[#E2E8F0] font-medium">{statistics.form_quality?.XA_percent || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-[#1A202C] rounded">
              <span className="text-[#A0AEC0] text-sm">X+% (Conventional+)</span>
              <span className="text-[#E2E8F0] font-medium">{statistics.form_quality?.X_plus_percent || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-[#1A202C] rounded">
              <span className="text-[#A0AEC0] text-sm">X-% (Distorted)</span>
              <span className="text-[#E2E8F0] font-medium">{statistics.form_quality?.X_minus_percent || 0}%</span>
            </div>
            <div className="flex justify-between items-center py-2 px-3 bg-[#1A202C] rounded">
              <span className="text-[#A0AEC0] text-sm">WDA% (W+D Accuracy)</span>
              <span className="text-[#E2E8F0] font-medium">{statistics.form_quality?.WDA_percent || 0}%</span>
            </div>
          </div>
        </div>

        {/* Content Totals - Full Width */}
        <div className="mt-6 card hover-lift">
          <h3 className="card-title text-[#E2E8F0] mb-3">Content Totals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(statistics.content_totals)
              .sort(([,a], [,b]) => b - a) // Sort by count descending
              .map(([key, count]) => (
                <div key={key} className="flex justify-between items-center py-2 px-3 bg-[#1A202C] rounded">
                  <span className="text-[#A0AEC0] text-sm">{key}</span>
                  <span className="text-[#E2E8F0] font-medium">{count}</span>
                </div>
              ))}
          </div>
          {Object.keys(statistics.content_totals).length === 0 && (
            <div className="text-[#A0AEC0] text-center py-4">No content data available</div>
          )}
        </div>

        {/* Comprehensive Rorschach Report */}
        {ratios && !ratios.error && (
          <div className="mt-6 space-y-6">
            {/* Core Section */}
            <div className="card hover-lift">
              <h3 className="card-title text-[#E2E8F0] mb-4">Core Section</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Lambda (L)</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">F / (R − F)</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{Number.isFinite(ratios.core_section.Lambda) ? ratios.core_section.Lambda : '∞'}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Experience Balance (EB)</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">(M + FM + m) / SumC</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{Number.isFinite(ratios.core_section.EB) ? ratios.core_section.EB : '∞'}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">EB Percentage</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">M / SumC</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{Number.isFinite(ratios.core_section.EBPer) ? ratios.core_section.EBPer : '∞'}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Experience Actual (EA)</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">M + SumC</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.core_section.EA}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Experienced Stimulation (es)</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">FM + m + Y + V + T</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.core_section.es}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">D Score</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">EA - es</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.core_section.D}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Adjusted D Score</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">EA - (es + WSum6/4)</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.core_section.AdjD}</div>
                </div>
              </div>
            </div>

            {/* Ideation Section */}
            <div className="card hover-lift">
              <h3 className="card-title text-[#E2E8F0] mb-4">Ideation Section</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">WSum6</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">Weighted sum of special scores</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.ideation_section.WSum6}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Intellectualization Index</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">(2×AB + Art + Ay) / R</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.ideation_section.Intellectualization_Index}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Perceptual Thinking Index (PTI)</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">Flags: {ratios.ideation_section.PTI.flags_found}/{ratios.ideation_section.PTI.threshold}</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.ideation_section.PTI.is_positive ? 'Positive' : 'Negative'}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Ego Impairment Index</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">(WSum6 + Critical + M- + Level2) / R</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.ideation_section.Ego_Impairment_Index}</div>
                </div>
              </div>
            </div>

            {/* Affect Section */}
            <div className="card hover-lift">
              <h3 className="card-title text-[#E2E8F0] mb-4">Affect Section</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Affective Ratio</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">SumC / R</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.affect_section.Affective_Ratio}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Isolation Index</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">(V + Y + T) / R</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.affect_section.Isolation_Index}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Depression Index (DEPI)</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">Flags: {ratios.affect_section.DEPI.flags_found}/{ratios.affect_section.DEPI.threshold}</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.affect_section.DEPI.is_positive ? 'Positive' : 'Negative'}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Suicide Constellation (SCON)</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">Flags: {ratios.affect_section.SCON.flags_found}/{ratios.affect_section.SCON.threshold}</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.affect_section.SCON.is_positive ? 'Positive' : 'Negative'}</div>
                </div>
              </div>
            </div>

            {/* Mediation Section */}
            <div className="card hover-lift">
              <h3 className="card-title text-[#E2E8F0] mb-4">Mediation Section</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">XA%</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">Form Quality + Ordinary + Unusual</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.mediation_section.XA_percent}%</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">WDA%</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">White space + Detail + Accidental</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.mediation_section.WDA_percent}%</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">X-%</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">Form Quality Minus</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.mediation_section.X_minus_percent}%</div>
                </div>
              </div>
            </div>

            {/* Processing Section */}
            <div className="card hover-lift">
              <h3 className="card-title text-[#E2E8F0] mb-4">Processing Section</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Lambda (L)</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">F / (R − F)</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{Number.isFinite(ratios.processing_section.Lambda) ? ratios.processing_section.Lambda : '∞'}</div>
                </div>
              </div>
            </div>

            {/* Interpersonal Section */}
            <div className="card hover-lift">
              <h3 className="card-title text-[#E2E8F0] mb-4">Interpersonal Section</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Coping Deficit Index (CDI)</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">Flags: {ratios.interpersonal_section.CDI.flags_found}/{ratios.interpersonal_section.CDI.threshold}</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.interpersonal_section.CDI.is_positive ? 'Positive' : 'Negative'}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Obsessive Style Index (OBS)</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">Flags: {ratios.interpersonal_section.OBS.flags_found}/{ratios.interpersonal_section.OBS.threshold}</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.interpersonal_section.OBS.is_positive ? 'Positive' : 'Negative'}</div>
                </div>
              </div>
            </div>

            {/* Self-Perception Section */}
            <div className="card hover-lift">
              <h3 className="card-title text-[#E2E8F0] mb-4">Self-Perception Section</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Egocentricity Index</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">(3×H + H' + Hd + Hd') / R</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{Number.isFinite(ratios.self_perception_section.Egocentricity_Index) ? ratios.self_perception_section.Egocentricity_Index : '∞'}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Morbid Content (MOR)</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">Direct count</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.self_perception_section.MOR}</div>
                </div>
                <div className="bg-[#1A202C] p-4 rounded-lg border border-[#4A5568] hover:border-[#8B5CF6] transition-colors">
                  <div className="text-[#E2E8F0] font-semibold">Vista Responses</div>
                  <div className="text-[#A0AEC0] text-sm mt-1">Direct count</div>
                  <div className="text-[#8B5CF6] font-medium mt-2">{ratios.self_perception_section.Vista_Responses}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default SummaryStatistics;
