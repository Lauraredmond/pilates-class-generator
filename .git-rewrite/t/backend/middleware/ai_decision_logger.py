"""
AI Decision Logger - EU AI Act Compliance
Logs all AI decisions with reasoning and explainability
"""

from datetime import datetime
from typing import Dict, Any, Optional
from utils.supabase_admin import supabase_admin  # Use admin client to bypass RLS for logging


class AIDecisionLogger:
    """EU AI Act compliance - Log all AI decisions with reasoning"""

    @staticmethod
    async def log_decision(
        user_id: str,
        agent_type: str,  # 'sequence_agent', 'music_agent', 'meditation_agent', 'research_agent'
        model_name: str,
        input_parameters: Dict[str, Any],
        output_result: Dict[str, Any],
        reasoning: str,
        confidence_score: float,
        model_version: Optional[str] = None,
        safety_validated: bool = True,
        processing_time_ms: Optional[int] = None,
        tokens_used: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Log an AI decision to the decision log

        Args:
            user_id: UUID of the user for whom the decision was made
            agent_type: Which AI agent made the decision
            model_name: Name of the AI model used (e.g., 'gpt-4')
            input_parameters: Complete input that was sent to the AI
            output_result: Complete output from the AI
            reasoning: Human-readable explanation of why this decision was made
            confidence_score: Model's confidence in the decision (0-1)
            model_version: Version of the model if known
            safety_validated: Whether output passed safety validation
            processing_time_ms: How long the AI took to respond
            tokens_used: Number of tokens used (for cost tracking)

        Returns:
            The created log entry or None if logging failed
        """

        log_entry = {
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat(),
            'agent_type': agent_type,
            'model_name': model_name,
            'model_version': model_version,
            'input_parameters': input_parameters,
            'output_result': output_result,
            'reasoning': reasoning,
            'confidence_score': min(max(confidence_score, 0.0), 1.0),  # Clamp to 0-1
            'safety_validated': safety_validated,
            'user_overridden': False,
            'processing_time_ms': processing_time_ms,
            'tokens_used': tokens_used,
            'compliance_flags': {
                'bias_detected': False,
                'safety_concern': not safety_validated
            }
        }

        try:
            # Use service role key to bypass RLS for logging
            result = supabase_admin.table('ai_decision_log').insert(log_entry).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"⚠️  AI decision logging failed: {e}")
            # In production, send to error monitoring service
            return None

    @staticmethod
    async def log_user_override(decision_id: str, override_reason: str) -> Optional[Dict[str, Any]]:
        """
        Log when a user overrides an AI decision

        This is important for detecting systematic issues with AI recommendations.
        If many users override the same type of decision, it indicates the AI
        needs retraining or adjustments.

        Args:
            decision_id: UUID of the decision being overridden
            override_reason: Why the user rejected the AI's suggestion

        Returns:
            The updated log entry or None if update failed
        """
        try:
            result = supabase_admin.table('ai_decision_log').update({
                'user_overridden': True,
                'override_reason': override_reason
            }).eq('id', decision_id).execute()

            return result.data[0] if result.data else None
        except Exception as e:
            print(f"⚠️  Failed to log user override: {e}")
            return None

    @staticmethod
    async def log_sequence_generation(
        user_id: str,
        input_params: Dict[str, Any],
        generated_sequence: Dict[str, Any],
        reasoning: str,
        model_name: str = 'sequence_agent_v1',
        confidence: float = 0.85
    ):
        """
        Convenience method for logging sequence generation

        Args:
            user_id: User requesting the sequence
            input_params: Duration, difficulty, focus areas, etc.
            generated_sequence: The movements selected
            reasoning: Why these movements were selected
            model_name: Name of the sequence generation model
            confidence: Confidence in the sequence quality
        """
        await AIDecisionLogger.log_decision(
            user_id=user_id,
            agent_type='sequence_agent',
            model_name=model_name,
            input_parameters=input_params,
            output_result=generated_sequence,
            reasoning=reasoning,
            confidence_score=confidence,
            safety_validated=True  # Sequence agent validates against safety rules
        )

    @staticmethod
    async def log_music_recommendation(
        user_id: str,
        class_details: Dict[str, Any],
        recommended_music: Dict[str, Any],
        reasoning: str,
        model_name: str = 'music_agent_v1',
        confidence: float = 0.90
    ):
        """
        Convenience method for logging music recommendations

        Args:
            user_id: User receiving the recommendation
            class_details: Class duration, intensity, focus
            recommended_music: Music tracks/playlists selected
            reasoning: Why this music was selected
            model_name: Name of the music recommendation model
            confidence: Confidence in the recommendation
        """
        await AIDecisionLogger.log_decision(
            user_id=user_id,
            agent_type='music_agent',
            model_name=model_name,
            input_parameters=class_details,
            output_result=recommended_music,
            reasoning=reasoning,
            confidence_score=confidence,
            safety_validated=True
        )

    @staticmethod
    async def log_meditation_generation(
        user_id: str,
        meditation_params: Dict[str, Any],
        generated_script: Dict[str, Any],
        reasoning: str,
        model_name: str = 'meditation_agent_v1',
        confidence: float = 0.88
    ):
        """
        Convenience method for logging meditation script generation

        Args:
            user_id: User receiving the meditation
            meditation_params: Duration, theme, intensity
            generated_script: The meditation script text
            reasoning: Why this script was selected
            model_name: Name of the meditation model
            confidence: Confidence in the script quality
        """
        await AIDecisionLogger.log_decision(
            user_id=user_id,
            agent_type='meditation_agent',
            model_name=model_name,
            input_parameters=meditation_params,
            output_result=generated_script,
            reasoning=reasoning,
            confidence_score=confidence,
            safety_validated=True
        )

    @staticmethod
    async def log_research_results(
        user_id: str,
        research_query: Dict[str, Any],
        research_results: Dict[str, Any],
        reasoning: str,
        sources: list,
        model_name: str = 'research_agent_v1',
        confidence: float = 0.75
    ):
        """
        Convenience method for logging MCP research results

        Args:
            user_id: User who requested research
            research_query: What was searched for
            research_results: Findings from web research
            reasoning: Why these sources were selected
            sources: List of URLs consulted
            model_name: Name of the research model
            confidence: Confidence in the research quality
        """
        # Include sources in the output for transparency
        research_results_with_sources = {
            **research_results,
            'sources': sources,
            'source_count': len(sources)
        }

        await AIDecisionLogger.log_decision(
            user_id=user_id,
            agent_type='research_agent',
            model_name=model_name,
            input_parameters=research_query,
            output_result=research_results_with_sources,
            reasoning=reasoning,
            confidence_score=confidence,
            safety_validated=True  # Research results are validated for quality
        )


# Convenience alias
log_ai_decision = AIDecisionLogger.log_decision
