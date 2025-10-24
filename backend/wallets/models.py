from django.db import models, transaction
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()

class Wallet(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='wallet')
    balance = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    total_invested = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    total_withdrawn = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    total_profit = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Wallet'
        verbose_name_plural = 'Wallets'

    def __str__(self):
        return f"{self.user.username}'s Wallet"

    @transaction.atomic
    def deposit(self, amount: Decimal) -> bool:
        """
        Safely add funds to wallet
        Returns True if successful, False if failed
        """
        try:
            self.balance += Decimal(str(amount))
            self.save()
            return True
        except Exception:
            return False

    @transaction.atomic
    def withdraw(self, amount: Decimal) -> bool:
        """
        Safely withdraw funds if balance sufficient
        Returns True if successful, False if insufficient funds
        """
        if self.balance >= amount:
            try:
                self.balance -= Decimal(str(amount))
                self.total_withdrawn += Decimal(str(amount))
                self.save()
                return True
            except Exception:
                return False
        return False

    @transaction.atomic
    def add_profit(self, amount: Decimal) -> bool:
        """
        Add investment profit to wallet
        Returns True if successful, False if failed
        """
        try:
            self.balance += Decimal(str(amount))
            self.total_profit += Decimal(str(amount))
            self.save()
            return True
        except Exception:
            return False

    def get_available_balance(self) -> Decimal:
        """Returns available balance (excluding locked investments)"""
        from investments.models import Investment
        locked_funds = Investment.objects.filter(
            user=self.user,
            is_completed=False
        ).aggregate(
            total=models.Sum('amount')
        )['total'] or Decimal('0')
        return self.balance - locked_funds

# Wallet creation is handled in `wallets/signals.py` to keep signal handlers
# centralized. Avoid registering another post_save receiver here to prevent
# duplicate executions that could attempt to create the same OneToOne wallet
# more than once.

