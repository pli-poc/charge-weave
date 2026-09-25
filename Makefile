PYTHON ?= python

.PHONY: install build generated validate tests reason release verify package
install:
	$(PYTHON) -m pip install -r requirements-ci.txt
build:
	$(PYTHON) tools/build_all.py
generated:
	$(PYTHON) tools/check_generated.py
validate:
	$(PYTHON) tools/validate.py --meta
tests:
	$(PYTHON) tools/test_business.py
	$(PYTHON) tools/test_boundaries.py
	$(PYTHON) tools/test_trust_boundary.py
	$(PYTHON) tools/test_business_acceptance.py
	$(PYTHON) tools/test_lifecycle.py
	$(PYTHON) tools/check_audit.py
	$(PYTHON) tools/check_naming.py
reason:
	$(PYTHON) tools/check_owl.py
release:
	$(PYTHON) tools/check_release.py
verify:
	$(PYTHON) tools/check_generated.py
	$(PYTHON) tools/verify_all.py
package:
	$(PYTHON) tools/package.py
