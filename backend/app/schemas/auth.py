from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class OTPRequestBody(BaseModel):
    email: EmailStr


class OTPVerifyBody(BaseModel):
    email: EmailStr
    otp: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str


class KvisVerifyBody(BaseModel):
    kvis_email: EmailStr
    otp: str
