"""
Observability utilities - Stub for Jentic standard-agent compatibility

WORKAROUND: Jentic's standard-agent library expects utils.observability.observe
but doesn't include this module in their package distribution.

This stub provides a no-op decorator that allows Jentic's code to run without
OpenTelemetry tracing (graceful degradation).
"""

from functools import wraps
from typing import Any, Callable, Optional


def observe(_fn: Optional[Callable[..., Any]] = None, *, llm: bool = False, root: bool = False) -> Callable[..., Any]:
    """
    No-op tracing decorator for Jentic compatibility.

    This is a compatibility shim for Jentic's standard-agent library
    which expects this decorator but doesn't include it in their package.

    The decorator supports both @observe and @observe(llm=True, root=True) syntax
    but simply passes through the function without any tracing instrumentation.

    Args:
        _fn: Function to decorate (for @observe without parens)
        llm: Flag for LLM-specific tracing (ignored in stub)
        root: Flag for root span tracing (ignored in stub)

    Returns:
        Decorated function (no-op wrapper that just calls original function)
    """

    def _decorate(fn: Callable[..., Any]) -> Callable[..., Any]:
        @wraps(fn)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            # No-op: just call the original function
            return fn(*args, **kwargs)

        return wrapper

    # Support both @observe and @observe() forms
    if callable(_fn):
        return _decorate(_fn)
    return _decorate


# Stub functions for other observability features
def setup_telemetry(*args, **kwargs):
    """No-op telemetry setup (OpenTelemetry not configured)."""
    pass


def get_tracer(*args, **kwargs):
    """No-op tracer getter (OpenTelemetry not configured)."""
    return None


# Export public API
__all__ = ["observe", "setup_telemetry", "get_tracer"]
