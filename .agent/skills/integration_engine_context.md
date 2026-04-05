---
name: integration_orchestration_engine_context
description: >
  Operating context for FinSpark hackathon implementation. Use this file before
  coding parser, registry, configuration, simulation, governance, and NVIDIA NIM
  orchestration features.
---

# FinSpark Context Pack

## Mission
Build an AI-Assisted Integration Configuration and Orchestration Engine that transforms enterprise requirement documents into production-ready integration configurations with governance controls.

Theme: Configure Enterprise Integrations from Intent, Not Code.

## Problem Summary
Enterprise implementation teams lose time on manual BRD analysis, schema mapping, version choices, and repetitive sandbox testing.

FinSpark solves this by combining:
- Declarative adapter metadata
- NVIDIA NIM-powered document and schema intelligence
- Automated configuration generation
- Simulation and governed approval lifecycle

## Scope for Hackathon Demo
Judge should be able to perform this end-to-end flow in browser:
1. Upload BRD or SOW text.
2. Parse requirements into structured JSON.
3. See AI-ranked matching adapters.
4. Generate config template with field mapping.
5. Simulate versions side-by-side with mock payloads.
6. Approve or rollback.
7. Review audit log and tenant-isolated activity.

## Core Modules

### 1) Requirement Parsing Engine
Route: /parser

Responsibilities:
- Extract services and endpoints.
- Detect mandatory versus optional services.
- Identify auth modes.
- Normalize request and response schema fields.

AI function:
- parseRequirementDoc(text)

### 2) Integration Registry and Hook Library
Route: /registry

Responsibilities:
- Load adapter metadata from JSON files.
- Support multiple versions per adapter.
- Expose hook points and capability tags.

AI function:
- rankAdapters(parsedReq, adapters)

### 3) Auto-Configuration Engine
Route: /config

Responsibilities:
- Produce configuration template from parsed requirement and selected adapter.
- Suggest source-to-target field mappings.
- Show configuration diff for version comparisons.

AI function:
- generateFieldMappings(sourceSchema, targetSchema)

### 4) Simulation and Testing Framework
Route: /simulation

Responsibilities:
- Generate realistic mock payloads.
- Execute parallel version runs with identical input.
- Capture latency, errors, and response coverage.
- Support rollback recommendation.

AI function:
- generateMockPayload(schema)

### 5) Governance Dashboard
Route: /governance

Responsibilities:
- Display audit logs and configuration diffs.
- Enforce tenant-level isolation.
- Show credential references in masked form.

## NVIDIA NIM Usage
Base endpoint:
- https://integrate.api.nvidia.com/v1

Models:
- meta/llama-3.1-70b-instruct
  - Document parsing
  - Field mapping generation
  - Mock payload generation
- nvidia/nemo-retriever-embedding-mistral-v1
  - Semantic ranking of adapters

Reliability controls:
- Chunk long document input.
- Cache responses by content hash.
- Exponential backoff retries with bounded attempts.
- Validate JSON contracts before persisting outputs.

## Clarification: Does AI Need Codebase Knowledge?
No.

AI orchestration does not require deep source-code awareness to create adapter configurations.

Why:
- Adapter capabilities are represented declaratively in JSON metadata.
- AI reasons over requirement text plus adapter schema metadata.
- Output artifacts are configuration templates, not code patches.

Outcome:
- New adapter onboarding remains no-code metadata onboarding.
- Core platform source remains stable.

## How Simulation Works
1. Create tenant-scoped simulation session.
2. Generate mock payloads from schema and domain hints.
3. Run version A and version B in parallel with same payloads.
4. Compare responses for correctness, completeness, and latency.
5. Store result with pass/fail flags and rollback suggestion.
6. Emit auditable event with before and after context.

## Data Contract Minimums
Every artifact should include:
- tenantId
- traceId
- version
- createdAt

Primary objects:
- ParsedRequirement
- AdapterDefinition
- ConfigurationTemplate
- SimulationResult
- AuditLogEntry

## Security and Enterprise Expectations
- Tenant isolation is mandatory for every read and write path.
- Credentials should be vault references, not plain text.
- Audit trail must be immutable and diff-based.
- Backward compatibility must be testable through side-by-side simulation.

## Build Plan Reference
1. Scaffold frontend and route shell.
2. Add backend API and adapter registry loading.
3. Implement nimClient wrapper with retry, cache, chunking.
4. Connect parser, ranking, and config generation.
5. Build simulation comparator and rollback flow.
6. Finalize governance dashboard and submission docs.

## Adapter Registry Targets
- credit-bureau.json
- kyc-provider.json
- gst-service.json
- payment-gateway.json
- fraud-engine.json

## Final Demo Success Criteria
- End-to-end run from upload to approve or rollback.
- Differences between adapter versions are visible and explainable.
- Governance log proves tenant context and auditability.
- Judge can understand business value and AI practicality quickly.
