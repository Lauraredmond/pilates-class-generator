"""
EU AI Act Compliance Utilities
Logging and monitoring for AI agent decisions
"""

import os
import uuid
from typing import Dict, Any, Optional
from datetime import datetime
from loguru import logger

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


class ComplianceLogger:
    """
    EU AI Act compliance logger
    Logs all AI agent decisions to database for audit trail
    """

    def __init__(self):
        """Initialize Supabase client for compliance logging"""
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')

        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not found. Compliance logging disabled.")
            self.supabase = None
        else:
            self.supabase: Optional[Client] = create_client(supabase_url, supabase_key)

    async def log_ai_decision(
        self,
        agent_type: str,
        user_id: str,
        input_data: Dict[str, Any],
        output_data: Dict[str, Any],
        reasoning: str,
        confidence: float = 1.0,
        model_used: str = "rule-based",
        processing_time_ms: Optional[float] = None
    ) -> str:
        """
        Log AI agent decision to database

        Args:
            agent_type: Type of agent making decision (sequence_validator, etc.)
            user_id: User ID making the request
            input_data: Input parameters to the agent
            output_data: Agent's output/decision
            reasoning: Human-readable explanation of decision
            confidence: Confidence score (0.0-1.0)
            model_used: Model/algorithm used
            processing_time_ms: Processing time in milliseconds

        Returns:
            Decision ID (UUID)
        """
        decision_id = str(uuid.uuid4())

        if not self.supabase:
            logger.warning("Supabase not initialized. Skipping compliance logging.")
            return decision_id

        try:
            # Prepare log entry
            log_entry = {
                'id': decision_id,
                'agent_type': agent_type,
                'user_id': user_id,
                'timestamp': datetime.now().isoformat(),
                'input_parameters': input_data,
                'output_data': output_data,
                'confidence_score': confidence,
                'reasoning': reasoning,
                'model_used': model_used,
                'success': True
            }

            if processing_time_ms is not None:
                log_entry['processing_time_ms'] = processing_time_ms

            # Insert into ai_decision_log table
            self.supabase.table('ai_decision_log').insert(log_entry).execute()

            logger.info(f"Logged AI decision {decision_id} | Agent: {agent_type}")

            return decision_id

        except Exception as e:
            logger.error(f"Failed to log AI decision: {e}")
            return decision_id

    async def log_validation_result(
        self,
        user_id: str,
        movements: list,
        validation_result: Dict[str, Any],
        processing_time_ms: Optional[float] = None
    ) -> str:
        """
        Convenience method for logging sequence validation decisions

        Args:
            user_id: User ID making the request
            movements: List of movements being validated
            validation_result: Validation result dictionary
            processing_time_ms: Processing time in milliseconds

        Returns:
            Decision ID
        """
        movement_names = [m.get('name', m.get('movement_name', 'Unknown')) for m in movements]

        reasoning_parts = []
        if validation_result.get('violations'):
            reasoning_parts.append(f"Violations: {', '.join(validation_result['violations'])}")
        if validation_result.get('warnings'):
            reasoning_parts.append(f"Warnings: {', '.join(validation_result['warnings'])}")
        if not validation_result.get('violations'):
            reasoning_parts.append("All safety rules passed")

        reasoning = "; ".join(reasoning_parts) or "Sequence validated"

        return await self.log_ai_decision(
            agent_type="sequence_validator",
            user_id=user_id,
            input_data={
                "movements": movement_names,
                "movement_count": len(movements)
            },
            output_data=validation_result,
            reasoning=reasoning,
            confidence=1.0,  # Rule-based validation has 100% confidence
            model_used="rule-based-validator",
            processing_time_ms=processing_time_ms
        )


# Global instance
compliance_logger = ComplianceLogger()
