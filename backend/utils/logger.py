"""
Logger utility - Stub for Jentic standard-agent compatibility

WORKAROUND: Jentic's standard-agent library expects utils.logger.get_logger()
but doesn't include this module in their package distribution.

This stub provides the expected interface using Python's standard logging.
"""

import logging
from typing import Optional


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """
    Get a logger instance for the given name.

    This is a compatibility shim for Jentic's standard-agent library
    which expects this function but doesn't include it in their package.

    Args:
        name: Logger name (typically __name__ from calling module)

    Returns:
        logging.Logger instance
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

    return logger
