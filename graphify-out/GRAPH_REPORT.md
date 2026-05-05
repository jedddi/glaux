# Graph Report - glaux  (2026-05-05)

## Corpus Check
- 94 files · ~417,301 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 5956 nodes · 19372 edges · 13 communities detected
- Extraction: 92% EXTRACTED · 8% INFERRED · 0% AMBIGUOUS · INFERRED: 1505 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]

## God Nodes (most connected - your core abstractions)
1. `i59` - 1354 edges
2. `T()` - 287 edges
3. `b()` - 196 edges
4. `X()` - 194 edges
5. `forEach()` - 188 edges
6. `copy()` - 173 edges
7. `Q()` - 172 edges
8. `constructor()` - 164 edges
9. `map()` - 129 edges
10. `set()` - 120 edges

## Surprising Connections (you probably didn't know these)
- `assertValidTransition()` --calls--> `uploadAndInspect()`  [INFERRED]
  lib\lifecycle\status.ts → lib\services\session-orchestrator.ts
- `GET()` --calls--> `set()`  [INFERRED]
  app\api\sessions\[sessionId]\download\route.ts → public\model-explorer\worker.js
- `proxyFetch()` --calls--> `setTimeout()`  [INFERRED]
  app\api\sessions\[sessionId]\evaluate\route.ts → public\model-explorer\main_browser.js
- `proxyFetch()` --calls--> `clearTimeout()`  [INFERRED]
  app\api\sessions\[sessionId]\evaluate\route.ts → public\model-explorer\main_browser.js
- `GET()` --calls--> `setTimeout()`  [INFERRED]
  app\api\sessions\[sessionId]\failures\route.ts → public\model-explorer\main_browser.js

## Communities

### Community 0 - "Community 0"
Cohesion: 0.0
Nodes (1042): __(), $4(), $5(), _6(), _7(), $8(), a_(), A0() (+1034 more)

### Community 1 - "Community 1"
Cohesion: 0.0
Nodes (229): GET(), GET(), GET(), a9(), aC(), _activateCurrentItem(), addHandler(), afterClosed() (+221 more)

### Community 2 - "Community 2"
Cohesion: 0.0
Nodes (149): boe(), gB(), ise(), koe(), loe(), makeRotationFromEuler(), Noe(), ooe() (+141 more)

### Community 3 - "Community 3"
Cohesion: 0.01
Nodes (444): $2(), absellipse(), accumulate(), accumulateAdditive(), addHeaderEntry(), addLevel(), addPanelClass(), addScaledSH() (+436 more)

### Community 4 - "Community 4"
Cohesion: 0.01
Nodes (335): seededRandom(), StubFailureAnalysisRunner, fetchFailureSamples(), useSessionGraph(), isActive(), isRetryable(), isTerminal(), isValidTransition() (+327 more)

### Community 5 - "Community 5"
Cohesion: 0.03
Nodes (227): ace(), ade(), ae(), afe(), ahe(), ame(), ape(), aue() (+219 more)

### Community 6 - "Community 6"
Cohesion: 0.02
Nodes (124): GET(), POST(), proxyFetch(), seededRandom(), StubEvaluationRunner, GET(), assertValidTransition(), _3() (+116 more)

### Community 7 - "Community 7"
Cohesion: 0.03
Nodes (122): BaseModel, Enum, Exception, uploadEvaluationDatasetApi(), uploadModelApi(), detect_format_from_bytes(), _is_onnx(), _is_tflite() (+114 more)

### Community 8 - "Community 8"
Cohesion: 0.03
Nodes (11): useSessionEvaluate(), Ao, getInput(), getOutput(), hi, Jp, pd, qa (+3 more)

### Community 9 - "Community 9"
Cohesion: 0.03
Nodes (89): A4(), _addPanelClasses(), apply(), _applyPosition(), AZ(), cache(), _cacheItemPositions(), _cacheParentPositions() (+81 more)

### Community 10 - "Community 10"
Cohesion: 0.06
Nodes (35): addGroup(), bindSkeletons(), Dh(), extractUrlBase(), fre(), fromJSON(), load(), loadAsync() (+27 more)

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (36): addControl(), _allControlsDisabled(), _anyControls(), _anyControlsDirty(), _anyControlsHaveStatus(), _anyControlsTouched(), By(), _calculateStatus() (+28 more)

### Community 12 - "Community 12"
Cohesion: 0.24
Nodes (4): b3(), B8(), nk(), oj()

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `i59` connect `Community 1` to `Community 0`, `Community 2`, `Community 3`, `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 9`, `Community 10`, `Community 11`, `Community 12`?**
  _High betweenness centrality (0.242) - this node is a cross-community bridge._
- **Why does `T()` connect `Community 5` to `Community 0`, `Community 1`, `Community 2`, `Community 3`, `Community 4`, `Community 6`, `Community 7`, `Community 10`, `Community 11`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `map()` connect `Community 3` to `Community 0`, `Community 1`, `Community 2`, `Community 4`, `Community 5`, `Community 6`, `Community 9`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Are the 215 inferred relationships involving `T()` (e.g. with `AP()` and `schedule()`) actually correct?**
  _`T()` has 215 INFERRED edges - model-reasoned connections that need verification._
- **Are the 185 inferred relationships involving `X()` (e.g. with `ae()` and `nu()`) actually correct?**
  _`X()` has 185 INFERRED edges - model-reasoned connections that need verification._
- **Are the 42 inferred relationships involving `forEach()` (e.g. with `.analyze()` and `.generateFallbackSamples()`) actually correct?**
  _`forEach()` has 42 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0 - nodes in this community are weakly interconnected._