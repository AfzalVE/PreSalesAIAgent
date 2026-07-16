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
  employees: [],
  adminProposals: [],
  usersList: [],
  otpLogs: [],
  dashboardStats: null,

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
  setUser: (userData) => {
    set({ user: userData });
    const r = String(userData?.role || '').toLowerCase();
    if (r === 'super-admin' || r === 'admin' || r === 'manager') {
      get().fetchAdminData();
    }
  },
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

  generateProposalsFromBackend: async () => {
    const store = get();
    const payload = {
      project_name: store.projectData.name,
      project_description: store.projectData.description,
      business_domain: store.projectData.domain,
      preferred_technology: store.projectData.techStack,
      budget: store.projectData.budget,
      timeline: store.projectData.timeline
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800); // 800ms timeout

      const response = await fetch("http://localhost:8000/api/v1/proposals/generate-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error("Failed to generate proposals");
      const data = await response.json();

      const mvpProposal = data.proposals.find(p => p.proposal_type === "MVP");
      const fullProposal = data.proposals.find(p => p.proposal_type === "FULL");

      const formatProposal = (p, label, descOverride) => {
        const teamMapped = (p.selected_resources?.resources || []).map(r => ({
          name: r.name,
          role: r.role
        }));

        return {
          id: p.id,
          label: label,
          description: descOverride || p.scope,
          timeline: p.estimated_duration,
          budget: p.estimated_cost,
          teamSize: teamMapped.length,
          team: teamMapped,
          features: [
            { name: "Core Scope & Deliverables", status: "active", desc: p.scope },
            { name: "Key Assumptions", status: "active", desc: p.assumptions },
            { name: "Risk Mitigation", status: "active", desc: p.risks }
          ],
          architecture: {
            client: "Web Application Client",
            apiGateway: "RESTful API Layer",
            services: [Object.values(p.tech_stack).join(", ")],
            databases: [p.tech_stack.db || "PostgreSQL"]
          },
          timeline_phases: p.timeline_phases || []
        };
      };

      const proposalStages = {
        mvp: formatProposal(mvpProposal, "MVP Launch", "Lean implementation focusing on core functionalities."),
        growth: formatProposal(fullProposal, "Growth Engine", "Full product release with complete architecture and integrations."),
        enterprise: {
          ...formatProposal(fullProposal, "Enterprise Scale", "Scalable multi-region deployment with enterprise SLAs and auditing."),
          budget: Math.round(fullProposal.estimated_cost * 1.3),
          timeline: `${Math.round(parseInt(fullProposal.estimated_duration) * 1.4)} Weeks`
        }
      };

      set({
        proposalStages,
        activeProposal: proposalStages.growth,
        selectedProposalStage: 'growth',
        projectData: {
          ...store.projectData,
          name: data.project_name,
          domain: data.business_domain,
          description: data.project_description,
          techStack: data.preferred_technology,
          budget: data.budget,
          timeline: data.timeline
        }
      });
      return { success: true };
    } catch (e) {
      console.warn("Backend proposal generation failed, falling back to mock data:", e);
      const mockStages = { ...store.proposalStages };
      mockStages.growth.budget = store.projectData.budget || mockStages.growth.budget;
      mockStages.growth.timeline = store.projectData.timeline || mockStages.growth.timeline;
      set({
        proposalStages: mockStages,
        activeProposal: mockStages.growth,
        selectedProposalStage: 'growth'
      });
      return { success: true };
    }
  },

  selectProposalFromBackend: async (proposalId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/proposals/${proposalId}/select`, {
        method: "POST"
      });
      if (!response.ok) throw new Error("Failed to select proposal");
      const data = await response.json();

      set((state) => ({
        activeProposal: {
          ...state.activeProposal,
          status: data.status,
          docx_url: data.docx_url
        }
      }));
      return { success: true, docx_url: data.docx_url };
    } catch (e) {
      console.warn("Backend proposal selection failed, using mock success fallback:", e);
      set((state) => ({
        activeProposal: {
          ...state.activeProposal,
          status: "selected",
          docx_url: "#"
        }
      }));
      return { success: true, docx_url: "#" };
    }
  },

  fetchAdminData: async () => {
    const safeFetch = async (url) => {
      try {
        const res = await fetch(url);
        if (res.ok) return await res.json();
      } catch (e) {
        console.error(`[useAppStore] Error fetching ${url}:`, e);
      }
      return null;
    };

    safeFetch("http://localhost:8000/api/v1/admin/dashboard-stats").then((statsData) => {
      if (statsData !== null) set({ dashboardStats: statsData });
    });
    safeFetch("http://localhost:8000/api/v1/proposals/all").then((propsData) => {
      if (propsData !== null) set({ adminProposals: propsData });
    });
    safeFetch("http://localhost:8000/api/v1/employees").then((empsData) => {
      if (empsData !== null) set({ employees: empsData });
    });
    safeFetch("http://localhost:8000/api/v1/users").then((usersData) => {
      if (usersData !== null) set({ usersList: usersData });
    });
    safeFetch("http://localhost:8000/api/v1/admin/otp-logs").then((logsData) => {
      if (logsData !== null) set({ otpLogs: logsData });
    });

    return { success: true };
  },

  updateEmployeeOnBackend: async (empId, updatedFields) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/employees/${empId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
      });
      if (response.ok) {
        await get().fetchAdminData();
        return { success: true };
      }
    } catch (e) {
      console.error("Failed to update employee on backend:", e);
    }
    return { success: false };
  },

  toggleUserStatusOnBackend: async (email) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/users/${email}/toggle-status`, {
        method: "PUT"
      });
      if (response.ok) {
        await get().fetchAdminData();
        return { success: true };
      }
    } catch (e) {
      console.error("Failed to toggle user status on backend:", e);
    }
    return { success: false };
  },

  verifyUserOnBackend: async (email) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/users/${email}/verify`, {
        method: "PUT"
      });
      if (response.ok) {
        await get().fetchAdminData();
        return { success: true };
      }
    } catch (e) {
      console.error("Failed to verify user on backend:", e);
    }
    return { success: false };
  },

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
  applyNegotiationRequest: (clientPrompt) => {
    const prompt = clientPrompt.toLowerCase();
    const store = get();
    const currentProposal = { ...store.activeProposal };
    let responseText;
    let negotiationError = "";

    // Create copy for new version history
    const nextVersionNum = `v1.${store.negotiationHistory.length}`;

    // 1. Check for budget reduction request
    if (prompt.includes("budget") && (prompt.includes("reduce") || prompt.includes("cut") || prompt.includes("lower") || prompt.includes("less"))) {
      let reductionPercent = 20; // default 20%
      const match = prompt.match(/(\d+)%/);
      if (match) {
        reductionPercent = parseInt(match[1], 10);
      }

      const newBudget = Math.round(currentProposal.budget * (1 - reductionPercent / 100));

      if (newBudget < 25000) {
        negotiationError = "Reducing the budget below $25,000 might compromise critical software quality standards. We recommend scheduling a direct kickoff to talk scope reductions.";
        responseText = "I cannot automatically lower the budget that far without dropping key deliverables. Let me flag this for manager approval, or we can scale down requirements.";
      } else {
        currentProposal.budget = newBudget;
        // Drop a team resource or flag dynamic changes
        if (currentProposal.team.length > 2) {
          const removedMember = currentProposal.team[currentProposal.team.length - 1];
          currentProposal.team = currentProposal.team.slice(0, -1);
          responseText = `Successfully adjusted the budget down by ${reductionPercent}%. To accommodate this, we've optimized resource allocation and transitioned "${removedMember.name}" (${removedMember.role}) off this cycle.`;
        } else {
          responseText = `Successfully adjusted the budget down by ${reductionPercent}%. The development team remains active but timeline buffers are optimized.`;
        }
      }
    }
    // 2. Check for technology changes
    else if (prompt.includes("react") && (prompt.includes("angular") || prompt.includes("instead of"))) {
      responseText = "Updated technical blueprint: Swapped custom Angular modules to leverage high-velocity React ecosystem components. This decreases frontend overhead.";
      if (!store.projectData.techStack.includes("React")) {
        set((state) => ({
          projectData: {
            ...state.projectData,
            techStack: [...state.projectData.techStack.filter(t => t !== "Angular"), "React"]
          }
        }));
      }
    }
    // 3. Timeline adjustment request
    else if (prompt.includes("month") || prompt.includes("week") || prompt.includes("launch in") || prompt.includes("timeline")) {
      const matchWeeks = prompt.match(/(\d+)\s*week/);
      const matchMonths = prompt.match(/(\d+)\s*month/);
      let targetWeeks = 8;

      if (matchWeeks) {
        targetWeeks = parseInt(matchWeeks[1], 10);
      } else if (matchMonths) {
        targetWeeks = parseInt(matchMonths[1], 10) * 4;
      }

      if (targetWeeks < 5) {
        negotiationError = "A release timeline shorter than 5 weeks is highly risky for enterprise-grade applications. We recommend connecting with management to discuss MVP phases.";
        responseText = "That timeline is extremely tight for the planned feature set. Let's arrange a human call to discuss dropping non-critical modules.";
      } else {
        currentProposal.timeline = `${targetWeeks} Weeks`;
        // Increase team size slightly to account for crash schedule
        if (currentProposal.team.length < 6) {
          currentProposal.team.push({ name: "Tariq Mahmood", role: "DevOps Engineer (Timeline Acceleration Specialist)" });
          currentProposal.budget = Math.round(currentProposal.budget * 1.15); // Rush premium
          responseText = `Compressed schedule to ${targetWeeks} weeks. Added Tariq Mahmood (DevOps) to accelerate integration tasks. A 15% timeline-rush premium is reflected in the budget.`;
        } else {
          responseText = `Timeline successfully compressed to ${targetWeeks} weeks. Resources are rescheduled.`;
        }
      }
    }
    // 4. Add AI modules
    else if (prompt.includes("ai") || prompt.includes("artificial intelligence") || prompt.includes("recommendation")) {
      currentProposal.features.forEach((feature) => {
        if (feature.name.includes("AI")) {
          feature.status = "active";
        }
      });
      currentProposal.budget = Math.round(currentProposal.budget * 1.2);
      responseText = "Illuminated the 'Advanced AI Optimization' module. Integrated vector embedding pipelines and semantic indexing nodes into our roadmap, adding 20% to cost.";
    }
    // 5. Default Response
    else {
      responseText = "Your request was processed by the AI Proposal Broker. I've updated the blueprints, modified allocation metrics, and adjusted details on the flight.";
    }

    if (negotiationError) {
      set({ negotiationError });
      return { success: false, text: responseText, error: negotiationError };
    }

    const newHistoryEntry = {
      version: nextVersionNum,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      budget: currentProposal.budget,
      timeline: currentProposal.timeline,
      author: "Client Request",
      changeDescription: `Prompt: "${clientPrompt}". AI Adjustment: ${responseText}`
    };

    set((state) => ({
      activeProposal: currentProposal,
      negotiationHistory: [newHistoryEntry, ...state.negotiationHistory],
      negotiationError: ''
    }));

    return { success: true, text: responseText };
  }
}));
