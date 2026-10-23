
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.student import router as student_router
from app.api.admin import router as admin_router
from app.api.staff import router as staff_router

app = FastAPI(
    title="Smart QR Student Verification API",
    description=(
        "Backend API for student identity verification, "
        "QR credentials, verification logs, and anomaly detection."
    ),
    version="1.0.0",
)

# Allow requests from the local React development server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register authentication endpoints.
app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Authentication"],
)
app.include_router(
    student_router,
    prefix="/api/student",
    tags=["Student"],
)
app.include_router(
    admin_router,
    prefix="/api/admin",
    tags=["Administration"],
)
app.include_router(
    staff_router,
    prefix="/api/staff",
    tags=["Staff"],
)


@app.get("/")
def root():
    return {
        "message": "Smart QR Student Verification API is running",
        "status": "success",
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "not connected yet",
    }
