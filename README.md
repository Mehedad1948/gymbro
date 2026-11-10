# Gymbro

A local-first gym PWA: store training plans, log set weights, see previous performance and progression suggestions, and browse 1,300+ movement guides. Everything lives on the phone.

```bash
npm install
npm run catalog:build   # once: downloads the exercise dataset → public/data/exercises.json
npm run dev             # http://localhost:3000 (install to home screen from a production build)
npm run check           # typecheck + lint + tests
npm run build && npm start
```

- Docs: [docs/README.md](docs/README.md) · Architecture: [docs/architecture.md](docs/architecture.md) · Agent handbook: [CLAUDE.md](CLAUDE.md)
- Generate the next plan with an AI: [docs/ai/plan-generation-guide.md](docs/ai/plan-generation-guide.md)

Exercise data from [hasaneyldrm/exercises-dataset](https://github.com/hasaneyldrm/exercises-dataset) (MIT). Media © Gym visual — https://gymvisual.com/.
