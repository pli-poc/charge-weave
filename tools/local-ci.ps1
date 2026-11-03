[CmdletBinding()]
param(
    [ValidateSet('fast', 'backend', 'ontology', 'browser', 'full')]
    [string] $Profile = 'fast',
    [string] $Python = 'python',
    [switch] $Install
)

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
Push-Location $repo
try {
    if ($Install) {
        Write-Host 'Installing the pinned project dependencies used by CI.' -ForegroundColor Cyan
        & $Python -m pip install -r requirements-ci.txt
        if ($LASTEXITCODE -ne 0) { throw 'Python dependency installation failed.' }
        npm ci --prefix ontology-authoring
        if ($LASTEXITCODE -ne 0) { throw 'Ontology authoring dependency installation failed.' }
        npm ci --prefix client-runtime
        if ($LASTEXITCODE -ne 0) { throw 'Client runtime dependency installation failed.' }
        npm ci --prefix website
        if ($LASTEXITCODE -ne 0) { throw 'Website dependency installation failed.' }
    }

    $steps = [System.Collections.Generic.List[object]]::new()
    $add = { param([string] $Label, [string] $Program, [string[]] $Arguments, [string] $Directory = '.')
        $steps.Add([pscustomobject]@{ Label=$Label; Program=$Program; Arguments=$Arguments; Directory=$Directory })
    }

    if ($Profile -in @('fast','ontology','full')) {
        & $add 'Generated artifact consistency' $Python @('tools/check_generated.py') '.'
        & $add 'Business rules' $Python @('tools/test_business.py') '.'
    }
    if ($Profile -in @('backend','full')) {
        & $add 'MCP and workspace contracts' 'node' @('--test','test/workspace.test.js','test/mcp.test.js','test/http.test.js','test/pairing.test.js') 'ontology-authoring'
        foreach ($check in 'test_domain_schema.py','test_authoring_adapter.py','test_authoring_example_overrides.py','test_business_case_provenance.py','test_check_generated.py') {
            & $add "Authoring support: $check" $Python @("tools/$check") '.'
        }
        & $add 'Ontology authoring suite' 'npm' @('test','--','--test-skip-pattern=^reference profile (runs generated model and fixture checks|generates evidence from requirement and temporal overlays)$') 'ontology-authoring'
    }
    if ($Profile -in @('ontology','full')) {
        $ontologyCommands = @(
            @('SHACL and reference graph','tools/validate.py','--meta'),
            @('Structural boundaries','tools/test_boundaries.py'),
            @('Input trust boundaries','tools/test_trust_boundary.py'),
            @('OWL consistency','tools/check_owl.py'),
            @('Release evidence','tools/check_release.py'),
            @('Requirement audit','tools/check_audit.py'),
            @('Business acceptance','tools/test_business_acceptance.py'),
            @('Lifecycle acceptance','tools/test_lifecycle.py'),
            @('Temporal audit','tools/audit_temporal.py'),
            @('Temporal acceptance','tools/test_temporal.py'),
            @('Analytics','tools/test_analytics.py'),
            @('Naming','tools/check_naming.py'),
            @('XFlow','tools/test_xflow.py')
        )
        foreach ($entry in $ontologyCommands) { & $add $entry[0] $Python @($entry | Select-Object -Skip 1) '.' }
        foreach ($family in 'closure','charge','credit','offline','reimbursement','privacy','energy','migration','asset','allowance','access','settlement','process') {
            & $add "Journey $family" $Python @('tools/test_journey_snapshots.py','--family',$family) '.'
        }
        foreach ($family in 'access','credit','allowance','dunning','history','hold') {
            & $add "Adversarial $family" $Python @('tools/test_adversarial.py','--family',$family) '.'
        }
    }
    if ($Profile -in @('browser','full')) {
        & $add 'Website production build' 'npm' @('run','build','--prefix','website') '.'
        & $add 'Browser model unit tests' 'node' @('--test','src/model/event-cursor.test.js','src/model/canvas-pins.test.js','src/model/canvas-history.test.js','src/model/canvas-viewport.test.js','src/model/canvas-hidden.test.js','src/model/canvas-groups.test.js','src/model/canvas-distribute.test.js','src/model/canvas-redo.test.js','src/model/context-checks.test.js') 'website'
        & $add 'Playwright desktop and mobile smoke' 'npx' @('playwright','test','tests/modelling.spec.js','--project=desktop') 'website'
        & $add 'Playwright mobile smoke' 'npx' @('playwright','test','tests/modelling.spec.js','--project=mobile','-g','mobile relationship list') 'website'
    }

    $failed = [System.Collections.Generic.List[string]]::new()
    if (-not $Install) {
        Write-Host 'If Python checks report missing packages, rerun with -Install and a valid Python 3.12 executable, or install requirements-ci.txt into that interpreter.' -ForegroundColor DarkYellow
    }
    foreach ($step in $steps) {
        Write-Host "`n=== $($step.Label) ===" -ForegroundColor Cyan
        $stepPath = Join-Path $repo $step.Directory
        Push-Location $stepPath
        $timer = [System.Diagnostics.Stopwatch]::StartNew()
        $previousTestPython = $env:CHARGEWEAVE_TEST_PYTHON
        $previousTestReference = $env:CHARGEWEAVE_TEST_REFERENCE
        $previousTestMaintenance = $env:CHARGEWEAVE_TEST_MAINTENANCE
        if ($step.Label -eq 'Ontology authoring suite') {
            $env:CHARGEWEAVE_TEST_PYTHON = $Python
            $env:CHARGEWEAVE_TEST_REFERENCE = '1'
            $env:CHARGEWEAVE_TEST_MAINTENANCE = '1'
        }
        try {
            & $step.Program @($step.Arguments)
            $exitCode = $LASTEXITCODE
        } finally {
            $timer.Stop()
            $env:CHARGEWEAVE_TEST_PYTHON = $previousTestPython
            $env:CHARGEWEAVE_TEST_REFERENCE = $previousTestReference
            $env:CHARGEWEAVE_TEST_MAINTENANCE = $previousTestMaintenance
            Pop-Location
        }
        if ($exitCode -ne 0) {
            $failed.Add("$($step.Label) (exit $exitCode; $([math]::Round($timer.Elapsed.TotalSeconds,1))s)")
            Write-Host "FAILED: $($failed[$failed.Count - 1])" -ForegroundColor Red
            break
        }
        Write-Host "PASS: $($step.Label) ($([math]::Round($timer.Elapsed.TotalSeconds,1))s)" -ForegroundColor Green
    }
    if ($failed.Count) { throw ($failed -join "`n") }
    Write-Host "`nLocal CI profile '$Profile' passed all $($steps.Count) selected checks." -ForegroundColor Green
    Write-Host 'GitHub Actions remains the shared verification authority.'
} finally {
    Pop-Location
}
