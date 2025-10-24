from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.core.mail import send_mail
from django.conf import settings
from .models import OTPVerification



User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    confirmPassword = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ("username", "email", "password", "confirmPassword")

    def validate(self, attrs):
        if attrs["password"] != attrs["confirmPassword"]:
            raise serializers.ValidationError({"confirmPassword": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("confirmPassword")
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data["password"]
        )

        # Generate and send OTP
        otp_obj = OTPVerification.create_otp_for_user(user)
        self._send_otp_email(user.email, otp_obj.otp)

        return user

    def _send_otp_email(self, email, otp):
        subject = 'Verify Your Legacy Prime Account'
        message = f'''Welcome to Legacy Prime!
        
Your verification code is: {otp}
        
This code will expire in 10 minutes.
Do not share this code with anyone.
'''
        try:
            send_mail(
                subject,
                message,
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"Failed to send OTP email: {str(e)}")


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "username", "email", "is_verified", "balance")



# change password serializer
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_new_password(self, value):
        validate_password(value)  # ensures password is strong
        return value

# For password reset
class ResetPasswordRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

class SetNewPasswordSerializer(serializers.Serializer):
    uidb64 = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField()

    def validate(self, attrs):
        try:
            uid = force_str(urlsafe_base64_decode(attrs["uidb64"]))
            user = User.objects.get(pk=uid)
        except Exception:
            raise serializers.ValidationError("Invalid UID")

        token = attrs["token"]
        if not PasswordResetTokenGenerator().check_token(user, token):
            raise serializers.ValidationError("Invalid or expired token")

        validate_password(attrs["new_password"])
        attrs["user"] = user
        return attrs