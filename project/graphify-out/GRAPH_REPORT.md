# Graph Report - project  (2026-04-26)

## Corpus Check
- 17 files · ~8,192 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 92 nodes · 113 edges · 4 communities detected
- Extraction: 84% EXTRACTED · 16% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]

## God Nodes (most connected - your core abstractions)
1. `DatabaseManager` - 33 edges
2. `CricketPoller` - 12 edges
3. `OddsEngine` - 10 edges
4. `BettingEngine` - 7 edges
5. `Match()` - 2 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (1): DatabaseManager

### Community 1 - "Community 1"
Cohesion: 0.16
Nodes (1): BettingEngine

### Community 2 - "Community 2"
Cohesion: 0.17
Nodes (2): CricketPoller, Match()

### Community 3 - "Community 3"
Cohesion: 0.27
Nodes (1): OddsEngine

## Knowledge Gaps
- **Thin community `Community 0`** (23 nodes): `database.js`, `DatabaseManager`, `.constructor()`, `.createTables()`, `.deposit()`, `.getAllMatches()`, `.getAllUsers()`, `.getBet()`, `.getBetsByUser()`, `.getLiveMatches()`, `.getMarketsByMatch()`, `.getMatch()`, `.getOpenBetsForMarket()`, `.getSelectionsByMarket()`, `.getTransactionsByUser()`, `.getUserByAuthId()`, `.getUserByUsername()`, `.init()`, `.insertBet()`, `.seedData()`, `.suspendMarkets()`, `.updateSelectionOdds()`, `.updateUser()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 1`** (18 nodes): `bettingEngine.js`, `BettingEngine`, `.cashout()`, `.constructor()`, `.fail()`, `.placeBet()`, `.setDatabase()`, `.settleMarket()`, `.createUser()`, `.getMarket()`, `.getSelection()`, `.getUser()`, `.insertTransaction()`, `.lockExposure()`, `.settleUser()`, `.updateBet()`, `.updateMarket()`, `.withdraw()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 2`** (16 nodes): `cricketPoller.js`, `CricketPoller`, `.constructor()`, `.fetchESPN()`, `.mapBallType()`, `.parseESPN()`, `.setDatabase()`, `.setIO()`, `.setOddsEngine()`, `.startMatch()`, `.stopMatch()`, `.syncToDatabase()`, `.tick()`, `.updateMatch()`, `Match.jsx`, `Match()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 3`** (11 nodes): `oddsEngine.js`, `OddsEngine`, `.bookmakerOdds()`, `.chaseWinProb()`, `.constructor()`, `.firstInningsProb()`, `.makeOdds()`, `.probToOdds()`, `.recalculate()`, `.setDatabase()`, `.spread()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `DatabaseManager` connect `Community 0` to `Community 1`, `Community 2`?**
  _High betweenness centrality (0.406) - this node is a cross-community bridge._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._