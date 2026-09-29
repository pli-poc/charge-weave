---
title: "Build AI into the platform, not around it"
category: "Platform architecture"
date: "2026-09-28"
summary: "AI can accelerate software change. A shared model-driven platform makes those changes testable, governable and reusable across the whole business journey."
published: true
---

When people discuss AI and software, the question is often how quickly an assistant can write code. That matters. But the deeper question is what happens after the code is generated: can another team understand it, can the change be tested before live systems are available, and can it be adapted without starting over?

The answer depends on where the assistant works. If every agent creates its own schemas, rules, integrations and tests, local speed can become system-wide complexity. Inside a shared platform, AI works against common business meaning, policies, workflows, forms, adapters, simulation and evidence—the same contracts that govern the running system.

This is a vision of an integrated platform: a place where people and AI can design, test and publish supported changes, as well as operate them. Its value comes from the foundation those activities share.

![Two approaches to AI-assisted software: isolated project outputs versus a shared platform harness with draft, validation, simulation, review and publication.](../assets/the-platform-as-a-harness/shared-harness.png)

## From generated code to a maintainable change

Code generation can produce a useful first version. But a business capability also depends on the meaning of its information, the decisions it may make, ownership of each action, external dependencies and evidence that the result works.

Without shared contracts, assumptions can be recreated project by project. Agents may use different representations, duplicate policies or produce tests that prove only one implementation. The work can look complete while connections between teams and systems remain unfinished. This is a coordination problem, not an inevitable property of coding agents: good engineering practices can address it, and agents remain useful for prototypes and new platform capabilities.

Inside a platform, an assistant can draft a change against shared building blocks. Checks validate its relationships and constraints, a virtual runtime exercises it, and an accountable owner reviews the differences before publication. Generated code may still be part of the result, within a system with known responsibilities.

## A platform is a set of connected responsibilities

A model-driven platform does not make one ontology the database, workflow engine and application. The ontology provides shared meaning and constraints; domain services own business actions and writes. Policies and identity define who may act. Workflow and state coordinate assignments, waiting, deadlines and checkpoints.

Human tasks fit here too. A task-specific form can use the workflow contract and model terms to show needed context and evidence; the responsible service validates and applies the change. Adapters translate external protocols, while separate storage boundaries retain operational records, temporal history, telemetry and evidence.

Together, shared meaning helps workflows ask for the right information, policy limits who can submit it, domain services validate changes, and the runtime records outcomes. Sharing a model does not mean every layer owns every concern.

The benefit extends across teams. Product owners, engineers, operations and assurance can refer to the same concepts, responsibilities and evidence instead of rediscovering them in separate specifications. Application behavior and analytics can use that common meaning while keeping their own service and storage responsibilities. Versioned model packages, loaded through a replaceable provider, keep definitions consistent without mixing them with business records or workflow progress.

![The AI authoring and reasoning layer reads shared context, plans and tests model changes, then publishes approved versions into a runtime of definitions, workflows, forms, services, adapters, data and browser simulation.](../assets/the-platform-as-a-harness/platform-layers.png)

## Give AI an authoring workspace

The AI needs somewhere to work out a change. That is the role of the authoring layer: it gathers relevant models, standards and documentation; maintains a proposed change; coordinates platform tools; and collects validation and simulation results. An AI model reached through an API helps interpret the request and prepare the proposal. The platform supplies the permitted tools, shared context and checks.

This workspace keeps drafts separate from approved runtime definitions. It can propose an ontology extension, adjust constraints, assemble a workflow, design its task forms and prepare an integration mapping as one related change. People see the differences, affected processes and test evidence before publication. The runtime then loads the approved package; a conversation does not silently rewrite a running process.

Versioning also matters after publication. Existing cases can remain on their original definitions until an explicit migration is approved. If a change must be withdrawn, reverting a model package does not automatically undo business actions that have already happened; those need their own recovery process.

## Prove the journey before the live connections

A particularly useful property is the ability to run a complete virtual environment in a browser. It can contain virtual adapters that speak expected protocol shapes, synthetic business data, a controllable clock, replaceable stores and deliberate fault scenarios. Teams can run a whole journey—including forms, workflows, services and evidence—without waiting for production endpoints, live devices, customer data or infrastructure to be provisioned.

A team can reproduce a late message, missing field, retry or approval delay, then replay the scenario after a change. Product, operations and engineering can inspect the same behavior together in the browser.

That shortens the engineering feedback loop: change a definition, run the journey, inspect the evidence, correct it and replay. A fixed seed and virtual clock make the conditions repeatable. Problems can surface while a process is still easy to reshape, before infrastructure provisioning or a partner integration becomes a prerequisite for meaningful testing.

Virtual testing does not replace real network, performance, security or endpoint checks. It gives them an already exercised journey and contract. Virtual, observe, hybrid and live are selectable modes at individual boundaries, not a mandatory rollout sequence. A real input can feed simulated downstream services and stores; another integration can remain entirely virtual. Observe mode compares live input without authorizing operational writes.

![A complete virtual browser environment supports rapid change, run, inspect and replay cycles; AI helps map endpoint documentation to shared contracts, with virtual, observe, hybrid and live modes selected independently per boundary.](../assets/the-platform-as-a-harness/browser-proving-ground.png)

## Let AI help bridge standards to real endpoints

A virtual adapter gives an assistant a known starting point: the protocol shape, the platform’s ontology constraints and the expected behavior are already visible. Given documentation and examples for a real endpoint, an assistant such as GPT-6 Luna could propose a mapping or adapter configuration, then help run it against virtual and contract tests.

The mapping remains a candidate: real endpoints can differ in fields, timing, interpretation or errors. Comparing observations with the expected contract and reviewing discrepancies helps people decide what can move into hybrid or live operation.

## Extend the platform through its supported building blocks

There are two complementary modes of change. In build mode, engineers use code, repository review and tests to create reusable platform capabilities. In extension mode, people and AI use the platform's authoring tools to adapt whatever its runtime can represent, validate, publish and execute as a supported model.

That includes the ontology itself: new concepts, fields and relationships can be proposed alongside constraints, policies, workflow definitions, forms and integration mappings. The boundary is runtime support, not a blanket rule that ontology changes require code. A new protocol implementation or execution mechanism that the platform cannot yet express still belongs in build mode.

A person describes intent; the assistant proposes the related model changes. Validation catches structural or permission problems, and browser simulation tests repeatable journeys. Review shows the differences and unresolved questions before an approved, versioned package is published.

![One supplier onboarding request becomes a coordinated model, policy, workflow, form and integration proposal, tested in the browser and published as an approved runtime version.](../assets/the-platform-as-a-harness/ai-extension-loop.png)

This is how a platform can become adaptable from within its own operating environment. AI assistance is useful not only for the initial build, but also for adding or changing the model-driven artifacts that the runtime explicitly supports. The platform still needs sound extension points, versioning, permissions and validation; a prompt cannot supply those foundations by itself.

## Keep human judgment where the consequences are real

Consider the request shown in the illustrations: add a supplier onboarding process with risk checks and manager approval. AI identifies the existing supplier concept, proposes any missing information and constraints, and assembles the workflow and task form. It also prepares a mapping to an external risk service through the supported adapter contract.

In the browser, the team tests a complete application, missing evidence, a delayed response and a rejected approval. The manager's form presents the relevant information and permitted actions. Policy determines who can approve; the owning business service applies the outcome; the workflow tracks progress; and evidence records the versions and decisions involved. A review can therefore examine a coherent business journey, rather than a disconnected screen.

An assistant can help shape that experience, suggest missing rules and generate repeatable test cases. It should not silently turn its own interpretation into an operational decision. People remain accountable for approval and for the outcomes their organizations choose to publish.

## Faster adaptation without losing control

The aim is to let people and AI work against shared contracts and prove changes before they reach live systems. New capabilities can then be built into the platform and reused wherever their contracts apply.

That makes the important measure of AI-assisted development broader than lines of code or the speed of a first draft. Can a team move from intent to an understandable, tested and accountable business change—and keep improving it without fragmenting the system around it?
