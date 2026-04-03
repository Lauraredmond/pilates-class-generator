"""
Logger utility - Stub for Jentic standard-agent compatibility

WORKAROUND: Jentic's standard-agent library expects utils.logger.get_logger()
but doesn't include this module in their package distribution.

ISSUE: Jentic uses structured logging with extra kwargs (source, tz_input, etc.)
but Python's standard logging.Logger doesn't support extra kwargs.

This stub provides a wrapper that accepts and incorporates extra kwargs.
"""

import logging
from typing import Optional, Any


class StructuredLogger(logging.LoggerAdapter):
    """
    Logger adapter that accepts structured logging kwargs

    Jentic's code calls logger.warning("msg", source=x, tz_input=y)
    but Python's standard logger doesn't support these extra kwargs.

    This adapter captures extra kwargs and adds them to the log message.
    """

    def process(self, msg, kwargs):
        """Process the logging call to extract and incorporate extra kwargs"""
        # Extract any extra kwargs that aren't standard logging params
        standard_kwargs = {'exc_info', 'stack_info', 'stacklevel', 'extra'}
        extra_data = {}

        # Separate standard logging kwargs from structured data
        for key in list(kwargs.keys()):
            if key not in standard_kwargs:
                extra_data[key] = kwargs.pop(key)

        # If there's extra structured data, add it to the message
        if extra_data:
            extra_str = ' | '.join(f'{k}={v}' for k, v in extra_data.items())
            msg = f'{msg} | {extra_str}'

        return msg, kwargs


def get_logger(name: Optional[str] = None) -> StructuredLogger:
    """
    Get a logger instance for the given name.

    This is a compatibility shim for Jentic's standard-agent library
    which expects this function but doesn't include it in their package.

    Returns a StructuredLogger that handles extra kwargs gracefully.

    Args:
        name: Logger name (typically __name__ from calling module)

    Returns:
        StructuredLogger instance (LoggerAdapter that accepts extra kwargs)
    """
    if name is None:
        name = "jentic"

    logger = logging.getLogger(name)

    # Set default level if not already configured
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)

    # Wrap in StructuredLogger adapter to handle extra kwargs
    return StructuredLogger(logger, {})
