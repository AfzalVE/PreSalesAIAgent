"""
Resource Service Package
------------------------
Exports the Resource Matching & Cost Estimation engine functions.
"""

from .matching import (
    match_resources,
    match_resources_from_db_request,
    get_employees_from_db,
    ResourceRequirement,
    SelectedResource,
    ProjectEstimate,
    FIXED_COMPANY_STATIC_COST,
)

__all__ = [
    "match_resources",
    "match_resources_from_db_request",
    "get_employees_from_db",
    "ResourceRequirement",
    "SelectedResource",
    "ProjectEstimate",
    "FIXED_COMPANY_STATIC_COST",
]
