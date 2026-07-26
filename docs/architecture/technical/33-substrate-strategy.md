# Substrate Strategy — Designing Under Licence Uncertainty

> AGPL is pending legal review. Rather than stall or guess, every substrate gets an
> interface with **two viable implementations**. This is the correct design under
> uncertainty — and, usefully, it is also the right design regardless of the ruling.

---

## 1. The pattern

```
Kernel ──► ChatBackend (interface)
              ├── MattermostBackend   (AGPL — pending)
              └── ZulipBackend        (permissive — fallback)

Kernel ──► CrmBackend
              ├── TwentyBackend       (AGPL — pending)
              └── NativeCrmBackend    (built — CRM is close to our domain)

Kernel ──► TaskBackend
              ├── AppFlowyBackend     (AGPL + Flutter risk)
              └── NativeTaskBackend   (built — small surface)
```

The interface is ours, narrow, and expressed in **our** domain language — not a
pass-through of any upstream's API. That is what makes implementations genuinely
interchangeable rather than nominally so.

```ts
export interface ChatBackend {
  ensureWorkspace(orgId: string): Promise<WorkspaceRef>;
  ensureMember(orgId: string, userId: string): Promise<MemberRef>;
  removeMember(orgId: string, userId: string): Promise<void>;   // deprovisioning
  listChannels(ctx: OrgContext): Promise<Channel[]>;            // union across orgs
  postMessage(ctx: OrgContext, input: PostMessage): Promise<MessageRef>;
  subscribe(ctx: OrgContext, onEvent: (e: ChatEvent) => void): Unsubscribe;
}
```

Note what the interface encodes: `OrgContext` in, union semantics, explicit
deprovisioning. Any implementation must satisfy **our** tenancy model, not the other way
round. An upstream that cannot is disqualified at the interface, before integration work
begins.

## 2. Conformance tests decide the choice

One suite, run against every candidate implementation:

```ts
describe('ChatBackend conformance', () => {
  test('listChannels unions across a user\'s orgs');
  test('a non-member cannot read another org\'s channel');   // ← isolation
  test('removeMember revokes access immediately');
  test('subscribe delivers events from all the user\'s orgs');
  test('events carry enough context to resolve organizationId');
  test('provisioning 100 members does not trip rate limits');
});
```

This turns spikes from opinion into evidence. A candidate either passes or it does not, and
"passes" is the same bar for AGPL and permissive options alike.

## 3. Candidate matrix

⚠️ **Licences change and my information may be dated — every entry needs verification by
counsel before commitment.**

| Need | AGPL candidate | Permissive candidate | Build |
|---|---|---|---|
| Chat | Mattermost | **Zulip / Matrix (Apache-2.0)** — verify | 6–9 months |
| CRM | Twenty | Thin pickings | **3–4 months — recommended** |
| Tasks | AppFlowy ⚠️ Flutter client | — | **2–3 months** |

### Chat
The largest surface to build (delivery guarantees, search, attachments, mobile push,
moderation), so substrate has the highest value here. If AGPL is ruled out, Zulip or Matrix
are the serious permissive candidates. Zulip's threading model is arguably a better fit for
async remote teams than Mattermost's.

### CRM — recommend building
Twenty is the best fit technically, but note: **CRM sits adjacent to your core domain.**
Client relationships, engagements and placements are exactly what the talent graph
consumes. A generic CRM would need heavy adaptation to model *"organisation ABC has a
Tezzeract-placed team of four, engagement outcome tracked"*.

Building it is 3–4 months, avoids the licence question, and produces something integrated
with the moat rather than adapted to it. **This is the one case where I'd build even if
counsel clears AGPL.**

### Tasks
AppFlowy carries two risks: AGPL, plus a Flutter primary client that will not compose into
a React shell. Its web client needs verification. A native task module is a 2–3 month
surface — and tasks integrate deeply with the agent, which favours owning it.

## 4. Decision framework

For each substrate, four questions in order:

1. **Is it adjacent to the moat?** (talent, engagements, outcomes) → **build**
2. **Is the surface very large and commodity?** (chat delivery, search) → **adapt**
3. **Does a permissive option pass conformance?** → prefer it over AGPL, always
4. **Does adapting cost more than half of building?** → build

Question 4 catches the trap: integration is systematically underestimated. SSO, tenancy
mapping, provisioning, deprovisioning, reconciliation, upgrade treadmill, and the ceiling
imposed by their API. For small surfaces adapting frequently costs *more* than building,
and leaves you owning less.

## 5. Recommendation while counsel deliberates

| Substrate | Decision | Rationale |
|---|---|---|
| **CRM** | 🔨 **Build native** | Adjacent to the moat; licence-independent; better integration |
| **Tasks** | 🔨 **Build native** | Small surface; deep agent integration; avoids Flutter risk |
| **Chat** | ⏸️ **Wait for counsel** | Largest saving; decision genuinely hinges on the ruling |

This is deliberately not "wait for legal on everything". Two of three decisions do not
depend on the ruling, so make them now and keep moving. Only Chat is genuinely blocked —
and even there, the interface and conformance suite can be built while waiting, so the
implementation slots in on day one after the decision.

## 6. What we build regardless

The adapter framework is shared infrastructure and pays for itself across every substrate:

```
packages/substrate/
├── conformance/       one test suite, all implementations
├── provisioning/      JIT create, event-driven sync, nightly reconcile
├── mapping/           org → workspace, user → account, membership → member
└── health/            upstream availability, rate-limit telemetry
```

Build this **before** the first adapter. Retrofitting reconciliation onto a live
integration is precisely how deprovisioning bugs — the worst tenancy failure class — reach
production.

## 7. Cost of optionality

Two implementations per substrate is not free:

| Cost | Mitigation |
|---|---|
| Second implementation is real work | Only the *fallback* needs to exist, not to be production-hardened, until needed |
| Narrow interface limits features | Correct: a feature we cannot express portably is a feature we should question |
| Conformance suite maintenance | It doubles as the isolation test — value counted twice |

**We accept these because the alternative is a single point of legal and commercial
failure.** And the property bought — *"substrate is replaceable, demonstrably"* — is
directly load-bearing in the IP narrative ([31 §3](31-ip-strategy.md)).
