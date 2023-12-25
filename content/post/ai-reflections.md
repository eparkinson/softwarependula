+++
title = "Reflections on AI progress (1995-2023)"
tags = [
    "tech",
    "musings",
    "ai"
]
date = "2023-12-25"
+++

Back in 1994, during my M.Sc. in Computer Science, my research topic for my thesis was exam timetabling. Initially, I explored various heuristic algorithms to address the graph colouring problem. However, as you add more complex constraints for optimisation, it became evident that traditional heuristics weren't quite cutting it. This led me to a shift towards genetic algorithms. At that time, they stood out as the superior strategy for tackling such multifaceted optimization challenges, offering a more dynamic and effective solution.



As an aside, it may be worthwhile here to point out why there is a relation between timetable scheduling and the graph colouring problem: At its core, graph colouring involves assigning colours to the vertices of a graph such that no two adjacent vertices share the same colour. This concept translates effectively into timetable scheduling, where each 'vertex' represents a time slot or a class, and 'colouring' corresponds to assigning these slots or classes in a conflict-free manner. For example, in a university timetable, each course can be considered a vertex, and the scheduling challenge is to ensure that no two courses that share students (adjacent vertices) are scheduled at the same time. The minimization of colours (time slots) while avoiding conflicts (adjacent vertices sharing the same colour) is akin to optimizing the timetable so that it uses the fewest possible number of time slots, thereby maximizing resource utilization and convenience. This practical application of graph colouring highlights its importance in creating efficient, conflict-free schedules in various domains, including education, transportation, and resource allocation.



Graph colouring and timetabling are classic examples of what computer scientists like to call NP-hard problems, notorious for their exponential ([probably](https://en.wikipedia.org/wiki/P_versus_NP_problem)) computational complexity. The catch? They probably don't have solutions that play nice with polynomial time for all scenarios. This means that when dealing with large-scale problems, hunting for the optimal solution can feel like searching for a needle in a digital haystack. So, what do we do? We turn to heuristic or approximation methods, the trusty sidekicks that help us find 'good enough' solutions without burning out our processors!



At the time Genetic Algorithms were arguably considered one of the hot topics in artificial intelligence research and formed part of the evolutionary programming domain. It was an excellent generic way to solve large NP-hard optimisation problems where brute force was not an option. While there were also a myriad of known heuristic algorithms to find approximate solutions to well-defined problems like the graph colouring problem, these did not generalise at all when additional types of constraints were added. Generic Algorithms generalise extremely well and could solve virtually any problem that could be expressed as minimising some kind of cost function.



Neural networks have been around since the 50s and 60s and when I was in university, I was aware of some of the concepts. In the 70s Paul Werbos introduced backpropagation, although its significance was fully recognized later in the 1980s through the work of Rumelhart, Hinton, and Williams. This algorithm, essential for training multi-layer networks, allowed neural networks to learn complex data patterns. By the mid-1990s, when I was busy with my Master's thesis, the field experienced a downturn, known as an "AI winter," due to computational limitations, and challenges in training deep networks. 



Neural networks struck me as a fascinating effort to echo the human brain, much like genetic algorithms aimed to emulate evolution in their quest for optimal solutions. At the time, neural nets seemed like a bit of a one-trick pony, their most notable "killer app" being the recognition of alphanumeric characters in a 8x8 grid. Sure, this was impressive and held promise, but it didn't appear to offer the broad applicability that evolutionary programming techniques boasted. Genetic algorithms, on the other hand, had a clear edge in tackling real-world optimization and search challenges. How the times have changed!



The purpose of the above lengthy setup is for me to reflect on just how much AI has changed since my university days. Today neural nets and large language models are taking over the world ([possibly literally](https://en.wikipedia.org/wiki/AI_takeover)).

![Terminator](/images/ai-reflections/terminator.jpg)



How did we get here? What are the reasons for the massive shift in AI's (and neural networks in particular) fortunes between the "AI Winter" of the 90s and the current hype of AI models and the belief that Artificial General Intelligence (AGI) is years or at worst decades away? I see 5 reasons, starting with 2 that are pretty obvious plus 3 that (I hope) are less so.

1. **Increases in computing power.** Moore's law predicted this, but reality arguably exceeded even Gorden Moore's expectations in terms of the length of time that that exponential increase in computing power was sustained. In addition to that, we've seen advances in GPU technology and other hardware optimised for AI applications. The shift from "fast processors" to "supercomputers" to virtually unlimited data centres filled with on-demand cloud computing resources has given researchers access to computing that was not imaginable in the 90s.


2. **Big Data.** The availability of large data sets along with the ability to store and process this data are crucial for training large and complex neural networks. This allowed neural nets to go beyond the recognition of 8x8 alphanumeric characters (there are only so many ways to represent an 'A' on an 8x8 grid before it starts to look like something else) to fully processing full modern HD images to find a 'cat'. The mind-boggling amount of labelled 'cat' images or written text available on the internet makes training cat-recognizing or large language models possible.


3. **Algorithmic improvements.** While much of the theory of neural nets was understood in the 90s, some algorithmic optimisations were discovered after that the contributed to the success of neural networks. To name just two: the RELU activation function proved to be an important optimisation and the convolutional neural net architecture proved invaluable for finding cats.

4. **Open source frameworks.** Back in the 90s we still had to hand code stuff (whether a neural net or a genetic algorithm) from some minimalistic description in a computer science paper. We had to deal with bugs and inaccurate pseudo-code. It took a reasonable amount of effort to construct these algorithms and even more to get to a point where you are confident enough in the quality of the code to publish research findings about it. Fast forward 20 or 30 years, virtually every published AI algorithm will have a reusuable open source implementation available for use. Sometime within mere days of publication. very little duplication of effort is required in implementing any of these algorithms which means effort could shift from coding to the practical application of these algorithms - in an automated, almost industrialised fashion.

5. **Private sector investment.** The commercial applications of various types of AI models have become increasingly apparent. From automated processing of handwritten documentation to finding cat images, to facial recognition, self-driving cars, humanoid robots and [AI girlfriends](https://play.google.com/store/apps/details?id=aigirlfriend.ai.girlfriend&hl=en&gl=US). This has resulted in AI research shifting from university research centres to big business - dramatically accelerating the pace of innovation.


A lot has changed in AI since the winter of the 90s. Is this the dawn of AGI transforming human civilization? Or the peak of inflated expectations preceding the trough of disillusionment of the next AI Winter? That is a topic for a future post...

