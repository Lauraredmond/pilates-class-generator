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

  // New state for tabs and selection
  const [activeTab, setActiveTab] = useState<'library' | 'session'>('library');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

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
      'Core Stability': 'bg-cyan-600',
      'Flexibility': 'bg-green-600',
      'Power & Agility': 'bg-blue-600',
      'Lower Body Strength': 'bg-indigo-600',
      'Upper Body Strength': 'bg-purple-600',
      'Balance & Coordination': 'bg-teal-600',
      'Full Body Integration': 'bg-sky-600'
    };
    return colors[category] || 'bg-charcoal';
  };

  const renderStars = (score: number = 3) => {
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i < score ? 'text-yellow-500 fill-current' : 'text-charcoal/20'}`}
            viewBox="0 0 24 24"
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
    );
  };

  // Helper functions for selection and expansion
  const toggleExerciseSelection = (exerciseId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const newSelected = new Set(selectedExercises);
    if (newSelected.has(exerciseId)) {
      newSelected.delete(exerciseId);
    } else {
      newSelected.add(exerciseId);
    }
    setSelectedExercises(newSelected);
  };

  const toggleExerciseExpansion = (exerciseId: string) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  const removeFromSession = (exerciseId: string) => {
    const newSelected = new Set(selectedExercises);
    newSelected.delete(exerciseId);
    setSelectedExercises(newSelected);
  };

  const getSelectedExercisesList = () => {
    return exercises.filter(e => selectedExercises.has(e.id));
  };

  return (
    <div className="min-h-screen bg-burgundy">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cream mb-2">
            ⚽ Pilates for Soccer
          </h1>
          <p className="text-cream/80">
            Enhance your pitch performance with targeted Pilates exercises
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-cream rounded-xl shadow-xl p-6">
          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('library')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'library'
                  ? 'bg-burgundy text-cream shadow-md'
                  : 'bg-white text-charcoal border border-charcoal/20 hover:bg-burgundy/10'
              }`}
            >
              Library
            </button>
            <button
              onClick={() => setActiveTab('session')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'session'
                  ? 'bg-burgundy text-cream shadow-md'
                  : 'bg-white text-charcoal border border-charcoal/20 hover:bg-burgundy/10'
              }`}
            >
              Session Builder {selectedExercises.size > 0 && `(${selectedExercises.size})`}
            </button>
          </div>

          {/* Library Tab */}
          {activeTab === 'library' && (
            <>
          {/* Search and Filters */}
          <div className="mb-6">
            {/* Search Bar */}
            <div className="relative mb-4">
              <input
                type="text"
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 bg-white text-charcoal rounded-lg border border-charcoal/20 focus:border-burgundy focus:outline-none focus:ring-2 focus:ring-burgundy/20 placeholder-charcoal/50"
              />
              <svg
                className="absolute right-3 top-3.5 w-5 h-5 text-charcoal/40"
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
                      ? 'bg-burgundy text-cream shadow-md'
                      : 'bg-white text-charcoal border border-charcoal/20 hover:bg-burgundy/10'
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
                <div className="inline-flex items-center gap-3 text-burgundy">
                  <svg className="animate-spin h-8 w-8" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-lg">Loading exercises...</span>
                </div>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-charcoal/60 text-lg">No exercises found matching your search.</p>
              </div>
            ) : (
              filteredExercises.map(exercise => (
                <div key={exercise.id} className="bg-white rounded-lg border border-charcoal/10 overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedExercises.has(exercise.id)}
                        onChange={(e) => toggleExerciseSelection(exercise.id, e)}
                        className="mt-1 h-5 w-5 rounded border-charcoal/30 text-burgundy focus:ring-burgundy"
                      />

                      {/* Exercise Content */}
                      <div className="flex-1">
                        <div
                          onClick={() => toggleExerciseExpansion(exercise.id)}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-burgundy hover:text-burgundy/80 transition-colors">
                              {exercise.exercise_name}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${getCategoryColor(exercise.category)}`}>
                              {exercise.category}
                            </span>
                          </div>

                          {/* Collapsed View */}
                          {expandedExercise !== exercise.id && (
                            <p className="text-sm text-charcoal/70 line-clamp-2">
                              {exercise.description}
                            </p>
                          )}
                        </div>

                        {/* Expanded View */}
                        {expandedExercise === exercise.id && (
                          <div className="space-y-3 mt-3 pb-2">
                            <div>
                              <h4 className="font-semibold text-burgundy text-sm mb-1">Pilates Technique</h4>
                              <p className="text-sm text-charcoal/80">{exercise.description}</p>
                            </div>

                            <div>
                              <h4 className="font-semibold text-burgundy text-sm mb-1">Soccer Connection</h4>
                              <p className="text-sm text-charcoal/80">{exercise.sport_relevance}</p>
                            </div>

                            {exercise.variations?.u12_modification && (
                              <div>
                                <h4 className="font-semibold text-burgundy text-sm mb-1">U12 Modifications</h4>
                                <p className="text-sm text-charcoal/80">{exercise.variations.u12_modification}</p>
                              </div>
                            )}

                            {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-burgundy text-sm mb-1">Muscle Groups</h4>
                                <div className="flex flex-wrap gap-1">
                                  {exercise.muscle_groups.map(muscle => (
                                    <span
                                      key={muscle}
                                      className="text-xs bg-burgundy/10 text-burgundy px-2 py-1 rounded"
                                    >
                                      {muscle}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Stars */}
                      <div className="flex flex-col items-end gap-1">
                        {renderStars(exercise.relevance_score)}
                        <span className="text-xs text-charcoal/50">Relevance</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

            </>
          )}

          {/* Session Builder Tab */}
          {activeTab === 'session' && (
            <div className="space-y-3">
              <div className="mb-4 p-3 bg-white rounded-lg border border-charcoal/20">
                <p className="text-sm text-charcoal/70">
                  {selectedExercises.size === 0
                    ? "No exercises selected yet. Go to the Library tab and select exercises to build your session."
                    : `${selectedExercises.size} exercise${selectedExercises.size === 1 ? '' : 's'} selected for your soccer training session.`
                  }
                </p>
              </div>

              {getSelectedExercisesList().map((exercise, index) => (
                <div key={exercise.id} className="bg-white rounded-lg border border-charcoal/10 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-burgundy/60">#{index + 1}</span>
                        <h3 className="text-lg font-semibold text-burgundy">
                          {exercise.exercise_name}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${getCategoryColor(exercise.category)}`}>
                          {exercise.category}
                        </span>
                      </div>
                      <p className="text-sm text-charcoal/70">
                        {exercise.description}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromSession(exercise.id)}
                      className="text-burgundy hover:text-burgundy/60 text-2xl leading-none ml-4"
                      title="Remove from session"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}

              {selectedExercises.size > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-600 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Session builder is in preview mode.
                    Sessions are not yet saved but this feature will be available soon.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Back Button */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/coach-hub')}
              className="px-6 py-3 bg-white text-burgundy font-medium rounded-lg hover:bg-burgundy hover:text-cream transition-all border border-burgundy"
            >
              ← Back to Coach Hub
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}