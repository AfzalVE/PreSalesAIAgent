from enum import Enum


class UserRole(str, Enum):
    CLIENT = "CLIENT"
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"


class UserStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class OTPPurpose(str, Enum):
    REGISTRATION = "REGISTRATION"
    LOGIN = "LOGIN"
    PASSWORD_RESET = "PASSWORD_RESET"
    EMAIL_CHANGE = "EMAIL_CHANGE"