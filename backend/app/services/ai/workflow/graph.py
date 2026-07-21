from langgraph.graph import StateGraph, END
from app.services.ai.workflow.state import AgentState
from app.services.ai.workflow.nodes import (
    extract_requirements_node,
    merge_requirements_node,
    ask_missing_info_node,
    generate_suggestion_node,
    recommend_tech_node,
    classify_tech_confirmation_node,
    decompose_project_node,
    mvp_plan_node,
    scalable_plan_node,
    mvp_estimation_node,
    scalable_estimation_node,
    generate_comparison_node
)

def should_ask_or_proceed(state: AgentState) -> str:
    if state.get("wants_suggestion"):
        return "generate_suggestion"
    if not state.get("is_gathering_info_complete"):
        return "ask_missing_info"
    if state.get("tech_stack_confirmed"):
        return "decompose_project"
    if state.get("recommended_tech_stack"):
        return "classify_tech_confirmation"
    return "recommend_tech"

def check_confirmation(state: AgentState) -> str:
    if state.get("tech_stack_confirmed"):
        return "decompose_project"
    return END

def build_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("extract_requirements", extract_requirements_node)
    workflow.add_node("merge_requirements", merge_requirements_node)
    workflow.add_node("ask_missing_info", ask_missing_info_node)
    workflow.add_node("generate_suggestion", generate_suggestion_node)
    workflow.add_node("recommend_tech", recommend_tech_node)
    workflow.add_node("classify_tech_confirmation", classify_tech_confirmation_node)
    workflow.add_node("decompose_project", decompose_project_node)
    workflow.add_node("mvp_plan", mvp_plan_node)
    workflow.add_node("scalable_plan", scalable_plan_node)
    workflow.add_node("mvp_estimation", mvp_estimation_node)
    workflow.add_node("scalable_estimation", scalable_estimation_node)
    workflow.add_node("generate_comparison", generate_comparison_node)
    
    workflow.set_entry_point("extract_requirements")
    workflow.add_edge("extract_requirements", "merge_requirements")
    
    workflow.add_conditional_edges(
        "merge_requirements",
        should_ask_or_proceed,
        {
            "generate_suggestion": "generate_suggestion",
            "ask_missing_info": "ask_missing_info",
            "decompose_project": "decompose_project",
            "classify_tech_confirmation": "classify_tech_confirmation",
            "recommend_tech": "recommend_tech"
        }
    )
    
    workflow.add_edge("generate_suggestion", END)
    
    workflow.add_edge("ask_missing_info", END)
    workflow.add_edge("recommend_tech", END)
    
    workflow.add_conditional_edges(
        "classify_tech_confirmation",
        check_confirmation,
        {
            "decompose_project": "decompose_project",
            END: END
        }
    )
    
    # Parallel execution
    workflow.add_edge("decompose_project", "mvp_plan")
    workflow.add_edge("decompose_project", "scalable_plan")
    
    workflow.add_edge("mvp_plan", "mvp_estimation")
    workflow.add_edge("scalable_plan", "scalable_estimation")
    
    # Join
    workflow.add_edge(["mvp_estimation", "scalable_estimation"], "generate_comparison")
    workflow.add_edge("generate_comparison", END)
    
    return workflow.compile()

# Provide a compiled instance
app_graph = build_graph()
