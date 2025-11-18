"""
Base Agent Class with EU AI Act Compliance
All AI agents inherit from this class to ensure:
- Decision transparency
- Bias monitoring
- Audit trail
- Graceful degradation
"""

import os
import time
import uuid
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from datetime import datetime
from loguru import logger

from supabase import create_client, Client
from dotenv import load_dotenv

# Optional OpenAI import - gracefully degrades to template variation if not installed
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    logger_imported = False
    # Note: logger will be available after imports, so we'll log this in __init__

load_dotenv()


class BaseAgent(ABC):
    """
    Base class for all AI agents
    Implements EU AI Act compliance requirements
    """

    def __init__(
        self,
        agent_type: str,
        model_name: str = "gpt-3.5-turbo",
        strictness_level: str = "guided"
    ):
        """
        Initialize base agent

        Args:
            agent_type: Type of agent (sequence, music, meditation, research)
            model_name: LLM model to use
            strictness_level: strict, guided, or autonomous
        """
        self.agent_type = agent_type
        self.model_name = model_name
        self.strictness_level = strictness_level

        # Initialize Supabase for decision logging
        supabase_url = os.getenv('SUPABASE_URL')
        supabase_key = os.getenv('SUPABASE_KEY')

        if not supabase_url or not supabase_key:
            logger.warning("Supabase credentials not found. Decision logging disabled.")
            self.supabase = None
        else:
            self.supabase: Optional[Client] = create_client(supabase_url, supabase_key)

        # Initialize OpenAI client for LLM capabilities
        if not OPENAI_AVAILABLE:
            logger.warning("openai package not installed. LLM features disabled. Using template-based variation.")
            self.openai_client = None
        else:
            openai_api_key = os.getenv('OPENAI_API_KEY')
            if not openai_api_key or openai_api_key == 'sk-YOUR_OPENAI_API_KEY_HERE':
                logger.warning("OpenAI API key not configured. LLM features disabled. Using template-based variation.")
                self.openai_client = None
            else:
                self.openai_client = OpenAI(api_key=openai_api_key)
                logger.info(f"OpenAI client initialized with model: {model_name}")

        # Bias monitoring thresholds
        self.confidence_threshold = {
            "strict": 0.9,
            "guided": 0.7,
            "autonomous": 0.5
        }

        logger.info(
            f"Initialized {agent_type} agent | "
            f"Model: {model_name} | "
            f"Strictness: {strictness_level}"
        )

    async def process(
        self,
        user_id: str,
        inputs: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Main processing method with compliance logging

        Args:
            user_id: User making the request
            inputs: Input parameters for the agent

        Returns:
            Dict with agent output and decision metadata
        """
        decision_id = str(uuid.uuid4())
        start_time = time.time()

        try:
            # Validate inputs
            self._validate_inputs(inputs)

            # Process with specific agent logic
            output_data = await self._process_internal(inputs)

            # Calculate confidence score
            confidence = self._calculate_confidence(output_data)

            # Check if confidence meets threshold
            if confidence < self.confidence_threshold[self.strictness_level]:
                logger.warning(
                    f"Low confidence ({confidence:.2f}) for {self.agent_type} agent. "
                    f"Threshold: {self.confidence_threshold[self.strictness_level]}"
                )
                output_data["warning"] = "Low confidence prediction"

            # Calculate processing time
            processing_time_ms = (time.time() - start_time) * 1000

            # Generate reasoning explanation
            reasoning = self._generate_reasoning(inputs, output_data)

            # Log decision to database (EU AI Act compliance)
            await self._log_decision(
                decision_id=decision_id,
                user_id=user_id,
                inputs=inputs,
                output_data=output_data,
                confidence=confidence,
                reasoning=reasoning,
                processing_time_ms=processing_time_ms
            )

            # Return result with metadata
            return {
                "success": True,
                "data": output_data,
                "metadata": {
                    "decision_id": decision_id,
                    "agent_type": self.agent_type,
                    "model_used": self.model_name,
                    "confidence_score": confidence,
                    "reasoning": reasoning,
                    "processing_time_ms": processing_time_ms,
                    "strictness_level": self.strictness_level,
                    "timestamp": datetime.now().isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Agent processing error: {e}", exc_info=True)

            # Log failure
            await self._log_failure(
                decision_id=decision_id,
                user_id=user_id,
                inputs=inputs,
                error=str(e),
                processing_time_ms=(time.time() - start_time) * 1000
            )

            # Graceful degradation
            fallback = await self._get_fallback(inputs)

            return {
                "success": False,
                "error": str(e),
                "fallback_data": fallback,
                "metadata": {
                    "decision_id": decision_id,
                    "agent_type": self.agent_type,
                    "error_handled": True,
                    "timestamp": datetime.now().isoformat()
                }
            }

    @abstractmethod
    async def _process_internal(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Internal processing logic (implemented by subclasses)

        Args:
            inputs: Validated input parameters

        Returns:
            Dict with agent-specific output
        """
        pass

    @abstractmethod
    def _validate_inputs(self, inputs: Dict[str, Any]) -> None:
        """
        Validate input parameters (implemented by subclasses)

        Args:
            inputs: Input parameters to validate

        Raises:
            ValueError: If inputs are invalid
        """
        pass

    @abstractmethod
    def _calculate_confidence(self, output_data: Dict[str, Any]) -> float:
        """
        Calculate confidence score for the output

        Args:
            output_data: Generated output

        Returns:
            Confidence score between 0.0 and 1.0
        """
        pass

    @abstractmethod
    def _generate_reasoning(
        self,
        inputs: Dict[str, Any],
        output_data: Dict[str, Any]
    ) -> str:
        """
        Generate human-readable explanation of the decision

        Args:
            inputs: Input parameters
            output_data: Generated output

        Returns:
            Human-readable reasoning string
        """
        pass

    @abstractmethod
    async def _get_fallback(self, inputs: Dict[str, Any]) -> Dict[str, Any]:
        """
        Provide fallback response when processing fails

        Args:
            inputs: Original input parameters

        Returns:
            Safe fallback output
        """
        pass

    async def _log_decision(
        self,
        decision_id: str,
        user_id: str,
        inputs: Dict[str, Any],
        output_data: Dict[str, Any],
        confidence: float,
        reasoning: str,
        processing_time_ms: float
    ) -> None:
        """
        Log agent decision to database for EU AI Act compliance

        Args:
            decision_id: Unique decision identifier
            user_id: User who made the request
            inputs: Input parameters
            output_data: Generated output
            confidence: Confidence score
            reasoning: Human-readable explanation
            processing_time_ms: Processing time in milliseconds
        """
        if not self.supabase:
            logger.warning("Supabase not initialized. Skipping decision logging.")
            return

        try:
            # Log to ai_decision_log table
            self.supabase.table('ai_decision_log').insert({
                'id': decision_id,
                'agent_type': self.agent_type,
                'user_id': user_id,
                'timestamp': datetime.now().isoformat(),
                'input_parameters': inputs,
                'output_data': output_data,
                'confidence_score': confidence,
                'reasoning': reasoning,
                'model_used': self.model_name,
                'processing_time_ms': processing_time_ms,
                'strictness_level': self.strictness_level,
                'success': True
            }).execute()

            logger.info(f"Logged decision {decision_id} to database")

        except Exception as e:
            logger.error(f"Failed to log decision: {e}")

    async def _log_failure(
        self,
        decision_id: str,
        user_id: str,
        inputs: Dict[str, Any],
        error: str,
        processing_time_ms: float
    ) -> None:
        """
        Log agent failure

        Args:
            decision_id: Unique decision identifier
            user_id: User who made the request
            inputs: Input parameters
            error: Error message
            processing_time_ms: Processing time in milliseconds
        """
        if not self.supabase:
            return

        try:
            self.supabase.table('ai_decision_log').insert({
                'id': decision_id,
                'agent_type': self.agent_type,
                'user_id': user_id,
                'timestamp': datetime.now().isoformat(),
                'input_parameters': inputs,
                'output_data': {'error': error},
                'confidence_score': 0.0,
                'reasoning': f"Processing failed: {error}",
                'model_used': self.model_name,
                'processing_time_ms': processing_time_ms,
                'strictness_level': self.strictness_level,
                'success': False
            }).execute()

        except Exception as e:
            logger.error(f"Failed to log failure: {e}")

    async def generate_narrative_variations(
        self,
        texts: List[str],
        variation_type: str = "general",
        preserve_meaning: bool = True
    ) -> List[str]:
        """
        Use LLM to generate varied phrasing while preserving meaning

        Args:
            texts: List of text strings to vary
            variation_type: Type of variation (setup, cue, muscle, general)
            preserve_meaning: If True, preserve exact meaning (only vary phrasing)

        Returns:
            List of varied text strings (same length as input)
        """
        if not self.openai_client:
            logger.warning("OpenAI client not initialized. Returning original texts.")
            return texts

        if not texts:
            return []

        try:
            # Build prompt based on variation type
            if variation_type == "setup":
                instruction = "Rephrase these Pilates setup instructions with natural variation while keeping the exact same meaning and safety information. Use conversational language suitable for a teleprompter."
            elif variation_type == "cue":
                instruction = "Rephrase these Pilates teaching cues with slight variation while preserving the exact teaching points. Keep them clear and actionable."
            elif variation_type == "muscle":
                instruction = "Rephrase these muscle group descriptions with natural variation. Keep them anatomically accurate but conversational."
            else:
                instruction = "Rephrase these texts with slight natural variation while preserving meaning exactly."

            # Format texts for the prompt
            numbered_texts = "\n".join([f"{i+1}. {text}" for i, text in enumerate(texts)])

            prompt = f"""{instruction}

Original texts:
{numbered_texts}

Provide {len(texts)} varied versions, one per line, numbered 1-{len(texts)}. Preserve all safety information and anatomical accuracy."""

            # Call OpenAI API
            response = self.openai_client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {"role": "system", "content": "You are a Pilates instruction expert. You rephrase teaching content with natural variation while preserving exact meaning and safety information."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,  # Moderate creativity
                max_tokens=500
            )

            # Parse response
            response_text = response.choices[0].message.content.strip()

            # Extract numbered lines
            varied_texts = []
            for line in response_text.split('\n'):
                line = line.strip()
                if line and any(line.startswith(f"{i+1}.") for i in range(len(texts))):
                    # Remove number prefix
                    text = line.split('.', 1)[1].strip() if '.' in line else line
                    varied_texts.append(text)

            # Ensure we have the right number of results
            if len(varied_texts) != len(texts):
                logger.warning(f"LLM returned {len(varied_texts)} variations, expected {len(texts)}. Using originals.")
                return texts

            logger.info(f"Generated {len(varied_texts)} narrative variations using {self.model_name}")
            return varied_texts

        except Exception as e:
            logger.error(f"Error generating narrative variations: {e}")
            # Fallback to original texts
            return texts

    def get_agent_info(self) -> Dict[str, Any]:
        """Get agent configuration information"""
        return {
            "agent_type": self.agent_type,
            "model_name": self.model_name,
            "strictness_level": self.strictness_level,
            "confidence_threshold": self.confidence_threshold[self.strictness_level],
            "llm_enabled": self.openai_client is not None
        }
