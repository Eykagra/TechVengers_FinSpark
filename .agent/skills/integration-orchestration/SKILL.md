---
name: integration-orchestration
description: "Use when: working on FinSpark requirement parsing, adapter ranking, auto-configuration, simulation strategy, governance design, hackathon submission narrative, NVIDIA NIM usage, or enterprise integration orchestration architecture."
---

# FinSpark Integration Orchestration Skill

## Purpose
Provide stable, reusable context for AI-assisted implementation and documentation of FinSpark.

## Use This Skill For
- Requirement parsing logic and output contracts.
- Adapter registry structure and semantic ranking flow.
- Auto-configuration template and field mapping generation.
- Simulation design (mock payloads, parallel version testing, rollback).
- Governance requirements (tenant isolation, auditability, credential handling).
- Judge-facing storytelling for hackathon submission.

## Product Definition
FinSpark converts requirement intent into integration configuration artifacts without requiring adapter source code changes.

Core flow:
1. Parse BRD/SOW/API text into structured requirement JSON.
2. Rank and select adapter versions from declarative registry files.
3. Generate configuration templates with field mappings and hook bindings.
4. Simulate integration behavior with realistic mock data in tenant sandboxes.
5. Compare versions, approve, rollback, and preserve audit history.

## AI Orchestration Policy
- AI is used for understanding, ranking, and generation of configuration artifacts.
- AI does not modify adapter source code directly.
- Adapter onboarding should remain declarative through metadata files.
- Every AI output must map into explicit JSON contracts before downstream use.

## NVIDIA NIM Integration Guidance
- Parsing and generation model: abacusai/dracarys-llama-3.1-70b-instruct
- Embedding model: nvidia/nemo-retriever-embedding-mistral-v1
- Mandatory reliability patterns:
  - Input chunking for large BRDs
  - Content-hash caching
  - Exponential backoff retries
  - Strict JSON validation and fallback behavior

## Enterprise Constraints To Preserve
- Multi-tenant isolation across all API and simulation boundaries.
- Full audit logs for configuration lifecycle events.
- Version coexistence and backward compatibility checks.
- Secure credential handling patterns (vault references, masking in UI).
- Zero disruption to existing core product codebase.

## Expected Data Contracts
- ParsedRequirement
- AdapterDefinition
- AdapterRankResult
- ConfigurationTemplate
- SimulationResult
- AuditLogEntry

All contracts should include tenant context and traceability identifiers.

## Implementation Priorities
1. Accurate requirement extraction and schema normalization.
2. Reliable adapter ranking with explainability metadata.
3. Deterministic config generation and diff review.
4. Simulation fidelity and comparison metrics.
5. Governance reporting and judge-readable evidence.

## Done Criteria
- End-to-end demo from document upload to approve or rollback.
- All generated artifacts are exportable and auditable.
- Judge can understand architecture, AI usage, and business impact in under 5 minutes.
