from .user_schema import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
)

from .email_otp_schema import (
    EmailOTPBase,
    EmailOTPCreate,
    EmailOTPUpdate,
    EmailOTPResponse,
)

from .proposal_request_schema import (
    ProposalRequestBase,
    ProposalRequestCreate,
    ProposalRequestUpdate,
    ProposalRequestResponse,
)

from .employee_schema import (
    EmployeeBase,
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
)

from .resource_allocation_schema import (
    ResourceAllocationBase,
    ResourceAllocationCreate,
    ResourceAllocationUpdate,
    ResourceAllocationResponse,
)

from .proposal_schema import (
    ProposalBase,
    ProposalCreate,
    ProposalUpdate,
    ProposalResponse,
)

from .final_proposal_schema import (
    FinalProposalBase,
    FinalProposalCreate,
    FinalProposalUpdate,
    FinalProposalResponse,
)

from .poc_document_schema import (
    POCDocumentBase,
    POCDocumentCreate,
    POCDocumentUpdate,
    POCDocumentResponse,
)

from .ai_conversation_schema import (
    AIConversationBase,
    AIConversationCreate,
    AIConversationUpdate,
    AIConversationResponse,
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",

    # Email OTP
    "EmailOTPBase",
    "EmailOTPCreate",
    "EmailOTPUpdate",
    "EmailOTPResponse",

    # Proposal Request
    "ProposalRequestBase",
    "ProposalRequestCreate",
    "ProposalRequestUpdate",
    "ProposalRequestResponse",

    # Employee
    "EmployeeBase",
    "EmployeeCreate",
    "EmployeeUpdate",
    "EmployeeResponse",

    # Resource Allocation
    "ResourceAllocationBase",
    "ResourceAllocationCreate",
    "ResourceAllocationUpdate",
    "ResourceAllocationResponse",

    # Proposal
    "ProposalBase",
    "ProposalCreate",
    "ProposalUpdate",
    "ProposalResponse",

    # Final Proposal
    "FinalProposalBase",
    "FinalProposalCreate",
    "FinalProposalUpdate",
    "FinalProposalResponse",

    # POC Document
    "POCDocumentBase",
    "POCDocumentCreate",
    "POCDocumentUpdate",
    "POCDocumentResponse",

    # AI Conversation
    "AIConversationBase",
    "AIConversationCreate",
    "AIConversationUpdate",
    "AIConversationResponse",
]