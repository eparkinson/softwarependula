+++
title = "Are compiled languages making a comeback?"
tags = [
    "tech",
    "musings",
    "golang",
    "k8s"
]
date = "2021-05-01"
+++

I started my career as a C++ developer. At the time, it was more or less considered the 'default' choice for software development. PERL was the new kid on the block for web application development. Python was just a scripting language pretending to be object-orientated and with a quirky way to delimit code blocks using indentation. JavaScript was brand spanking new, uncool, but the idea of running code in a browser was at least somewhat interesting. To be clear, I still think JavaScript is uncool, but I am aware that a significant and growing number of software developers will disagree with me. But back then, it was pretty much universally accepted as uncool except for a few fringe "web developers".

Not that C++ was perfect. It was complicated. It had no underlying unifying theme or style to its syntax. You could literally do anything you wanted to in C++ in hundreds of different ways. And you could do some really crazy stuff with operators - but shouldn't. Pointer errors would drive you crazy - it could even drive your debugger crazy. You needed a PhD to compile C++, and minor sorcery was required to create an installable package that could actually run on machines other than your own without complaining about some missing run time dependency. This was in the late nineties, and to be fair to C++, a lot of the tooling around it has improved since then.

But C++ had an excellent compiler, and it was fast. No mere scripting language could ever hope to hold a candle to its speed. Its support for objection orientation was impressive. For a long time, C++ was king. Even when Visual Basic came along and made Windows GUI development for business applications easier, real developers stuck to C++. The fence-sitters adopted C#.

Then Java came along. It wasn't precisely a compiled language, but it wasn't just a scripting language either. It was something in between - compiled to optimised bytecode which still needed an interpreter to run. The marketing guys at Sun were smart enough to call it a virtual machine instead of an interpreter, though. It solved a lot of problems that C++ didn't. The Java Virtual Machine was truly cross-platform - gone were worries of run time dependencies. No more pointer errors or memory leaks to debug. And the language was simple enough for new developers to learn quickly and purist enough in its idiom and style to impress more experienced developers. And it was almost as fast as C++. Its network handling was well optimised, and for most applications where performance or resource constraints were not the overwhelming considerations, it was performant enough.  

And for a long time, Java was King. But the pendulum swings. The pervasiveness of the web meant that JavaScript gained much popularity for client-side development and started making a come back on the server-side too. The cool kids started to use Ruby and Python to develop web apps. Later data science became a thing and boosted Python's popularity even more. Java made that half-step towards an interpreted language fashionable, and suddenly one more half step towards a fully interpreted language no longer seemed like such a terrible thing. And interpreted languages were easy to learn, with simple toolsets and little boilerplate code. Java started appearing old fashioned. Personal computers and Linux servers were cheap, common and powerful enough that the performance of a compiled language like C++ was just not important. At least, not for most developers aside from a few die-hard OS and system programmers (and they would prefer to use vanilla C anyway). 

[The Tiobe index](https://www.tiobe.com/tiobe-index/) tracks the popularity of programming languages. It shows that while Java has managed to hold on to its number one ranking for much of the last two decades, its popularity has been eroded slowly but consistently over time.

![](/images/compiled-languages/Java.png)

A large part of the reason for Java's decline is just that different languages found their niche. C# was popular for windows GUI development. Javascript had a monopoly on browser-side code. Python found a home in data science and AI applications. C/C++ never lost its importance in the hearts and minds of operating systems and embedded software developers. Java still remained king in large enterprises where the idea of language standardisations to make it easy to move fungible developers between teams appeals to the bureaucrats. 

Then in 2009 and 2010, respectively, Go and Rust appeared with little fanfare. Both are compiled languages that borrow heavily from C syntax but without the clutter and complexity of C++. Both provide memory safety - a significant source of developer unhappiness and security vulnerabilities in C/C++ software. And both come with a toolchain that makes them so simple to use that you might be forgiven for thinking that they are interpreted scripting languages. Neat languages, to be sure, but lacking their own niche in the cluttered programming languages landscape.


Go, invented at Google, found its niche, first inside Google, then as the language of choice for contributors to Kubernetes and its surrounding ecosystem, and finally for creating code to run in containers on Kubernetes. At cloud scale, performance becomes important again, and small containers that start up quickly enables rapid autoscaling. Go is king in this domain - compiled Go code in an Alpine Linux container can be just over 10 MB in size and starts up in a second.   A typical containerised Java application with all of its dependencies, by comparison, is huge - 200MB. It starts up in tens of seconds. Python is better for container development, smaller and faster to start up than Java, but still doesn't come close to compiled Go. 

Rust adoption has arguable been slower than Go's. But recently, talk around Rust's use in Linux and even in Linux's core has intensified. Another tracker of programming languages' popularity is [PYPL](https://pypl.github.io/PYPL.html). Not much has changed over the last 15 years amongst the top 5 (C/C++, C#, Java, Javascript and Python), other than Python being the big winner while Java has slowly been losing ground. See the image below.  

![](/images/compiled-languages/PYPL.png)

The graph also shows the rapid growth of Go and Rust over the last five years. The appeal of compiled languages that approach the performance and efficiency of C/C++ while having none of its weaknesses, together with the ease of use of interpreted languages, is hard to resist. I think that the rapid growth of containerisation and Kubernetes as the default container orchestrator will, ensure the continued popularity of newer compiled languages outside of the traditional stronghold of C/C++ - systems and embedded programming. It also makes for an excellent topic for this blog, Software Pendula, to note that once again, the pendulum is in full swing back towards compiled languages - a class of programming languages that have been out of favour for so long.