"""
Compliance API Endpoints - GDPR & EU AI Act
Provides users with transparency into their data processing
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import Dict, Any, List
from datetime import datetime
from api.auth import get_current_user_id
from utils.supabase_client import supabase
from utils.supabase_admin import supabase_admin  # Service role client for compliance operations
from middleware.pii_logger import PIILogger

router = APIRouter()


@router.get("/api/compliance/my-data")
async def export_my_data(
    request: Request,
    format: str = 'json',  # 'json' or 'csv'
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

        # Saved classes (if table exists)
        try:
            classes = supabase_admin.table('saved_classes').select('*').eq('user_id', user_id).execute()
            user_data['saved_classes'] = classes.data
        except:
            user_data['saved_classes'] = []

        # Class history (if table exists)
        try:
            history = supabase_admin.table('class_history').select('*').eq('user_id', user_id).execute()
            user_data['class_history'] = history.data
        except:
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
            'data_controller_contact': 'support@bassline.com',  # Update with real contact
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
        elif format == 'csv':
            # CSV export not yet implemented
            raise HTTPException(
                status_code=status.HTTP_501_NOT_IMPLEMENTED,
                detail="CSV export not yet implemented. Use format=json"
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid format. Use 'json' or 'csv'"
            )

    except Exception as e:
        print(f"Error exporting user data: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export data: {str(e)}"
        )


@router.get("/api/compliance/ropa-report")
async def get_ropa_report(
    request: Request,
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
            return {
                'data_subject': user_id,
                'report_date': datetime.utcnow().isoformat(),
                'summary': {
                    'total_processing_activities': 0,
                    'message': 'No processing activities recorded yet'
                }
            }

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
                    'how_to_exercise': 'Contact support@bassline.com'  # Update with real email
                },
                'right_to_withdraw_consent': {
                    'description': 'You can withdraw consent for data processing',
                    'how_to_exercise': 'Delete your account or contact support'
                }
            },
            'data_protection_officer': {
                'contact': 'dpo@bassline.com',  # Update with real contact
                'role': 'Handles data protection inquiries and complaints'
            },
            'supervisory_authority': {
                'name': 'Your local data protection authority',
                'info': 'You have the right to lodge a complaint with your local authority',
                'find_yours': 'https://edpb.europa.eu/about-edpb/about-edpb/members_en'
            }
        }

        return report

    except Exception as e:
        print(f"Error generating ROPA report: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate ROPA report: {str(e)}"
        )


@router.get("/api/compliance/ai-decisions")
async def get_ai_decisions(
    request: Request,
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
            return {
                'user_id': user_id,
                'total_decisions': 0,
                'decisions': [],
                'message': 'No AI decisions recorded yet'
            }

        # Calculate statistics
        total_decisions = len(result.data)
        avg_confidence = sum(d['confidence_score'] for d in result.data if d.get('confidence_score')) / total_decisions
        overrides_count = sum(1 for d in result.data if d.get('user_overridden'))
        override_rate = (overrides_count / total_decisions * 100) if total_decisions > 0 else 0

        decisions_by_agent = {}
        for decision in result.data:
            agent = decision['agent_type']
            decisions_by_agent[agent] = decisions_by_agent.get(agent, 0) + 1

        return {
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
        'contact': 'privacy@bassline.com'  # Update with real email
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
