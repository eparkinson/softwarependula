+++
title = "AI Soccer, part 1: a small game for testing bot players"
tags = [
    "ai",
    "python",
    "aisoccer",
    "tech"
]
date = "2026-10-11T08:00:00+02:00"
+++

In December 2020 I started a small side project called [ai-soccer](https://github.com/eparkinson/ai-soccer): a physics-based soccer sandbox where the players are controlled by code, and the fun is in pitting one piece of code against another. I wanted a game with rules simple enough to explain in a minute and cheap enough to simulate thousands of times, but where it is not at all obvious what good play looks like. In other words, a decent test bed for the kinds of AI I wrote about in [Reflections on AI progress](/post/ai-reflections/), from the genetic algorithms of my M.Sc. days to today's neural networks and language models.

This is the first of two posts. This one covers the game itself and two simple hand-written players. [Part 2](/post/ai-soccer-part-2/) is about what happened when I stopped writing players by hand and let them learn the game instead, with an AI as my collaborator.

# The rules

The game is five-a-side, seen from above, and everything on the pitch is a circle.

- Two teams of five players on a pitch of 1800 by 800 pixels. Blue defends the left goal and red the right.
- Each goal is a 400 pixel gap in the end wall, with a post at each end. A goal is scored when the whole ball crosses the line inside the gap. Everywhere else the walls are solid and the ball bounces off them. There are no throw-ins, corners or offsides.
- Every tick of the game clock, each team is told where everything is (the position and velocity of all ten players and the ball) and answers with one thing: an acceleration for each of its five players. That is all a team controls. There is no kick button and no pass button.
- Accelerations and speeds are capped. The ball's top speed is twice a player's.
- Collisions are elastic, and mass goes with the square of the radius. A player has three times the ball's radius, so nine times its mass. "Kicking" is nothing more than running into the ball: where it goes depends on where you hit it and how fast you were moving.
- There is no friction. A ball that has been hit keeps going until it hits something else.
- After a goal, everyone returns to their kick-off positions and the ball gets a small random nudge.

All of these numbers live in one file, [`aisoccer/constants.py`](https://github.com/eparkinson/ai-soccer/blob/main/aisoccer/constants.py). Games can also be seeded, so the same two teams with the same seed play out exactly the same game every time. That matters a lot once you start comparing players, as part 2 will show.

Those few rules produce a game that looks like football but does not really play like it. It took an AI to point out to me, almost six years later, what kind of game I had actually built. More on that in part 2.

# Writing a player

In the code, the logic that controls a team is called a *brain*. A brain is a Python class with one method, `do_move`, which returns a 5 by 2 array: one acceleration vector per player. Here is a complete brain:

```python
import numpy as np

from aisoccer.abstractbrain import AbstractBrain


class MyBrain(AbstractBrain):
    def do_move(self) -> np.ndarray:
        return self.ball_pos - self.my_players_pos  # everyone chases the ball
```

Every player runs straight at the ball. It is the kind of first attempt most people write, and it is in the repo as `SimpleBrain`.

Everything a brain sees is from its own point of view: you always defend the goal at x = 0 and attack the far end, whichever colour you happen to be playing. To try it:

```shell
git clone https://github.com/eparkinson/ai-soccer.git
cd ai-soccer
poetry install
poetry run python demo_game.py
```

`demo_game.py` opens a window and plays a game you can watch. `demo_tournament.py` plays a round robin between all the brains in the repo and prints a league table.

# Two simple brains

The first two brains I wrote back in 2020 are still in the repo, and one of them plays a big role in part 2.

## BehindAndTowards (BAT)

This is the whole brain:

```python
class BehindAndTowards(BaseBrainUtils):
    def do_move(self) -> np.ndarray:
        actions = [[0] * 2] * 5
        for i in range(5):
            if self.is_behind_ball(i):
                actions[i] = self.run_towards(i, self.ball_pos)
            else:
                actions[i] = self.run_back(i)

        return np.array(actions)
```

Each player asks one question: am I behind the ball, meaning on my own goal's side of it? If yes, run at the ball. If no, run straight back towards my own end until I am. That is the entire strategy. There are no positions and no roles, and nobody stays home to defend.

Its one idea is a good one, though: only ever hit the ball from behind, so that it goes forwards. That alone is enough to put it above "everyone chase the ball" in the repo's league table.

## DefendersAndAttackers (DAA)

DAA is BAT with a formation. Four of the five players get a home position and a zone:

- Two defenders sit deep in their own half, and two midfielders about a third of the way up the pitch.
- Each of them only goes for the ball when it comes inside its own zone: within 100 pixels for the deepest defender, growing to 400 pixels for the last midfielder. Inside its zone a player behaves exactly like BAT.
- When the ball is outside its zone and moving away up the pitch, the player goes back to its home position.
- When the ball is coming towards it, the player works out where the ball's path will cross its home line, bounces off the side walls included, and goes to stand there.

The fifth player is a full-time attacker and simply plays BAT.

That is about forty lines of if-statements. It is still nothing clever, but it has two things BAT lacks: players who stay home, and players who go to where the ball will be and not where it is now.

# BAT against DAA

Here they are playing each other. DAA is blue and BAT is red.

{{< video src="/videos/ai-soccer/bat-vs-daa.mp4" caption="DefendersAndAttackers (blue) against BehindAndTowards (red): 90 seconds of play" >}}

DAA wins this one 9–5. I recorded five games and picked the most typical one. DAA won all five, by between three and eight goals.

Two things are worth watching for. BAT moves as a pack: its five players are on average about 130 pixels from each other, a few body widths, so when the ball gets past the pack there is nobody left behind it. DAA is spread out, and keeps four of its five players in its own half most of the time, so there is nearly always somebody between the ball and its goal. It is not one-way traffic, though. BAT still scores five.

DAA is the strongest of the hand-written brains in the repo, and that makes it a useful yardstick. If a player that starts off knowing nothing can learn to beat forty lines of if-statements from 2020, it has learnt something. Whether it can, how, and what it costs is the subject of [part 2](/post/ai-soccer-part-2/).
