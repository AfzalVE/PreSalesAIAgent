import { create } from 'zustand';
import { MOCK_PROPOSAL_STAGES, MOCK_NEGOTIATION_HISTORY, MOCK_EMPLOYEES, MOCK_ADMIN_PROPOSALS } from '../mock/mockData';

const INITIAL_PROJECT_DATA = {
  name: '',
  domain: '',
  description: '',
  techStack: [],
  budget: 75000,
  timeline: '12 Weeks',
  notes: '',
  complexity: 'Medium',
  estimatedTeam: 4
};

export const useAppStore = create((set, get) => ({
  // Admin Data Management
  employees: [...MOCK_EMPLOYEES],
  adminProposals: [...MOCK_ADMIN_PROPOSALS],

  updateEmployee: (empId, updatedFields) => set((state) => ({
    employees: state.employees.map(emp => emp.id === empId ? { ...emp, ...updatedFields } : emp)
  })),

  // User Authentication
  user: {
    emailOrPhone: '',
    isVerified: false
  },
  
  // Navigation & Guided Steps
  // Steps: 0: Landing, 1: Onboarding, 2: Voice, 3: Summary, 4: Evolution, 5: Negotiation, 6: Approval
  activeStep: 0,
  
  // Project specifications
  projectData: { ...INITIAL_PROJECT_DATA },
  
  // Voice Recording state
  voiceData: {
    isRecording: false,
    transcript: '',
    extracted: {
      name: '',
      features: [],
      budget: 0,
      timeline: '',
      techStack: [],
      complexity: ''
    }
  },
  
  // Proposals & Stages
  proposalStages: { ...MOCK_PROPOSAL_STAGES },
  selectedProposalStage: 'growth', // 'mvp' | 'growth' | 'enterprise'
  
  // Active (negotiated) versions
  activeProposal: { ...MOCK_PROPOSAL_STAGES.growth },
  negotiationHistory: [...MOCK_NEGOTIATION_HISTORY],
  negotiationError: '',
  
  // Actions
  setUser: (userData) => set({ user: userData }),
  setActiveStep: (step) => set({ activeStep: step }),
  
  updateProjectData: (data) => set((state) => {
    const updated = { ...state.projectData, ...data };
    
    // Automatically update proposals based on user onboarding choices
    const currentGrowth = { ...state.proposalStages.growth };
    currentGrowth.budget = updated.budget || currentGrowth.budget;
    currentGrowth.timeline = updated.timeline || currentGrowth.timeline;
    
    return { 
      projectData: updated,
      activeProposal: currentGrowth
    };
  }),
  
  setVoiceData: (data) => set((state) => ({
    voiceData: { ...state.voiceData, ...data }
  })),
  
  setSelectedProposalStage: (stage) => set((state) => ({
    selectedProposalStage: stage,
    activeProposal: { ...state.proposalStages[stage] }
  })),
  
  addNegotiationHistory: (entry) => set((state) => ({
    negotiationHistory: [entry, ...state.negotiationHistory]
  })),
  
  resetStore: () => set({
    user: { emailOrPhone: '', isVerified: false },
    activeStep: 0,
    projectData: { ...INITIAL_PROJECT_DATA },
    selectedProposalStage: 'growth',
    activeProposal: { ...MOCK_PROPOSAL_STAGES.growth },
    negotiationHistory: [...MOCK_NEGOTIATION_HISTORY],
    negotiationError: ''
  }),
  
  // AI Negotiation Logic
  applyNegotiationRequest: async (clientPrompt) => {
    const store = get();
    const currentProposal = { ...store.activeProposal };
    const nextVersionNum = `v1.${store.negotiationHistory.length}`;
    
    try {
      const response = await fetch("http://127.0.0.1:8000/api/v1/ai-agent/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_request: clientPrompt,
          current_budget: currentProposal.budget,
          current_timeline: currentProposal.timeline,
          current_tech_stack: currentProposal.techStack || store.projectData.techStack
        })
      });
      
      const data = await response.json();
      
      if (!data.success) {
        set({ negotiationError: data.error_message || "Negotiation declined." });
        return { success: false, text: data.response_message, error: data.error_message };
      }
      
      // Update proposal with negotiated values
      currentProposal.budget = data.new_budget;
      currentProposal.timeline = data.new_timeline;
      
      const newHistoryEntry = {
        version: nextVersionNum,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        budget: currentProposal.budget,
        timeline: currentProposal.timeline,
        author: "Client Request",
        changeDescription: `Prompt: "${clientPrompt}". AI Adjustment: ${data.response_message}`
      };
      
      set((state) => ({
        activeProposal: currentProposal,
        negotiationHistory: [newHistoryEntry, ...state.negotiationHistory],
        negotiationError: '',
        projectData: {
          ...state.projectData,
          techStack: data.new_tech_stack
        }
      }));
      
      return { success: true, text: data.response_message };
      
    } catch (err) {
      console.error(err);
      return { success: false, text: "Error connecting to AI Negotiation Broker.", error: "Network Error" };
    }
  }
}));
