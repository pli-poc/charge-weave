"""Behavioral acceptance for bitemporal writes, SPARQL selection and calendar replay."""
import json
import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path
from rdflib import Dataset, Graph, Literal, Namespace, RDF, URIRef, XSD, BNode
from runtime import P, C, E, check
from temporal_integrity import (aggregate_digest, canonical_bytes, digest, expand_window, instant,
                                local_instant, policy, stamp_digests, contract_digest)
from temporal_store import TemporalStore, TemporalError, Checkpoint, classify_event, interval_union_seconds
from build_temporal import Clock, price_graph, demo_store, reference_closure, serialize_dataset


def person_graph(value='original'):
    g=reference_closure([E.Person])
    g.set((E.Person,C.personReference,Literal(value,datatype=XSD.string)))
    for n in list(g.subjects(C.createdAt,None)):
        g.set((n,C.createdAt,Literal(instant('2026-05-01T00:00:00Z'),datatype=XSD.dateTime)))
    return g


class TemporalAcceptance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.demo=demo_store()

    def setUp(self):
        self.clock=Clock('2026-05-01T00:00:00Z')
        self.store=TemporalStore(E.Tenant,'https://example.org/scope/person',clock=self.clock)

    def cp(self,offset=1,**changes):
        args=dict(source='events',partition='0',offset=offset,complete_through=self.clock(),observed_at=self.clock())
        args.update(changes)
        return [Checkpoint(**args)]

    def put(self,graph=None,**changes):
        args=dict(valid_from='2026-05-01T00:00:00Z',expected_head=self.store.head,checkpoints=self.cp(),reason='test event')
        args.update(changes)
        return self.store.commit(person_graph() if graph is None else graph,**args)

    def test_01_original_and_corrected_answers(self):
        q=(P/'queries/temporal/tariff-at.rq').read_text()
        for valid,known,price in [('2026-05-02','2026-05-02','0.30'),('2026-05-02','2026-05-04','0.35'),
                                  ('2026-05-16','2026-05-06','0.32'),('2026-05-20','2026-05-06','0.35')]:
            snap,rows=self.demo.query(q,valid+'T00:00:00Z',known+'T00:00:00Z')
            self.assertEqual(float(rows[0].price),float(price))
            self.assertEqual(digest(snap.graph),snap.payload_digest)

    def test_02_retraction_preserves_prior_answers(self):
        before=self.demo.select('2026-05-18T12:00:00Z','2026-05-06T00:00:00Z')
        withdrawn=self.demo.select('2026-05-18T12:00:00Z','2026-05-08T00:00:00Z')
        resumed=self.demo.select('2026-05-19T00:00:00Z','2026-05-08T00:00:00Z')
        self.assertEqual(before.state,'Present');self.assertEqual(withdrawn.state,'Retracted')
        self.assertIsNone(withdrawn.graph);self.assertEqual(resumed.state,'Present')

    def test_03_valid_and_system_boundaries(self):
        a=self.demo.select('2026-05-02T00:00:00Z','2026-05-02T23:59:59.999999Z')
        b=self.demo.select('2026-05-02T00:00:00Z','2026-05-03T00:00:00Z')
        self.assertNotEqual(a.commit,b.commit)
        self.assertEqual(a.system_until,b.system_from)
        self.assertIsNone(self.demo.select('2026-06-01T00:00:00Z','2026-05-08T00:00:00Z'))
        self.assertIsNone(self.demo.select('2026-05-01T00:00:00Z','2026-04-30T23:59:59Z'))

    def test_04_timezone_equivalence(self):
        a=self.demo.select('2026-05-02T00:00:00Z','2026-05-03T00:00:00Z')
        b=self.demo.select('2026-05-02T02:00:00+02:00','2026-05-03T02:00:00+02:00')
        self.assertEqual(a.commit,b.commit);self.assertEqual(a.slice,b.slice)
        with self.assertRaises(ValueError):self.demo.select('2026-05-02','2026-05-03')

    def test_05_optimistic_concurrency_atomicity(self):
        first=self.put();self.clock.set('2026-05-02T00:00:00Z')
        before=serialize_dataset(self.store.export_dataset())
        with self.assertRaisesRegex(TemporalError,'Stale expected head'):
            self.put(person_graph('changed'),expected_head=None)
        self.assertEqual(self.store.head,first);self.assertEqual(serialize_dataset(self.store.export_dataset()),before)

    def test_06_identical_and_conflicting_duplicates(self):
        cp=self.cp();first=self.put(event_key='event-1',checkpoints=cp)
        self.assertEqual(self.put(event_key='event-1',checkpoints=cp,expected_head=None),first)
        with self.assertRaisesRegex(TemporalError,'Conflicting duplicate'):
            self.put(person_graph('different'),event_key='event-1',checkpoints=cp)

    def test_07_recording_time_cannot_regress_or_tie(self):
        first=self.put()
        with self.assertRaisesRegex(TemporalError,'Recording time must increase'):
            self.put(person_graph('new'))
        self.clock.set('2026-04-30T00:00:00Z')
        with self.assertRaisesRegex(TemporalError,'Recording time must increase'):
            self.put(person_graph('new'))
        self.assertEqual(self.store.head,first)

    def test_08_watermarks_must_be_complete_monotonic_and_present(self):
        first=self.put(checkpoints=self.cp(5))
        self.clock.set('2026-05-02T00:00:00Z')
        for cp in [self.cp(4),self.cp(6,complete=False),self.cp(6,complete_through=instant('2026-05-03T00:00:00Z')),
                   [Checkpoint('events','new',6,self.clock(),self.clock())]]:
            with self.assertRaises(TemporalError):self.put(person_graph('new'),checkpoints=cp)
        self.assertEqual(self.store.head,first)

    def test_09_stale_projection_queries_fail(self):
        self.put(checkpoints=self.cp(5));self.clock.set('2026-05-02T00:00:00Z')
        with self.assertRaisesRegex(TemporalError,'required source offset'):
            self.store.select('2026-05-01T00:00:00Z','2026-05-01T00:00:00Z',required_offsets={('events','0'):6})
        with self.assertRaisesRegex(TemporalError,'not complete'):
            self.store.select('2026-05-01T00:00:00Z','2026-05-01T00:00:00Z',complete_through='2026-05-02T00:00:00Z')

    def test_10_nested_tariff_mutation_rejected_even_with_recomputed_digest(self):
        self.store=TemporalStore(E.Tenant,'https://example.org/scope/tariff',clock=self.clock)
        self.put(price_graph('0.30',1));self.clock.set('2026-05-02T00:00:00Z')
        with self.assertRaisesRegex(TemporalError,'Immutable aggregate changed'):
            self.put(price_graph('0.35',1))
        self.put(price_graph('0.35',2))  # New immutable version identity is legitimate.

    def test_11_bad_digest_cannot_be_admitted(self):
        graph=price_graph('0.30',1);graph.set((E.PriceComponent,C.unitPrice,Literal('0.40',datatype=XSD.decimal)))
        with self.assertRaisesRegex(TemporalError,'Snapshot digest'):
            self.put(graph)
        self.assertIsNone(self.store.head)

    def test_12_export_and_selection_are_defensive_copies(self):
        self.put();self.clock.set('2026-05-02T00:00:00Z')
        selected=self.store.select('2026-05-01T00:00:00Z','2026-05-01T00:00:00Z')
        selected.graph.remove((None,None,None))
        exported=self.store.export_dataset()
        for ctx in list(exported.contexts()):ctx.remove((None,None,None))
        again=self.store.select('2026-05-01T00:00:00Z','2026-05-01T00:00:00Z')
        self.assertGreater(len(again.graph),0)

    def test_13_cross_tenant_and_metadata_injection_rejected(self):
        g=person_graph();g.set((E.Person,C.tenant,URIRef('https://example.org/other-tenant')))
        with self.assertRaisesRegex(TemporalError,'authorized tenant'):self.put(g)
        g=person_graph();g.add((E.Person,RDF.type,C.TemporalCommit))
        with self.assertRaisesRegex(TemporalError,'trusted history'):self.put(g)

    def test_14_temporal_queries_cannot_federate_or_join_history(self):
        for query in ['SELECT * WHERE {SERVICE <https://example.org/> {?s ?p ?o}}',
                      'SELECT * FROM <https://example.org/> WHERE {?s ?p ?o}',
                      'SELECT * WHERE { GRAPH ?g { ?s ?p ?o } }']:
            with self.assertRaisesRegex(TemporalError,'selected snapshot graph'):
                self.store.query(query,'2026-05-01T00:00:00Z','2026-05-01T00:00:00Z')

    def test_15_historical_access_survives_current_revocation(self):
        # One authorization scope contains its complete decision evidence.
        g=person_graph()
        def record(n,cls):
            for p,o in [(RDF.type,C[cls]),(C.tenant,E.Tenant),(C.canonicalId,Literal(str(n))),
                        (C.createdAt,Literal(self.clock(),datatype=XSD.dateTime)),(C.revision,Literal(1,datatype=XSD.positiveInteger))]:g.add((n,p,o))
        record(E.Principal,'Principal');record(E.Permission,'Permission');record(E.SecurityRole,'SecurityRole');record(E.AccessGrant,'AccessGrant');record(E.AccessDecision,'AccessDecision');record(E.EvidenceDocument,'EvidenceDocument')
        triples=[(E.Principal,C.subjectReference,Literal('operator')),(E.Principal,C.identityProvider,Literal('test')),(E.Principal,C.principalKind,C.principalKind_Human),(E.Principal,C.principalState,C.principalState_Enabled),
                 (E.Permission,C.permissionAction,Literal('inspect')),(E.Permission,C.resourceClass,C.Person),(E.Permission,C.descriptionText,Literal('Read person')), (E.SecurityRole,C.roleName,Literal('Reader')),(E.SecurityRole,C.permission,E.Permission),
                 (E.AccessGrant,C.grantee,E.Principal),(E.AccessGrant,C.securityRole,E.SecurityRole),(E.AccessGrant,C.scopeRecord,E.Person),(E.AccessGrant,C.validFrom,Literal(self.clock(),datatype=XSD.dateTime)),(E.AccessGrant,C.grantState,C.grantState_Active),
                 (E.AccessDecision,C.grantee,E.Principal),(E.AccessDecision,C.scopeRecord,E.Person),(E.AccessDecision,C.permission,E.Permission),(E.AccessDecision,C.accessDecision,C.accessDecision_Permit),(E.AccessDecision,C.decidedAt,Literal(self.clock(),datatype=XSD.dateTime)),(E.AccessDecision,C.accessGrant,E.AccessGrant),(E.AccessDecision,C.decisionEvidence,E.EvidenceDocument),
                 (E.EvidenceDocument,C.contentDigest,Literal('sha256:'+'0'*64)),(E.EvidenceDocument,C.mediaType,Literal('text/plain')),(E.EvidenceDocument,C.storageReference,Literal('https://example.org/evidence',datatype=XSD.anyURI)),(E.EvidenceDocument,C.capturedAt,Literal(self.clock(),datatype=XSD.dateTime))]
        for triple in triples:g.add(triple)
        self.put(g)
        self.clock.set('2026-05-03T00:00:00Z')
        current=g+Graph();current.set((E.Principal,C.principalState,C.principalState_Disabled));current.set((E.AccessGrant,C.grantState,C.grantState_Revoked))
        for p,o in list(current.predicate_objects(E.AccessDecision)):
            current.add((E.CurrentDecision,p,o))
        current.remove((E.AccessDecision,None,None));current.set((E.CurrentDecision,C.canonicalId,Literal('new-decision')))
        current.set((E.CurrentDecision,C.accessDecision,C.accessDecision_Deny));current.set((E.CurrentDecision,C.decidedAt,Literal(self.clock(),datatype=XSD.dateTime)))
        self.put(current,valid_from=self.clock(),checkpoints=self.cp(2))
        past=self.store.select('2026-05-02T00:00:00Z','2026-05-03T00:00:00Z')
        present=self.store.select('2026-05-03T00:00:00Z','2026-05-03T00:00:00Z')
        self.assertIn((E.AccessDecision,C.accessDecision,C.accessDecision_Permit),past.graph)
        self.assertIn((E.CurrentDecision,C.accessDecision,C.accessDecision_Deny),present.graph)
        self.assertTrue(check(past.graph)[0]);self.assertTrue(check(present.graph)[0])
        # Keeping the historical permit beside today's disabled principal remains invalid.
        for p,o in g.predicate_objects(E.AccessDecision):current.add((E.AccessDecision,p,o))
        self.assertFalse(check(current)[0])

    def test_16_exported_trig_replays_same_sparql_selection(self):
        exported=Dataset(default_union=False).parse(data=serialize_dataset(self.demo.export_dataset()),format='trig')
        query=(P/'queries/temporal/select-snapshot.rq').read_text()
        rows=list(exported.query(query,initBindings={'tenant':E.Tenant,'scope':self.demo.scope,
                  'validAt':Literal(instant('2026-05-16T00:00:00Z'),datatype=XSD.dateTime),'knownAt':Literal(instant('2026-05-06T00:00:00Z'),datatype=XSD.dateTime)}))
        self.assertEqual(len(rows),1)
        expected=self.demo.select('2026-05-16T00:00:00Z','2026-05-06T00:00:00Z')
        self.assertEqual(rows[0].commit,expected.commit);self.assertEqual(str(rows[0].digest),expected.payload_digest)

    def test_17_history_overlap_and_changes(self):
        ds=self.demo.export_dataset();bindings={'tenant':self.demo.tenant,'scope':self.demo.scope}
        history=list(ds.query((P/'queries/temporal/history.rq').read_text(),initBindings=bindings))
        self.assertEqual(len({r.commit for r in history}),4)
        overlap=list(ds.query((P/'queries/temporal/overlap.rq').read_text(),initBindings={**bindings,
                     'knownAt':Literal(instant('2026-05-06T00:00:00Z'),datatype=XSD.dateTime),
                     'windowStart':Literal(instant('2026-05-14T00:00:00Z'),datatype=XSD.dateTime),
                     'windowEnd':Literal(instant('2026-05-21T00:00:00Z'),datatype=XSD.dateTime)}))
        self.assertEqual(len(overlap),3)
        difference=self.demo.changes('2026-05-02T00:00:00Z','2026-05-02T00:00:00Z','2026-05-04T00:00:00Z')
        self.assertTrue(difference['removed']);self.assertTrue(difference['added'])

    def test_18_dst_gap_fold_and_overnight(self):
        gap=datetime(2026,3,29,2,30)
        with self.assertRaisesRegex(ValueError,'Nonexistent'):local_instant(gap,'Europe/Amsterdam')
        self.assertIsNone(local_instant(gap,'Europe/Amsterdam',gap_policy='skip'))
        fold=datetime(2026,10,25,2,30)
        a=local_instant(fold,'Europe/Amsterdam','earlier');b=local_instant(fold,'Europe/Amsterdam','later')
        self.assertEqual((b-a).total_seconds(),3600)
        with self.assertRaisesRegex(ValueError,'Ambiguous'):local_instant(fold,'Europe/Amsterdam','reject')
        result=expand_window('2026-03-28','2026-03-28',[5],'23:00:00','04:00:00','Europe/Amsterdam',True)
        self.assertEqual((result[0][1]-result[0][0]).total_seconds(),4*3600)

    def test_19_calendar_exclusions_and_overlap_union(self):
        with self.assertRaises(ValueError):expand_window('2026-02-30','2026-03-01',[0],'09:00:00','10:00:00','Europe/Amsterdam')
        windows=expand_window('2026-05-04','2026-05-04',[0],'09:00:00','12:00:00','Europe/Amsterdam',exclusions=[('2026-05-04T08:00:00Z','2026-05-04T09:00:00Z')])
        self.assertEqual(len(windows),2);self.assertEqual(sum((b-a).total_seconds() for a,b in windows),7200)
        self.assertEqual(interval_union_seconds([('2026-05-01T10:00:00Z','2026-05-01T12:00:00Z'),('2026-05-01T11:00:00Z','2026-05-01T13:00:00Z')]),10800)

    def test_20_lateness_and_retention_disposition(self):
        def decision(event,arrival,cutoff):return classify_event(event,arrival,cutoff,60,3600)
        self.assertEqual(decision('2026-05-01T10:00:00Z','2026-05-01T10:00:30Z','2026-05-01T09:59:00Z').action,'Accept')
        self.assertEqual(decision('2026-05-01T10:00:00Z','2026-05-01T10:05:00Z','2026-05-01T10:02:00Z').action,'Correct')
        self.assertEqual(decision('2026-05-01T10:00:00Z','2026-05-01T10:00:30Z','2026-05-01T10:00:00Z').action,'Correct')
        self.assertEqual(decision('2026-05-01T10:00:00Z','2026-05-01T12:00:00Z','2026-05-01T11:59:00Z').action,'Quarantine')
        self.assertEqual(decision('2026-05-01T12:00:00Z','2026-05-01T10:00:00Z','2026-05-01T09:59:00Z').action,'Quarantine')

    def test_21_all_classes_have_explicit_policy_and_valid_owned_links(self):
        catalog=json.loads((P/'model/catalog.json').read_text())
        self.assertEqual(set(catalog),set(policy()['classPolicies']))
        for cls,links in policy()['ownedLinks'].items():
            self.assertLessEqual(set(links),{f['property'] for f in catalog[cls]['fields']},cls)
        self.assertEqual(set(policy()['classPolicies'].values()),
                         {'abstract','tenant-context','immutable-aggregate','snapshot-versioned','history-metadata'})

    def test_22_graph_digest_ignores_blank_labels_and_decimal_lexical_format(self):
        a=Graph();b=Graph()
        a.add((BNode('a'),C.numericValue,Literal('0',datatype=XSD.decimal)))
        b.add((BNode('b'),C.numericValue,Literal('0.0',datatype=XSD.decimal)))
        self.assertEqual(digest(a),digest(b))
        b.set((next(b.subjects()),C.numericValue,Literal('0.1',datatype=XSD.decimal)))
        self.assertNotEqual(digest(a),digest(b))
        a.set((next(a.subjects()),C.numericValue,Literal('1.00000000000000000000000000001',datatype=XSD.decimal)))
        b.set((next(b.subjects()),C.numericValue,Literal('1.00000000000000000000000000002',datatype=XSD.decimal)))
        self.assertNotEqual(digest(a),digest(b))  # No Decimal context rounding in hashes.
        with self.assertRaisesRegex(ValueError,'precision'):instant('2026-05-01T00:00:00.1234567Z')

    def test_23_future_knowledge_and_future_record_creation_rejected(self):
        with self.assertRaisesRegex(TemporalError,'future'):
            self.store.select('2026-05-01T00:00:00Z','2026-05-02T00:00:00Z')
        graph=person_graph();graph.set((E.Person,C.createdAt,Literal(instant('2026-05-02T00:00:00Z'),datatype=XSD.dateTime)))
        with self.assertRaisesRegex(TemporalError,'not yet known'):self.put(graph)

    def test_24_failed_empty_interval_does_not_advance_history(self):
        with self.assertRaisesRegex(TemporalError,'Empty or reversed'):
            self.put(valid_until='2026-05-01T00:00:00Z')
        self.assertIsNone(self.store.head)

    def test_25_all_business_modules_roundtrip_in_one_complete_snapshot(self):
        graph=Graph().parse(P/'examples/reference.ttl')
        history={C[k] for k,v in policy()['classPolicies'].items() if v=='history-metadata'}
        for node in {s for cls in history for s in graph.subjects(RDF.type,cls)}:
            graph.remove((node,None,None));graph.remove((None,None,node))
        self.clock.set('2026-09-26T00:00:00Z')
        self.put(graph,valid_from='2026-09-25T00:00:00Z')
        selected=self.store.select('2026-09-25T12:00:00Z',self.clock())
        self.assertEqual(digest(graph),selected.payload_digest)
        catalog=json.loads((P/'model/catalog.json').read_text())
        represented={catalog[str(cls).removeprefix(str(C))]['module'] for cls in selected.graph.objects(None,RDF.type) if str(cls).removeprefix(str(C)) in catalog}
        self.assertEqual(represented,{c['module'] for c in catalog.values()})

    def test_26_forecast_horizon_is_distinct_from_knowledge_cutoff(self):
        graph=person_graph()
        for node,cls in [(E.Forecast,'EnergyForecast'),(E.Point,'ForecastPoint'),(E.Horizon,'TimeWindow')]:
            for p,o in [(RDF.type,C[cls]),(C.tenant,E.Tenant),(C.canonicalId,Literal(str(node))),
                        (C.createdAt,Literal(self.clock(),datatype=XSD.dateTime)),(C.revision,Literal(1,datatype=XSD.positiveInteger))]:graph.add((node,p,o))
        for triple in [(E.Forecast,C.forecastTarget,E.Person),(E.Forecast,C.issuedAt,Literal(self.clock(),datatype=XSD.dateTime)),
                       (E.Forecast,C.horizon,E.Horizon),(E.Forecast,C.forecastPoint,E.Point),(E.Forecast,C.forecastMethod,Literal('test')),
                       (E.Forecast,C.unitIri,URIRef('https://qudt.org/vocab/unit/KiloW')),(E.Point,C.interval,E.Horizon),
                       (E.Point,C.predictedValue,Literal('10',datatype=XSD.decimal)),
                       (E.Horizon,C.startsAt,Literal(instant('2026-05-03T00:00:00Z'),datatype=XSD.dateTime)),
                       (E.Horizon,C.endsAt,Literal(instant('2026-05-04T00:00:00Z'),datatype=XSD.dateTime))]:graph.add(triple)
        self.put(graph)
        self.clock.set('2026-05-02T00:00:00Z')
        updated=graph+Graph();updated.set((E.Point,C.predictedValue,Literal('12',datatype=XSD.decimal)))
        updated.set((E.Forecast,C.issuedAt,Literal(self.clock(),datatype=XSD.dateTime)))
        self.put(updated,checkpoints=self.cp(2))
        query=(P/'queries/temporal/forecast-as-known.rq').read_text()
        bindings={'targetAt':Literal(instant('2026-05-03T12:00:00Z'),datatype=XSD.dateTime),'forecastTarget':E.Person}
        _,old=self.store.query(query,'2026-05-03T12:00:00Z','2026-05-01T00:00:00Z',bindings=bindings)
        _,new=self.store.query(query,'2026-05-03T12:00:00Z','2026-05-02T00:00:00Z',bindings=bindings)
        self.assertEqual(float(old[0].value),10);self.assertEqual(float(new[0].value),12)
        bindings['targetAt']=Literal(instant('2026-05-04T00:00:00Z'),datatype=XSD.dateTime)
        self.assertEqual(self.store.query(query,'2026-05-03T12:00:00Z',self.clock(),bindings=bindings)[1],[])

    def test_27_coalescing_open_ends_and_retraction_resume(self):
        first=self.put();self.clock.set('2026-05-02T00:00:00Z')
        self.put(valid_from='2026-05-03T00:00:00Z',checkpoints=self.cp(2))
        ds=self.store.export_dataset();meta=ds.default_context
        self.assertEqual(len(list(meta.objects(self.store.head,C.temporalSlice))),1)
        self.clock.set('2026-05-03T00:00:00Z')
        self.store.commit(None,valid_from='2026-05-04T00:00:00Z',expected_head=self.store.head,checkpoints=self.cp(3),reason='withdraw indefinitely')
        self.assertEqual(self.store.select('2030-01-01T00:00:00Z',self.clock()).state,'Retracted')
        self.assertEqual(self.store.select('2030-01-01T00:00:00Z','2026-05-01T00:00:00Z').commit,first)

    def test_28_committed_history_metadata_conforms(self):
        self.assertTrue(check(self.demo.export_dataset().default_context)[0])

    def test_29_new_rule_boundaries(self):
        from runtime import ontology
        graph=ontology()
        def violates(rule,node):
            return bool(list(graph.query((P/'queries'/f'{rule}.rq').read_text(),initBindings={'this':node})))
        def dt(value):return Literal(instant(value),datatype=XSD.dateTime)
        # Leap-century calendar arithmetic: 2000 is a leap year; 1900 is not.
        graph.add((E.Calendar,RDF.type,C.ReimbursementPolicy))
        for value,bad in [('2000-02-29',False),('1900-02-29',True),('2026-04-30',False),('2026-04-31',True)]:
            graph.set((E.Calendar,C.validFromDate,Literal(value,datatype=XSD.string)))
            self.assertEqual(violates('B175',E.Calendar),bad)
        graph.add((E.Cabinet,RDF.type,C.PowerCabinet));graph.add((E.Cabinet,C.totalCabinetPowerKW,Literal('100',datatype=XSD.decimal)))
        for n in [E.A,E.B]:
            for p,o in [(RDF.type,C.PowerModuleAllocation),(C.powerCabinet,E.Cabinet),(C.allocatedPowerKW,Literal('50',datatype=XSD.decimal)),(C.interval,E.Window)]:graph.add((n,p,o))
        graph.add((E.Window,C.startsAt,dt('2026-05-01T10:00:00Z')));graph.add((E.Window,C.endsAt,dt('2026-05-01T11:00:00Z')))
        self.assertFalse(violates('B182',E.Cabinet))  # Same start must not multiply the sum.
        graph.set((E.B,C.allocatedPowerKW,Literal('51',datatype=XSD.decimal)))
        self.assertTrue(violates('B182',E.Cabinet))
        # Adjacent assignments are allowed, one microsecond of overlap is rejected.
        for n,a,b in [(E.First,'10:00:00','11:00:00'),(E.Second,'11:00:00','12:00:00')]:
            for p,o in [(RDF.type,C.CredentialAssignment),(C.credential,E.Credential),(C.validFrom,dt('2026-05-01T'+a+'Z')),(C.validUntil,dt('2026-05-01T'+b+'Z'))]:graph.add((n,p,o))
        self.assertFalse(violates('B181',E.First))
        graph.set((E.Second,C.validFrom,dt('2026-05-01T10:59:59.999999Z')))
        self.assertTrue(violates('B181',E.First))
        # Archived financial evidence may retain both price versions. Only a live
        # selection pool with conflicting candidates is ambiguous.
        for node in [E.PriceA,E.PriceB]:
            graph.add((node,RDF.type,C.TariffVersion));graph.add((node,C.tariff,E.Tariff))
            graph.add((node,C.validFrom,dt('2026-05-01T00:00:00Z')))
        graph.add((E.Set,RDF.type,C.TariffSet));graph.add((E.Set,C.defaultTariff,E.PriceA))
        self.assertFalse(violates('B174',E.Set))
        graph.add((E.Set,C.tariffAssignment,E.Assignment));graph.add((E.Assignment,C.assignedTariff,E.PriceB))
        self.assertTrue(violates('B174',E.Set))
        for p,o in [(RDF.type,C.TemporalSnapshotSelection),(C.selectionState,C.selectionState_Unavailable),
                    (C.validAt,dt('2026-05-01T00:00:00Z')),(C.knownAt,dt('2026-05-02T00:00:00Z')),
                    (C.tenant,E.Tenant),(C.snapshotScope,E.Scope)]:graph.add((E.Selection,p,o))
        self.assertFalse(violates('B184',E.Selection))
        for p,o in [(RDF.type,C.TemporalCommit),(C.recordedAt,dt('2026-05-01T00:00:00Z')),
                    (C.tenant,E.Tenant),(C.snapshotScope,E.Scope),(C.temporalSlice,E.Slice)]:graph.add((E.Commit,p,o))
        graph.add((E.Slice,C.validFrom,dt('2026-05-01T00:00:00Z')));graph.add((E.Slice,C.sliceState,C.sliceState_Present))
        self.assertTrue(violates('B184',E.Selection))
        graph.set((E.Selection,C.selectionState,C.selectionState_Present))
        graph.add((E.Selection,C.selectedCommit,E.Commit));graph.add((E.Selection,C.selectedSlice,E.Slice))
        self.assertFalse(violates('B184',E.Selection))

    def test_30_posted_journal_cannot_be_rewritten_or_reopened(self):
        graph=Graph().parse(P/'examples/reference.ttl')
        history={C[k] for k,v in policy()['classPolicies'].items() if v=='history-metadata'}
        for node in {s for cls in history for s in graph.subjects(RDF.type,cls)}:
            graph.remove((node,None,None));graph.remove((None,None,node))
        self.clock.set('2026-09-26T00:00:00Z')
        graph.set((E.Journal,C.journalState,C.journalState_Posted))
        self.put(graph,valid_from='2026-09-25T00:00:00Z')
        self.clock.set('2026-09-26T00:01:00Z')
        changed=graph+Graph();changed.set((E.Journal,C.postingReference,Literal('changed')))
        with self.assertRaisesRegex(TemporalError,'Immutable aggregate changed'):
            self.put(changed,valid_from='2026-09-25T00:00:00Z',checkpoints=self.cp(2))
        graph.set((E.Journal,C.journalState,C.journalState_Draft))
        with self.assertRaisesRegex(TemporalError,'return to draft'):
            self.put(graph,valid_from='2026-09-25T00:00:00Z',checkpoints=self.cp(2))


class RecordedResult(unittest.TextTestResult):
    def __init__(self,*args,**kwargs):super().__init__(*args,**kwargs);self.rows=[]
    def addSuccess(self,test):super().addSuccess(test);self.rows.append({'test':test.id().split('.')[-1],'passed':True})
    def addFailure(self,test,err):super().addFailure(test,err);self.rows.append({'test':test.id().split('.')[-1],'passed':False,'detail':self._exc_info_to_string(err,test)})
    def addError(self,test,err):super().addError(test,err);self.rows.append({'test':test.id().split('.')[-1],'passed':False,'detail':self._exc_info_to_string(err,test)})


if __name__=='__main__':
    suite=unittest.defaultTestLoader.loadTestsFromTestCase(TemporalAcceptance)
    result=unittest.TextTestRunner(verbosity=2,resultclass=RecordedResult).run(suite)
    report={'scope':'Executable in-process writer, immutable named RDF payloads, SPARQL history and calendar/stream policies. No production database or external adapter execution.',
            'schemaDigest':contract_digest(),'passed':sum(r['passed'] for r in result.rows),'total':len(result.rows),'tests':result.rows}
    (P/'reports/temporal-tests.json').write_text(json.dumps(report,indent=2)+'\n')
    sys.exit(0 if result.wasSuccessful() else 1)
