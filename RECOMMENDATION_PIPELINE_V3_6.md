# CoverageFit Recommendation Pipeline 3.6

The recommendation subsystem now has one shared runtime pipeline:

1. `assets/js/recommendation-engine.js` owns registration, collection, de-duplication, priority upgrades, evidence merging, enrichment, sorting, diagnostics, and generation.
2. Product rule modules register with the engine:
   - `home-recommendation-rules.js`
   - `business-recommendation-rules.js`
3. Report renderers call `CoverageFitRecommendationEngine.generate(product, context)`.
4. `business-recommendations.js` remains only as a backwards-compatible adapter and contains no rules.

Future Landlord, Auto, and Life products should register a product rule file and use the same generate method.
