"""Validate the generic XFlow vocabulary and ChargeWeave workflow profile."""
import json
from pathlib import Path

from pyshacl import validate
from rdflib import Graph, Namespace, URIRef
from rdflib.namespace import OWL, RDF

ROOT = Path(__file__).resolve().parents[1]
XFLOW = Namespace("https://example.org/chargeweave/xflow#")
CD = Namespace("https://example.org/charge-domain#")
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
