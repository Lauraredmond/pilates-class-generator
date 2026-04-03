/**
 * MuscleBalanceTracker Component
 * Displays horizontal bar chart showing muscle group balance
 * Warns if imbalance detected
 */

import { useMemo } from 'react';
import { Card, CardHeader, CardBody, CardTitle } from '../ui/Card';
import { useStore } from '../../store/useStore';

interface MuscleBarProps {
  label: string;
  percentage: number;
  color: string;
}

function MuscleBar({ label, percentage, color }: MuscleBarProps) {
  const isImbalanced = percentage > 40;

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-semibold text-cream">{label}</span>
        <span
          className={`text-xs font-semibold ${isImbalanced ? 'text-yellow-400' : 'text-cream/60'}`}
        >
          {percentage}%
        </span>
      </div>
      <div className="relative h-6 bg-burgundy-dark rounded-full overflow-hidden border border-cream/20">
        <div
          className={`absolute inset-y-0 left-0 ${color} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        >
          {percentage > 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-bold text-white drop-shadow">
                {percentage > 10 && `${percentage}%`}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function MuscleBalanceTracker() {
  const calculateMuscleBalance = useStore((state) => state.calculateMuscleBalance);
  const currentClass = useStore((state) => state.currentClass);

  const balance = useMemo(() => {
    return calculateMuscleBalance();
  }, [currentClass, calculateMuscleBalance]);

  const muscleGroups = [
    { key: 'core', label: 'Core', color: 'bg-gradient-to-r from-purple-500 to-purple-600' },
    { key: 'legs', label: 'Legs', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { key: 'arms', label: 'Arms', color: 'bg-gradient-to-r from-green-500 to-green-600' },
    { key: 'back', label: 'Back', color: 'bg-gradient-to-r from-orange-500 to-orange-600' },
    { key: 'fullBody', label: 'Full Body', color: 'bg-gradient-to-r from-pink-500 to-pink-600' },
  ];

  const hasImbalance = Object.values(balance).some((value) => value > 40);
  const isEmpty = !currentClass || currentClass.movements.length === 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Muscle Balance</CardTitle>
          {hasImbalance && !isEmpty && (
            <span className="text-xs px-2 py-1 bg-yellow-600/20 text-yellow-400 rounded-full">
              Imbalanced
            </span>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {isEmpty ? (
          <div className="text-center py-8 text-cream/40">
            <svg
              className="w-12 h-12 mx-auto mb-2 opacity-40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <p className="text-sm">Add movements to see muscle balance</p>
          </div>
        ) : (
          <>
            {muscleGroups.map((group) => (
              <MuscleBar
                key={group.key}
                label={group.label}
                percentage={balance[group.key as keyof typeof balance]}
                color={group.color}
              />
            ))}

            {hasImbalance && (
              <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-600/40 rounded-lg">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm text-yellow-400 font-semibold mb-1">Imbalance Detected</p>
                    <p className="text-xs text-yellow-400/80">
                      One or more muscle groups exceed 40% of the class. Consider adding variety for
                      a more balanced workout.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!hasImbalance && (
              <div className="mt-4 p-3 bg-green-600/20 border border-green-600/40 rounded-lg">
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm text-green-400">Well-balanced muscle distribution</p>
                </div>
              </div>
            )}
          </>
        )}
      </CardBody>
    </Card>
  );
}
