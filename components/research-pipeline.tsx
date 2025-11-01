'use client';

import { useState } from 'react';
import { GlowingEffect } from '@/components/ui/glowing-effect';

interface Model {
  id: string;
  name: string;
  provider: string;
}

interface ResearchPipelineProps {
  selectedModels: string[];
  availableModels: Model[];
  onModelsChange: (models: string[]) => void;
  getModelInfo: (id: string) => Model;
  showBench: boolean;
  onToggleBench: () => void;
  providerStyles: Record<string, { logo: string; bg: string }>;
  onDragStart: (modelId: string, fromTeam: boolean) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDropOnTeam: (e: React.DragEvent, targetIndex?: number) => void;
  onDropOnBench: (e: React.DragEvent) => void;
  removeModel: (modelId: string) => void;
  draggedModel: string | null;
  draggedFromTeam: boolean;
}

export function ResearchPipeline({
  selectedModels,
  availableModels,
  getModelInfo,
  showBench,
  onToggleBench,
  providerStyles,
  onDragStart,
  onDragOver,
  onDropOnTeam,
  onDropOnBench,
  removeModel,
  draggedModel,
  draggedFromTeam,
}: ResearchPipelineProps) {
  return (
    <div className={`relative transition-all ${showBench ? 'mr-80' : ''}`}>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
            Research Pipeline
          </h3>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Multi-phase deep research system
          </p>
        </div>
        <button
          onClick={onToggleBench}
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          {showBench ? 'Hide Bench' : 'Show Bench'}
        </button>
      </div>

      {/* Pipeline Visualization */}
      <div className="space-y-8">
        {/* Phase 1: Parallel Research */}
        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              1
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Parallel Research</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Query multiple AI models simultaneously
              </p>
            </div>
          </div>

          {/* Model Grid */}
          <div className="ml-11 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {selectedModels.map((modelId, index) => {
              const modelInfo = getModelInfo(modelId);
              return (
                <div
                  key={index}
                  draggable={showBench}
                  onDragStart={() => onDragStart(modelId, true)}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDropOnTeam(e, index)}
                  className="relative rounded-lg"
                >
                  <GlowingEffect
                    spread={40}
                    glow={true}
                    disabled={false}
                    proximity={64}
                    inactiveZone={0.01}
                  />
                  <div
                    className={`group relative rounded-lg border p-3 transition-colors ${
                      showBench
                        ? 'cursor-move border-zinc-300 hover:border-blue-500 dark:border-zinc-700 dark:hover:border-blue-500'
                        : 'border-zinc-200 dark:border-zinc-800'
                    }`}
                  >
                    {/* Remove button */}
                    {showBench && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeModel(modelId);
                        }}
                        className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                        title="Remove from team"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}

                    <div className="flex items-start gap-2">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                        style={{
                          backgroundColor: providerStyles[modelInfo.provider]?.bg || '#F5F5F5',
                        }}
                      >
                        <img
                          src={providerStyles[modelInfo.provider]?.logo || ''}
                          alt={modelInfo.provider}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">{modelInfo.provider}</div>
                        <div className="truncate text-xs font-medium">{modelInfo.name}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Drop zone to add new models */}
            {showBench && (
              <div
                onDragOver={onDragOver}
                onDrop={(e) => onDropOnTeam(e)}
                className="flex items-center justify-center rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50 p-4 transition-all hover:border-blue-500 hover:bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20 dark:hover:border-blue-600 dark:hover:bg-blue-950/40"
                style={{ minHeight: '80px' }}
              >
                <div className="text-center">
                  <div className="text-3xl text-blue-500 dark:text-blue-400">+</div>
                  <div className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">Drag here to add</div>
                </div>
              </div>
            )}
          </div>

          {/* Connector Arrow */}
          <div className="ml-11 mt-6 flex justify-center">
            <div className="flex flex-col items-center">
              <div className="h-8 w-0.5 bg-gradient-to-b from-blue-400 to-purple-400" />
              <svg className="h-4 w-4 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a.75.75 0 01-.75-.75V4.66L7.3 6.76a.75.75 0 11-1.1-1.02l3.5-3.75a.75.75 0 011.1 0l3.5 3.75a.75.75 0 01-1.1 1.02L10.75 4.66v12.59A.75.75 0 0110 18z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Phase 2: Gap Analysis */}
        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-purple-600 dark:bg-purple-950 dark:text-purple-400">
              2
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Gap Analysis</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                AI identifies contradictions and missing information
              </p>
            </div>
          </div>

          <div className="ml-11 rounded-lg border border-purple-200 bg-purple-50/50 p-4 dark:border-purple-900/30 dark:bg-purple-950/20">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                  Claude Sonnet analyzes all responses
                </p>
                <ul className="mt-2 space-y-1 text-xs text-purple-700 dark:text-purple-300">
                  <li>• Identifies contradictions between models</li>
                  <li>• Finds gaps in coverage</li>
                  <li>• Generates targeted follow-up queries</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Connector Arrow */}
          <div className="ml-11 mt-6 flex justify-center">
            <div className="flex flex-col items-center">
              <div className="h-8 w-0.5 bg-gradient-to-b from-purple-400 to-green-400" />
              <svg className="h-4 w-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a.75.75 0 01-.75-.75V4.66L7.3 6.76a.75.75 0 11-1.1-1.02l3.5-3.75a.75.75 0 011.1 0l3.5 3.75a.75.75 0 01-1.1 1.02L10.75 4.66v12.59A.75.75 0 0110 18z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Phase 3: Deep Dive */}
        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-600 dark:bg-green-950 dark:text-green-400">
              3
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Targeted Deep Dive</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Research identified gaps with focused queries
              </p>
            </div>
          </div>

          <div className="ml-11 rounded-lg border border-green-200 bg-green-50/50 p-4 dark:border-green-900/30 dark:bg-green-950/20">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Follow-up research on gaps
                </p>
                <ul className="mt-2 space-y-1 text-xs text-green-700 dark:text-green-300">
                  <li>• Web search for specific topics</li>
                  <li>• Targeted model queries</li>
                  <li>• Fill information gaps</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Connector Arrow */}
          <div className="ml-11 mt-6 flex justify-center">
            <div className="flex flex-col items-center">
              <div className="h-8 w-0.5 bg-gradient-to-b from-green-400 to-amber-400" />
              <svg className="h-4 w-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a.75.75 0 01-.75-.75V4.66L7.3 6.76a.75.75 0 11-1.1-1.02l3.5-3.75a.75.75 0 011.1 0l3.5 3.75a.75.75 0 01-1.1 1.02L10.75 4.66v12.59A.75.75 0 0110 18z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        {/* Phase 4: Final Synthesis */}
        <div className="relative">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-sm font-bold text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              4
            </div>
            <div>
              <h4 className="font-semibold text-zinc-900 dark:text-zinc-100">Final Synthesis</h4>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Comprehensive report combining all insights
              </p>
            </div>
          </div>

          <div className="ml-11 rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/30 dark:bg-amber-950/20">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  Generate final research report
                </p>
                <ul className="mt-2 space-y-1 text-xs text-amber-700 dark:text-amber-300">
                  <li>• Combine all model responses</li>
                  <li>• Include follow-up research</li>
                  <li>• Highlight agreements & disagreements</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bench Sidebar */}
      {showBench && (
        <div className="fixed right-0 top-0 z-50 h-screen w-80 border-l border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Bench</h3>
            <button
              onClick={onToggleBench}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
            Drag models to your team or drag team members here to bench them
          </p>
          <div
            className="space-y-2 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
            onDragOver={onDragOver}
            onDrop={onDropOnBench}
          >
            {availableModels.filter(model => !selectedModels.includes(model.id)).map((model) => (
              <div
                key={model.id}
                draggable
                onDragStart={() => onDragStart(model.id, false)}
                className="cursor-move rounded-lg border border-zinc-200 p-3 transition-colors hover:border-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-100 dark:hover:bg-zinc-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
                    style={{
                      backgroundColor: providerStyles[model.provider]?.bg || '#F5F5F5',
                    }}
                  >
                    <img
                      src={providerStyles[model.provider]?.logo || ''}
                      alt={model.provider}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{model.name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{model.provider}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
