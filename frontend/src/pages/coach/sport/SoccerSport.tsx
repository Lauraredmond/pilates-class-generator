import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Exercise {
  id: string;
  exercise_name: string;
  category: string;
  description: string;
  sport_relevance: string;
  injury_prevention: string;
  position_specific: string;
  relevance_score?: number;
  variations?: any;
  muscle_groups?: string[];
}

export function SoccerSport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
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

  useEffect(() => {
    filterExercises();
  }, [exercises, selectedCategory, searchTerm]);

  const fetchExercises = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/coach/exercises/soccer`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setExercises(response.data);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      // Fallback data for development
      setExercises([]);
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = [...exercises];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(e =>
        e.exercise_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by relevance score (highest first)
    filtered.sort((a, b) => (b.relevance_score || 3) - (a.relevance_score || 3));

    setFilteredExercises(filtered);
  };

  const categories = ['all', ...new Set(exercises.map(e => e.category))];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'Core Stability': 'bg-cyan-500',
      'Flexibility': 'bg-green-500',
      'Power & Agility': 'bg-blue-600',
      'Lower Body Strength': 'bg-indigo-500',
      'Upper Body Strength': 'bg-purple-500',
      'Balance & Coordination': 'bg-teal-500',
      'Full Body Integration': 'bg-sky-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  const renderStars = (score: number = 3) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < score ? 'text-cyan-400 fill-current' : 'text-gray-600'}`}
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-950 to-black">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cyan-400 mb-2">
            ⚽ Pilates for Soccer
          </h1>
          <p className="text-gray-300">
            Enhance your pitch performance with targeted Pilates exercises
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-black/40 backdrop-blur-sm rounded-xl p-6 mb-6 border border-blue-900/30">
          {/* Search Bar */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900/50 text-gray-100 rounded-lg border border-gray-700 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 placeholder-gray-500"
            />
            <svg
              className="absolute right-3 top-3.5 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-cyan-500 text-black shadow-lg shadow-cyan-500/30'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                }`}
              >
                {category === 'all' ? 'All Exercises' : category}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center gap-3 text-cyan-400">
                <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-lg">Loading exercises...</span>
              </div>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg">No exercises found matching your search.</p>
            </div>
          ) : (
            filteredExercises.map(exercise => (
              <div
                key={exercise.id}
                onClick={() => setSelectedExercise(exercise)}
                className="bg-black/40 backdrop-blur-sm border border-gray-800 rounded-lg p-4 hover:border-cyan-400/50 hover:bg-black/60 transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-100 group-hover:text-cyan-400 transition-colors">
                        {exercise.exercise_name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${getCategoryColor(exercise.category)}`}>
                        {exercise.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {exercise.description}
                    </p>
                    {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {exercise.muscle_groups.slice(0, 3).map(muscle => (
                          <span
                            key={muscle}
                            className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded border border-gray-700"
                          >
                            {muscle}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="ml-4 flex flex-col items-end gap-2">
                    {renderStars(exercise.relevance_score)}
                    <span className="text-xs text-gray-500">Relevance</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/coach-hub')}
            className="px-6 py-3 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
          >
            ← Back to Coach Hub
          </button>
        </div>
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-b from-gray-900 to-blue-950 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-blue-900/50">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-cyan-400 mb-2">
                    {selectedExercise.exercise_name}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full text-white ${getCategoryColor(selectedExercise.category)}`}>
                      {selectedExercise.category}
                    </span>
                    {renderStars(selectedExercise.relevance_score)}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="text-gray-400 hover:text-white text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-cyan-400 mb-2">Description</h3>
                  <p className="text-gray-300">{selectedExercise.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-cyan-400 mb-2">Soccer Performance Benefits</h3>
                  <p className="text-gray-300">{selectedExercise.sport_relevance}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-cyan-400 mb-2">Injury Prevention</h3>
                  <p className="text-gray-300">{selectedExercise.injury_prevention}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-cyan-400 mb-2">Position-Specific Notes</h3>
                  <p className="text-gray-300">{selectedExercise.position_specific}</p>
                </div>

                {selectedExercise.variations && Object.keys(selectedExercise.variations).length > 0 && (
                  <div>
                    <h3 className="font-semibold text-cyan-400 mb-2">Variations</h3>
                    {Object.entries(selectedExercise.variations).map(([key, value]) => (
                      <div key={key} className="mb-2">
                        <span className="text-gray-400 capitalize">{key.replace('_', ' ')}:</span>
                        <p className="text-gray-300 ml-2">{String(value)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedExercise.muscle_groups && selectedExercise.muscle_groups.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-cyan-400 mb-2">Muscle Groups</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedExercise.muscle_groups.map(muscle => (
                        <span
                          key={muscle}
                          className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm border border-gray-700"
                        >
                          {muscle}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedExercise(null)}
                  className="px-6 py-3 bg-cyan-500 text-black font-semibold rounded-lg hover:bg-cyan-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}