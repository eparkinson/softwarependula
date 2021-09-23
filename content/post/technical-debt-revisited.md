+++
title = "Technical debt considered useful revisited"
tags = [
    "tech",
    "musings"
]
date = "2021-04-24"
+++


In 2013 I wrote a blog post titled ["Technical debt considered useful"](https://www.softwarependula.net/post/technical-debt/) in response to what I saw as an increasing trend by colleagues working in agile teams to see tech debt as a strictly "bad thing". More recently, the DevOps movement (which is entirely positive for the software industry at large) has prompted some to adopt the idea that tech debt must be avoided at all costs. A post titled ["Technical Debt - The Anti-DevOps Culture"](https://devblogs.microsoft.com/premier-developer/technical-debt-the-anti-devops-culture/) inspired me to return to this topic - after all, a lot can change in 7 years. Perhaps I was wrong. (Spoiler alert: I don't believe I was)

# Definition
Before I go any further, it is only fair that I define tech debt. A good, formal definition is somewhat hard to find, despite that much has been written on the subject. So here is my attempt:
>Technical debt is the net cost forced onto the development of future features by past design decisions.

The term "net cost" needs some explaining. First, avoiding future work by doing more work now is not sensible - no matter how much of a purist or a craftsman you are, simple economics must carry the day. And secondly, it is also necessary to consider the time value of money (and time). All things being equal, it's better to do work in the future if doing so does not create additional tech debt drag.

# Why is tech debt useful?
I can summarise my original argument in "Technical debt considered useful"  as follows: Tech debt is a metaphor based on 'ordinary' financial debt. It is a very apt metaphor for the below two reasons.

Firstly, tech debt generates interest that must be repaid in the form of drag on the development process that slows down future development. Future work must also be done to eliminate or reduce the tech debt, or the team will eventually "drown in debt". Secondly, incurring tech debt can be a legitimate strategy to deliver a project faster by allowing us to borrow time against the future.

Consequently, tech debt can be useful - it's not always a bad thing in all cases. And I still believe that. This post attempts to go a little further than the original by looking at some of the reasons why tech debt is increasingly seen as "anti-DevOps" by teams. And to get more precise and offer an opinion about where and when it might be appropriate to incur tech debt and when to actively avoid and reduce tech debt.

# Technical debt as anti-DevOps

One of my favourite tech quotes is from "Accelerate" by Nicole Forsgren, Jez Humble and Gene Kim. The authors speak about the "wall of confusion" found in traditional IT organizations where "development throws poor quality code over the wall to operations, and operations put in place painful change management processes as a way to inhibit change".  The increasing consolidation of development and operations into unified DevOps teams necessitates the bridging of this "wall of confusion" divide between development and operations. Two such extreme attitudes cannot coexist for long in a combined DevOps team. A considered  (rather than a zero-tolerance) approach to tech debt is key to bridging the divide.

# When to incur tech debt
In general, you want to incur tech debt when the short term goals heavily outweigh the importance of longer-term goals. Suppose funding for future work is not guaranteed and depends on a single demonstration of a quickly developed prototype. In this case, traditional quality concerns like testability, deployability and reliability carry almost no weight at all. In fact, "it works on my machine" is not only good enough, but any effort beyond that will be a waste.

This trade-off between short and long term goals is not unique only to the initial stages of a software system's lifecycle but also towards the end. When fixing a critical defect in software that is nearing end-of-life, it may also be appropriate to find the "quickest" and "safest" solution that just works around existing tech debt to avoid breaking something. And in this scenario, it may even be appropriate to incur more tech debt in the process.

# When not to incur tech debt
As a long and bright future for a software system becomes probable, it becomes increasingly important to reduce historical tech debt (incurred in the process of assuring this bright future) and avoid the introduction of additional tech debt. A common pitfall here is to pay too much attention to areas of known tech debt and not enough attention to managing the introduction of new debt as new futures are introduced - avoiding tech debt from the start is usually easier.

One of the areas driving this idea of zero-tolerance for tech debt is deployment automation. And with reasonable justification. Automated deployment and testing tools have sufficiently matured that there is very little reason not to automate the deployment and (at the very least) sanity or health testing of any non-trivial production system. The days of "throwing code of the wall" the Ops to deploy is (or should be) mercifully gone. But even here, there are sophisticated versus simple approaches to automation to consider and weigh.

# Conclusion
When I originally wrote on tech debt, I commented on the misguided certainty with which Wikipedia's entry on tech debt asserted: "tech debt is a major cause for projects to miss deadlines." This sentence is still here, now at least flagged as needing citation.

As always, however, the truth is more nuanced. And I still consider tech debt, incurred thoughtfully and managed actively, useful.
