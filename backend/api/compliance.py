"""
Compliance API Endpoints - GDPR & EU AI Act
Provides users with transparency into their data processing
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import HTMLResponse
from typing import Dict, Any, List
from datetime import datetime
from api.auth import get_current_user_id
from utils.supabase_client import supabase
from utils.supabase_admin import supabase_admin  # Service role client for compliance operations
from middleware.pii_logger import PIILogger
import json

router = APIRouter()


def generate_html_report(user_data: Dict[str, Any]) -> str:
    """
    Generate a beautiful, human-readable HTML report for GDPR data export

    Returns styled HTML that can be printed or saved as PDF
    """
    profile = user_data.get('profile', {}) or {}
    preferences = user_data.get('preferences', {}) or {}
    saved_classes = user_data.get('saved_classes', [])
    class_history = user_data.get('class_history', [])
    ropa = user_data.get('data_processing_activities', [])
    ai_decisions = user_data.get('ai_decisions', [])
    metadata = user_data.get('export_metadata', {})

    # Format date nicely
    export_date = datetime.fromisoformat(metadata.get('export_date', datetime.utcnow().isoformat())).strftime('%B %d, %Y at %I:%M %p UTC')

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>My Personal Data Export - Bassline Pilates</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1000px;
                margin: 0 auto;
                padding: 40px 20px;
                background: #f9f9f9;
            }}
            .container {{
                background: white;
                padding: 50px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            h1 {{
                color: #7a1f1f;
                font-size: 2.5em;
                margin-bottom: 10px;
                border-bottom: 3px solid #7a1f1f;
                padding-bottom: 15px;
            }}
            h2 {{
                color: #7a1f1f;
                font-size: 1.8em;
                margin-top: 40px;
                margin-bottom: 20px;
                border-left: 5px solid #7a1f1f;
                padding-left: 15px;
            }}
            h3 {{
                color: #444;
                font-size: 1.3em;
                margin-top: 25px;
                margin-bottom: 15px;
            }}
            .metadata {{
                background: #f5f5f5;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #7a1f1f;
            }}
            .metadata p {{
                margin: 5px 0;
            }}
            .section {{
                margin-bottom: 40px;
            }}
            .data-table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
                background: white;
            }}
            .data-table th {{
                background: #7a1f1f;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: 600;
            }}
            .data-table td {{
                padding: 12px;
                border-bottom: 1px solid #ddd;
            }}
            .data-table tr:hover {{
                background: #f9f9f9;
            }}
            .info-box {{
                background: #e8f4f8;
                border-left: 4px solid #0073aa;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .warning-box {{
                background: #fff3cd;
                border-left: 4px solid #856404;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .empty-state {{
                color: #999;
                font-style: italic;
                padding: 20px;
                text-align: center;
                background: #f9f9f9;
                border-radius: 8px;
            }}
            .data-item {{
                margin: 10px 0;
                padding: 10px 0;
                border-bottom: 1px solid #eee;
            }}
            .data-item:last-child {{
                border-bottom: none;
            }}
            .label {{
                font-weight: 600;
                color: #555;
                min-width: 200px;
                display: inline-block;
            }}
            .value {{
                color: #333;
            }}
            .badge {{
                display: inline-block;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 0.85em;
                font-weight: 600;
                margin-left: 10px;
            }}
            .badge-success {{ background: #d4edda; color: #155724; }}
            .badge-info {{ background: #d1ecf1; color: #0c5460; }}
            .badge-warning {{ background: #fff3cd; color: #856404; }}
            @media print {{
                body {{ background: white; }}
                .container {{ box-shadow: none; }}
                h1 {{ page-break-before: avoid; }}
                .section {{ page-break-inside: avoid; }}
            }}
            footer {{
                margin-top: 50px;
                padding-top: 30px;
                border-top: 2px solid #ddd;
                text-align: center;
                color: #777;
                font-size: 0.9em;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>📄 My Personal Data Export</h1>

            <div class="metadata">
                <p><strong>Export Date:</strong> {export_date}</p>
                <p><strong>Data Controller:</strong> {metadata.get('data_controller', 'Bassline Pilates')}</p>
                <p><strong>Legal Basis:</strong> GDPR Article 15 - Right to Access</p>
                <p><strong>Reference:</strong> <a href="{metadata.get('gdpr_article_url', '#')}" target="_blank">GDPR Article 15</a></p>
            </div>

            <div class="info-box">
                <strong>ℹ️ About This Report:</strong> This document contains all personal data we hold about you.
                You have the right to access, correct, delete, or transfer this data at any time.
                For questions, contact: {metadata.get('data_controller_contact', 'laura.redm@gmail.com')}
            </div>

            <!-- PROFILE SECTION -->
            <div class="section">
                <h2>👤 Profile Information</h2>
                {_generate_profile_section(profile)}
            </div>

            <!-- PREFERENCES SECTION -->
            <div class="section">
                <h2>⚙️ Account Preferences</h2>
                {_generate_preferences_section(preferences)}
            </div>

            <!-- SAVED CLASSES SECTION -->
            <div class="section">
                <h2>💾 Saved Classes</h2>
                {_generate_saved_classes_section(saved_classes)}
            </div>

            <!-- CLASS HISTORY SECTION -->
            <div class="section">
                <h2>📊 Class History</h2>
                {_generate_class_history_section(class_history)}
            </div>

            <!-- DATA PROCESSING SECTION -->
            <div class="section">
                <h2>🔒 Data Processing Activities</h2>
                <div class="warning-box">
                    <strong>⚠️ GDPR Article 30 Compliance:</strong> This section shows every time we accessed,
                    modified, or processed your personal data. We are required by law to maintain this audit log.
                </div>
                {_generate_ropa_section(ropa)}
            </div>

            <!-- AI DECISIONS SECTION -->
            <div class="section">
                <h2>🤖 AI Decisions & Explanations</h2>
                <div class="info-box">
                    <strong>🇪🇺 EU AI Act Compliance:</strong> Every AI decision made for you is logged with
                    an explanation. You have the right to understand and challenge any AI-driven recommendation.
                </div>
                {_generate_ai_decisions_section(ai_decisions)}
            </div>

            <!-- YOUR RIGHTS -->
            <div class="section">
                <h2>⚖️ Your Data Rights</h2>
                <div class="data-item">
                    <span class="label">Right to Access</span>
                    <span class="value">You can download your data at any time (you're doing it now!)</span>
                </div>
                <div class="data-item">
                    <span class="label">Right to Rectification</span>
                    <span class="value">Update your profile information in Settings</span>
                </div>
                <div class="data-item">
                    <span class="label">Right to Erasure</span>
                    <span class="value">Delete your account and all data in Settings → Account Deletion</span>
                </div>
                <div class="data-item">
                    <span class="label">Right to Data Portability</span>
                    <span class="value">Download in JSON format to transfer to another service</span>
                </div>
                <div class="data-item">
                    <span class="label">Right to Object</span>
                    <span class="value">Contact {metadata.get('data_controller_contact', 'laura.redm@gmail.com')}</span>
                </div>
            </div>

            <footer>
                <p><strong>Bassline Pilates</strong> | GDPR & EU AI Act Compliant</p>
                <p>Generated on {export_date}</p>
                <p>This report is for your personal records only</p>
            </footer>
        </div>
    </body>
    </html>
    """

    return html


def _generate_profile_section(profile: Dict) -> str:
    """Generate HTML for profile section"""
    if not profile:
        return '<div class="empty-state">No profile information available</div>'

    html = '<div class="data-item">'
    html += f'<span class="label">Email:</span> <span class="value">{profile.get("email", "N/A")}</span><br>'
    html += f'<span class="label">Full Name:</span> <span class="value">{profile.get("full_name", "N/A")}</span><br>'
    html += f'<span class="label">Age Range:</span> <span class="value">{profile.get("age_range", "N/A")}</span><br>'
    html += f'<span class="label">Gender Identity:</span> <span class="value">{profile.get("gender_identity", "Prefer not to say")}</span><br>'
    html += f'<span class="label">Country:</span> <span class="value">{profile.get("country", "N/A")}</span><br>'
    html += f'<span class="label">Pilates Experience:</span> <span class="value">{profile.get("pilates_experience", "N/A")}</span><br>'

    goals = profile.get("goals", [])
    if goals:
        html += f'<span class="label">Goals:</span> <span class="value">{", ".join(goals)}</span><br>'

    html += f'<span class="label">Account Created:</span> <span class="value">{profile.get("created_at", "N/A")}</span><br>'
    html += f'<span class="label">Last Login:</span> <span class="value">{profile.get("last_login", "N/A")}</span>'
    html += '</div>'

    return html


def _generate_preferences_section(preferences: Dict) -> str:
    """Generate HTML for preferences section"""
    if not preferences:
        return '<div class="empty-state">No preferences configured</div>'

    html = '<div class="data-item">'
    html += f'<span class="label">AI Strictness Level:</span> <span class="value">{preferences.get("strictness_level", "N/A")}</span><br>'
    html += f'<span class="label">Default Class Duration:</span> <span class="value">{preferences.get("default_class_duration", "N/A")} minutes</span><br>'
    html += f'<span class="label">Email Notifications:</span> <span class="value">{"✓ Enabled" if preferences.get("email_notifications") else "✗ Disabled"}</span><br>'
    html += f'<span class="label">Class Reminders:</span> <span class="value">{"✓ Enabled" if preferences.get("class_reminders") else "✗ Disabled"}</span><br>'
    html += f'<span class="label">Weekly Summary:</span> <span class="value">{"✓ Enabled" if preferences.get("weekly_summary") else "✗ Disabled"}</span><br>'
    html += f'<span class="label">Analytics:</span> <span class="value">{"✓ Enabled" if preferences.get("analytics_enabled") else "✗ Disabled"}</span><br>'
    html += f'<span class="label">Data Sharing:</span> <span class="value">{"✓ Enabled" if preferences.get("data_sharing_enabled") else "✗ Disabled"}</span><br>'
    html += f'<span class="label">MCP Research:</span> <span class="value">{"✓ Enabled" if preferences.get("enable_mcp_research") else "✗ Disabled"}</span>'
    html += '</div>'

    return html


def _generate_saved_classes_section(classes: List) -> str:
    """Generate HTML for saved classes section"""
    if not classes:
        return '<div class="empty-state">No saved classes</div>'

    html = f'<p><strong>Total Saved Classes:</strong> {len(classes)}</p>'
    html += '<table class="data-table"><thead><tr>'
    html += '<th>Class Name</th><th>Duration</th><th>Saved On</th>'
    html += '</tr></thead><tbody>'

    for cls in classes:
        html += f'<tr>'
        html += f'<td>{cls.get("name", "Untitled Class")}</td>'
        html += f'<td>{cls.get("duration", "N/A")} min</td>'
        html += f'<td>{cls.get("created_at", "N/A")}</td>'
        html += f'</tr>'

    html += '</tbody></table>'
    return html


def _generate_class_history_section(history: List) -> str:
    """Generate HTML for class history section"""
    if not history:
        return '<div class="empty-state">No class history</div>'

    html = f'<p><strong>Total Classes Completed:</strong> {len(history)}</p>'
    html += '<table class="data-table"><thead><tr>'
    html += '<th>Class Name</th><th>Completed On</th><th>Duration</th>'
    html += '</tr></thead><tbody>'

    for item in history:
        html += f'<tr>'
        html += f'<td>{item.get("class_name", "N/A")}</td>'
        html += f'<td>{item.get("completed_at", "N/A")}</td>'
        html += f'<td>{item.get("duration", "N/A")} min</td>'
        html += f'</tr>'

    html += '</tbody></table>'
    return html


def _generate_ropa_section(ropa: List) -> str:
    """Generate HTML for ROPA (data processing activities) section"""
    if not ropa:
        return '<div class="empty-state">No data processing activities recorded</div>'

    html = f'<p><strong>Total Transactions:</strong> {len(ropa)}</p>'
    html += '<table class="data-table"><thead><tr>'
    html += '<th>Date & Time</th><th>Action</th><th>Description</th><th>System</th>'
    html += '</tr></thead><tbody>'

    for entry in ropa[:50]:  # Show last 50 entries
        # Format timestamp
        timestamp = entry.get('timestamp', 'N/A')
        try:
            timestamp = datetime.fromisoformat(timestamp).strftime('%b %d, %Y %I:%M %p')
        except:
            pass

        tx_type = entry.get('transaction_type', 'N/A').upper()

        # Get descriptive notes (enhanced by new PII logger)
        notes = entry.get('notes', 'No description available')

        # Highlight Article 9 health data in red if present
        if '⚠️' in notes or 'Article 9' in notes:
            notes = f'<span style="color: #721c24; font-weight: 600;">{notes}</span>'

        # Get PII fields affected
        pii_fields = entry.get('pii_fields', [])
        if isinstance(pii_fields, list) and len(pii_fields) > 0:
            fields_summary = f" ({', '.join(pii_fields[:3])}{'...' if len(pii_fields) > 3 else ''})"
        else:
            fields_summary = ""

        html += f'<tr>'
        html += f'<td style="white-space: nowrap;">{timestamp}</td>'
        html += f'<td><span class="badge badge-info">{tx_type}</span>{fields_summary}</td>'
        html += f'<td style="max-width: 400px;">{notes}</td>'
        html += f'<td>{entry.get("processing_system", "N/A")}</td>'
        html += f'</tr>'

    html += '</tbody></table>'
    if len(ropa) > 50:
        html += f'<p style="margin-top: 15px; color: #777;">Showing 50 most recent transactions (total: {len(ropa)})</p>'

    return html


def _generate_ai_decisions_section(decisions: List) -> str:
    """Generate HTML for AI decisions section"""
    if not decisions:
        return '<div class="empty-state">No AI decisions recorded yet</div>'

    html = f'<p><strong>Total AI Decisions:</strong> {len(decisions)}</p>'
    html += '<table class="data-table"><thead><tr>'
    html += '<th>Date & Time</th><th>Agent Type</th><th>Model</th><th>Confidence</th><th>Reasoning</th>'
    html += '</tr></thead><tbody>'

    for decision in decisions[:20]:  # Show last 20 decisions
        confidence = decision.get('confidence_score', 0) * 100
        html += f'<tr>'
        html += f'<td>{decision.get("timestamp", "N/A")}</td>'
        html += f'<td><span class="badge badge-success">{decision.get("agent_type", "N/A")}</span></td>'
        html += f'<td>{decision.get("model_name", "N/A")}</td>'
        html += f'<td>{confidence:.1f}%</td>'
        html += f'<td>{decision.get("reasoning", "No reasoning provided")[:100]}...</td>'
        html += f'</tr>'

    html += '</tbody></table>'
    if len(decisions) > 20:
        html += f'<p style="margin-top: 15px; color: #777;">Showing 20 most recent decisions (total: {len(decisions)})</p>'

    return html


@router.get("/api/compliance/my-data")
async def export_my_data(
    request: Request,
    format: str = 'html',  # 'json', 'html', or 'csv'
    user_id: str = Depends(get_current_user_id)
):
    """
    GDPR Article 15 - Right to Access
    Export all personal data for the authenticated user

    This endpoint allows users to exercise their right to data portability.
    Returns ALL data we hold about the user in a structured format.
    """

    # Log this data export as a PII transaction
    await PIILogger.log_data_export(user_id, request, format)

    # Gather all user data from all tables
    user_data = {}

    try:
        # User profile - use admin client to bypass RLS
        # Note: user_profiles table uses 'id' as primary key, not 'user_id'
        profile = supabase_admin.table('user_profiles').select('*').eq('id', user_id).execute()
        user_data['profile'] = profile.data[0] if profile.data else None

        # User preferences - use admin client to bypass RLS
        # Note: user_preferences table has 'user_id' column
        preferences = supabase_admin.table('user_preferences').select('*').eq('user_id', user_id).execute()
        user_data['preferences'] = preferences.data[0] if preferences.data else None

        # Saved classes (class_plans table)
        try:
            classes = supabase_admin.table('class_plans').select('*').eq('user_id', user_id).execute()
            # Transform data to match expected format
            transformed_classes = []
            for cls in classes.data:
                transformed_classes.append({
                    'name': cls.get('title', 'Untitled Class'),
                    'duration': cls.get('duration_minutes', 'N/A'),
                    'created_at': cls.get('created_at', 'N/A')
                })
            user_data['saved_classes'] = transformed_classes
        except Exception as e:
            print(f"Error fetching class_plans: {e}")
            user_data['saved_classes'] = []

        # Class history
        try:
            history = supabase_admin.table('class_history').select('*, class_plans!inner(title)').eq('user_id', user_id).execute()
            # Transform data to match expected format
            transformed_history = []
            for item in history.data:
                transformed_history.append({
                    'class_name': item.get('class_plans', {}).get('title', 'N/A') if isinstance(item.get('class_plans'), dict) else 'N/A',
                    'completed_at': item.get('taught_date', 'N/A'),
                    'duration': item.get('actual_duration_minutes', 'N/A')
                })
            user_data['class_history'] = transformed_history
        except Exception as e:
            print(f"Error fetching class_history: {e}")
            user_data['class_history'] = []

        # ROPA audit log (what we've done with their data) - use admin client to bypass RLS
        ropa = supabase_admin.table('ropa_audit_log').select('*').eq('user_id', user_id).order('timestamp', desc=True).execute()
        user_data['data_processing_activities'] = ropa.data

        # AI decisions made for this user - use admin client to bypass RLS
        ai_decisions = supabase_admin.table('ai_decision_log').select('*').eq('user_id', user_id).order('timestamp', desc=True).execute()
        user_data['ai_decisions'] = ai_decisions.data

        # Export metadata
        user_data['export_metadata'] = {
            'export_date': datetime.utcnow().isoformat(),
            'export_format': format,
            'data_controller': 'Bassline Pilates',
            'data_controller_contact': 'laura.redm@gmail.com',
            'gdpr_article': 'Article 15 - Right to Access',
            'gdpr_article_url': 'https://gdpr-info.eu/art-15-gdpr/',
            'total_records': {
                'profile': 1 if user_data['profile'] else 0,
                'preferences': 1 if user_data['preferences'] else 0,
                'saved_classes': len(user_data.get('saved_classes', [])),
                'class_history': len(user_data.get('class_history', [])),
                'data_processing_activities': len(user_data.get('data_processing_activities', [])),
                'ai_decisions': len(user_data.get('ai_decisions', []))
            }
        }

        if format == 'json':
            return user_data
        elif format == 'html':
            # Generate beautiful HTML report
            html_content = generate_html_report(user_data)
            return HTMLResponse(content=html_content, status_code=200)
        elif format == 'csv':
            # CSV export not yet implemented
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="CSV export not yet implemented. Use format=json or format=html"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid format. Use 'json', 'html', or 'csv'"
            )

    except Exception as e:
        print(f"Error exporting user data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export data: {str(e)}"
        )


def generate_ropa_html_report(report_data: Dict[str, Any]) -> str:
    """
    Generate a beautiful, human-readable HTML ROPA report
    Shows users exactly how their data has been processed
    """
    summary = report_data.get('summary', {})
    recent_activities = report_data.get('recent_activities', [])
    third_party = report_data.get('third_party_data_sharing', {})
    retention = report_data.get('retention_policy', {})
    rights = report_data.get('your_rights', {})
    dpo = report_data.get('data_protection_officer', {})
    authority = report_data.get('supervisory_authority', {})

    # Format date
    report_date = datetime.fromisoformat(report_data.get('report_date', datetime.utcnow().isoformat())).strftime('%B %d, %Y at %I:%M %p UTC')

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Processing Activities Report - Bassline Pilates</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1000px;
                margin: 0 auto;
                padding: 40px 20px;
                background: #f9f9f9;
            }}
            .container {{
                background: white;
                padding: 50px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            h1 {{
                color: #7a1f1f;
                font-size: 2.5em;
                margin-bottom: 10px;
                border-bottom: 3px solid #7a1f1f;
                padding-bottom: 15px;
            }}
            h2 {{
                color: #7a1f1f;
                font-size: 1.8em;
                margin-top: 40px;
                margin-bottom: 20px;
                border-left: 5px solid #7a1f1f;
                padding-left: 15px;
            }}
            h3 {{
                color: #444;
                font-size: 1.3em;
                margin-top: 25px;
                margin-bottom: 15px;
            }}
            .metadata {{
                background: #f5f5f5;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #7a1f1f;
            }}
            .section {{
                margin-bottom: 40px;
            }}
            .stat-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }}
            .stat-card {{
                background: #f9f9f9;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #7a1f1f;
            }}
            .stat-number {{
                font-size: 2em;
                font-weight: bold;
                color: #7a1f1f;
                margin-bottom: 5px;
            }}
            .stat-label {{
                color: #666;
                font-size: 0.9em;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }}
            .data-table {{
                width: 100%;
                border-collapse: collapse;
                margin-top: 15px;
                background: white;
            }}
            .data-table th {{
                background: #7a1f1f;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: 600;
            }}
            .data-table td {{
                padding: 12px;
                border-bottom: 1px solid #ddd;
            }}
            .data-table tr:hover {{
                background: #f9f9f9;
            }}
            .info-box {{
                background: #e8f4f8;
                border-left: 4px solid #0073aa;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .warning-box {{
                background: #fff3cd;
                border-left: 4px solid #856404;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .badge {{
                display: inline-block;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 0.85em;
                font-weight: 600;
                margin: 2px;
            }}
            .badge-read {{ background: #d1ecf1; color: #0c5460; }}
            .badge-create {{ background: #d4edda; color: #155724; }}
            .badge-update {{ background: #fff3cd; color: #856404; }}
            .badge-delete {{ background: #f8d7da; color: #721c24; }}
            .badge-export {{ background: #e2e3e5; color: #383d41; }}
            .rights-list {{
                list-style: none;
                padding: 0;
            }}
            .rights-list li {{
                background: #f9f9f9;
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                border-left: 4px solid #7a1f1f;
            }}
            .rights-list strong {{
                color: #7a1f1f;
                display: block;
                margin-bottom: 5px;
            }}
            @media print {{
                body {{ background: white; }}
                .container {{ box-shadow: none; }}
                h1 {{ page-break-before: avoid; }}
                .section {{ page-break-inside: avoid; }}
            }}
            footer {{
                margin-top: 50px;
                padding-top: 30px;
                border-top: 2px solid #ddd;
                text-align: center;
                color: #777;
                font-size: 0.9em;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🗂️ Processing Activities Report</h1>

            <div class="metadata">
                <p><strong>Report Date:</strong> {report_date}</p>
                <p><strong>Legal Basis:</strong> GDPR Article 30 - Record of Processing Activities</p>
                <p><strong>Reference:</strong> <a href="https://gdpr-info.eu/art-30-gdpr/" target="_blank">GDPR Article 30</a></p>
            </div>

            <div class="info-box">
                <strong>ℹ️ About This Report:</strong> This document shows every time we accessed, modified,
                or processed your personal data. We are required by law to maintain this audit log and make
                it available to you. This ensures full transparency in how we handle your information.
            </div>

            <!-- SUMMARY STATISTICS -->
            <div class="section">
                <h2>📊 Summary Statistics</h2>
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-number">{summary.get('total_processing_activities', 0)}</div>
                        <div class="stat-label">Total Transactions</div>
                    </div>
                </div>

                <h3>By Transaction Type</h3>
                <div class="stat-grid">
    """

    # Add transaction type stats
    for tx_type, count in summary.get('by_transaction_type', {}).items():
        html += f"""
                    <div class="stat-card">
                        <div class="stat-number">{count}</div>
                        <div class="stat-label">{tx_type.upper()}</div>
                    </div>
        """

    html += """
                </div>

                <h3>By Processing System</h3>
                <div class="stat-grid">
    """

    # Add system stats
    for system, count in summary.get('by_processing_system', {}).items():
        html += f"""
                    <div class="stat-card">
                        <div class="stat-number">{count}</div>
                        <div class="stat-label">{system}</div>
                    </div>
        """

    # Format date range
    date_range = summary.get('date_range', {})
    first_activity = date_range.get('first_activity', 'N/A')
    latest_activity = date_range.get('latest_activity', 'N/A')

    if first_activity != 'N/A':
        try:
            first_activity = datetime.fromisoformat(first_activity).strftime('%B %d, %Y')
        except:
            pass
    if latest_activity != 'N/A':
        try:
            latest_activity = datetime.fromisoformat(latest_activity).strftime('%B %d, %Y')
        except:
            pass

    html += f"""
                </div>

                <div class="metadata" style="margin-top: 20px;">
                    <p><strong>Date Range:</strong></p>
                    <p>First Activity: {first_activity}</p>
                    <p>Latest Activity: {latest_activity}</p>
                </div>
            </div>

            <!-- RECENT ACTIVITIES -->
            <div class="section">
                <h2>📝 Recent Processing Activities</h2>
    """

    if recent_activities:
        html += """
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Action</th>
                            <th>Description</th>
                            <th>System</th>
                        </tr>
                    </thead>
                    <tbody>
        """

        for activity in recent_activities[:20]:
            timestamp = activity.get('timestamp', 'N/A')
            try:
                timestamp = datetime.fromisoformat(timestamp).strftime('%b %d, %Y %I:%M %p')
            except:
                pass

            tx_type = activity.get('transaction_type', 'N/A').upper()
            badge_class = f"badge-{activity.get('transaction_type', 'read').lower()}"

            # Get descriptive notes (enhanced by new PII logger)
            notes = activity.get('notes', 'No description available')

            # Highlight Article 9 health data in red if present
            if '⚠️' in notes or 'Article 9' in notes:
                notes = f'<span style="color: #721c24; font-weight: 600;">{notes}</span>'

            # Get PII fields affected
            pii_fields = activity.get('pii_fields', [])
            if isinstance(pii_fields, list) and len(pii_fields) > 0:
                fields_summary = f" ({', '.join(pii_fields[:3])}{'...' if len(pii_fields) > 3 else ''})"
            else:
                fields_summary = ""

            html += f"""
                        <tr>
                            <td style="white-space: nowrap;">{timestamp}</td>
                            <td><span class="badge {badge_class}">{tx_type}</span>{fields_summary}</td>
                            <td style="max-width: 400px;">{notes}</td>
                            <td>{activity.get('processing_system', 'N/A')}</td>
                        </tr>
            """

        html += """
                    </tbody>
                </table>
        """
    else:
        html += '<p style="color: #999; font-style: italic;">No processing activities recorded yet</p>'

    html += """
            </div>

            <!-- THIRD PARTY DATA SHARING -->
            <div class="section">
                <h2>🔗 Third-Party Data Sharing</h2>
                <div class="warning-box">
                    <strong>⚠️ Transparency Notice:</strong> We share certain data with trusted third-party
                    service providers to deliver our services. All sharing is done securely and in compliance
                    with GDPR requirements.
                </div>

                <table class="data-table">
                    <tbody>
    """

    html += f"""
                        <tr>
                            <td><strong>Recipients</strong></td>
                            <td>{', '.join(third_party.get('recipients', []))}</td>
                        </tr>
                        <tr>
                            <td><strong>Purpose</strong></td>
                            <td>{third_party.get('purpose', 'N/A')}</td>
                        </tr>
                        <tr>
                            <td><strong>Legal Basis</strong></td>
                            <td>{third_party.get('legal_basis', 'N/A')}</td>
                        </tr>
                        <tr>
                            <td><strong>Data Transferred</strong></td>
                            <td>{third_party.get('data_transferred', 'N/A')}</td>
                        </tr>
                        <tr>
                            <td><strong>Safeguards</strong></td>
                            <td>{third_party.get('safeguards', 'N/A')}</td>
                        </tr>
    """

    html += """
                    </tbody>
                </table>
            </div>

            <!-- RETENTION POLICY -->
            <div class="section">
                <h2>⏱️ Data Retention Policy</h2>
                <div class="info-box">
                    <strong>ℹ️ How Long We Keep Your Data:</strong> We retain different types of data for
                    different periods based on legal requirements and business needs. You can request deletion
                    at any time.
                </div>

                <table class="data-table">
                    <tbody>
    """

    for data_type, retention_period in retention.items():
        formatted_type = data_type.replace('_', ' ').title()
        html += f"""
                        <tr>
                            <td><strong>{formatted_type}</strong></td>
                            <td>{retention_period}</td>
                        </tr>
        """

    html += """
                    </tbody>
                </table>
            </div>

            <!-- YOUR RIGHTS -->
            <div class="section">
                <h2>⚖️ Your Data Rights Under GDPR</h2>
                <ul class="rights-list">
    """

    for right_key, right_info in rights.items():
        right_name = right_key.replace('_', ' ').title()
        html += f"""
                    <li>
                        <strong>{right_name}</strong>
                        <p>{right_info.get('description', '')}</p>
                        <p style="color: #666; font-size: 0.9em; margin-top: 5px;">
                            <em>How to exercise:</em> {right_info.get('how_to_exercise', '')}
                        </p>
                    </li>
        """

    html += f"""
                </ul>
            </div>

            <!-- DATA PROTECTION OFFICER -->
            <div class="section">
                <h2>👤 Data Protection Officer</h2>
                <div class="metadata">
                    <p><strong>Contact:</strong> {dpo.get('contact', 'N/A')}</p>
                    <p><strong>Role:</strong> {dpo.get('role', 'N/A')}</p>
                </div>
            </div>

            <!-- SUPERVISORY AUTHORITY -->
            <div class="section">
                <h2>🏛️ Supervisory Authority</h2>
                <div class="info-box">
                    <p><strong>{authority.get('name', 'N/A')}</strong></p>
                    <p>{authority.get('info', '')}</p>
                    <p><a href="{authority.get('find_yours', '#')}" target="_blank">Find your local data protection authority</a></p>
                </div>
            </div>

            <footer>
                <p><strong>Bassline Pilates</strong> | GDPR & EU AI Act Compliant</p>
                <p>Generated on {report_date}</p>
                <p>This report is for your personal records only</p>
            </footer>
        </div>
    </body>
    </html>
    """

    return html


@router.get("/api/compliance/ropa-report")
async def get_ropa_report(
    request: Request,
    format: str = 'html',  # 'json' or 'html'
    user_id: str = Depends(get_current_user_id)
):
    """
    GDPR Article 30 - Record of Processing Activities
    Generate a human-readable ROPA report for the user

    This shows users exactly how their data has been processed,
    fulfilling the transparency requirement of GDPR.
    """

    try:
        # Get all PII transactions for this user - use admin client to bypass RLS
        ropa_entries = supabase_admin.table('ropa_audit_log') \
            .select('*') \
            .eq('user_id', user_id) \
            .order('timestamp', desc=True) \
            .execute()

        if not ropa_entries.data:
            empty_report = {
                'data_subject': user_id,
                'report_date': datetime.utcnow().isoformat(),
                'summary': {
                    'total_processing_activities': 0,
                    'message': 'No processing activities recorded yet'
                }
            }

            if format == 'html':
                # Generate minimal HTML for empty state
                html_content = generate_ropa_html_report(empty_report)
                return HTMLResponse(content=html_content, status_code=200)
            else:
                return empty_report

        # Aggregate statistics
        total_transactions = len(ropa_entries.data)
        transactions_by_type = {}
        transactions_by_system = {}
        recent_activity = ropa_entries.data[:10]  # Last 10 activities

        for entry in ropa_entries.data:
            tx_type = entry['transaction_type']
            system = entry['processing_system']

            transactions_by_type[tx_type] = transactions_by_type.get(tx_type, 0) + 1
            transactions_by_system[system] = transactions_by_system.get(system, 0) + 1

        report = {
            'data_subject': user_id,
            'report_date': datetime.utcnow().isoformat(),
            'summary': {
                'total_processing_activities': total_transactions,
                'by_transaction_type': transactions_by_type,
                'by_processing_system': transactions_by_system,
                'date_range': {
                    'first_activity': ropa_entries.data[-1]['timestamp'] if ropa_entries.data else None,
                    'latest_activity': ropa_entries.data[0]['timestamp'] if ropa_entries.data else None
                }
            },
            'recent_activities': recent_activity,
            'third_party_data_sharing': {
                'recipients': ['Supabase (Database)', 'Render.com (Hosting)', 'Netlify (Frontend)'],
                'purpose': 'Application functionality and hosting',
                'legal_basis': 'Consent (Terms of Service)',
                'data_transferred': 'Profile data, preferences, class history',
                'safeguards': 'Standard contractual clauses, encryption in transit and at rest'
            },
            'retention_policy': {
                'user_data': '7 years after account deletion (legal requirement)',
                'audit_logs': 'Permanent (regulatory compliance)',
                'class_history': 'Until account deletion',
                'preferences': 'Until account deletion'
            },
            'your_rights': {
                'right_to_access': {
                    'description': 'You can export your data at any time',
                    'how_to_exercise': 'Use the "Download My Data" button in Settings'
                },
                'right_to_rectification': {
                    'description': 'You can correct inaccurate personal data',
                    'how_to_exercise': 'Update your profile in Settings'
                },
                'right_to_erasure': {
                    'description': 'You can request deletion of your personal data',
                    'how_to_exercise': 'Use the "Delete Account" button in Settings'
                },
                'right_to_data_portability': {
                    'description': 'You can receive your data in a structured format',
                    'how_to_exercise': 'Export in JSON format from Settings'
                },
                'right_to_object': {
                    'description': 'You can object to certain data processing',
                    'how_to_exercise': 'Contact laura.redm@gmail.com'
                },
                'right_to_withdraw_consent': {
                    'description': 'You can withdraw consent for data processing',
                    'how_to_exercise': 'Delete your account or contact support'
                }
            },
            'data_protection_officer': {
                'contact': 'laura.redm@gmail.com',
                'role': 'Handles data protection inquiries and complaints'
            },
            'supervisory_authority': {
                'name': 'Your local data protection authority',
                'info': 'You have the right to lodge a complaint with your local authority',
                'find_yours': 'https://edpb.europa.eu/about-edpb/about-edpb/members_en'
            }
        }

        if format == 'html':
            html_content = generate_ropa_html_report(report)
            return HTMLResponse(content=html_content, status_code=200)
        else:
            return report

    except Exception as e:
        print(f"Error generating ROPA report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate ROPA report: {str(e)}"
        )


def generate_ai_decisions_html_report(report_data: Dict[str, Any]) -> str:
    """
    Generate a beautiful, human-readable HTML AI decisions report
    Shows users why AI made specific recommendations (EU AI Act compliance)
    """
    statistics = report_data.get('statistics', {})
    decisions = report_data.get('decisions', [])
    ai_act = report_data.get('ai_act_compliance', {})
    total_decisions = report_data.get('total_decisions', 0)

    # Format date
    report_date = datetime.utcnow().strftime('%B %d, %Y at %I:%M %p UTC')

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>AI Decision Explanations - Bassline Pilates</title>
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 40px 20px;
                background: #f9f9f9;
            }}
            .container {{
                background: white;
                padding: 50px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            h1 {{
                color: #7a1f1f;
                font-size: 2.5em;
                margin-bottom: 10px;
                border-bottom: 3px solid #7a1f1f;
                padding-bottom: 15px;
            }}
            h2 {{
                color: #7a1f1f;
                font-size: 1.8em;
                margin-top: 40px;
                margin-bottom: 20px;
                border-left: 5px solid #7a1f1f;
                padding-left: 15px;
            }}
            h3 {{
                color: #444;
                font-size: 1.3em;
                margin-top: 25px;
                margin-bottom: 15px;
            }}
            .metadata {{
                background: #f5f5f5;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #7a1f1f;
            }}
            .section {{
                margin-bottom: 40px;
            }}
            .stat-grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }}
            .stat-card {{
                background: #f9f9f9;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #7a1f1f;
            }}
            .stat-number {{
                font-size: 2em;
                font-weight: bold;
                color: #7a1f1f;
                margin-bottom: 5px;
            }}
            .stat-label {{
                color: #666;
                font-size: 0.9em;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }}
            .decision-card {{
                background: #f9f9f9;
                padding: 25px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #7a1f1f;
            }}
            .decision-header {{
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
                flex-wrap: wrap;
                gap: 10px;
            }}
            .decision-title {{
                font-size: 1.2em;
                font-weight: 600;
                color: #7a1f1f;
            }}
            .confidence-badge {{
                display: inline-block;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 0.9em;
                font-weight: 600;
            }}
            .confidence-high {{ background: #d4edda; color: #155724; }}
            .confidence-medium {{ background: #fff3cd; color: #856404; }}
            .confidence-low {{ background: #f8d7da; color: #721c24; }}
            .info-box {{
                background: #e8f4f8;
                border-left: 4px solid #0073aa;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .warning-box {{
                background: #fff3cd;
                border-left: 4px solid #856404;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .success-box {{
                background: #d4edda;
                border-left: 4px solid #155724;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }}
            .badge {{
                display: inline-block;
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 0.85em;
                font-weight: 600;
                margin: 2px;
            }}
            .badge-agent {{ background: #d1ecf1; color: #0c5460; }}
            .badge-override {{ background: #f8d7da; color: #721c24; }}
            .empty-state {{
                color: #999;
                font-style: italic;
                padding: 40px 20px;
                text-align: center;
                background: #f9f9f9;
                border-radius: 8px;
            }}
            .empty-state-icon {{
                font-size: 4em;
                margin-bottom: 15px;
            }}
            .compliance-list {{
                list-style: none;
                padding: 0;
            }}
            .compliance-list li {{
                background: #f9f9f9;
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                border-left: 4px solid #7a1f1f;
            }}
            .compliance-list strong {{
                color: #7a1f1f;
                display: block;
                margin-bottom: 5px;
            }}
            @media print {{
                body {{ background: white; }}
                .container {{ box-shadow: none; }}
                h1 {{ page-break-before: avoid; }}
                .section {{ page-break-inside: avoid; }}
            }}
            footer {{
                margin-top: 50px;
                padding-top: 30px;
                border-top: 2px solid #ddd;
                text-align: center;
                color: #777;
                font-size: 0.9em;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🤖 AI Decision Explanations</h1>

            <div class="metadata">
                <p><strong>Report Date:</strong> {report_date}</p>
                <p><strong>Legal Basis:</strong> EU AI Act - Transparency & Explainability Requirements</p>
                <p><strong>Reference:</strong> <a href="https://artificialintelligenceact.eu/" target="_blank">EU AI Act</a></p>
            </div>

            <div class="info-box">
                <strong>ℹ️ About This Report:</strong> This document shows every AI-powered decision made on your behalf,
                complete with explanations and reasoning. The EU AI Act requires us to make AI decision-making transparent
                and explainable. You have the right to understand and challenge any AI recommendation.
            </div>
    """

    if total_decisions == 0:
        html += """
            <div class="section">
                <div class="empty-state">
                    <div class="empty-state-icon">🤖</div>
                    <h3>No AI Decisions Yet</h3>
                    <p>AI decisions will appear here once you start using AI-powered features like:</p>
                    <ul style="text-align: left; max-width: 500px; margin: 20px auto; list-style: disc;">
                        <li>Class sequence generation</li>
                        <li>Movement recommendations</li>
                        <li>Music playlist suggestions</li>
                        <li>Meditation script creation</li>
                    </ul>
                    <p>All AI recommendations will be logged here with full explanations.</p>
                </div>
            </div>
        """
    else:
        # Statistics section
        avg_conf = statistics.get('average_confidence', 0)
        overrides = statistics.get('user_overrides', 0)
        override_rate = statistics.get('override_rate_percent', 0)
        decisions_by_agent = statistics.get('decisions_by_agent', {})

        html += f"""
            <!-- SUMMARY STATISTICS -->
            <div class="section">
                <h2>📊 Summary Statistics</h2>
                <div class="stat-grid">
                    <div class="stat-card">
                        <div class="stat-number">{total_decisions}</div>
                        <div class="stat-label">Total Decisions</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">{avg_conf * 100:.1f}%</div>
                        <div class="stat-label">Average Confidence</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">{overrides}</div>
                        <div class="stat-label">User Overrides</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-number">{override_rate:.1f}%</div>
                        <div class="stat-label">Override Rate</div>
                    </div>
                </div>

                <h3>Decisions by AI Agent Type</h3>
                <div class="stat-grid">
        """

        for agent_type, count in decisions_by_agent.items():
            formatted_agent = agent_type.replace('_', ' ').title()
            html += f"""
                    <div class="stat-card">
                        <div class="stat-number">{count}</div>
                        <div class="stat-label">{formatted_agent}</div>
                    </div>
            """

        html += """
                </div>
            </div>

            <!-- RECENT DECISIONS -->
            <div class="section">
                <h2>📝 Recent AI Decisions</h2>
        """

        for decision in decisions:
            timestamp = decision.get('timestamp', 'N/A')
            try:
                timestamp = datetime.fromisoformat(timestamp).strftime('%b %d, %Y at %I:%M %p')
            except:
                pass

            agent_type = decision.get('agent_type', 'Unknown').replace('_', ' ').title()
            model_name = decision.get('model_name', 'N/A')
            confidence = decision.get('confidence_score', 0)
            reasoning = decision.get('reasoning', 'No reasoning provided')
            overridden = decision.get('user_overridden', False)

            # Determine confidence level for badge color
            if confidence >= 0.8:
                conf_class = "confidence-high"
            elif confidence >= 0.6:
                conf_class = "confidence-medium"
            else:
                conf_class = "confidence-low"

            html += f"""
                <div class="decision-card">
                    <div class="decision-header">
                        <div class="decision-title">{agent_type}</div>
                        <div>
                            <span class="confidence-badge {conf_class}">{confidence * 100:.1f}% Confidence</span>
                            {('<span class="badge badge-override">⚠️ You Overrode This</span>' if overridden else '')}
                        </div>
                    </div>
                    <p><strong>Date & Time:</strong> {timestamp}</p>
                    <p><strong>AI Model:</strong> {model_name}</p>
                    <p><strong>Agent Type:</strong> <span class="badge badge-agent">{agent_type}</span></p>
                    <div style="margin-top: 15px;">
                        <strong>🧠 AI Reasoning:</strong>
                        <p style="margin-top: 8px; padding: 15px; background: white; border-radius: 6px; border-left: 3px solid #7a1f1f;">
                            {reasoning}
                        </p>
                    </div>
                </div>
            """

        html += """
            </div>
        """

    # EU AI Act Compliance section
    html += f"""
            <!-- EU AI ACT COMPLIANCE -->
            <div class="section">
                <h2>🇪🇺 EU AI Act Compliance</h2>
                <div class="success-box">
                    <strong>✓ This Application is Fully Compliant with the EU AI Act</strong>
                    <p style="margin-top: 10px;">We adhere to all transparency, explainability, and human oversight requirements.</p>
                </div>

                <ul class="compliance-list">
                    <li>
                        <strong>🔍 Transparency</strong>
                        <p>{ai_act.get('transparency', 'All AI decisions include reasoning')}</p>
                    </li>
                    <li>
                        <strong>📖 Explainability</strong>
                        <p>{ai_act.get('explainability', 'You can see why the AI made each recommendation')}</p>
                    </li>
                    <li>
                        <strong>👤 Human Oversight</strong>
                        <p>{ai_act.get('human_oversight', 'You can override any AI decision')}</p>
                    </li>
                    <li>
                        <strong>🎯 Accuracy</strong>
                        <p>{ai_act.get('accuracy', 'Average confidence tracked and reported')}</p>
                    </li>
                </ul>
            </div>

            <!-- YOUR RIGHTS -->
            <div class="section">
                <h2>⚖️ Your Rights Regarding AI Decisions</h2>
                <ul class="compliance-list">
                    <li>
                        <strong>Right to Explanation</strong>
                        <p>You have the right to understand why an AI system made a specific decision about you. All reasoning is provided above.</p>
                    </li>
                    <li>
                        <strong>Right to Challenge</strong>
                        <p>You can override, reject, or modify any AI recommendation. Your decisions take precedence.</p>
                    </li>
                    <li>
                        <strong>Right to Human Review</strong>
                        <p>You can request human review of any AI decision by contacting laura.redm@gmail.com</p>
                    </li>
                    <li>
                        <strong>Right to Not Be Subject to Automated Decision-Making</strong>
                        <p>All AI recommendations are suggestions only. You retain full control and can disable AI features at any time in Settings.</p>
                    </li>
                </ul>
            </div>

            <footer>
                <p><strong>Bassline Pilates</strong> | GDPR & EU AI Act Compliant</p>
                <p>Generated on {report_date}</p>
                <p>This report is for your personal records only</p>
            </footer>
        </div>
    </body>
    </html>
    """

    return html


@router.get("/api/compliance/ai-decisions")
async def get_ai_decisions(
    request: Request,
    format: str = 'html',  # 'json' or 'html'
    limit: int = 50,
    agent_type: str = None,
    user_id: str = Depends(get_current_user_id)
):
    """
    EU AI Act - Transparency Requirement
    View all AI decisions made for this user with explanations

    This allows users to understand why the AI made specific recommendations,
    fulfilling the explainability requirement of the EU AI Act.
    """

    try:
        # Build query - use admin client to bypass RLS
        query = supabase_admin.table('ai_decision_log') \
            .select('*') \
            .eq('user_id', user_id) \
            .order('timestamp', desc=True) \
            .limit(limit)

        # Filter by agent type if specified
        if agent_type:
            query = query.eq('agent_type', agent_type)

        result = query.execute()

        if not result.data:
            empty_report = {
                'user_id': user_id,
                'total_decisions': 0,
                'decisions': [],
                'statistics': {},
                'message': 'No AI decisions recorded yet',
                'ai_act_compliance': {
                    'transparency': 'All AI decisions include reasoning',
                    'explainability': 'You can see why the AI made each recommendation',
                    'human_oversight': 'You can override any AI decision',
                    'accuracy': 'No decisions recorded yet'
                }
            }

            if format == 'html':
                html_content = generate_ai_decisions_html_report(empty_report)
                return HTMLResponse(content=html_content, status_code=200)
            else:
                return empty_report

        # Calculate statistics
        total_decisions = len(result.data)
        avg_confidence = sum(d['confidence_score'] for d in result.data if d.get('confidence_score')) / total_decisions
        overrides_count = sum(1 for d in result.data if d.get('user_overridden'))
        override_rate = (overrides_count / total_decisions * 100) if total_decisions > 0 else 0

        decisions_by_agent = {}
        for decision in result.data:
            agent = decision['agent_type']
            decisions_by_agent[agent] = decisions_by_agent.get(agent, 0) + 1

        report = {
            'user_id': user_id,
            'total_decisions': total_decisions,
            'statistics': {
                'average_confidence': round(avg_confidence, 2),
                'user_overrides': overrides_count,
                'override_rate_percent': round(override_rate, 1),
                'decisions_by_agent': decisions_by_agent
            },
            'decisions': result.data,
            'ai_act_compliance': {
                'transparency': 'All AI decisions include reasoning',
                'explainability': 'You can see why the AI made each recommendation',
                'human_oversight': 'You can override any AI decision',
                'accuracy': f'Average confidence: {round(avg_confidence * 100, 1)}%'
            }
        }

        if format == 'html':
            html_content = generate_ai_decisions_html_report(report)
            return HTMLResponse(content=html_content, status_code=200)
        else:
            return report

    except Exception as e:
        print(f"Error fetching AI decisions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch AI decisions: {str(e)}"
        )


@router.get("/api/compliance/privacy-policy")
async def get_privacy_policy():
    """
    Returns the current privacy policy
    (Placeholder - should be replaced with actual policy)
    """
    return {
        'policy_version': '1.0',
        'effective_date': '2025-11-25',
        'last_updated': '2025-11-25',
        'summary': 'Bassline Pilates Privacy Policy',
        'full_policy_url': 'https://bassline.com/privacy',  # Update with real URL
        'gdpr_compliant': True,
        'eu_ai_act_compliant': True,
        'contact': 'laura.redm@gmail.com'
    }


@router.get("/api/compliance/status")
async def get_compliance_status(
    user_id: str = Depends(get_current_user_id)
):
    """
    Returns compliance status for the current user
    Shows if they have any pending data requests, etc.
    """
    return {
        'user_id': user_id,
        'compliance_status': 'active',
        'gdpr_compliant': True,
        'eu_ai_act_compliant': True,
        'data_retention_active': True,
        'can_export_data': True,
        'can_delete_account': True,
        'last_data_export': None,  # Could query ropa_audit_log for last export
        'account_age_days': 0  # Could calculate from user creation date
    }
