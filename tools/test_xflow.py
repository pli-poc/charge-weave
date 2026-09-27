"""Validate the generic XFlow vocabulary and ChargeWeave workflow profile."""
import json
from pathlib import Path

from pyshacl import validate
from rdflib import Graph, Literal, Namespace, URIRef
from rdflib.namespace import OWL, RDF

ROOT = Path(__file__).resolve().parents[1]
XFLOW = Namespace("https://example.org/chargeweave/xflow#")
CD = Namespace("https://example.org/charge-domain#")
SH = Namespace("http://www.w3.org/ns/shacl#")
PROFILE = ROOT / "xflow/charge-correction.profile.json"


def check(graph, shapes, ontology):
    return validate(
        data_graph=graph,
        shacl_graph=shapes,
        ont_graph=ontology,
        inference="rdfs",
        advanced=True,
        meta_shacl=True,
    )


def main():
    ontology = Graph().parse(ROOT / "xflow/ontology.ttl", format="turtle")
    shapes = Graph().parse(ROOT / "xflow/shapes.ttl", format="turtle")
    data = Graph().parse(PROFILE, format="json-ld")
    results = []

    business = Graph().parse(ROOT / "ontology/charge-domain-complete.ttl", format="turtle")
    workflow = next(data.subjects(RDF.type, XFLOW.WorkflowDefinition))
    bound_concepts = set(data.objects(None, XFLOW.domainBinding))
    required_records = {
        data.value(workflow, XFLOW.executionRecordClass),
        data.value(workflow, XFLOW.stepRecordClass),
        data.value(workflow, XFLOW.transitionRecordClass),
    }
    concepts_resolve = (
        bound_concepts <= set(business.subjects(RDF.type, OWL.Class))
        and required_records <= set(business.subjects(RDF.type, OWL.Class))
        and (data.value(workflow, XFLOW.processKind), RDF.type, CD.ProcessKindCode) in business
    )
    results.append({
        "check": "business-bindings-resolve",
        "passed": concepts_resolve,
        "detail": None if concepts_resolve else "One or more workflow bindings do not resolve in the current ChargeWeave ontology.",
    })

    conforms, _, details = check(data, shapes, ontology)
    results.append({"check": "profile-conforms", "passed": bool(conforms), "detail": None if conforms else str(details)})

    timeout_action_constrained = (
        (XFLOW.timeoutAction, RDF.type, OWL.ObjectProperty) in ontology
        and any(shapes.triples((None, SH.path, XFLOW.timeoutAction)))
    )
    results.append({
        "check": "timeout-action-is-declared-and-shaped",
        "passed": timeout_action_constrained,
        "detail": None if timeout_action_constrained else "xflow:timeoutAction is missing from the ontology or HumanTask SHACL shape.",
    })

    invalid_start = Graph().parse(PROFILE, format="json-ld")
    workflow = next(invalid_start.subjects(RDF.type, XFLOW.WorkflowDefinition))
    invalid_start.remove((workflow, XFLOW.initialStep, None))
    start_conforms, _, start_details = check(invalid_start, shapes, ontology)
    rejected_start = not start_conforms and "initialStep" in str(start_details)
    results.append({
        "check": "missing-initial-step-rejected",
        "passed": rejected_start,
        "detail": None if rejected_start else str(start_details),
    })

    invalid_target = Graph().parse(PROFILE, format="json-ld")
    transition, _ = next(invalid_target.subject_objects(XFLOW.targetStep))
    invalid_target.remove((transition, XFLOW.targetStep, None))
    invalid_target.add((transition, XFLOW.targetStep, URIRef("https://example.org/chargeweave/xflow#not-listed")))
    target_conforms, _, target_details = check(invalid_target, shapes, ontology)
    rejected_target = not target_conforms and "transition target" in str(target_details)
    results.append({
        "check": "unlisted-transition-target-rejected",
        "passed": rejected_target,
        "detail": None if rejected_target else str(target_details),
    })

    invalid_timeout = Graph().parse(PROFILE, format="json-ld")
    timed_task = next(invalid_timeout.subjects(XFLOW.timeoutAfter, None))
    workflow = next(invalid_timeout.subjects(RDF.type, XFLOW.WorkflowDefinition))
    current_target = next(invalid_timeout.objects(timed_task, XFLOW.timeoutTarget))
    replacement_target = next(target for target in invalid_timeout.objects(workflow, XFLOW.hasStep) if target != current_target)
    invalid_timeout.remove((timed_task, XFLOW.timeoutTarget, None))
    invalid_timeout.add((timed_task, XFLOW.timeoutTarget, replacement_target))
    timeout_conforms, _, timeout_details = check(invalid_timeout, shapes, ontology)
    rejected_timeout = not timeout_conforms and "declared event transition to that target" in str(timeout_details)
    results.append({
        "check": "timeout-must-match-an-event-transition",
        "passed": rejected_timeout,
        "detail": None if rejected_timeout else str(timeout_details),
    })

    invalid_timeout_action = Graph().parse(PROFILE, format="json-ld")
    timed_task = next(invalid_timeout_action.subjects(XFLOW.timeoutAfter, None))
    invalid_timeout_action.add((timed_task, XFLOW.timeoutAction, Literal("not-an-IRI")))
    action_conforms, _, action_details = check(invalid_timeout_action, shapes, ontology)
    rejected_action = not action_conforms and "timeoutAction" in str(action_details)
    results.append({
        "check": "timeout-action-must-be-an-IRI",
        "passed": rejected_action,
        "detail": None if rejected_action else str(action_details),
    })

    incomplete_form_profile = Graph().parse(PROFILE, format="json-ld")
    task = next(incomplete_form_profile.subjects(XFLOW.taskFormProfileId, None))
    incomplete_form_profile.remove((task, XFLOW.taskFormProfileVersion, None))
    form_profile_conforms, _, form_profile_details = check(incomplete_form_profile, shapes, ontology)
    rejected_incomplete_profile = not form_profile_conforms and "declared together" in str(form_profile_details)
    results.append({
        "check": "task-form-profile-id-and-version-are-paired",
        "passed": rejected_incomplete_profile,
        "detail": None if rejected_incomplete_profile else str(form_profile_details),
    })

    report = {
        "passed": sum(result["passed"] for result in results),
        "total": len(results),
        "checks": results,
    }
    report_path = ROOT / "reports/xflow.json"
    report_path.parent.mkdir(exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    print(f"XFlow vocabulary and correction profile: {report['passed']}/{report['total']} checks ({len(data)} profile triples).")
    if not all(result["passed"] for result in results):
        for result in results:
            if not result["passed"]:
                print(f"FAILED {result['check']}: {result['detail']}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
