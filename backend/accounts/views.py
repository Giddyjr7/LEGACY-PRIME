from django.http import JsonResponse
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import (
    RegisterSerializer, 
    UserSerializer, 
    ChangePasswordSerializer, 
    ResetPasswordRequestSerializer, 
    SetNewPasswordSerializer
)
from .models import OTPVerification
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from django.contrib.auth.tokens import PasswordResetTokenGenerator 
# from .serializers import ResetPasswordRequestSerializer, SetNewPasswordSerializer
# from django.core.mail import send_mail

# test endpoint
def index(request):
    return JsonResponse({"message": "Accounts API is working!"})

User = get_user_model()

# Registration endpoint
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        headers = self.get_success_headers(serializer.data)
        
        return Response({
            "message": "Registration successful. Please check your email for verification code.",
            "user": UserSerializer(user).data
        }, status=status.HTTP_201_CREATED, headers=headers)

class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        try:
            user = User.objects.get(email=email)
            if user.is_verified:
                return Response({
                    'message': 'Account is already verified.'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            otp_obj = OTPVerification.objects.filter(
                user=user,
                is_used=False,
                otp=otp
            ).latest('created_at')
            
            if not otp_obj.is_valid():
                return Response({
                    'message': 'OTP has expired. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Mark OTP as used and verify user
            otp_obj.is_used = True
            otp_obj.save()
            user.is_verified = True
            user.save()
            
            # Generate JWT tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Account verified successfully.',
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
            
        except User.DoesNotExist:
            return Response({
                'message': 'User not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        except OTPVerification.DoesNotExist:
            return Response({
                'message': 'Invalid OTP.'
            }, status=status.HTTP_400_BAD_REQUEST)

class ResendOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            
            if user.is_verified:
                return Response({
                    'message': 'Account is already verified.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Generate new OTP
            otp_obj = OTPVerification.create_otp_for_user(user)
            
            # Send email
            subject = 'New Verification Code - Legacy Prime'
            message = f'''Here's your new verification code:

{otp_obj.otp}

This code will expire in 10 minutes.
Do not share this code with anyone.
'''
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            
            return Response({
                'message': 'New verification code sent successfully.'
            })
            
        except User.DoesNotExist:
            return Response({
                'message': 'User not found.'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({
                'message': 'Failed to send verification code.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Profile endpoint (view/update logged-in user)
class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


# Change password endpoint
# User = get_user_model()

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    model = User
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # check old password
            if not user.check_password(serializer.validated_data.get("old_password")):
                return Response({"old_password": "Wrong password."}, status=status.HTTP_400_BAD_REQUEST)

            # set new password
            user.set_password(serializer.validated_data.get("new_password"))
            user.save()

            return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

# Password reset request endpoint
class ResetPasswordRequestView(APIView):
    def post(self, request):
        serializer = ResetPasswordRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"detail": "If that email exists, a reset link will be sent."})

        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        token = PasswordResetTokenGenerator().make_token(user)

        # 🔥 For now, just return the link (in production, send via email)
        reset_link = f"http://localhost:8000/api/accounts/reset-password-confirm/?uidb64={uidb64}&token={token}"

        return Response({"reset_link": reset_link})


class ResetPasswordConfirmView(APIView):
    def post(self, request):
        serializer = SetNewPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        new_password = serializer.validated_data["new_password"]
        user.set_password(new_password)
        user.save()

        return Response({"detail": "Password has been reset successfully."})