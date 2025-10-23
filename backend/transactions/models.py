from django.db import models, transaction
from django.conf import settings
from django.utils import timezone
import uuid

User = settings.AUTH_USER_MODEL


class TransactionHistory(models.Model):
    """
    Logs all wallet activities such as deposits, withdrawals, profits, and manual adjustments.
    Keeps a full record of how each user's wallet balance changes over time.
    """

    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('profit', 'Profit'),
        ('manual_credit', 'Manual Credit'),
        ('manual_debit', 'Manual Debit'),
        ('transfer', 'Transfer'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('successful', 'Successful'),
        ('failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="transactions")
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    fee = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='successful')
    balance_before = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    balance_after = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    reference = models.CharField(max_length=50, unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Transaction History"
        verbose_name_plural = "Transaction Histories"

    def save(self, *args, **kwargs):
        """Automatically create a transaction reference if missing."""
        if not self.reference:
            self.reference = f"TXN-{uuid.uuid4().hex[:10].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.user.username} - {self.transaction_type} - ₦{self.amount}"


# --- SIGNALS SECTION ---
from django.db.models.signals import post_save
from django.dispatch import receiver
from investments.models import Deposit, Withdrawal
from wallets.models import Wallet



@receiver(post_save, sender=Deposit)
def log_deposit_transaction(sender, instance, created, **kwargs):
    """
    Automatically log a transaction when a deposit is approved.
    Uses atomic transaction to ensure data consistency.
    """
    if instance.status == 'approved':
        try:
            with transaction.atomic():
                wallet = Wallet.objects.select_for_update().get(user=instance.user)
                before_balance = wallet.balance
                
                # Try to deposit funds
                if not wallet.deposit(instance.amount):
                    raise Exception("Failed to process deposit")

                # Log the successful transaction
                TransactionHistory.objects.create(
                    user=instance.user,
                    transaction_type='deposit',
                    amount=instance.amount,
                    balance_before=before_balance,
                    balance_after=wallet.balance,
                    status='successful',
                    description=f"Deposit approved: {instance.reference}",
                )
        except Exception as e:
            # Log failed transaction
            TransactionHistory.objects.create(
                user=instance.user,
                transaction_type='deposit',
                amount=instance.amount,
                status='failed',
                description=f"Deposit failed: {str(e)}",
            )
            # Revert deposit status
            instance.status = 'failed'
            instance.save(update_fields=['status'])


@receiver(post_save, sender=Withdrawal)
def log_withdrawal_transaction(sender, instance, created, **kwargs):
    """
    Automatically log a transaction when a withdrawal is approved.
    Includes security checks and atomic operations.
    """
    if instance.status == 'approved':
        try:
            with transaction.atomic():
                wallet = Wallet.objects.select_for_update().get(user=instance.user)
                before_balance = wallet.balance
                
                # Security checks
                if wallet.get_available_balance() < instance.amount:
                    raise Exception("Insufficient available balance")
                
                # Try to withdraw funds
                if not wallet.withdraw(instance.amount):
                    raise Exception("Failed to process withdrawal")

                # Log the successful transaction
                TransactionHistory.objects.create(
                    user=instance.user,
                    transaction_type='withdrawal',
                    amount=instance.amount,
                    balance_before=before_balance,
                    balance_after=wallet.balance,
                    status='successful',
                    description=f"Withdrawal processed: {instance.reference}",
                )
        except Exception as e:
            # Log failed transaction
            TransactionHistory.objects.create(
                user=instance.user,
                transaction_type='withdrawal',
                amount=instance.amount,
                status='failed',
                description=f"Withdrawal failed: {str(e)}",
            )
            # Revert withdrawal status
            instance.status = 'failed'
            instance.save(update_fields=['status'])
