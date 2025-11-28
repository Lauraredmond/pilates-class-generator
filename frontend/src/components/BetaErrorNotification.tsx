/**
 * Beta Error Notification Component
 *
 * Displays a non-intrusive notification when known bugs are bypassed
 * Provides transparency to beta testers about technical debt
 */

import React, { useState } from 'react';
import './BetaErrorNotification.css';

interface BetaErrorNotificationProps {
  errorType: string;
  message: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  onClose?: () => void;
  showDetails?: boolean;
}

const BetaErrorNotification: React.FC<BetaErrorNotificationProps> = ({
  errorType,
  message,
  severity,
  onClose,
  showDetails = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onClose) {
      onClose();
    }
  };

  if (isDismissed) {
    return null;
  }

  const severityConfig = {
    LOW: {
      icon: 'ℹ️',
      color: '#3498db',
      bgColor: '#ebf5fb',
      borderColor: '#3498db',
    },
    MEDIUM: {
      icon: '⚠️',
      color: '#f39c12',
      bgColor: '#fef5e7',
      borderColor: '#f39c12',
    },
    HIGH: {
      icon: '🔴',
      color: '#e74c3c',
      bgColor: '#fadbd8',
      borderColor: '#e74c3c',
    },
  };

  const config = severityConfig[severity];

  return (
    <div
      className="beta-error-notification"
      style={{
        backgroundColor: config.bgColor,
        borderLeft: `4px solid ${config.borderColor}`,
      }}
    >
      <div className="beta-error-header">
        <span className="beta-error-icon">{config.icon}</span>
        <span className="beta-error-badge">BETA</span>
        <span className="beta-error-title">Known Issue Bypassed</span>
        <button className="beta-error-close" onClick={handleDismiss}>
          ×
        </button>
      </div>

      <div className="beta-error-content">
        <p className="beta-error-message">
          <strong>Your request succeeded,</strong> but we detected a known bug that was
          automatically handled. Your data is safe and the feature works correctly.
        </p>

        {showDetails && (
          <>
            <button
              className="beta-error-toggle"
              onClick={() => setIsExpanded(!isExpanded)}
              style={{ color: config.color }}
            >
              {isExpanded ? '▼' : '▶'} Technical Details
            </button>

            {isExpanded && (
              <div className="beta-error-details">
                <div className="beta-error-detail-row">
                  <strong>Error Type:</strong>
                  <code>{errorType}</code>
                </div>
                <div className="beta-error-detail-row">
                  <strong>Severity:</strong>
                  <span
                    className="beta-error-severity-badge"
                    style={{ backgroundColor: config.color }}
                  >
                    {severity}
                  </span>
                </div>
                <div className="beta-error-detail-row">
                  <strong>Details:</strong>
                  <span className="beta-error-detail-message">{message}</span>
                </div>
                <div className="beta-error-help">
                  <p>
                    <strong>What this means:</strong> This is a known issue in the beta version.
                    We're working on a fix, but have implemented a workaround so you can continue
                    using the app normally.
                  </p>
                  <p>
                    <strong>Action required:</strong> None! Everything worked correctly despite
                    this issue. Your data has been saved and is accessible.
                  </p>
                  <p>
                    <strong>Report status:</strong> This issue has been automatically logged to
                    our bug tracker and will be fixed in a future update.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BetaErrorNotification;
