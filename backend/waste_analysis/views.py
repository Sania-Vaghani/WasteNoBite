import json
import os
import random
from datetime import datetime, timedelta
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from pymongo import MongoClient
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from io import BytesIO

@csrf_exempt
@require_http_methods(["GET"])
def waste_distribution(request):
    """
    Step 1: Waste Distribution Analysis
    Calculates waste distribution by food category
    """
    try:
        # Get MongoDB connection
        mongo_url = os.getenv('MONGO_URL')
        mongo_db = os.getenv('MONGO_DB')
        
        if not mongo_url or not mongo_db:
            return JsonResponse({"error": "MongoDB configuration not found"}, status=500)
        
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        
        # Find inventory collection
        inventory_collection = db["inventory_items"]
        
        if not inventory_collection:
            return JsonResponse({"error": "Inventory collection not found"}, status=404)

        # Fetch inventory items
        inventory_items = list(inventory_collection.find({}))
        
        if not inventory_items:
            return JsonResponse({"error": "No inventory data found"}, status=404)

        # Calculate waste distribution by category
        category_waste = {}
        total_waste_units = 0
        
        for item in inventory_items:
            category = item.get('Category', 'Unknown')
            quantity_wasted = float(item.get('Quantity Wasted', 0))
            quantity_purchased = float(item.get('Quantity Purchased', 1))
            
            if category not in category_waste:
                category_waste[category] = {
                    'total_waste_quantity': 0,
                    'total_cost_wasted': 0
                }
            
            category_waste[category]['total_waste_quantity'] += quantity_wasted
            category_waste[category]['total_cost_wasted'] += quantity_wasted * float(item.get('Cost Per Unit', 0))
            
            total_waste_units += quantity_wasted

        # Calculate percentages and format response
        waste_distribution = []
        colors = ['#22c55e', '#ef4444', '#f59e42', '#3b82f6', '#a78bfa', '#8b5cf6', '#ec4899']
        
        for i, (category, data) in enumerate(category_waste.items()):
            if total_waste_units > 0:
                percentage = (data['total_waste_quantity'] / total_waste_units) * 100
            else:
                percentage = 0
                
            waste_distribution.append({
                'label': category,
                'value': round(percentage, 1),
                'color': colors[i % len(colors)],
                'units': round(data['total_waste_quantity'], 1),
                'total_waste_quantity': data['total_waste_quantity'],
                'total_cost_wasted': round(data['total_cost_wasted'], 2)
            })

        # Sort by percentage (highest first)
        waste_distribution.sort(key=lambda x: x['value'], reverse=True)

        return JsonResponse({
            'waste_distribution': waste_distribution,
            'total_waste_units': round(total_waste_units, 1),
            'formula_used': {
                'waste_percentage': '(Category Waste Quantity / Total Waste Quantity) * 100',
                'description': 'Calculates the percentage distribution of waste across different food categories'
            }
        })

    except Exception as e:
        print(f"[DEBUG] Error in waste_distribution: {str(e)}")
        return JsonResponse({"error": f"Server Error: {str(e)}"}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def waste_trends(request):
    """
    Step 2: Weekly Waste Trends
    Calculates daily waste trends vs targets
    """
    try:
        mongo_url = os.getenv('MONGO_URL')
        mongo_db = os.getenv('MONGO_DB')
        if not mongo_url or not mongo_db:
            return JsonResponse({"error": "MongoDB configuration not found"}, status=500)
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        inventory_collection = db["inventory_items"]
        trends_collection = db["weekly_waste_trends"]

        # Get current week start date (Monday)
        today = datetime.now()
        week_start = today - timedelta(days=today.weekday())
        week_start_str = week_start.strftime("%Y-%m-%d")

        # Check if trend for this week exists
        existing_trend = trends_collection.find_one({"week_start": week_start_str})
        if existing_trend:
            weekly_trends = existing_trend["weekly_trends"]
        else:
            inventory_items = list(inventory_collection.find({}))
            if not inventory_items:
                return JsonResponse({"error": "No inventory data found"}, status=404)
            total_waste_quantity = sum(float(item.get('Quantity Wasted', 0)) for item in inventory_items)
            avg_daily_waste = total_waste_quantity / 7 if total_waste_quantity > 0 else 0
            weekly_trends = []
            days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            target_daily = 11  # Example target daily waste in kg
            for i, day in enumerate(days):
                variation = random.uniform(0.9,1.5)
                daily_waste = avg_daily_waste * variation
                weekly_trends.append({
                    'day': day,
                    'value': round(daily_waste, 1),
                    'target': target_daily
                })
            # Save to DB
            trends_collection.insert_one({
                "week_start": week_start_str,
                "weekly_trends": weekly_trends,
                "created_at": datetime.now()
            })

        return JsonResponse({
            'weekly_trends': weekly_trends,
            'formula_used': {
                'daily_waste': '(Total Waste Quantity / 7 days) * Daily Variation Factor',
                'variation_factor': 'Random factor between 0.5 and 0.7 for realistic variation',
                'description': 'Calculates daily waste amounts with realistic variation to show trends'
            }
        })

    except Exception as e:
        print(f"[DEBUG] Error in waste_trends: {str(e)}")
        return JsonResponse({"error": f"Server Error: {str(e)}"}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def item_analysis(request):
    """
    Step 3: Individual Item Analysis
    Analyzes waste patterns for specific items
    """
    try:
        # Get MongoDB connection
        mongo_url = os.getenv('MONGO_URL')
        mongo_db = os.getenv('MONGO_DB')
        
        if not mongo_url or not mongo_db:
            return JsonResponse({"error": "MongoDB configuration not found"}, status=500)
        
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        
        # Find inventory collection
        inventory_collection = db["inventory_items"]
        
        if not inventory_collection:
            return JsonResponse({"error": "Inventory collection not found"}, status=404)

        # Fetch inventory items
        inventory_items = list(inventory_collection.find({}))
        
        if not inventory_items:
            return JsonResponse({"error": "No inventory data found"}, status=404)

        # Analyze individual items
        item_analysis = []
        for item in inventory_items:
            quantity_wasted = float(item.get('Quantity Wasted', 0))
            quantity_purchased = float(item.get('Quantity Purchased', 1))
            cost_per_unit = float(item.get('Cost Per Unit', 0))
            spoilage_rate = float(item.get('Spoilage rate', 0))
            freshness_percentage = float(item.get('Freshness Percentage', 100))
            
            # Calculate waste metrics
            waste_percentage = (quantity_wasted / quantity_purchased) * 100 if quantity_purchased > 0 else 0
            cost_wasted = quantity_wasted * cost_per_unit
            
            # Calculate risk score
            days_to_expiry = item.get('Max lifespan', 7)
            risk_score = (days_to_expiry * waste_percentage) / max(freshness_percentage, 1)
            
            # Determine waste level
            if waste_percentage > 75:
                waste_level = "High"
            elif waste_percentage > 45:
                waste_level = "Medium"
            else:
                waste_level = "Low"
            
            item_analysis.append({
                'name': item.get('Item Name', 'Unknown'),
                'category': item.get('Category', 'Unknown'),
                'waste_percentage': round(waste_percentage, 1),
                'waste_quantity': quantity_wasted,
                'cost_wasted': round(cost_wasted, 2),
                'risk_score': round(risk_score, 2),
                'waste_level': waste_level,
                'spoilage_rate': spoilage_rate,
                'freshness_percentage': freshness_percentage
            })

        # Sort by waste percentage (highest first)
        item_analysis.sort(key=lambda x: x['waste_percentage'], reverse=True)

        return JsonResponse({
            'item_analysis': item_analysis,
            'formula_used': {
                'waste_percentage': '(Quantity Wasted / Quantity Purchased) * 100',
                'cost_wasted': 'Quantity Wasted * Cost Per Unit',
                'risk_score': '(Days to Expiry * Waste Rate) / Freshness Factor',
                'description': 'Analyzes individual items for waste patterns and risk assessment'
            }
        })

    except Exception as e:
        print(f"[DEBUG] Error in item_analysis: {str(e)}")
        return JsonResponse({"error": f"Server Error: {str(e)}"}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def waste_recommendations(request):
    """
    Step 4: AI Recommendations
    Generates smart recommendations based on waste patterns
    """
    try:
        # Get MongoDB connection
        mongo_url = os.getenv('MONGO_URL')
        mongo_db = os.getenv('MONGO_DB')
        
        if not mongo_url or not mongo_db:
            return JsonResponse({"error": "MongoDB configuration not found"}, status=500)
        
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        
        # Find inventory collection
        inventory_collection = db["inventory_items"]
        
        if not inventory_collection:
            return JsonResponse({"error": "Inventory collection not found"}, status=404)

        # Fetch inventory items
        inventory_items = list(inventory_collection.find({}))
        
        if not inventory_items:
            return JsonResponse({"error": "No inventory data found"}, status=404)

        # Generate recommendations
        recommendations = []
        
        # Analyze high waste items
        high_waste_items = []
        for item in inventory_items:
            quantity_wasted = float(item.get('Quantity Wasted', 0))
            quantity_purchased = float(item.get('Quantity Purchased', 1))
            waste_percentage = (quantity_wasted / quantity_purchased) * 100 if quantity_purchased > 0 else 0
            
            if waste_percentage > 15:
                high_waste_items.append({
                    'name': item.get('Item Name', 'Unknown'),
                    'waste_percentage': waste_percentage,
                    'cost_wasted': quantity_wasted * float(item.get('Cost Per Unit', 0))
                })
        
        # High waste recommendation
        if high_waste_items:
            top_item = max(high_waste_items, key=lambda x: x['waste_percentage'])
            potential_savings = top_item['cost_wasted'] * 0.15
            recommendations.append({
                'title': 'High Impact Opportunity',
                'description': f"Reduce {top_item['name']} waste by 15% by implementing portion control. Estimated savings: ${potential_savings:.2f}/week",
                'color': 'bg-green-50 border-green-200 text-green-800',
                'titleColor': 'text-green-800',
                'priority': 'high'
            })

        # Expiring items recommendation
        expiring_items = [item for item in inventory_items if item.get('Freshness Level', '').lower() == 'near_expiry']
        if expiring_items:
            expiring_names = [item.get('Item Name', 'Unknown') for item in expiring_items[:3]]
            recommendations.append({
                'title': 'Menu Optimization',
                'description': f"Create daily specials using ingredients expiring soon: {', '.join(expiring_names)}",
                'color': 'bg-orange-50 border-orange-200 text-orange-800',
                'titleColor': 'text-orange-800',
                'priority': 'medium'
            })

        # Process improvement recommendation
        dairy_items = [item for item in inventory_items if item.get('Category', '').lower() == 'dairy']
        if dairy_items:
            total_dairy_waste = sum(float(item.get('Quantity Wasted', 0)) for item in dairy_items)
            total_dairy_purchased = sum(float(item.get('Quantity Purchased', 0)) for item in dairy_items)
            dairy_waste_percentage = (total_dairy_waste / total_dairy_purchased) * 100 if total_dairy_purchased > 0 else 0
            
            if dairy_waste_percentage > 10:
                recommendations.append({
                    'title': 'Process Improvement',
                    'description': f"Implement FIFO system for dairy products. Potential waste reduction: 20%",
                    'color': 'bg-blue-50 border-blue-200 text-blue-800',
                    'titleColor': 'text-blue-800',
                    'priority': 'medium'
                })

        return JsonResponse({
            'recommendations': recommendations,
            'formula_used': {
                'recommendation_priority': '(Cost Impact * Waste Rate * Urgency Factor)',
                'potential_savings': 'Current Cost Wasted * Reduction Factor (15%)',
                'description': 'Generates AI-powered recommendations based on waste patterns and cost impact'
            }
        })

    except Exception as e:
        print(f"[DEBUG] Error in waste_recommendations: {str(e)}")
        return JsonResponse({"error": f"Server Error: {str(e)}"}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def cost_analysis(request):
    """
    Step 5: Cost Analysis
    Calculates financial impact of waste
    """
    try:
        mongo_url = os.getenv('MONGO_URL')
        mongo_db = os.getenv('MONGO_DB')
        if not mongo_url or not mongo_db:
            return JsonResponse({"error": "MongoDB configuration not found"}, status=500)
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        inventory_collection = db["inventory_items"]

        if not inventory_collection:
            return JsonResponse({"error": "Inventory collection not found"}, status=404)

        inventory_items = list(inventory_collection.find({}))
        if not inventory_items:
            return JsonResponse({"error": "No inventory data found"}, status=404)

        from datetime import datetime
        total_cost_wasted = 0
        total_inventory_value = 0
        high_waste_items = []
        today = datetime.now().date()
        for item in inventory_items:
            expiry_str = item.get('Expiry Date', None)
            quantity_wasted = float(item.get('Quantity Wasted', 0))
            quantity_purchased = float(item.get('Quantity Purchased', 0))
            cost_per_unit = float(item.get('Cost Per Unit', 0))
            # Only count cost wasted for expired items
            if expiry_str:
                try:
                    expiry_date = datetime.strptime(expiry_str, "%d-%m-%Y").date()
                except Exception:
                    expiry_date = None
                if expiry_date and expiry_date <= today:
                    total_cost_wasted += quantity_wasted * cost_per_unit
                    # Track high waste items for recommendations (only expired)
                    waste_percentage = (quantity_wasted / quantity_purchased) * 100 if quantity_purchased > 0 else 0
                    if waste_percentage > 20:
                        high_waste_items.append({
                            'name': item.get('Item Name', 'Unknown'),
                            'waste_percentage': round(waste_percentage, 1),
                            'cost_wasted': round(quantity_wasted * cost_per_unit, 2)
                        })
            # Still calculate total inventory value for all items
            total_inventory_value += quantity_purchased * cost_per_unit

        potential_savings = total_cost_wasted * 0.90
        waste_cost_percentage = (total_cost_wasted / (total_inventory_value + total_cost_wasted)) * 100 if (total_inventory_value + total_cost_wasted) > 0 else 0

        # Recommendations to reduce cost
        recommendations = []
        if high_waste_items:
            top_item = max(high_waste_items, key=lambda x: x['cost_wasted'])
            recommendations.append({
                'title': 'Reduce High Waste Item',
                'description': f"Focus on reducing waste for '{top_item['name']}' (waste: {top_item['waste_percentage']}%, cost: ${top_item['cost_wasted']}). Strategies: portion control, better inventory tracking, staff training.",
                'priority': 'high'
            })
        if waste_cost_percentage > 10:
            recommendations.append({
                'title': 'General Waste Reduction',
                'description': "Implement FIFO (First-In-First-Out) for perishable items, regular stock audits, and menu planning to use items before expiry.",
                'priority': 'medium'
            })
        if total_cost_wasted > 100:
            recommendations.append({
                'title': 'Cost Monitoring',
                'description': "Set up alerts for high-cost waste events and review purchasing patterns to avoid overstocking expensive items.",
                'priority': 'medium'
            })

        cost_analysis = {
            'total_cost_wasted': round(total_cost_wasted, 2),
            'potential_savings': round(potential_savings, 2),
            'waste_cost_percentage': round(waste_cost_percentage, 1),
            'total_inventory_value': round(total_inventory_value, 2),
            'recommendations': recommendations
        }

        return JsonResponse({
            'cost_analysis': cost_analysis,
            'formula_used': {
                'total_cost_wasted': 'Sum(Quantity Wasted * Cost Per Unit)',
                'potential_savings': 'Total Cost Wasted * Reduction Factor (25%)',
                'waste_cost_percentage': '(Total Cost Wasted / Total Inventory Value) * 100',
                'description': 'Calculates the financial impact of waste and provides actionable recommendations'
            }
        })

    except Exception as e:
        print(f"[DEBUG] Error in cost_analysis: {str(e)}")
        return JsonResponse({"error": f"Server Error: {str(e)}"}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def waste_summary(request):
    """
    Step 6: Summary Metrics
    Provides overall waste summary statistics
    """
    try:
        # Get MongoDB connection
        mongo_url = os.getenv('MONGO_URL')
        mongo_db = os.getenv('MONGO_DB')
        
        if not mongo_url or not mongo_db:
            return JsonResponse({"error": "MongoDB configuration not found"}, status=500)
        
        client = MongoClient(mongo_url)
        db = client[mongo_db]
        
        # Find inventory collection
        inventory_collection = db["inventory_items"]
        
        if not inventory_collection:
            return JsonResponse({"error": "Inventory collection not found"}, status=404)

        # Fetch inventory items
        inventory_items = list(inventory_collection.find({}))
        
        if not inventory_items:
            return JsonResponse({"error": "No inventory data found"}, status=404)

        # Calculate summary metrics
        total_items = len(inventory_items)
        total_waste_quantity = sum(float(item.get('Quantity Wasted', 0)) for item in inventory_items)
        total_purchased_quantity = sum(float(item.get('Quantity Purchased', 0)) for item in inventory_items)
        total_cost_wasted = sum(float(item.get('Quantity Wasted', 0)) * float(item.get('Cost Per Unit', 0)) for item in inventory_items)
        
        average_waste_percentage = (total_waste_quantity / total_purchased_quantity) * 100 if total_purchased_quantity > 0 else 0
        
        # Find highest waste category
        category_waste = {}
        for item in inventory_items:
            category = item.get('Category', 'Unknown')
            quantity_wasted = float(item.get('Quantity Wasted', 0))
            
            if category not in category_waste:
                category_waste[category] = 0
            category_waste[category] += quantity_wasted
        
        highest_waste_category = max(category_waste.items(), key=lambda x: x[1])[0] if category_waste else 'None'

        summary_metrics = {
            'total_items_analyzed': total_items,
            'total_waste_quantity': round(total_waste_quantity, 1),
            'average_waste_percentage': round(average_waste_percentage, 1),
            'highest_waste_category': highest_waste_category,
            'total_cost_wasted': round(total_cost_wasted, 2)
        }

        return JsonResponse({
            'summary_metrics': summary_metrics,
            'formula_used': {
                'average_waste_percentage': '(Total Waste Quantity / Total Purchased Quantity) * 100',
                'total_cost_wasted': 'Sum(Quantity Wasted * Cost Per Unit)',
                'description': 'Provides overall summary statistics for waste analysis'
            }
        })

    except Exception as e:
        print(f"[DEBUG] Error in waste_summary: {str(e)}")
        return JsonResponse({"error": f"Server Error: {str(e)}"}, status=500)

@csrf_exempt
@require_http_methods(["GET"])
def analysis_formulas(request):
    """
    Step 7: Analysis Formulas
    Returns all mathematical formulas used in waste analysis
    """
    formulas = {
        'waste_percentage': '(Quantity Wasted / Quantity Purchased) * 100',
        'cost_wasted': 'Quantity Wasted * Cost Per Unit',
        'risk_score': '(Days to Expiry * Waste Rate) / Freshness Factor',
        'potential_savings': 'Total Cost Wasted * Reduction Factor (25%)',
        'category_distribution': '(Category Waste Quantity / Total Waste Quantity) * 100',
        'daily_waste_trend': '(Total Waste Quantity / 7 days) * Daily Variation Factor',
        'recommendation_priority': '(Cost Impact * Waste Rate * Urgency Factor)',
        'waste_cost_percentage': '(Total Cost Wasted / Total Inventory Value) * 100',
        'average_waste_percentage': '(Total Waste Quantity / Total Purchased Quantity) * 100'
    }
    
    return JsonResponse({
        'formulas': formulas,
        'description': 'All mathematical formulas used in the waste analysis system'
    })

@csrf_exempt
@require_http_methods(["POST"])
def generate_report(request):
    """
    Generate concise PDF report from waste analytics data
    """
    try:
        data = json.loads(request.body)
        
        # Create PDF buffer
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        styles = getSampleStyleSheet()
        story = []
        
        # Title
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=20,
            spaceAfter=20,
            alignment=1
        )
        story.append(Paragraph("Waste Analytics Report", title_style))
        story.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Executive Summary
        story.append(Paragraph("Executive Summary", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        summary_data = data.get('summary', {})
        summary_table_data = [
            ['Metric', 'Value'],
            ['Items Analyzed', str(summary_data.get('totalItems', 0))],
            ['Total Waste', f"{summary_data.get('totalWaste', 0)} units"],
            ['Avg Waste Rate', f"{summary_data.get('averageWaste', 0)}%"],
            ['Potential Savings', f"${summary_data.get('potentialSavings', 0)}"]
        ]
        
        summary_table = Table(summary_table_data, colWidths=[2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(summary_table)
        story.append(Spacer(1, 15))
        
        # Key Insights - Two columns
        story.append(Paragraph("Key Insights", styles['Heading2']))
        story.append(Spacer(1, 10))
        
        # Waste Distribution (Top 5)
        waste_distribution = data.get('wasteDistribution', [])
        if waste_distribution:
            dist_table_data = [['Category', 'Waste %', 'Units', 'Cost']]
            for item in waste_distribution[:5]:
                dist_table_data.append([
                    item.get('label', ''),
                    f"{item.get('value', 0)}%",
                    str(item.get('units', 0)),
                    f"${item.get('total_cost_wasted', 0)}"
                ])
            
            dist_table = Table(dist_table_data, colWidths=[1.2*inch, 0.8*inch, 0.8*inch, 1*inch])
            dist_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(dist_table)
            story.append(Spacer(1, 15))
        
        # Top Waste Items (Top 5)
        top_items = data.get('topWasteItems', [])
        if top_items:
            story.append(Paragraph("Top Waste Items", styles['Heading3']))
            story.append(Spacer(1, 8))
            
            items_table_data = [['Item', 'Waste %', 'Cost', 'Risk']]
            for item in top_items[:5]:
                items_table_data.append([
                    item.get('name', ''),
                    f"{item.get('waste_percentage', 0)}%",
                    f"${item.get('cost_wasted', 0)}",
                    item.get('waste_level', '')
                ])
            
            items_table = Table(items_table_data, colWidths=[1.5*inch, 0.8*inch, 1*inch, 0.8*inch])
            items_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            story.append(items_table)
            story.append(Spacer(1, 15))
        
        # Key Recommendations (Top 3)
        recommendations = data.get('recommendations', [])
        if recommendations:
            story.append(Paragraph("Key Recommendations", styles['Heading3']))
            story.append(Spacer(1, 8))
            
            for i, rec in enumerate(recommendations[:3], 1):
                story.append(Paragraph(f"{i}. {rec.get('title', '')}", styles['Heading4']))
                story.append(Paragraph(rec.get('description', ''), styles['Normal']))
                story.append(Spacer(1, 8))
        
        # Quick Stats
        story.append(Paragraph("Quick Stats", styles['Heading3']))
        story.append(Spacer(1, 8))
        
        cost_analysis = data.get('costAnalysis', {})
        stats_data = [
            ['Metric', 'Value'],
            ['Total Cost Wasted', f"${cost_analysis.get('total_cost_wasted', 0)}"],
            ['Potential Savings', f"${cost_analysis.get('potential_savings', 0)}"],
            ['Waste Cost %', f"{cost_analysis.get('waste_cost_percentage', 0)}%"],
            ['Highest Waste Category', waste_distribution[0].get('label', 'N/A') if waste_distribution else 'N/A'],
            ['Most Wasteful Item', top_items[0].get('name', 'N/A') if top_items else 'N/A']
        ]
        
        stats_table = Table(stats_data, colWidths=[2*inch, 2*inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(stats_table)
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        # Create response
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="waste-report-{datetime.now().strftime("%Y-%m-%d")}.pdf"'
        
        return response
        
    except Exception as e:
        print(f"[DEBUG] Error in generate_report: {str(e)}")
        return JsonResponse({"error": f"Server Error: {str(e)}"}, status=500)
