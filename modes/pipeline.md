# Pipeline inbox

Process unchecked entries in `data/rfp_pipeline.md` through auto-pipeline. For three or more items, use bounded workers when supported, but serialize tracker writes. Mark successful items with the decision; retain failures with concise error evidence. Summarize top pursuits, deadlines, unknown gates, and source failures.
