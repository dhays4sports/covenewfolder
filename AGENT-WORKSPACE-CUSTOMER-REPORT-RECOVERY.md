# Agent Workspace Customer Report Recovery

The consultation inbox and private report store are separate records in Cloudflare D1. A consultation can remain available even when an older private-report record is missing, was created before D1 was configured, or was saved only on the homeowner device.

CoverageFit v3.20.8 keeps the durable opaque-link lookup as the primary path. When **Open customer report** is selected from the Agent Workspace, the active report is also prepared as a same-origin Workspace preview. If the durable lookup cannot be completed, the report page uses that prepared copy instead of showing an unavailable state.

Customer-facing links opened outside the Agent Workspace do not receive this fallback and continue to honor server deletion and 30-day expiration behavior.
