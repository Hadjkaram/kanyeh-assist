import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Case, CreateCaseData, CaseImage } from '@/types/case';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface CaseContextType {
  cases: Case[];
  addCase: (data: CreateCaseData) => Case;
  updateCase: (id: string, data: Partial<Case>) => void;
  addImageToCase: (caseId: string, image: CaseImage) => void;
  removeImageFromCase: (caseId: string, imageId: string) => void;
  submitCase: (caseId: string) => void;
  getCaseById: (id: string) => Case | undefined;
  getDraftCases: () => Case[];
  getPendingCases: () => Case[];
}

const CaseContext = createContext<CaseContextType | undefined>(undefined);

// Generate unique IDs
const generateCaseId = () => {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `KA-${year}-${num}`;
};

const generatePatientId = () => {
  const num = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `CMU-${num}`;
};

export const CaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cases, setCases] = useState<Case[]>([]);
  const { user } = useAuth();

  // CHARGEMENT INITIAL DEPUIS SUPABASE
  useEffect(() => {
    const fetchAllCases = async () => {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const formattedCases: Case[] = data.map((d: any) => {
          const nameParts = d.patient_name ? d.patient_name.split(' ') : ['Inconnu', ''];
          return {
            id: d.case_reference || d.id,
            patientInfo: {
              id: d.patient_id || 'N/A',
              firstName: nameParts[0],
              lastName: nameParts.slice(1).join(' ') || '',
              dateOfBirth: 'Non spécifié',
              gender: 'female',
              phone: '',
              cmuNumber: d.patient_id || '',
            },
            pathology: d.pathology,
            status: d.status,
            priority: d.priority,
            images: [],
            clinicalNotes: d.analysis_notes || '',
            sampleType: d.sample_type || 'Biopsie',
            collectionDate: new Date(d.created_at).toISOString().split('T')[0],
            centerId: d.center,
            centerName: d.center,
            createdBy: d.created_by,
            createdAt: d.created_at,
            updatedAt: d.created_at,
            diagnosis: d.diagnosis
          };
        });
        setCases(formattedCases);
      }
    };

    fetchAllCases();
  }, []);

  const addCase = (data: CreateCaseData): Case => {
    const caseRef = generateCaseId();
    const patientId = generatePatientId();

    const newCase: Case = {
      id: caseRef,
      patientInfo: {
        ...data.patientInfo,
        id: patientId,
      },
      pathology: data.pathology,
      status: 'draft',
      priority: data.priority,
      images: [],
      clinicalNotes: data.clinicalNotes,
      sampleType: data.sampleType,
      collectionDate: data.collectionDate,
      centerId: user?.centerId || 'unknown',
      centerName: user?.centerName || 'Unknown Center',
      createdBy: user?.id || 'unknown',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCases(prev => [newCase, ...prev]);

    supabase.from('cases').insert([{
      case_reference: caseRef,
      patient_name: `${data.patientInfo.lastName} ${data.patientInfo.firstName}`.trim(),
      patient_id: patientId,
      pathology: data.pathology,
      status: 'draft',
      priority: data.priority,
      center: user?.centerName || 'Plateforme',
      created_by: user?.id,
      sample_type: data.sampleType,
      analysis_notes: data.clinicalNotes
    }]).then(({ error }) => {
      if (error) console.error("Erreur de sauvegarde Supabase :", error);
    });

    return newCase;
  };

  const updateCase = (id: string, data: Partial<Case>) => {
    setCases(prev =>
      prev.map(c =>
        c.id === id
          ? { ...c, ...data, updatedAt: new Date().toISOString() }
          : c
      )
    );

    const updatePayload: any = {};
    const safeData = data as any; // <-- CORRECTION POUR ENLEVER LA LIGNE ROUGE
    
    if (safeData.status) updatePayload.status = safeData.status;
    if (safeData.diagnosis) updatePayload.diagnosis = safeData.diagnosis;
    if (safeData.priority) updatePayload.priority = safeData.priority;
    
    if (Object.keys(updatePayload).length > 0) {
      supabase.from('cases').update(updatePayload).eq('case_reference', id).then(({ error }) => {
        if (error) supabase.from('cases').update(updatePayload).eq('id', id).then();
      });
    }
  };

  const addImageToCase = (caseId: string, image: CaseImage) => {
    setCases(prev =>
      prev.map(c =>
        c.id === caseId
          ? { ...c, images: [...c.images, image], updatedAt: new Date().toISOString() }
          : c
      )
    );
  };

  const removeImageFromCase = (caseId: string, imageId: string) => {
    setCases(prev =>
      prev.map(c =>
        c.id === caseId
          ? { ...c, images: c.images.filter(img => img.id !== imageId), updatedAt: new Date().toISOString() }
          : c
      )
    );
  };

  const submitCase = (caseId: string) => {
    updateCase(caseId, { status: 'pending' });
  };

  const getCaseById = (id: string) => cases.find(c => c.id === id);

  const getDraftCases = () => cases.filter(c => c.status === 'draft');

  const getPendingCases = () => cases.filter(c => c.status === 'pending');

  return (
    <CaseContext.Provider
      value={{
        cases,
        addCase,
        updateCase,
        addImageToCase,
        removeImageFromCase,
        submitCase,
        getCaseById,
        getDraftCases,
        getPendingCases,
      }}
    >
      {children}
    </CaseContext.Provider>
  );
};

export const useCases = (): CaseContextType => {
  const context = useContext(CaseContext);
  if (!context) {
    throw new Error('useCases must be used within a CaseProvider');
  }
  return context;
};