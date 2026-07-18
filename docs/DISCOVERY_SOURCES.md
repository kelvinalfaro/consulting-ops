# Discovery sources

`consulting-ops` separates discovery providers from AI tools. A user can add opportunities manually, configure public RSS/Atom feeds, or configure JSON APIs without changing the rest of the workflow.

Bundled providers load from the installed system package. Private providers load from the configured workspace's `plugins.local/`; duplicate provider identifiers are rejected rather than silently overridden.

## Manual and AI-assisted search

Run the queries in `config/rfp_sources.yml` through a browser, search engine, procurement database, or AI with web access. Add source URLs to `data/rfp_pipeline.md`. This is the broadest option for local governments, nonprofits, associations, universities, and foundations whose procurement systems do not expose feeds.

## RSS or Atom

```yaml
- id: example-feed
  type: rss
  enabled: true
  label: Example procurement feed
  url: https://example.org/procurement/feed.xml
```

## JSON APIs

```yaml
- id: example-api
  type: json
  enabled: true
  label: Example procurement API
  url: https://example.org/api/opportunities
  items_path: results
  fields:
    title: title
    url: url
    issuer: agency.name
    published: posted_at
    summary: description
```

Only configure endpoints whose terms permit automated access. Do not scrape authenticated portals or bypass access controls.

## Federal sources

SAM.gov provides an official contract-opportunities API, but it requires a SAM.gov API key and date parameters. Simpler.Grants.gov provides a separate API for federal funding opportunities and also requires an API key. These are candidates for optional provider modules; they are not enabled in the default configuration because contract RFPs and funding opportunities have different eligibility and response models.

Keep provider credentials in environment variables, never in YAML or tracked files.

## Classification and source health

Discovery requires both a solicitation signal and a consulting-service fit signal before an item enters `Pending`. Generic procurement pages remain `Source leads`; informational, expired, irrelevant, or blacklisted results are rejected with reason codes. Tracking parameters are removed for URL comparison, and issuer/title/deadline fingerprints suppress cross-URL duplicates.

A source can override global vocabulary with a nested `filters:` block. Use this only when the portal's own wording differs from the shared search vocabulary.

Successful non-dry runs append source status to `data/source-health.tsv`. `reachable` and `empty` reset a failure streak; `network`, `configuration`, and `authorization_required` increment it. The default persistent-failure threshold is three runs. Dry runs never write pipeline, scan-history, or source-health files.
