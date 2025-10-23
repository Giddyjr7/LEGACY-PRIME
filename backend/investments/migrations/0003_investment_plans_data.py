from django.db import migrations

def create_investment_plans(apps, schema_editor):
    InvestmentPlan = apps.get_model('investments', 'InvestmentPlan')
    
    # Clear existing plans to avoid duplicates
    InvestmentPlan.objects.all().delete()
    
    plans = [
        {
            'name': 'Basic',
            'description': 'Perfect for beginners starting their investment journey.',
            'min_amount': 40.00,
            'max_amount': 51.00,
            'daily_roi': 3.00,
            'duration_days': 5,
            'total_return': 15.00,
            'compound_interest': True
        },
        {
            'name': 'Venom Bot',
            'description': 'Designed for investors seeking steady growth with automation.',
            'min_amount': 100.00,
            'max_amount': 399.00,
            'daily_roi': 3.40,
            'duration_days': 5,
            'total_return': 17.00,
            'compound_interest': True
        },
        {
            'name': 'Pro Bot',
            'description': 'Advanced plan for investors aiming for higher returns.',
            'min_amount': 500.00,
            'max_amount': 799.00,
            'daily_roi': 3.80,
            'duration_days': 5,
            'total_return': 19.00,
            'compound_interest': True
        },
        {
            'name': 'Titan Bot',
            'description': 'Comprehensive solution for serious, large-scale investors.',
            'min_amount': 1000.00,
            'max_amount': 9999999.00,
            'daily_roi': 4.20,
            'duration_days': 5,
            'total_return': 21.00,
            'compound_interest': True
        }
    ]
    
    for plan in plans:
        InvestmentPlan.objects.create(**plan)

def remove_investment_plans(apps, schema_editor):
    InvestmentPlan = apps.get_model('investments', 'InvestmentPlan')
    InvestmentPlan.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('investments', '0002_deposit_investment_withdrawal'),
    ]

    operations = [
        migrations.RunPython(create_investment_plans, remove_investment_plans)
    ]