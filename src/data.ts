/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Interviewer, InterviewTopic } from "./types";

export const INTERVIEWERS: Interviewer[] = [
  {
    id: "sia",
    name: "Sia Chen",
    title: "Senior Core Android Specialist",
    avatar: "👩‍💻",
    colorClass: "from-teal-400 to-emerald-500",
    borderColorClass: "border-teal-500/30 text-teal-400",
    persona: "Core Framework Specialist emphasizing compiler efficiency, API design, and lower-level internal execution details.",
    description: "Sia expects highly accurate terminology, memory-conscious code, and answers highlighting Jetpack internals (e.g., SlotTable, recomposition indices, custom Layout modifiers).",
    welcomeMessage: "Hey there! I am Sia. I design core SDK frameworks. I hope you're ready to dive deep into the internals of Android. Let's start typing and speaking clean code!"
  },
  {
    id: "devon",
    name: "Devon Miller",
    title: "Principal Android Architect",
    avatar: "👨‍💼",
    colorClass: "from-blue-400 to-indigo-500",
    borderColorClass: "border-blue-500/30 text-blue-400",
    persona: "System Designer focusing on high-level MVVM/MVI architectures, SOLID principles, and elegant codebase modularity.",
    description: "Devon likes broad systemic concepts: modularization strategies, custom Hilt scopes, repository-layer abstractions, unit testing boundary rules, and relational schemas.",
    welcomeMessage: "Welcome. I am Devon. I look at applications from 10,000 feet. Show me how you structure directories, inject dependencies, and make modules scale across multiple teams."
  },
  {
    id: "rhea",
    name: "Rhea Joshi",
    title: "Pragmatic Tech Lead & Senior Manager",
    avatar: "👩‍💼",
    colorClass: "from-amber-400 to-orange-500",
    borderColorClass: "border-amber-500/30 text-amber-400",
    persona: "Real-world developer prioritizing quick resolution, profiles, debugging, performance metrics, and realistic UX trade-offs.",
    description: "Rhea values pragmatic optimization over design-pattern overload. Expect live scenarios: performance bottleneck tracing, LeakCanary triage, and work schedules.",
    welcomeMessage: "Hi candidate! I'm Rhea. Let's bypass the fluff — tell me how you debug memory leaks, optimize slow frame layouts, and make background workers behave."
  }
];

export const INTERVIEW_TOPICS: InterviewTopic[] = [
  {
    id: "compose",
    title: "Jetpack Compose & Modern UI",
    icon: "Layout",
    description: "Declarative layouts, State hoisting, stable compiler rules, Side-Effects, canvas drawings, custom measurements, and custom theme overrides.",
    difficultyLevels: ["Junior", "Mid-Level", "Senior"]
  },
  {
    id: "architecture",
    title: "Architecture, DI & Modularity",
    icon: "GitBranch",
    description: "Unidirectional Data Flow (MVI/MVVM), Hilt/Dagger setups, multi-module setups, dynamic features, testing strategies, and Room repositories.",
    difficultyLevels: ["Junior", "Mid-Level", "Senior"]
  },
  {
    id: "concurrency",
    title: "Kotlin Concurrency, Flow & Coroutines",
    icon: "Zap",
    description: "Coroutine Builders, custom Dispatchers, backpressure streams, StateFlow vs SharedFlow, Channels, and handling asynchronous cancellations cleanly.",
    difficultyLevels: ["Junior", "Mid-Level", "Senior"]
  },
  {
    id: "core",
    title: "Lifecycle, WorkManager & Core OS",
    icon: "Cpu",
    description: "Lifecycle-aware scopes, Activity/Fragment states, background scheduling via WorkManager, custom Services, and App Start optimization.",
    difficultyLevels: ["Junior", "Mid-Level", "Senior"]
  },
  {
    id: "performance",
    title: "Performance & Memory Profiling",
    icon: "Activity",
    description: "Tracking over-draw, finding memory leaks with LeakCanary, baseline profiles, background heap dumps, custom analytics, and startup times.",
    difficultyLevels: ["Junior", "Mid-Level", "Senior"]
  }
];
