from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from investments.models import Investment
from transactions.models import TransactionHistory
from decimal import Decimal

class Command(BaseCommand):
    help = 'Process active investments and distribute profits'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting investment processing...')
        
        # Get all active investments
        active_investments = Investment.objects.filter(
            is_completed=False,
            ends_at__lte=timezone.now()
        ).select_related('user', 'plan')

        for investment in active_investments:
            try:
                with transaction.atomic():
                    # Calculate and distribute profit
                    profit = investment.calculate_profit()
                    
                    if profit > Decimal('0'):
                        wallet = investment.user.wallet
                        before_balance = wallet.balance
                        
                        # Add profit to wallet
                        if wallet.add_profit(profit):
                            # Log profit transaction
                            TransactionHistory.objects.create(
                                user=investment.user,
                                transaction_type='profit',
                                amount=profit,
                                balance_before=before_balance,
                                balance_after=wallet.balance,
                                status='successful',
                                description=f"Profit from {investment.plan.name} investment"
                            )
                            
                            self.stdout.write(
                                self.style.SUCCESS(
                                    f'Successfully processed investment {investment.id} - '
                                    f'Profit: ${profit}'
                                )
                            )
                    
                    # Mark investment as completed
                    investment.is_completed = True
                    investment.save()

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f'Failed to process investment {investment.id}: {str(e)}'
                    )
                )

        self.stdout.write('Investment processing completed.')