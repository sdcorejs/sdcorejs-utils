# sdcorejs-utils — Package contributor rules

This repository publishes `@sdcorejs/utils`, a framework-independent TypeScript package
with zero runtime dependencies. Consumers rely on its public declarations as well as
its JavaScript behavior. Read `package.json`, `README.md`, adjacent tests and the
affected API reference before changing a contract.

## Public API and JSDoc

- Every new or changed public export, method, overload, generic parameter and model
  property must have complete, useful JSDoc. Describe purpose, inputs, defaults,
  constraints, return shape, null/empty behavior, errors, side effects, precision,
  runtime requirements and a working example where relevant. Document asynchronous
  completion/cancellation and mutation where applicable; omit irrelevant tags.
- Update JSDoc in the same change as behavior. Comments must match the implementation
  and remain available in published declarations. Do not substitute a README link or
  a one-line restatement of the identifier for the consumer contract.
- Keep shared models dependency-free. Export them through the existing root and
  public subpaths; never introduce consumer imports from `src/` or `dist/`.
- Keep the bilingual API inventory, compiled examples and release notes current.

## Tests, coverage and benchmarks

- Every behavior change requires focused tests for normal, boundary, empty/null and
  error cases, plus regression tests for fixes. Add integration tests at the owning
  boundary when mocks cannot prove the contract. Keep all coverage thresholds; do
  not lower thresholds, exclude new code, or add assertion-free tests to pass CI.
- Type-only changes require positive and negative compiler checks against the packed
  package, through both root/subpath exports and ESM/CommonJS declarations. Runtime
  coverage percentages do not establish correctness of erased TypeScript models.
- Performance-sensitive functions and performance claims require reproducible
  benchmarks with a meaningful baseline, checked results, representative input sizes,
  warmups, repeated samples, latency distribution and environment/source identity.
  Include allocation/memory observations when relevant and document limitations.
- Run benchmarks independently of heavy tests/builds. Avoid machine-specific timing
  assertions in normal unit tests. Type-only model changes add no runtime work;
  explicitly record that runtime benchmarking is not applicable instead of inventing
  measurements. Benchmark the consuming query executor when its behavior changes.

## Verification and release

- Use the committed npm lockfiles and supported Node versions from `package.json`.
- Run `npm run validate` for source typecheck, coverage, build, export validation and
  packed consumers. Run `npm run validate:site` for documentation changes.
- Releases use Changesets and `.github/workflows/publish.yml` with npm trusted
  publishing. Respect the user's requested version; publish only after required
  checks pass. Verify the actual npm version before claiming publication.
- Stage only the intended files. Never commit credentials, temporary package fixtures,
  node_modules, coverage reports or generated build output.
