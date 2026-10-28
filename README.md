# Lithium Battery Risk Mesh

An interactive tool for exploring lithium battery risk scenarios in aviation. Build a scenario as a branching mesh of parameters (device, capacity, location, flight phase, condition) and get a live risk assessment with mitigation guidance.

**Live site:** https://anisc.github.io/Lithium-Battery-Risk/

## Features

- **Scenario register** — 20 seeded scenarios from the Class 9 lithium battery register (LB-001 to LB-056 range)
- **Build from device** — start from a device (phone, laptop, power bank, vape, mobility aid, drone, etc.) and branch outward
- **Right-click a node** — add a parameter branch. Each parameter type may appear only once per path
- **Double-click a node** — apply mitigations (containment bag, fire gloves, cooling, monitoring, etc.)
- **Path highlighting** — selecting a node highlights the full branch back to its root
- **Live risk assessment** — severity, probability, barrier effectiveness, risk score, tolerability and decision guidance based on the 5×5 matrix in `riskMatrix.pdf`
- **Risk differentiation** — battery energy (Wh), accessibility, flight phase, fire load and condition all shift the calculated risk

## How risk is calculated

Base severity/probability is set by the root scenario, then modified by:

| Factor | Effect |
| --- | --- |
| Location accessibility | Overhead bin/cargo/held-in-seat raises severity and weakens barriers |
| Phase of flight | Take-off/landing and in-flight raise probability (no immediate ground access) |
| Battery capacity | 100–160 Wh and >160 Wh raise severity; unknown capacity is treated as elevated |
| Device type | Fire load weighting by device/chemistry |
| Condition | Damaged, trapped, charging, overheating, smoke, thermal runaway escalate risk |
| Quantity | Multiple batteries increase fire load |
| Mitigations | Applied mitigations reduce severity/probability and improve barriers |

Risk levels map to the provided matrix: Low (acceptable), Medium (tolerable), High and Very High (intolerable), each with matching investigation/action requirements.

## Development

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to ./out
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds a static export and publishes it to the `gh-pages` branch. GitHub Pages serves that branch at the live URL above.

Static export is enabled in `next.config.ts`; when `GITHUB_PAGES=true`, assets are served from the `/Lithium-Battery-Risk` base path.

## Status

Implemented: graph + branching (Phases 0–2), risk engine, mitigations.

Not yet implemented: recommended-mitigation engine, escalation-ladder nodes, path comparison, export/reporting.
