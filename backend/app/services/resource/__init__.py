"""
Resource Service Package
------------------------
Exports the Resource Matching & Cost Estimation engine functions.
"""

from .cost_estimation import (
    match_resources,
    match_resources_from_db_request,
    match_resources_with_budget_cap,
    match_resources_with_extended_timeline,
    get_employees_from_db,
    ResourceRequirement,
    SelectedResource,
    ProjectEstimate,
)

__all__ = [
    "match_resources",
    "match_resources_from_db_request",
    "match_resources_with_budget_cap",
    "match_resources_with_extended_timeline",
    "get_employees_from_db",
    "ResourceRequirement",
    "SelectedResource",
    "ProjectEstimate",
]