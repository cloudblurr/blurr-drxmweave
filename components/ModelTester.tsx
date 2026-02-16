import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, RefreshCw, Clock, AlertCircle, CheckCircle, Loader2, Zap, X, Plus, Minus } from 'lucide-react';
import { NSFW_ROLEPLAY_MODELS, SYSTEM_INSTRUCTION } from '../constants';
import { testMultipleModels, ModelTestConfig, ModelTestResponse } from '../services/xaiService';
import { getSettings } from '../services/storage';
import { AIModel, ViewType } from '../types';

interface ModelTesterProps {
  onBack: () => void;
}

export const ModelTester: React.FC<ModelTesterProps> = ({ onBack }) => {
  const settings = getSettings();
  const [selectedModels, setSelectedModels] = useState<ModelTestConfig[]>([]);
  const [testPrompt, setTestPrompt] = useState('');
  const [customSystemPrompt, setCustomSystemPrompt] = useState('');
  const [useGlobalPrompt, setUseGlobalPrompt] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<ModelTestResponse[]>([]);
  const [modelSearch, setModelSearch] = useState('');

  // Filter models based on search
  const filteredModels = NSFW_ROLEPLAY_MODELS.filter(m => 
    m.name.toLowerCase().includes(modelSearch.toLowerCase()) ||
    m.id.toLowerCase().includes(modelSearch.toLowerCase()) ||
    m.description?.toLowerCase().includes(modelSearch.toLowerCase())
  );

  // Group models by provider
  const xaiModels = filteredModels.filter(m => m.provider === 'xai');
  const openrouterModels = filteredModels.filter(m => m.provider === 'openrouter');

  const addModel = (model: AIModel) => {
    if (selectedModels.length >= 5) {
      alert('Maximum 5 models can be tested at once');
      return;
    }
    if (selectedModels.some(m => m.modelId === model.id)) {
      return; // Already selected
    }
    setSelectedModels([...selectedModels, {
      modelId: model.id,
      modelName: model.name,
      provider: model.provider
    }]);
  };

  const removeModel = (modelId: string) => {
    setSelectedModels(selectedModels.filter(m => m.modelId !== modelId));
  };

  const runTest = async () => {
    if (selectedModels.length === 0) {
      alert('Please select at least one model to test');
      return;
    }
    if (!testPrompt.trim()) {
      alert('Please enter a test prompt');
      return;
    }

    setIsRunning(true);
    setResults([]);

    // Build the system prompt
    let systemPrompt = '';
    if (useGlobalPrompt) {
      systemPrompt = settings.globalSystemPrompt || SYSTEM_INSTRUCTION;
    }
    if (customSystemPrompt.trim()) {
      systemPrompt += (systemPrompt ? '\n\n' : '') + customSystemPrompt;
    }
    if (!systemPrompt) {
      systemPrompt = SYSTEM_INSTRUCTION;
    }

    try {
      await testMultipleModels(
        selectedModels,
        systemPrompt,
        testPrompt,
        (result) => {
          setResults(prev => [...prev, result]);
        }
      );
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const retryModel = async (model: ModelTestConfig) => {
    setIsRunning(true);
    
    // Build the system prompt
    let systemPrompt = '';
    if (useGlobalPrompt) {
      systemPrompt = settings.globalSystemPrompt || SYSTEM_INSTRUCTION;
    }
    if (customSystemPrompt.trim()) {
      systemPrompt += (systemPrompt ? '\n\n' : '') + customSystemPrompt;
    }
    if (!systemPrompt) {
      systemPrompt = SYSTEM_INSTRUCTION;
    }

    try {
      await testMultipleModels(
        [model],
        systemPrompt,
        testPrompt,
        (result) => {
          setResults(prev => {
            // Replace existing result for this model
            const existing = prev.findIndex(r => r.modelId === model.modelId);
            if (existing >= 0) {
              const newResults = [...prev];
              newResults[existing] = result;
              return newResults;
            }
            return [...prev, result];
          });
        }
      );
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-holo-cyan/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>
          <div>
            <h1 className="holo-text text-2xl flex items-center gap-2">
              <Zap className="w-6 h-6 text-holo-amber" />
              Model Tester
            </h1>
            <p className="holo-label text-sm">Compare up to 5 models side-by-side for roleplay quality</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Model Selection */}
          <div className="lg:col-span-1 space-y-4">
            {/* Selected Models */}
            <div className="holo-panel p-4">
              <h3 className="holo-text-glow text-lg mb-3 flex items-center justify-between">
                Selected Models ({selectedModels.length}/5)
                {selectedModels.length > 0 && (
                  <button
                    onClick={() => setSelectedModels([])}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Clear All
                  </button>
                )}
              </h3>
              
              {selectedModels.length === 0 ? (
                <p className="text-slate-600 text-sm">Select models from the list below</p>
              ) : (
                <div className="space-y-2">
                  {selectedModels.map((model, idx) => (
                    <div
                      key={model.modelId}
                      className="flex items-center justify-between bg-black/30 border border-holo-cyan/10 px-3 py-2 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-holo-cyan font-mono text-xs">{idx + 1}</span>
                        <span className="text-holo-cyan text-sm truncate max-w-[180px]">{model.modelName}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          model.provider === 'xai' ? 'bg-holo-blue/20 text-holo-blue' : 'bg-holo-purple/20 text-holo-purple'
                        }`}>
                          {model.provider}
                        </span>
                      </div>
                      <button
                        onClick={() => removeModel(model.modelId)}
                        className="p-1 hover:bg-red-500/10 rounded"
                      >
                        <X className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Model Browser */}
            <div className="holo-panel p-4">
              <h3 className="holo-text-glow text-lg mb-3">Available Models</h3>
              
              <input
                type="text"
                placeholder="Search models..."
                value={modelSearch}
                onChange={(e) => setModelSearch(e.target.value)}
                className="holo-input w-full text-sm mb-3"
              />

              <div className="max-h-[400px] overflow-y-auto space-y-4">
                {/* xAI Models */}
                {xaiModels.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-holo-blue mb-2">xAI</h4>
                    <div className="space-y-1">
                      {xaiModels.map(model => (
                        <ModelCard
                          key={model.id}
                          model={model}
                          isSelected={selectedModels.some(m => m.modelId === model.id)}
                          onSelect={() => addModel(model)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* OpenRouter Models */}
                {openrouterModels.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-holo-purple mb-2">OpenRouter</h4>
                    <div className="space-y-1">
                      {openrouterModels.map(model => (
                        <ModelCard
                          key={model.id}
                          model={model}
                          isSelected={selectedModels.some(m => m.modelId === model.id)}
                          onSelect={() => addModel(model)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Test Configuration & Results */}
          <div className="lg:col-span-2 space-y-4">
            {/* Test Configuration */}
            <div className="holo-panel p-4">
              <h3 className="holo-text-glow text-lg mb-3">Test Configuration</h3>
              
              {/* System Prompt Options */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={useGlobalPrompt}
                    onChange={(e) => setUseGlobalPrompt(e.target.checked)}
                    className="w-4 h-4 rounded bg-black/40 border-holo-cyan/30 text-holo-cyan focus:ring-holo-cyan"
                  />
                  <span className="text-sm text-slate-400">Include Global System Prompt</span>
                </label>
                
                <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
                  Additional System Instructions (optional)
                </label>
                <textarea
                  rows={3}
                  value={customSystemPrompt}
                  onChange={(e) => setCustomSystemPrompt(e.target.value)}
                  className="holo-textarea w-full text-sm font-mono"
                  placeholder="Add specific instructions for this test..."
                />
              </div>

              {/* Test Prompt */}
              <div className="mb-4">
                <label className="block text-xs font-bold uppercase tracking-wider text-holo-cyan/50 mb-2">
                  Test Prompt / Roleplay Scenario
                </label>
                <textarea
                  rows={4}
                  value={testPrompt}
                  onChange={(e) => setTestPrompt(e.target.value)}
                  className="holo-textarea w-full text-sm"
                  placeholder="Enter a roleplay prompt to test how each model responds. Example: *I walk into the dimly lit tavern, my cloak dripping from the rain outside. I scan the room for the hooded figure who sent me the cryptic letter...*"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={runTest}
                  disabled={isRunning || selectedModels.length === 0 || !testPrompt.trim()}
                  className="holo-btn holo-btn-primary flex-1 py-2 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Run Test ({selectedModels.length} models)
                    </>
                  )}
                </button>
                
                {results.length > 0 && (
                  <button
                    onClick={clearResults}
                    className="holo-btn holo-btn-ghost py-2 font-medium flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-4">
                <h3 className="holo-text-glow text-lg">Results</h3>
                
                {results.map((result, idx) => (
                  <ResultCard
                    key={`${result.modelId}-${result.timestamp}`}
                    result={result}
                    index={idx}
                    onRetry={() => retryModel({
                      modelId: result.modelId,
                      modelName: result.modelName,
                      provider: result.provider
                    })}
                    isRetrying={isRunning}
                  />
                ))}
              </div>
            )}

            {/* Waiting indicator */}
            {isRunning && results.length < selectedModels.length && (
              <div className="holo-panel p-4">
                <div className="flex items-center gap-3 text-slate-500">
                  <Loader2 className="w-5 h-5 animate-spin text-holo-cyan" />
                  <span>
                    Testing model {results.length + 1} of {selectedModels.length}...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Model Card Component
const ModelCard: React.FC<{
  model: AIModel;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ model, isSelected, onSelect }) => (
  <button
    onClick={onSelect}
    disabled={isSelected}
    className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
      isSelected
        ? 'bg-holo-cyan/10 border border-holo-cyan/40 cursor-default'
        : 'bg-black/20 hover:bg-holo-cyan/5 border border-transparent hover:border-holo-cyan/20'
    }`}
  >
    <div className="flex items-center justify-between">
      <span className={`text-sm font-medium ${isSelected ? 'text-holo-cyan' : 'text-slate-300'}`}>
        {model.name}
      </span>
      {isSelected ? (
        <CheckCircle className="w-4 h-4 text-holo-cyan" />
      ) : (
        <Plus className="w-4 h-4 text-slate-600" />
      )}
    </div>
    <div className="flex items-center gap-2 mt-1">
      {model.isNsfw && (
        <span className="holo-badge-danger text-xs">NSFW</span>
      )}
      <span className="text-xs text-slate-600">{model.pricing}</span>
    </div>
    {model.description && (
      <p className="text-xs text-slate-600 mt-1 line-clamp-2">{model.description}</p>
    )}
  </button>
);

// Result Card Component
const ResultCard: React.FC<{
  result: ModelTestResponse;
  index: number;
  onRetry: () => void;
  isRetrying: boolean;
}> = ({ result, index, onRetry, isRetrying }) => (
  <div className={`holo-card p-4 ${
    result.error ? 'border-red-500/50' : ''
  }`}>
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-3">
        <span className="text-holo-cyan font-mono text-sm">#{index + 1}</span>
        <h4 className="text-holo-cyan font-medium">{result.modelName}</h4>
        <span className={`text-xs px-1.5 py-0.5 rounded ${
          result.provider === 'xai' ? 'bg-holo-blue/20 text-holo-blue' : 'bg-holo-purple/20 text-holo-purple'
        }`}>
          {result.provider}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1 text-xs text-slate-600">
          <Clock className="w-3 h-3" />
          {(result.duration / 1000).toFixed(1)}s
        </span>
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="p-1.5 hover:bg-holo-cyan/10 rounded transition-colors disabled:opacity-50"
          title="Retry this model"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${isRetrying ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
    
    {result.error ? (
      <div className="flex items-start gap-2 text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span className="text-sm">{result.error}</span>
      </div>
    ) : (
      <div className="bg-black/30 border border-holo-cyan/10 rounded-lg p-3 max-h-[300px] overflow-y-auto">
        <p className="text-slate-300 text-sm whitespace-pre-wrap">{result.response}</p>
      </div>
    )}
  </div>
);

export default ModelTester;
