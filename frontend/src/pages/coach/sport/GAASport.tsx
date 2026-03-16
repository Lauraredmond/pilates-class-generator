import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { hasCoachingRole } from '../../../types/auth.types';
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

export function GAASport() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // New state for tabs and selections
  const [activeTab, setActiveTab] = useState<'library' | 'session'>('library');
  const [selectedExercises, setSelectedExercises] = useState<Set<string>>(new Set());
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  // Redirect if not a coach or admin
  if (!user || !hasCoachingRole(user)) {
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
      const response = await axios.get(`${API_BASE_URL}/api/coach/exercises/gaa`, {
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
      'Core Stability': 'bg-yellow-600',
      'Flexibility': 'bg-green-600',
      'Power & Agility': 'bg-orange-600',
      'Lower Body Strength': 'bg-blue-600',
      'Upper Body Strength': 'bg-purple-600',
      'Balance & Coordination': 'bg-pink-600',
      'Full Body Integration': 'bg-red-600'
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

  const toggleExerciseSelection = (exerciseId: string) => {
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

  // Get selected exercises for session builder
  const getSelectedExercisesList = () => {
    return exercises.filter(e => selectedExercises.has(e.id));
  };

  return (
    <div className="min-h-screen bg-burgundy">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cream mb-2">
            🏐 Pilates for GAA & Hurling
          </h1>
          <p className="text-cream/80">
            Sport-specific Pilates exercises to enhance your game performance
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-cream rounded-xl shadow-xl">
          {/* Tab Navigation */}
          <div className="border-b border-burgundy/20">
            <div className="flex">
              <button
                onClick={() => setActiveTab('library')}
                className={`flex-1 px-6 py-4 text-lg font-semibold transition-all ${
                  activeTab === 'library'
                    ? 'bg-white text-burgundy border-b-4 border-burgundy'
                    : 'text-charcoal/60 hover:text-burgundy hover:bg-white/50'
                }`}
              >
                Library
              </button>
              <button
                onClick={() => setActiveTab('session')}
                className={`flex-1 px-6 py-4 text-lg font-semibold transition-all relative ${
                  activeTab === 'session'
                    ? 'bg-white text-burgundy border-b-4 border-burgundy'
                    : 'text-charcoal/60 hover:text-burgundy hover:bg-white/50'
                }`}
              >
                Session Builder
                {selectedExercises.size > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-6 h-6 text-xs text-white bg-burgundy rounded-full">
                    {selectedExercises.size}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="p-6">
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
                            <div className="mt-1">
                              <input
                                type="checkbox"
                                id={`checkbox-${exercise.id}`}
                                checked={selectedExercises.has(exercise.id)}
                                onChange={() => toggleExerciseSelection(exercise.id)}
                                className="w-5 h-5 rounded border-burgundy text-burgundy focus:ring-burgundy cursor-pointer"
                              />
                            </div>

                            {/* Exercise Content */}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h3
                                      onClick={() => toggleExerciseExpansion(exercise.id)}
                                      className="text-lg font-semibold text-burgundy hover:text-burgundy/80 cursor-pointer transition-colors"
                                    >
                                      {exercise.exercise_name}
                                    </h3>
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${getCategoryColor(exercise.category)}`}>
                                      {exercise.category}
                                    </span>
                                  </div>

                                  {/* Always visible short description */}
                                  <p className="text-sm text-charcoal/70 line-clamp-2">
                                    {exercise.description}
                                  </p>

                                  {/* Muscle groups */}
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

                                {/* Stars */}
                                <div className="ml-4 flex flex-col items-end gap-1">
                                  {renderStars(exercise.relevance_score)}
                                  <span className="text-xs text-charcoal/50">Relevance</span>
                                </div>
                              </div>

                              {/* Expanded Details */}
                              {expandedExercise === exercise.id && (
                                <div className="mt-4 pt-4 border-t border-charcoal/10 space-y-3">
                                  <div>
                                    <h4 className="font-semibold text-burgundy text-sm mb-1">Pilates Technique</h4>
                                    <p className="text-sm text-charcoal/80">{exercise.description}</p>
                                  </div>

                                  <div>
                                    <h4 className="font-semibold text-burgundy text-sm mb-1">GAA/Hurling Connection</h4>
                                    <p className="text-sm text-charcoal/80">{exercise.sport_relevance}</p>
                                  </div>

                                  {exercise.variations?.u12mod && (
                                    <div>
                                      <h4 className="font-semibold text-burgundy text-sm mb-1">U12 Modifications</h4>
                                      <p className="text-sm text-charcoal/80">{exercise.variations.u12mod}</p>
                                    </div>
                                  )}

                                  {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                                    <div>
                                      <h4 className="font-semibold text-burgundy text-sm mb-1">Muscle Groups</h4>
                                      <div className="flex flex-wrap gap-1">
                                        {exercise.muscle_groups.map(muscle => (
                                          <span
                                            key={muscle}
                                            className="bg-burgundy/10 text-burgundy px-2 py-1 rounded text-xs"
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
              <div>
                {selectedExercises.size === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-charcoal/60">
                      <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <p className="text-lg font-medium mb-2">No exercises selected yet</p>
                      <p className="text-sm">Go to the Library tab and select exercises to build your session</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mb-4 p-3 bg-burgundy/5 rounded-lg border border-burgundy/20">
                      <p className="text-sm text-charcoal/70">
                        <span className="font-semibold text-burgundy">{selectedExercises.size}</span> exercises selected for this session
                      </p>
                    </div>

                    {getSelectedExercisesList().map((exercise, index) => (
                      <div key={exercise.id} className="bg-white rounded-lg border border-charcoal/10 p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold text-charcoal/40">
                                {index + 1}.
                              </span>
                              <h3 className="text-lg font-semibold text-burgundy">
                                {exercise.exercise_name}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full text-white ${getCategoryColor(exercise.category)}`}>
                                {exercise.category}
                              </span>
                            </div>

                            {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                              <div className="mt-2 ml-7 flex flex-wrap gap-1">
                                {exercise.muscle_groups.map(muscle => (
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

                          <button
                            onClick={() => toggleExerciseSelection(exercise.id)}
                            className="text-burgundy hover:text-burgundy/60 transition-colors"
                            title="Remove from session"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
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
    </div>
  );
}