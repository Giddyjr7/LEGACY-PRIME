from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
from django.core.validators import MinValueValidator
from decimal import Decimal

User = settings.AUTH_USER_MODEL


# -----------------------------
# INVESTMENT PLAN MODEL
# -----------------------------
class InvestmentPlan(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    min_amount = models.DecimalField(max_digits=12, decimal_places=2)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2)
    daily_roi = models.DecimalField(max_digits=5, decimal_places=2, help_text="Daily ROI in percentage")
    duration_days = models.PositiveIntegerField()
    total_return = models.DecimalField(max_digits=5, decimal_places=2, help_text="Total ROI + Capital")
    compound_interest = models.BooleanField(default=False)

    def __str__(self):
        return self.name


# -----------------------------
# USER INVESTMENT MODEL
# -----------------------------
class UserInvestment(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('completed', 'Completed'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="investments")
    plan = models.ForeignKey(InvestmentPlan, on_delete=models.CASCADE, related_name="user_investments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    expected_profit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_payout = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)

    def __str__(self):
        return f"{self.user.username} - {self.plan.name}"

    def calculate_expected_profit(self):
        daily_profit = (self.amount * self.plan.daily_roi) / 100
        total_profit = daily_profit * self.plan.duration_days
        self.expected_profit = total_profit
        self.total_payout = self.amount + total_profit
        return self.expected_profit


# -----------------------------
# INVESTMENT MODEL
# -----------------------------
class Investment(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    plan = models.ForeignKey(InvestmentPlan, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    compound_interest = models.BooleanField(default=False)
    profit = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_return = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    ends_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.ends_at:
            self.ends_at = self.created_at + timedelta(days=self.plan.duration_days)
        super().save(*args, **kwargs)

    def calculate_profit(self):
        """Calculate investment profit based on daily ROI and compound interest settings"""
        if self.is_completed:
            return self.profit

        daily_rate = Decimal(str(self.plan.daily_roi)) / Decimal('100')
        days_elapsed = min(
            (timezone.now() - self.created_at).days,
            self.plan.duration_days
        )

        if self.compound_interest:
            final_amount = Decimal(str(self.amount))
            for _ in range(days_elapsed):
                final_amount += final_amount * daily_rate
            profit = final_amount - Decimal(str(self.amount))
        else:
            profit = Decimal(str(self.amount)) * daily_rate * Decimal(str(days_elapsed))

        self.profit = profit
        self.total_return = Decimal(str(self.amount)) + profit
        
        # Mark as completed if duration has passed
        if timezone.now() >= self.ends_at:
            self.is_completed = True
            self.save()
            
            # Update user's wallet balance with profit
            from wallets.models import Wallet
            wallet = Wallet.objects.get(user=self.user)
            wallet.balance += self.profit
            wallet.save()

            # Log profit transaction
            from transactions.models import TransactionHistory
            TransactionHistory.objects.create(
                user=self.user,
                transaction_type='profit',
                amount=self.profit,
                balance_before=wallet.balance - self.profit,
                balance_after=wallet.balance,
                status='successful',
                description=f"Investment profit from {self.plan.name} plan"
            )

        return self.profit


# -----------------------------
# DEPOSIT MODEL
# -----------------------------
class Deposit(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="deposits")
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(10)])
    proof = models.ImageField(upload_to='deposits/')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def approve(self):
        if self.status != 'approved':
            self.status = 'approved'
            self.save(update_fields=["status", "updated_at"])
            # ✅ Update main wallet automatically (from wallets app)
            from wallets.models import Wallet
            wallet, _ = Wallet.objects.get_or_create(user=self.user)
            wallet.credit(self.amount)

    def reject(self):
        self.status = 'rejected'
        self.save(update_fields=["status", "updated_at"])

    def __str__(self):
        return f"Deposit {self.id} - {self.user.username} - ₦{self.amount} ({self.status})"


# -----------------------------
# WITHDRAWAL MODEL
# -----------------------------
class Withdrawal(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="withdrawals")
    amount = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(10)])
    wallet_address = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def approve(self):
        """Approve withdrawal only if user has enough balance."""
        from wallets.models import Wallet
        wallet, _ = Wallet.objects.get_or_create(user=self.user)
        if wallet.debit(self.amount):
            self.status = 'approved'
        else:
            self.status = 'rejected'
        self.save(update_fields=["status", "updated_at"])

    def reject(self):
        self.status = 'rejected'
        self.save(update_fields=["status", "updated_at"])

    def __str__(self):
        return f"Withdrawal {self.id} - {self.user.username} ({self.status})"
