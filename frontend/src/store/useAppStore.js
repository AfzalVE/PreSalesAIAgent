import { create } from 'zustand';

const INITIAL_PROJECT_DATA = {
  name: '',
  domain: '',
  description: '',
  techStack: [],
  budget: null,
  timeline: '',
  notes: '',
  complexity: '',
  estimatedTeam: 0
};

export const useAppStore = create((set, get) => ({
  // Admin Data Management
  employees: [],
  adminProposals: [],
  usersList: [],
  otpLogs: [],
  dashboardStats: null,
  employeeChats: [],

  updateEmployee: (empId, updatedFields) => set((state) => ({
    employees: state.employees.map(emp => emp.id === empId ? { ...emp, ...updatedFields } : emp)
  })),

  // User Authentication
  user: (() => {
    try {
      const saved = localStorage.getItem("user_session");
      return saved ? JSON.parse(saved) : { emailOrPhone: '', isVerified: false };
    } catch {
      return { emailOrPhone: '', isVerified: false };
    }
  })(),

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

  isDemoReady: false,
  setIsDemoReady: (ready) => set({ isDemoReady: ready }),
  generatedDemos: [],
  setGeneratedDemos: (demos) => set({ generatedDemos: demos }),

  activeRequestId: null,
  setActiveRequestId: (id) => set({ activeRequestId: id }),

  // Proposals & Stages
  proposalStages: null,
  selectedProposalStage: null, // 'mvp' | 'growth' | 'enterprise'

  // Active (negotiated) versions
  activeProposal: null,
  negotiationHistory: [],
  negotiationError: '',
  jsonPocs: {
    extraction: null,
    matching: null,
    generation: null
  },

  // Actions
  setUser: (userData) => {
    set({ user: userData });
    if (userData) {
      localStorage.setItem("user_session", JSON.stringify(userData));
    } else {
      localStorage.removeItem("user_session");
    }
    const r = String(userData?.role || '').toLowerCase();
    if (r === 'super-admin' || r === 'admin' || r === 'manager') {
      get().fetchAdminData();
    }
  },
  setActiveStep: (step) => set({ activeStep: step }),

  updateProjectData: (data) => set((state) => {
    const updated = { ...state.projectData, ...data };

    // Automatically update proposals based on user onboarding choices
    let currentGrowth = null;
    if (state.proposalStages && state.proposalStages.growth) {
      currentGrowth = { ...state.proposalStages.growth };
      currentGrowth.budget = updated.budget || currentGrowth.budget;
      currentGrowth.timeline = updated.timeline || currentGrowth.timeline;
    }

    return {
      projectData: updated,
      activeProposal: currentGrowth || state.activeProposal
    };
  }),

  setVoiceData: (data) => set((state) => ({
    voiceData: { ...state.voiceData, ...data }
  })),

  setSelectedProposalStage: (stage) => set((state) => ({
    selectedProposalStage: stage,
    activeProposal: state.proposalStages ? { ...state.proposalStages[stage] } : null
  })),

  addNegotiationHistory: (entry) => set((state) => ({
    negotiationHistory: [entry, ...state.negotiationHistory]
  })),



  matchResourcesFromBackend: async () => {
    const store = get();
    const timelineNum = parseInt(store.projectData.timeline) || 12;
    const payload = {
      project_name: store.projectData.name,
      timeline_weeks: timelineNum,
      client_budget: store.projectData.budget || 75000,
      company_static_cost: 100.0,
      resource_requirements: [
        {
          role: "Senior Backend Engineer",
          count: 1,
          minimum_experience: 3,
          skills: store.projectData.techStack.length > 0 ? store.projectData.techStack : ["Python", "FastAPI"]
        },
        {
          role: "Senior Frontend Engineer",
          count: 1,
          minimum_experience: 3,
          skills: store.projectData.techStack.length > 0 ? store.projectData.techStack : ["React"]
        }
      ]
    };

    try {
      const token = store.user?.accessToken;
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/resource-allocation/match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Failed to match resources");
      const data = await response.json();

      const teamMapped = (data.selected_resources || []).map(r => ({
        name: r.name,
        role: r.role,
        hourly_cost: r.hourly_cost,
        allocated_hours: r.allocated_hours,
        estimated_cost: r.estimated_cost
      }));

      const updatedGrowth = {
        ...store.proposalStages.growth,
        budget: data.total_project_cost,
        timeline: `${timelineNum} Weeks`,
        teamSize: teamMapped.length,
        team: teamMapped,
        description: `Custom proposal matched dynamically from active bench employees for ${store.projectData.name}.`,
      };

      set({
        proposalStages: {
          ...store.proposalStages,
          growth: updatedGrowth
        },
        activeProposal: updatedGrowth,
        selectedProposalStage: 'growth'
      });

      return { success: true, data: data };
    } catch (e) {
      console.error("Resource matching API failed:", e);
      return { success: false, error: e.message || "Failed to call resource matching API." };
    }
  },

  generateProposalsFromBackend: async () => {
    const store = get();

    const techText = store.projectData.techStack?.length ? store.projectData.techStack.join(', ') : "Not provided. INFER appropriate enterprise tech stack based on description.";
    const budgetText = store.projectData.budget ? `$${store.projectData.budget}` : "Not provided. INFER realistic enterprise budget based on description.";
    const timelineText = store.projectData.timeline ? store.projectData.timeline : "Not provided. INFER realistic timeline in days based on description.";

    // Concatenate details into a single prompt for extract-requirements
    const extractionText = `[SYSTEM OVERRIDE: Form Submission Mode]
Project Name: ${store.projectData.name}
Business Domain: ${store.projectData.domain}
Description: ${store.projectData.description}
Preferred Tech Stack: ${techText}
Budget: ${budgetText}
Timeline: ${timelineText}

Treat this request as fully complete. INFER any missing fields (like budget, timeline_days, tech stack, and resource_requirements) dynamically based on the description.
You MUST explicitly extract and output project_name, business_domain, and project_description in your JSON response.
You MUST output mvp_resource_requirements, full_resource_requirements, mvp_timeline_days, and full_timeline_days based on the inferred tech stack and description.
DO NOT just divide the timeline in half for the MVP. Make a thoughtful calculation so mvp_timeline_days is genuinely different from full_timeline_days.
MUST set is_gathering_info_complete = true, summary_confirmed = true, ready_for_match = true, estimation_confirmed = true, ready_for_proposal_generation = true. DO NOT ask follow-up questions.`;

    try {
      const token = store.user?.accessToken;
      // 1. Call ai-agent/extract-requirements
      const extractionResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/ai-agent/extract-requirements`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ text: extractionText })
      });
      if (!extractionResponse.ok) throw new Error("Failed to extract requirements");
      const extractionData = await extractionResponse.json();
      console.log("Extraction Data:", extractionData);

      set((state) => ({
        activeRequestId: extractionData.request_id,
        jsonPocs: {
          ...state.jsonPocs,
          extraction: extractionData
        }
      }));

      // 2. Call resource-allocation/match with the returned data (do NOT send default values!)
      const matchingPayload = {
        proposal_id: extractionData.proposal_id,
        project_name: extractionData.project_name,
        timeline_days: extractionData.timeline_days,
        client_budget: extractionData.client_budget,
        resource_requirements: extractionData.resource_requirements,
        mvp_timeline_days: extractionData.mvp_timeline_days,
        full_timeline_days: extractionData.full_timeline_days,
        mvp_resource_requirements: extractionData.mvp_resource_requirements,
        full_resource_requirements: extractionData.full_resource_requirements
      };

      const matchingResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/resource-allocation/match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(matchingPayload)
      });
      if (!matchingResponse.ok) throw new Error("Failed to match resources");
      const matchingData = await matchingResponse.json();
      console.log("Matching Data:", matchingData);

      set((state) => ({
        jsonPocs: {
          ...state.jsonPocs,
          matching: matchingData
        }
      }));

      // Fallback for tech stack if inferred by AI
      let finalTechStack = store.projectData.techStack;
      if ((!finalTechStack || finalTechStack.length === 0) && extractionData.preferred_technology) {
          if (Array.isArray(extractionData.preferred_technology) && extractionData.preferred_technology.length > 0) {
              // Extraction might return a list of lists e.g. [["React", "Node"]]
              finalTechStack = Array.isArray(extractionData.preferred_technology[0]) 
                  ? extractionData.preferred_technology[0] 
                  : extractionData.preferred_technology;
          }
      }

      // 3. Call proposals/generate-demo
      const generationPayload = {
        project_name: extractionData.project_name,
        project_description: store.projectData.description,
        business_domain: extractionData.business_domain || store.projectData.domain,
        preferred_technology: finalTechStack,
        client_budget: extractionData.client_budget || store.projectData.budget,
        timeline: extractionData.timeline_weeks ? (extractionData.timeline_weeks + " Weeks") : store.projectData.timeline,
        ...matchingData
      };

      const generationResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/proposals/generate-demo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(generationPayload)
      });
      if (!generationResponse.ok) throw new Error("Failed to generate demo proposals");
      const generationData = await generationResponse.json();
      console.log("Generation Data:", generationData);

      set((state) => ({
        jsonPocs: {
          ...state.jsonPocs,
          generation: generationData
        }
      }));
      if (generationData.possible === false) {
        return { success: false, error: generationData.description || "Project not possible within constraints." };
      }

      // 4. Update activeProposal with raw backend data
      const mvpProposal = generationData.proposals?.find(p => p.proposal_type === "MVP");
      const fullProposal = generationData.proposals?.find(p => p.proposal_type === "FULL");

      const rawProposal = {
        inferred_project_name: generationData.project_name,
        inferred_business_domain: generationData.business_domain,
        inferred_project_description: generationData.project_description,
        inferred_preferred_technology: generationData.preferred_technology,
        inferred_budget: generationData.budget,
        inferred_timeline: generationData.timeline,
        mvp: mvpProposal,
        full: fullProposal,
        proposals: generationData.proposals,
        key_differences: generationData.key_differences
      };

      set({
        activeProposal: rawProposal
      });

      return { success: true };
    } catch (e) {
      console.error("Onboarding Pipeline failed:", e);
      return { success: false, error: e.message || "Pipeline execution failed." };
    }
  },

  selectProposalFromBackend: async (proposalId) => {
    try {
      const token = get().user?.accessToken;
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/proposals/${proposalId}/select`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
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

  /**
   * Tiered budget negotiation.
   *
   * @param {object} params
   * @param {number}   params.targetBudget          - Budget the client wants to hit (USD)
   * @param {number}   params.currentCost           - Current total cost of the active proposal
   * @param {number}   params.currentTimelineDays   - Current timeline in days
   * @param {Array}    params.currentResources       - Developer list from the active proposal
   * @param {Array}    [params.resourceRequirements] - Original role specs (optional)
   * @param {string}   [params.proposalType]         - "MVP" or "FULL"
   * @param {number}   params.negotiationAttempt     - 1 = first try, 2+ = second+ try
   * @param {string}   [params.requestId]            - Active proposal request UUID
   */
  negotiateBudgetOnBackend: async ({
    targetBudget,
    currentCost,
    currentTimelineDays,
    currentResources = [],
    resourceRequirements = null,
    proposalType = "MVP",
    negotiationAttempt = 1,
    requestId = null,
  }) => {
    try {
      const token = get().user?.accessToken;

      const payload = {
        request_id: requestId || get().activeRequestId || null,
        proposal_type: proposalType,
        target_budget: targetBudget,
        current_cost: currentCost,
        current_timeline_days: currentTimelineDays,
        current_resources: currentResources.map((r) => ({
          employee_id: r.employee_id || null,
          name: r.name || null,
          role: r.role || null,
          hourly_cost: r.hourly_cost || null,
          experience_years: r.experience_years || null,
          skills: r.skills || [],
          estimated_cost: r.estimated_cost || null,
          allocated_hours: r.allocated_hours || null,
        })),
        resource_requirements: resourceRequirements || null,
        negotiation_attempt: negotiationAttempt,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/v1/ai-agent/negotiate-budget`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Budget negotiation request failed");
      }

      const data = await response.json();

      // Update the active proposal in-place with the new team and costs
      if (data.success) {
        set((state) => {
          const prev = state.activeProposal || {};

          // Find the proposal variant that matches and patch it
          const patchProposal = (proposal) => {
            if (!proposal) return proposal;
            return {
              ...proposal,
              estimated_cost: data.new_cost,
              estimated_duration: data.new_timeline_formatted,
              selected_resources: {
                ...(proposal.selected_resources || {}),
                selected_resources: data.new_resources,
              },
            };
          };

          const updatedProposals = (prev.proposals || []).map((p) =>
            p.proposal_type === proposalType ? patchProposal(p) : p
          );

          return {
            activeProposal: {
              ...prev,
              proposals: updatedProposals,
              // Also patch the top-level mvp/full shortcuts if present
              ...(proposalType === "MVP" && prev.mvp
                ? { mvp: patchProposal(prev.mvp) }
                : {}),
              ...(proposalType === "FULL" && prev.full
                ? { full: patchProposal(prev.full) }
                : {}),
            },
          };
        });
      }

      return {
        success: data.success,
        strategyUsed: data.strategy_used,
        newCost: data.new_cost,
        newTimelineDays: data.new_timeline_days,
        newTimelineFormatted: data.new_timeline_formatted,
        newResources: data.new_resources,
        responseMessage: data.response_message,
        errorMessage: data.error_message || null,
      };
    } catch (e) {
      console.error("negotiateBudgetOnBackend failed:", e);
      return {
        success: false,
        strategyUsed: "none",
        responseMessage:
          "I was unable to reach the resource matching service. Please try again.",
        errorMessage: e.message,
      };
    }
  },

  fetchAdminData: async () => {
    const token = get().user?.accessToken;
    const safeFetch = async (url) => {
      try {
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) return await res.json();
      } catch (e) {
        console.error(`[useAppStore] Error fetching ${url}:`, e);
      }
      return null;
    };

    safeFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/dashboard-stats`).then((statsData) => {
      if (statsData !== null) set({ dashboardStats: statsData });
    });
    safeFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/proposals/all`).then((propsData) => {
      if (propsData !== null) set({ adminProposals: propsData });
    });
    safeFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/employees`).then((empsData) => {
      if (empsData !== null) set({ employees: empsData });
    });
    safeFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users`).then((usersData) => {
      if (usersData !== null) set({ usersList: usersData });
    });
    safeFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/admin/otp-logs`).then((logsData) => {
      if (logsData !== null) set({ otpLogs: logsData });
    });
    safeFetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/employees/chats`).then((chatsData) => {
      if (chatsData !== null) set({ employeeChats: chatsData });
    });

    return { success: true };
  },

  updateEmployeeOnBackend: async (empId, updatedFields) => {
    try {
      const token = get().user?.accessToken;
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/employees/${empId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
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

  uploadEmployeePdfOnBackend: async (empId, file) => {
    try {
      const token = get().user?.accessToken;
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/employees/${empId}/upload-pdf`, {
        method: "POST",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });
      if (response.ok) {
        await get().fetchAdminData();
        const data = await response.json();
        return { success: true, pdfPath: data.pdfPath };
      }
    } catch (e) {
      console.error("Failed to upload employee PDF:", e);
    }
    return { success: false };
  },

  sendEmployeeChatOnBackend: async (employeeId, clientId, sender, message) => {
    try {
      const token = get().user?.accessToken;
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/employees/chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ employeeId, clientId, sender, message })
      });
      if (response.ok) {
        await get().fetchAdminData();
        return { success: true };
      }
    } catch (e) {
      console.error("Failed to send employee chat:", e);
    }
    return { success: false };
  },

  createEmployeeOnBackend: async (newEmployeeFields) => {
    try {
      const token = get().user?.accessToken;
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/employees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(newEmployeeFields)
      });
      if (response.ok) {
        await get().fetchAdminData();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.detail || "Failed to create employee" };
      }
    } catch (e) {
      console.error("Failed to create employee on backend:", e);
    }
    return { success: false, error: "Network error occurred" };
  },

  toggleUserStatusOnBackend: async (email) => {
    try {
      const token = get().user?.accessToken;
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users/${email}/toggle-status`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
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
      const token = get().user?.accessToken;
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/v1/users/${email}/verify`, {
        method: "PUT",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
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

  resetStore: () => {
    localStorage.removeItem("user_session");
    set({
      user: { emailOrPhone: '', isVerified: false },
      activeStep: 0,
      projectData: { ...INITIAL_PROJECT_DATA },
      selectedProposalStage: null,
      activeProposal: null,
      negotiationHistory: [],
      negotiationError: '',
      proposalStages: null,
      activeRequestId: null
    });
  },



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
