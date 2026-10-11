+++
title = "AI Soccer, part 2: learning brains and what they cost"
tags = [
    "ai",
    "python",
    "aisoccer"
]
date = "2026-10-11T09:00:00+02:00"
description = "Brains that start from nothing learn to play, and I count what each approach cost."
collection = "AI Soccer"
+++

In [part 1](/post/ai-soccer-part-1/) I introduced [ai-soccer](https://github.com/eparkinson/ai-soccer), a small physics-based soccer game for teams controlled by code, and DefendersAndAttackers (DAA), the strongest of my hand-written brains: forty lines of if-statements from 2020.

This post is about an experiment I ran at the end of September with [Claude Code](https://claude.com/claude-code) as my collaborator. The question was simple. If brains start out knowing nothing about the game, which way of learning gets them furthest, and what does it cost? I will explain the setup, show what happened, and then get to the part I found most interesting: what I learnt about working with an AI on a problem where neither of us knew the answer in advance.

# The experiment

It took three attempts to get the design right, and the first two taught us mostly how to measure. (They had their moments. In the second, evolved teams discovered that five players standing side by side could seal a 300 pixel goal completely, so we widened it to 400.) The third league worked like this:

- **A league.** All the brains train at the same time on one 24-core machine. Every half hour or so training pauses and the league plays a tournament of long matches. To take the title a brain has to lead the table over three rounds running and be ahead of the holder with statistical confidence, not just on the day.
- **A yardstick nobody trains against.** DAA never plays in the league and no brain ever trains against it. Every few rounds each brain plays a set of games against it (36 by the end), and the score is its goal difference per 9,000 ticks, a little over two minutes of play. DAA itself is zero. It works like a held-out test set: a brain can only improve against it by getting better at the game in general.
- **A bill.** Every brain's training is metered in CPU time and priced at a cloud rate of $0.04 per CPU-hour. Where a brain was written by an LLM, the tokens are priced at list price. Each brain carries the cost of its whole lineage, failed attempts included. Dollars make very different kinds of compute comparable: an hour of simulation and a million tokens of Claude end up on the same axis.
- **Error bars on everything.** Goals in this game are rare and noisy. Between well-matched brains most short games are draws, and a gap that looks decisive over 16 games can vanish over 300. So every number below has a 95% confidence interval behind it, and no result counted until it held up on fresh games.

The league ran for 150 rounds over four days.

# The approaches

Each one is a different bet on how to get good.

- **Reinforcement learning (PPO).** A small neural network sees the game from one player's point of view and outputs that player's acceleration. All five players share it. It starts with random weights and learns from reward: plus for a goal scored, minus for a goal conceded. The purest version, PPO-goals, got nothing else.
- **Evolution strategies.** The same kind of network, trained by trying many small random changes to its weights and moving towards the ones that won more.
- **Genetic programming (GP).** Evolution again, but of short readable programs instead of network weights. Each program answers one question for every player on every tick, "where should I go?", using only basic geometry: the ball, the goals, the nearest opponent, distances and comparisons.
- **The Coach.** Picks a team from the best individual players in the league, whichever brain they come from.
- **The LLM line.** Claude writes a brain as plain Python. It started deliberately naive (version 1: everyone runs at the ball) and was allowed one small change per round, backed by evidence from that round's games and kept only if it passed a quick check. I capped it at about a hundred readable lines. Its bill is mostly tokens.

# What happened

![Goal difference against DAA by league round for the four main approaches](/images/ai-soccer/yardstick.svg)

The chart shows the four approaches that mattered against the yardstick. Each point is 12 to 36 games, and most have a 95% interval of about one goal either way. Three things happened, in order.

## Evolution found a wall, and everyone got stuck behind it

By round 20 GP had evolved an idea nobody gave it: the player nearest the ball chases it, and the other four stand together in front of their own goal. It was the first learner to draw level with DAA, and it held the title for most of the first 30 rounds. It was also dull to watch. The top games ended 0–0.

The others trailed. PPO from zero crawled from −17 to about −2 against the yardstick over 40 rounds and then went flat. The LLM line climbed a tidy staircase: −10.0, −7.1, −4.4, −3.3, −1.1 and −1.0 for the six versions that played, each step small and explainable. A goalkeeper. A sweeper. Hitting the ball from behind. Slowing down on arrival. Then it stalled too. Four other versions failed their checks and never played. After $4.68 it was still just short of DAA.

## A sideways question

At this point Claude's recommendation was to freeze the LLM line and wrap the experiment up. Instead I asked a question from outside the experiment: *how would your old Tactics brain do here?*

Tactics was a brain Claude had written in one go for an earlier league, from a full brief: about 600 lines, with real skills such as predicting the ball's path and aiming its kicks. We let it in at round 30. It won 39 of its 42 games and scored +7.2 against the yardstick. The careful line and the one-shot design had the same author. The difference was the brief.

So I changed the rules for the LLM line: improvement comes first, big changes are allowed, and it may invent its own measurements. It was told only that better play existed, never how, and it was not allowed to read Tactics' code. (The first brief Claude drafted for it gave away a recipe. I stopped that run before any code was written.)

The result was version 11, and how it got there is my favourite thing in the whole experiment. It measured before it built. It recorded games and found that the ball is at or near top speed 70% of the time and is touched only once every 15 to 30 ticks. Its conclusion: *this is closer to air hockey than to football*, so what decides a game is where each touch sends the ball. It built its own test for that, and found that version 8 sent only 46% of its first touches forwards. Its first fix, steering by geometry, lost 0–8 to Tactics. Its second was to stop calculating and simulate. Every tick, each player tries 49 possible moves, runs the game's own physics 40 ticks ahead for each, and picks the one whose touch sends the ball somewhere useful. That took first touches forwards to 97%.

Version 11 entered in round 34 and won all 24 of its games. Against the yardstick it scored **+20.3**, where every earlier version had lost. Here is the LLM line beating DAA for the first time:

{{< youtube 99oEQ7scg1g >}}

*LLM-v11 (red) against DefendersAndAttackers (blue): 90 seconds of play.*

That one finishes 14–1. Of five recorded games it is the typical one: the margins ran from 11 to 16.

Version 11 was also the most expensive brain in the league by a distance: $17.62 for that one version, nearly all of it tokens, as the model re-read its own growing notebook of experiments about a hundred times. That took the LLM line to $22.30.

## Learning catches up

We froze version 11 and asked the question the experiment was really about: given the same money, can learning catch up with design? Every remaining contender got a budget of about $22, with the spare cores going to whoever was furthest behind on spend.

GP got part of the way. When it stalled, the cause turned out to be vocabulary: its language could say where to stand but had no words for how to hit the ball. We gave it words like `intercept` and `strike`, and later roles, and it rose to +3.3. It won a match against version 11 for the first time in round 96, but never made a habit of it.

The surprise was PPO. Its second design, PPO-v2, had more inputs, a bigger network and a head start: it began as an imitation of version 11, and a poor one, at −4.3 against the yardstick. For its first fifty rounds it lost every single game it played against the original: 264 games, no wins, no draws. In rounds 61 to 70 the combined score was 79 goals to 1,069. But the margin kept shrinking. In round 111 it won a match against version 11 for the first time, in round 115 it took the title, and over the last 40 rounds it won 195 of their 240 games.

{{< youtube kXcgzrk3sZw >}}

*The final champion, PPO-champ-11 (blue), against LLM-v11 (red): 90 seconds of play.*

The champion wins this one 3–2. Close is typical. In five recorded games of this length it won two, drew two and lost one. Its edge shows over long matches, not in any single minute.

Now look at the chart again. The champion beats DAA by 7 goals, where version 11 beats DAA by 20. And yet the champion beats version 11 four times out of five. There is no single ladder. PPO-v2 got good at beating the opponents in front of it, version 11 above all, and it never trained against DAA. Which of the two is "better" depends on who you ask them to play, and that is why the design has both a league and a held-out yardstick.

# The cost of learning

Here is where the four finished.

| Brain | How it was built | Compute | Against DAA | Last round (W-D-L) |
| --- | --- | ---: | ---: | ---: |
| PPO-v2 | Neural network, reinforcement learning, started as an imitation of version 11 | $18.22 | +7.1 ± 0.8 | 20-0-4 |
| LLM-v11 | Python written by Claude over 11 versions | $22.30 | +20.3 ± 1.0 | 14-1-9 |
| GP-v3 | Evolved programs, language redesigned twice | $22.32 | +3.3 ± 1.0 | 6-1-17 |
| PPO-v3 | Neural network, reinforcement learning from zero | $19.67 | −1.7 ± 0.7 | 0-0-24 |

The title holder at the end, PPO-champ-11, is a saved copy of PPO-v2 from round 133. What I take from the bill:

- **It is all remarkably cheap.** Four days on a 24-core machine, with every approach put together, comes to roughly a hundred dollars at cloud prices.
- **Design is expensive up front and then stands still.** $17.62 bought version 11 in a single step, and it was the best brain in the league for about 80 rounds. It never got any better, because improving it would have meant paying again.
- **Learning is slow and then keeps going.** PPO-v2 had used under $8 of compute when it took the title from a brain that cost $22. Some of that brain's design was baked into its starting point, though, which is why the next result matters.
- **"From zero" is doing a lot of work.** The learner we changed least, PPO from zero, finished just below DAA's level after $19.67. Every brain that got further was helped over at least one plateau by a design change: new inputs, a new vocabulary, new rules.
- **The bill leaves things out.** It counts each brain's own training and writing. It does not count the Claude Code sessions that built the league, the simulator and the analysis, or my time.

# What I learnt about working with an AI

Claude wrote nearly all of the new code in this experiment: the league, a batched simulator, the learners, the analysis and, of course, the LLM line. My part was deciding what to build, what to measure, what counted as fair, and when to change course. Here is what I would pass on.

**Decide how you will know before you start.** The most valuable thing I did was insist on the measurement: a yardstick nobody trains against, enough games for confidence intervals, a bill in dollars, and videos of typical games, never the best ones. An agent will happily report progress on whatever number you give it. More than once the honest number said we were stuck when the story I wanted said otherwise, and the number was right.

**A guardrail is also a boundary on the search.** The rules that left the LLM line stuck just short of DAA were mine: one small change per round, don't jump ahead, keep it to a hundred lines. Each made sense on its own. Together they made it impossible to build a skill like an aimed shot, which needs four parts that are each useless alone. Claude followed those rules faithfully for ten versions and never questioned them, because questioning the brief was not in the brief. When an automated process reports round after round that nothing helps, ask which of your own rules it is standing against.

**There is such a thing as too small a step.** We like small pull requests, and with AI writing more of the code that instinct is only getting stronger. Small steps gave the LLM line a cheap, safe, explainable climb from −10 to −1. But a process that only keeps changes that pay for themselves on arrival is hill climbing, and it cannot cross a valley. Version 11 was one big step, taken on purpose, and it was worth 21 goals. Keep the review small, and let the capability be as big as it needs to be.

**Say that better exists. Don't say how.** The brief for version 11 held evidence that there was room above, the rules, and the freedom to measure. It held no recipe. What came back was something neither of us had specified: the air hockey observation, a test built to measure it, a failed first idea, and a planner that runs the simulator. Had I handed over a design, I would have got my design back.

**Stay outside the loop.** The loops did the grinding: thousands of games, generations and updates that nobody could run by hand, for days, unattended. Every change of direction came from a conversation outside them. The Tactics question was mine. The role ideas for GP's last redesign were mine, while the diagnosis of why it had flatlined, and the build, were Claude's. The fairness line for PPO was mine: extra inputs are fine, but a physics simulator inside the network's brain is cheating. Usually I noticed the rut and Claude found the cause and built the fix. Sometimes it was the other way round.

**Treat a running experiment like production.** One morning of quick changes to the live league cost us several crashes and some lost training. After that we agreed operating rules, the same ones I would want from a human team: one experiment at a time, changes only at a round boundary, settings reloaded without a restart, a watchdog, and a feature freeze. Claude built changes in the background and they went in when they were ready. It was dull, and after that the league mostly ran itself.

**Verify the agent's work the way you would a colleague's.** When PPO looked hopeless, three independent reviews of the training code found no significant bug. That told us the problem was the approach, and saved us from chasing ghosts. When a rewrite made Tactics 2.2 times faster, 150,000 moves were checked to be identical before it went in. And the one time a network change went in with only its outputs checked, it blew up in training and muddied three rounds of results.

We call these learning brains, and between redesigns they did learn unattended. But the two biggest jumps in the league had the same shape: a long unattended plateau that ended soon after a person and an AI sat down together to rethink it. That is one experiment, not a proof. It has still changed how I think about the architect's job when an AI does most of the building: choose what to measure, set the rules with care, and keep asking which of them are still earning their place.

# What next

The game and the brains are in the [ai-soccer repo](https://github.com/eparkinson/ai-soccer). For the next league I want a proper train and test split, with several hand-written yardsticks held out instead of one, and a clean run of PPO-v2's design from random weights to see how much that head start was really worth. And if you think you can write a brain that beats version 11, I would love to see it.
