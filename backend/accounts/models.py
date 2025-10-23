from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import random
import string

class User(AbstractUser):
    email = models.EmailField(unique=True)
    is_verified = models.BooleanField(default=False)
    phone_number = models.CharField(max_length=15, blank=True)

    groups = models.ManyToManyField(
        "auth.Group",
        related_name="custom_user_set",
        blank=True
    )
    user_permissions = models.ManyToManyField(
        "auth.Permission",
        related_name="custom_user_set",
        blank=True
    )

    def __str__(self):
        return self.username
        
class OTPVerification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    def __str__(self):
        return f"OTP for {self.user.email}"
    
    @classmethod
    def generate_otp(cls):
        """Generate a 6-digit OTP"""
        return ''.join(random.choices(string.digits, k=6))
    
    @classmethod
    def create_otp_for_user(cls, user):
        """Create a new OTP for the given user"""
        otp = cls.generate_otp()
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        
        # Invalidate any existing unused OTPs for this user
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        
        # Create new OTP
        return cls.objects.create(
            user=user,
            otp=otp,
            expires_at=expires_at
        )
    
    def is_valid(self):
        """Check if OTP is still valid"""
        return (
            not self.is_used and
            timezone.now() <= self.expires_at
        )
