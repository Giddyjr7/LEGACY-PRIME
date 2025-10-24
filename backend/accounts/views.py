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
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        # Use OTP flow for password reset in development
        serializer = ResetPasswordRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"]

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Do not reveal whether the email exists
            return Response({"message": "If that email exists, an OTP will be sent."})

        # Create OTP for password reset and send to user's email
        otp_obj = OTPVerification.create_otp_for_user(user)
        subject = 'Password Reset - Legacy Prime'
        message = f'''Here's your password reset code:

{otp_obj.otp}

This code will expire in 10 minutes. Do not share this code with anyone.'''
        try:
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send reset OTP email: {e}")
            return Response({"message": "Failed to send reset code."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"message": "Password reset code sent to email."})


class ResetPasswordConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        # Support OTP-based reset: expect { email, otp, new_password }
        email = request.data.get('email')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password') or request.data.get('password')

        if email and otp and new_password:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return Response({"detail": "User not found."}, status=status.HTTP_404_NOT_FOUND)

            try:
                otp_obj = OTPVerification.objects.filter(
                    user=user,
                    is_used=False,
                    otp=otp
                ).latest('created_at')
            except OTPVerification.DoesNotExist:
                return Response({"detail": "Invalid OTP."}, status=status.HTTP_400_BAD_REQUEST)

            if not otp_obj.is_valid():
                return Response({"detail": "OTP expired."}, status=status.HTTP_400_BAD_REQUEST)

            # All good — set new password and mark OTP used
            user.set_password(new_password)
            user.save()
            otp_obj.is_used = True
            otp_obj.save()

            return Response({"detail": "Password has been reset successfully."})

        # Fallback to existing token-based flow (uidb64 + token)
        serializer = SetNewPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]
        new_password = serializer.validated_data["new_password"]
        user.set_password(new_password)
        user.save()

        return Response({"detail": "Password has been reset successfully."})


class VerifyResetOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        if not email or not otp:
            return Response({'detail': 'Email and OTP required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            otp_obj = OTPVerification.objects.filter(user=user, is_used=False, otp=otp).latest('created_at')
        except OTPVerification.DoesNotExist:
            return Response({'detail': 'Invalid OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        if not otp_obj.is_valid():
            return Response({'detail': 'OTP expired.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'detail': 'OTP is valid.'})


from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        if email and password:
            # Check if user exists first
            try:
                user = User.objects.get(email=email)
                print(f"Found user {user.username} with email {email}")
            except User.DoesNotExist:
                print(f"No user found with email {email}")
                raise InvalidToken("No active account found with the given credentials")

            # Now try to authenticate
            user = authenticate(
                request=self.context.get("request"),
                username=user.username,  # Django's auth expects username
                password=password
            )

            if not user:
                print(f"Authentication failed for email {email}")
                raise InvalidToken("No active account found with the given credentials")

            if not user.is_active:
                print(f"User {user.username} is not active")
                raise InvalidToken("User account is disabled")

            print(f"Successful authentication for {user.username}")
            refresh = self.get_token(user)

            return {
                "access": str(refresh.access_token),
                "refresh": str(refresh)
            }
        else:
            raise InvalidToken("Must include email and password fields")

class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom token view that handles login with email."""
    serializer_class = EmailTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        print("Login attempt data:", request.data)
        
        # Rename username field to email if it exists
        if "username" in request.data:
            request.data["email"] = request.data.pop("username")
        
        try:
            response = super().post(request, *args, **kwargs)
            print("Login successful")
            return response
        except InvalidToken as e:
            print("Login error:", str(e))
            return Response(
                {"detail": str(e)},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except Exception as e:
            print("Unexpected login error:", str(e))
            return Response(
                {"detail": "An error occurred during login. Please try again."},
                status=status.HTTP_400_BAD_REQUEST
            )


class LogoutView(APIView):
    """Invalidate/blacklist the provided refresh token so it can't be reused.

    Expects JSON: { "refresh": "<refresh_token>" }
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh = request.data.get('refresh')
        if not refresh:
            return Response({'detail': 'Refresh token required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh)
            # blacklist the token (requires token_blacklist app)
            token.blacklist()
            return Response({'detail': 'Logout successful.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'detail': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)