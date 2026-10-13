# Deterministic monster recovery browser proof

PR32's first WebGL run, 38435459466, failed while waiting to observe the live capsule fallback. Its JSON recorded responses `[503,200]`, zero page errors and `sawCapsule:false`; `ready:false` was a test flag only assigned after observing that intermediate state, not a snapshot of the rendered model.

The browser proof waited for the diagnostic render-status hook before looking for a short-lived intermediate state. A successful retry could finish before that hook was available. A controlled six-second delay in publishing only the diagnostic hook reproduces the old failure with `finalStatus.modelReady:true` and the actual 503→200 sequence. This establishes the observation-race failure mode; the historical run did not capture final render status, so its exact scheduling is not asserted.

The corrected fixture holds successful network retry responses until the living, rendered capsule is actually observed. It then releases the real response and requires a living, rendered, model-ready monster, HTTP200, exactly one injected503, no page errors and no overflow. Original timeouts and assertions remain. Production loaders and retry timers are unchanged. A final render-status snapshot is now included even on failure.

With the same diagnostic publication delay, the old proof fails after the model has recovered; the corrected proof passes on desktop and mobile while observing both fallback and normal model states. The ordinary corrected proof also passes on desktop and mobile. The before/after reports and scripts are retained in release evidence.
