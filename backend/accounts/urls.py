from django.urls import path
from .views import (
    index,
    RegisterView,
    ProfileView,
    ChangePasswordView,
    ResetPasswordRequestView,
    ResetPasswordConfirmView,
    VerifyOTPView,
    ResendOTPView
)
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("", index, name="accounts_index"),
    path("register/", RegisterView.as_view(), name="register"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    path("reset-password/", ResetPasswordRequestView.as_view(), name="reset-password"),
    path("reset-password-confirm/", ResetPasswordConfirmView.as_view(), name="reset-password-confirm"),
    
    # JWT Token endpoints
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # OTP verification endpoints
    path('verify-otp/', VerifyOTPView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
]
