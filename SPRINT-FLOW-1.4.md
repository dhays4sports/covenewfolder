# FLOW-1.4 — Entry-Specific Transition Messaging

Status: Implemented

CoverageFit now derives one context-sensitive transition from the existing normalized prospect profile. Homebuyer, professional, home + auto, general homeowner, and time-sensitive entries receive appropriate messaging without separate pages, assessments, or personalization engines.

Professional messaging treats occupation as acquisition context and explicitly states that eligibility or available discounts still require confirmation. Home + auto messaging prepares the home portion of the existing assessment without promising savings. Time-sensitive entries carry their urgency into the transition while stating that coverage availability and timing remain subject to confirmation.

The web prefill receiver now also persists and scrubs the buyer, partner, and launch-surface context that the existing 408FARMERS sender already supplied. This preserves zero-repeat handoff and attribution while keeping those fields out of the visible URL.
