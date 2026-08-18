# Shared Recommendation Engine

Version 3.6.0 uses one recommendation runtime for every product.

## Runtime

`assets/js/recommendation-engine.js` owns:

- product registration
- recommendation generation
- normalization
- de-duplication
- priority upgrades
- reason and trigger merging
- evidence and rule identifiers
- Trigger Library enrichment
- sorting
- diagnostics

## Product rule modules

- `assets/js/home-recommendation-rules.js`
- `assets/js/business-recommendation-rules.js`

Each module registers itself with:

```js
CoverageFitRecommendationEngine.registerProduct('product-name', {
  generate(context) { /* return recommendations */ }
});
```

Report renderers request results through:

```js
CoverageFitRecommendationEngine.generate('product-name', context);
```

`business-recommendations.js` is retained only as a backwards-compatible nine-line adapter. It contains no recommendation rules.

Future Landlord, Auto, and Life modules should register product-specific rules without creating a second recommendation engine.
