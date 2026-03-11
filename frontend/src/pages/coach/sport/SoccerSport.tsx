import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/ui/Button';
// TODO: Implement API endpoints for coach functionality
// import axios from 'axios';
// const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Exercise {
  id: string;
  exercise_name: string;
  category: string;
  description: string;
  sport_relevance: string;
  injury_prevention: string;
  position_specific: string;
  variations?: any;
  muscle_groups?: string[];
}

export function SoccerSport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);

  // Redirect if not a coach or admin
  if (!user || (user.user_type !== 'coach' && user.user_type !== 'admin')) {
    navigate('/');
    return null;
  }

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      // TODO: Create API endpoint for fetching sport exercises
      // For now, using empty array until backend endpoint is created
      // const response = await axios.get(`${API_BASE_URL}/api/coach/exercises/soccer`);
      // setExercises(response.data);
      setExercises([]);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', ...new Set(exercises.map(e => e.category))];
  const filteredExercises = selectedCategory === 'all'
    ? exercises
    : exercises.filter(e => e.category === selectedCategory);

  return (
    <div className="min-h-screen bg-burgundy">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cream mb-2">Soccer Programme</h1>
          <p className="text-cream/70">
            Pilates exercises optimized for soccer performance and injury prevention
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-cream rounded-lg shadow-xl p-6">
          {/* Category Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedCategory === category
                      ? 'bg-burgundy text-cream'
                      : 'bg-white text-burgundy border border-burgundy/20 hover:bg-burgundy/10'
                  }`}
                >
                  {category === 'all' ? 'All Exercises' : category}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Grid */}
          {loading ? (
            <div className="text-center py-8 text-charcoal/60">Loading exercises...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredExercises.map(exercise => (
                <div
                  key={exercise.id}
                  className="bg-white rounded-lg shadow-card p-4 border border-charcoal/10 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedExercise(exercise)}
                >
                  <h3 className="font-semibold text-burgundy mb-2">
                    {exercise.exercise_name}
                  </h3>
                  <p className="text-xs text-charcoal/60 mb-2">
                    Category: {exercise.category}
                  </p>
                  <p className="text-sm text-charcoal/80 line-clamp-3">
                    {exercise.description}
                  </p>
                  {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {exercise.muscle_groups.slice(0, 3).map(muscle => (
                        <span
                          key={muscle}
                          className="text-xs bg-burgundy/10 text-burgundy px-2 py-1 rounded"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Session Builder Section */}
          <div className="mt-8 p-4 bg-burgundy/5 rounded-lg border border-burgundy/20">
            <h3 className="text-sm font-semibold text-burgundy mb-2">
              Coming Soon: Session Builder
            </h3>
            <p className="text-xs text-charcoal/70">
              Build custom training sessions for your soccer team. Select exercises, set durations,
              and save sessions for different training focuses: pre-match, recovery, position-specific,
              or injury prevention.
            </p>
          </div>

          {/* Back Button */}
          <div className="mt-8 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/coach-hub')}
              className="text-burgundy hover:text-burgundy/80"
            >
              ← Back to Coach Hub
            </Button>
          </div>
        </div>
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-cream rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-burgundy">
                  {selectedExercise.exercise_name}
                </h2>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-burgundy hover:text-burgundy/80 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-burgundy mb-1">Exercise Description</h3>
                  <p className="text-charcoal/80">{selectedExercise.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-burgundy mb-1">Soccer Performance Benefits</h3>
                  <p className="text-charcoal/80">{selectedExercise.sport_relevance}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-burgundy mb-1">Injury Prevention</h3>
                  <p className="text-charcoal/80">{selectedExercise.injury_prevention}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-burgundy mb-1">Position-Specific Notes</h3>
                  <p className="text-charcoal/80">{selectedExercise.position_specific}</p>
                </div>

                {selectedExercise.muscle_groups && selectedExercise.muscle_groups.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-burgundy mb-1">Target Muscle Groups</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.muscle_groups.map(muscle => (
                        <span
                          key={muscle}
                          className="bg-burgundy/10 text-burgundy px-3 py-1 rounded-full text-sm"
                        >
                          {muscle.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="primary"
                  onClick={() => setSelectedExercise(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}