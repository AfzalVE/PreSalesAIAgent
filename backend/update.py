import sys
import re

file_path = 'app/services/resource/cost_estimation.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. ProjectEstimate unfulfilled_roles and budget_overrun_warning
content = content.replace(
'''    selected_resources: List[SelectedResource] = field(default_factory=list)
    developer_cost: float = 0.0
    total_project_cost: float = 0.0''',
'''    selected_resources: List[SelectedResource] = field(default_factory=list)
    unfulfilled_roles: List[Dict[str, Any]] = field(default_factory=list)
    developer_cost: float = 0.0
    total_project_cost: float = 0.0
    budget_overrun_warning: Optional[str] = None'''
)

# 2. SelectedResource match_tier and shared_with_mvp
content = content.replace(
'''    estimated_cost: float = 0.0
    experience_years: int = 0
    skills: List[str] = field(default_factory=list)''',
'''    estimated_cost: float = 0.0
    experience_years: int = 0
    skills: List[str] = field(default_factory=list)
    match_tier: int = 1
    shared_with_mvp: bool = False'''
)

# 3. filter_candidates match_tier assignment
content = content.replace(
'''                tier1.append(emp)''',
'''                emp_copy = dict(emp)
                emp_copy["match_tier"] = 1
                tier1.append(emp_copy)'''
)
content = content.replace(
'''            tier2.append(emp)''',
'''            emp_copy = dict(emp)
            emp_copy["match_tier"] = 2
            tier2.append(emp_copy)'''
)
content = content.replace(
'''            tier3.append(emp)''',
'''            emp_copy = dict(emp)
            emp_copy["match_tier"] = 3
            tier3.append(emp_copy)'''
)
content = content.replace(
'''            tier4.append(emp)''',
'''            emp_copy = dict(emp)
            emp_copy["match_tier"] = 4
            tier4.append(emp_copy)'''
)

# 4. select_resources remaining_budget and budget scaling
old_select = '''def select_resources(
    employees: List[Dict[str, Any]],
    requirement: ResourceRequirement,
    mode: str = "balanced",
    exclude_ids: Optional[set] = None,
    timeline_days: int = 0,
    client_budget: float = 0.0,
    total_roles: int = 1,
) -> List[Dict[str, Any]]:
    """
    Returns developers to fulfill the required daily capacity for a role.
    
    Business-aware allocation:
    - Primarily matches resources whose skills align with the project tech stack.
    - By default, selects 1 developer per role (count=1) to avoid unnecessary duplication.
    - Scales up headcount ONLY when the timeline is very tight relative to 
      scope AND the budget can support multiple developers for the same role.
    """
    candidates = filter_candidates(employees, requirement)
    if not candidates:
        candidates = [c for c in employees if c.get("available_hours", 0) > 0]

    if exclude_ids:
        remaining = [c for c in candidates if c["employee_id"] not in exclude_ids]
        if len(remaining) > 0:
            candidates = remaining

    ranked = rank_candidates(candidates, mode=mode)
    
    # Business-aware count adjustment:
    # If timeline is tight (< 30 days for a full project) AND budget allows,
    # keep the AI-suggested count. Otherwise, cap at 1 per role to avoid
    # allocating unnecessary multiples.
    effective_count = requirement.count
    if effective_count > 1 and timeline_days > 0 and client_budget > 0:
        # Estimate rough cost per dev for this timeline
        weeks = max(1, timeline_days / 7)
        avg_hourly = sum(c.get("hourly_cost", 10) for c in ranked[:3]) / max(len(ranked[:3]), 1)
        cost_per_dev = weeks * WORKING_DAYS_PER_WEEK * 8 * avg_hourly
        max_affordable_devs = int(client_budget / (cost_per_dev * total_roles)) if cost_per_dev > 0 else 1
        
        # Only allow multiple devs per role if timeline is tight (< 6 weeks)
        # and budget can actually afford the extra headcount
        if timeline_days >= 42:  # 6+ weeks — not tight, reduce to 1
            effective_count = 1
        else:
            effective_count = min(effective_count, max(1, max_affordable_devs))
    
    required_daily_capacity = effective_count * 8'''

new_select = '''def select_resources(
    employees: List[Dict[str, Any]],
    requirement: ResourceRequirement,
    mode: str = "balanced",
    exclude_ids: Optional[set] = None,
    timeline_days: int = 0,
    remaining_budget: float = 0.0,
    total_roles: int = 1,
) -> List[Dict[str, Any]]:
    """
    Returns developers to fulfill the required daily capacity for a role.
    
    Business-aware allocation:
    - Primarily matches resources whose skills align with the project tech stack.
    - By default, selects 1 developer per role (count=1) to avoid unnecessary duplication.
    - Scales up headcount ONLY when the timeline is very tight relative to 
      scope AND the budget can support multiple developers for the same role.
    """
    candidates = filter_candidates(employees, requirement)
    if not candidates:
        candidates = [c for c in employees if c.get("available_hours", 0) > 0]

    if exclude_ids:
        remaining = [c for c in candidates if c["employee_id"] not in exclude_ids]
        if len(remaining) > 0:
            candidates = remaining

    ranked = rank_candidates(candidates, mode=mode)
    
    # Business-aware count adjustment:
    effective_count = requirement.count
    print(f"[Resource Selection] Evaluating '{requirement.role}' with {len(candidates)} available candidates.")
    print(f"[Resource Selection] Initial AI-suggested headcount: {effective_count}, Timeline: {timeline_days} days, Remaining Budget: ${remaining_budget}")
    
    if remaining_budget <= 0:
        effective_count = 1
        print("[Resource Selection] No remaining budget. Capping headcount at 1.")
    elif effective_count > 1 and timeline_days > 0:
        weeks = max(1, timeline_days / 7)
        avg_hourly = sum(c.get("hourly_cost", 10) for c in ranked[:3]) / max(len(ranked[:3]), 1)
        cost_per_dev = weeks * WORKING_DAYS_PER_WEEK * 8 * avg_hourly
        max_affordable_devs = int(remaining_budget / (cost_per_dev * total_roles)) if cost_per_dev > 0 else 1
        
        if timeline_days >= 42:
            effective_count = 1
            print("[Resource Selection] Timeline is comfortable. Capping headcount at 1.")
        else:
            effective_count = min(effective_count, max(1, max_affordable_devs))
            print(f"[Resource Selection] Timeline is tight. Adjusted headcount to {effective_count} based on budget.")
    
    required_daily_capacity = effective_count * 8
    print(f"[Resource Selection] Final Headcount: {effective_count}. Required daily capacity: {required_daily_capacity} hours.")'''
content = content.replace(old_select, new_select)

content = content.replace(
'''        # Create a copy so we can assign specific allocated hours for this project
        emp_copy = dict(emp)
        emp_copy["allocated_daily_hours"] = hours_to_take
        selected.append(emp_copy)
        
        current_capacity += hours_to_take

    return selected''',
'''        # Create a copy so we can assign specific allocated hours for this project
        emp_copy = dict(emp)
        emp_copy["allocated_daily_hours"] = hours_to_take
        selected.append(emp_copy)
        
        current_capacity += hours_to_take
        print(f"[Resource Selection] Allocated {hours_to_take} hours/day to {emp_copy['name']}. Total fulfilled: {current_capacity}/{required_daily_capacity}")

    print(f"[Resource Selection] Finished selecting for '{requirement.role}'.\\n")
    return selected'''
)

# 5. allocate_resources loop
old_allocate_loop = '''    for resource in resource_reqs_raw:
        requirement = ResourceRequirement(
            role=resource.get("role", "FullStack Engineer"),
            count=int(resource.get("count", 1)),
            minimum_experience=int(resource.get("minimum_experience", 1)),
            skills=resource.get("skills", []),
        )

        selected = select_resources(
            employees, requirement, mode=mode, exclude_ids=already_picked_in_this_call,
            timeline_days=timeline_days, client_budget=client_budget, total_roles=total_roles
        )
        already_picked_in_this_call.update(emp["employee_id"] for emp in selected)

        for emp in selected:
            # Determine daily hours based on what was dynamically allocated
            hours_per_day = emp.get("allocated_daily_hours", emp.get("available_hours", 8))
            
            # Total working hours for the project timeline
            allocated_hours = int(
                (timeline_days / 7)
                * WORKING_DAYS_PER_WEEK
                * hours_per_day
            )

            estimated_cost = float(allocated_hours * emp["hourly_cost"])
            total_developer_cost += estimated_cost

            estimate.selected_resources.append(
                SelectedResource(
                    employee_id=emp["employee_id"],
                    name=emp["name"],
                    role=emp["role"],
                    hourly_cost=emp["hourly_cost"],
                    daily_capacity_hours=emp["daily_capacity_hours"],
                    allocated_hours=allocated_hours,
                    available_hours=emp["available_hours"],
                    bench_status=emp["bench_status"],
                    global_bench=emp["global_bench"],
                    estimated_cost=estimated_cost,
                    experience_years=emp["experience"],
                    skills=emp["skills"],
                )
            )

    estimate.developer_cost = round(total_developer_cost, 2)
    # Total cost == developer cost. No company static overhead added.
    estimate.total_project_cost = estimate.developer_cost'''

new_allocate_loop = '''    for resource in resource_reqs_raw:
        requirement = ResourceRequirement(
            role=resource.get("role", "FullStack Engineer"),
            count=int(resource.get("count", 1)),
            minimum_experience=int(resource.get("minimum_experience", 1)),
            skills=resource.get("skills", []),
        )
        
        remaining_budget = max(0.0, client_budget - total_developer_cost)

        selected = select_resources(
            employees, requirement, mode=mode, exclude_ids=already_picked_in_this_call,
            timeline_days=timeline_days, remaining_budget=remaining_budget, total_roles=total_roles
        )
        
        if not selected:
            estimate.unfulfilled_roles.append(resource)
            print(f"[Cost Calculation] WARNING: No candidates found for {requirement.role}!")
            continue
            
        already_picked_in_this_call.update(emp["employee_id"] for emp in selected)

        for emp in selected:
            hours_per_day = emp.get("allocated_daily_hours", emp.get("daily_capacity_hours", 8))
            print(f"[Cost Calculation] Resource: {emp['name']} ({emp['role']}) - {hours_per_day} hrs/day * ${emp['hourly_cost']}/hr")
            
            computed_hours = int((timeline_days / 7) * WORKING_DAYS_PER_WEEK * hours_per_day)
            allocated_hours = min(computed_hours, emp.get("available_hours", computed_hours))
            
            is_shared = False
            if exclude_ids and emp["employee_id"] in exclude_ids:
                is_shared = True

            estimated_cost = float(allocated_hours * emp["hourly_cost"])
            total_developer_cost += estimated_cost
            print(f"[Cost Calculation] -> {allocated_hours} total hours * ${emp['hourly_cost']}/hr = ${estimated_cost}")

            estimate.selected_resources.append(
                SelectedResource(
                    employee_id=emp["employee_id"],
                    name=emp["name"],
                    role=emp["role"],
                    hourly_cost=emp["hourly_cost"],
                    daily_capacity_hours=emp["daily_capacity_hours"],
                    allocated_hours=allocated_hours,
                    available_hours=emp["available_hours"],
                    bench_status=emp["bench_status"],
                    global_bench=emp["global_bench"],
                    estimated_cost=estimated_cost,
                    experience_years=emp["experience"],
                    skills=emp["skills"],
                    match_tier=emp.get("match_tier", 1),
                    shared_with_mvp=is_shared
                )
            )

    estimate.developer_cost = round(total_developer_cost, 2)
    print(f"[Cost Calculation] Final Total Estimated Cost: ${estimate.developer_cost}\\n")
    estimate.total_project_cost = estimate.developer_cost
    
    if client_budget > 0 and estimate.total_project_cost > client_budget:
        overage = estimate.total_project_cost - client_budget
        warning_msg = f"Project estimate exceeds the client budget of ${client_budget} by ${overage:.2f}."
        estimate.budget_overrun_warning = warning_msg
        print(f"[Cost Calculation] WARNING: {warning_msg}")'''
content = content.replace(old_allocate_loop, new_allocate_loop)

# 6. JSON output
old_json = '''                "estimated_cost": round(dev.estimated_cost, 2),
                "experience_years": dev.experience_years,
                "skills": dev.skills,
            }
        )
        
    def format_timeline(days):
        try:
            days = int(days)
        except:
            return str(days)
        if days < 7:
            return f"{days} Day{'s' if days > 1 else ''}"
        elif days % 30 == 0:
            months = days // 30
            return f"{months} Month{'s' if months > 1 else ''}"
        elif days % 7 == 0:
            weeks = days // 7
            return f"{weeks} Week{'s' if weeks > 1 else ''}"
        else:
            if days >= 30:
                return f"{days // 30} Month{'s' if days // 30 > 1 else ''} {days % 30} Days"
            elif days >= 7:
                return f"{days // 7} Week{'s' if days // 7 > 1 else ''} {days % 7} Days"
            return f"{days} Days"

    return {
        "timeline_days": timeline_days,
        "timeline_formatted": format_timeline(timeline_days),
        "timeline_weeks": timeline_days // 7, # Keep for backwards compatibility
        "resource_requirements": resource_requirements,
        "selected_resources": resources,
        "developer_cost": estimate.developer_cost,
        "total_project_cost": estimate.total_project_cost,
        "estimated_cost": estimate.total_project_cost,
    }'''

new_json = '''                "estimated_cost": round(dev.estimated_cost, 2),
                "experience_years": dev.experience_years,
                "skills": dev.skills,
                "match_tier": dev.match_tier,
                "shared_with_mvp": dev.shared_with_mvp
            }
        )
        
    def format_timeline(days):
        try:
            days = int(days)
        except:
            return str(days)
        if days < 7:
            return f"{days} Day{'s' if days > 1 else ''}"
        elif days % 30 == 0:
            months = days // 30
            return f"{months} Month{'s' if months > 1 else ''}"
        elif days % 7 == 0:
            weeks = days // 7
            return f"{weeks} Week{'s' if weeks > 1 else ''}"
        else:
            if days >= 30:
                return f"{days // 30} Month{'s' if days // 30 > 1 else ''} {days % 30} Days"
            elif days >= 7:
                return f"{days // 7} Week{'s' if days // 7 > 1 else ''} {days % 7} Days"
            return f"{days} Days"

    result = {
        "timeline_days": timeline_days,
        "timeline_formatted": format_timeline(timeline_days),
        "timeline_weeks": timeline_days // 7, # Keep for backwards compatibility
        "resource_requirements": resource_requirements,
        "unfulfilled_roles": estimate.unfulfilled_roles,
        "selected_resources": resources,
        "developer_cost": estimate.developer_cost,
        "total_project_cost": estimate.total_project_cost,
        "estimated_cost": estimate.total_project_cost,
    }
    if estimate.budget_overrun_warning:
        result["budget_overrun_warning"] = estimate.budget_overrun_warning
    return result'''
content = content.replace(old_json, new_json)

# Final debug prints in match_resources
content = content.replace(
'''def match_resources(
    proposal: Dict[str, Any],
    employees: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """''',
'''def match_resources(
    proposal: Dict[str, Any],
    employees: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    print("\\n" + "="*50)
    print("🚀 STARTING RESOURCE MATCH & COST ESTIMATION")
    print("="*50 + "\\n")
    """'''
)

content = content.replace(
'''    for option_json in (mvp_json, full_json):
        if client_budget is not None:
            option_json["is_within_budget"] = client_budget >= option_json["total_project_cost"]
            option_json["budget_variance_usd"] = round(client_budget - option_json["total_project_cost"], 2)
        else:
            option_json["is_within_budget"] = True
            option_json["budget_variance_usd"] = 0.0

    return {''',
'''    for option_json in (mvp_json, full_json):
        if client_budget is not None:
            option_json["is_within_budget"] = client_budget >= option_json["total_project_cost"]
            option_json["budget_variance_usd"] = round(client_budget - option_json["total_project_cost"], 2)
        else:
            option_json["is_within_budget"] = True
            option_json["budget_variance_usd"] = 0.0

    print(f"✅ FINAL MVP COST: ${mvp_json['total_project_cost']}")
    print(f"✅ FINAL FULL PROJECT COST: ${full_json['total_project_cost']}")
    print("\\n" + "="*50)
    print("🏁 FINISHED RESOURCE MATCH & COST ESTIMATION")
    print("="*50 + "\\n")

    return {'''
)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done applying all changes!')
