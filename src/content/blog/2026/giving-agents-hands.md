---
title: "Two different philosophies of giving an agent hands"
description: "A comparison between CLI and MCP approaches for giving AI agents capabilities to interact with systems."
pubDatetime: 2026-02-13T12:00:00+01:00
heroImage: /mcp.png
tags: ["Post"]
featured: false
---


First of all I would like to give credit to Peter Steinberger regarding the subject of this blog post. Peter has been advocating for CLI over MCPs and that got me wondering why, and it also made me curious about the strengths of both options. The goal is rather to get an introduction to both technologies and understand them, rather than advocate for one or the other. 

You can find some interesting content from Peter here, which I leave as reference if you want to have a closer look :

[https://github.com/steipete](https://github.com/steipete)

[The Pragmatic Engineer: The creator of Clawd: "I ship code I don't read"](https://youtu.be/8lF7HmQ_RgY?si=Ghr7QVIPCyoh6-bD)

To begin with, we are going to define each term and try to understand what exactly a CLI and an MCP are. 

## CLI or Command Line Interface

A CLI is a universal interface where programs accept text input, produce text output and can signal failure via exit codes. They can also be composed through pipes and scripts. 

CLIs operate using primitives :

- **commands** (like `git`, `curl`, `python`...) to perform specific tasks

- **streams** : `stdin` for input, `stdout` for normal  output and `stderr` for errors. Streams channel data between programs.

- Finally **exit codes** where `0` signals success and non-zero values indicate failure. 

Another powerful feature of CLIs is their ability to **compose** these primitives. This can be done using pipes written as `|` to chain these commands together (e.g `cmdA | cmdB | cmdC`). Users can also script in the shell in order to automate repetitive tasks, create custom workflows and more. 

## MCP (Model Context Protocol)

MCP is an **open standard** created by Anthropic where the host is the LLM application, which contains clients (connectors) that talk to MCP servers. These servers are exposing **tools**, **resources** and **prompts** using a structured protocol. We will define these tools, resources and prompts a bit later. This means that the AI client and the server communicate using a strict, predefined format. The Model Context Protocol is built on JSON-RPC 2.0. This is a widely adopted standard for remote procedure calls. JSON-RPC 2.0 uses JSON (JavaScript Object Notation) which is a lightweight data format to package requests and responses making it easy for different systems to communicate regardless of their programming language. 

There are two primary ways the client and the server can talk :

- The first one is `stdio` which is used for local servers. The host is starting the server as a child process (in other words the host program, the AI client here, launches the MCP server as a separate, dependent process) and communicates via standard input/output. 

- The second way is Streamable HTTP. It is used for remote servers. The client sends requests via `HTTP POST` and the server streams updates back. 

Now, **tools** are callable actions with a name and a schema (functions with contracts). **Resources** are retrievable context objects addressed by URIs like files, schemas, docs and so on. Finally **prompts** are server-provided prompt templates the client can discover and fill. 

MCPs aim to stand as a standardized way to connect assistants to tools and data in a secure and consistent manner. 

## What does it look like to use these tools in practice?

### CLI tool use 

An agent : 

1) runs a command
2) reads `stdout` / `stderr`
3) checks exit code
4) iterates

An example of this could be :

1) Search files : `rg ...` (ripgrep to recursively search a directory)
2) Transform data : `jq ...` (to manipulate JSON data)
3) Run tests : `pytest...` (to write tests)
4) Decide next step based on errors/results

The key in this case is that *the environment itself is the feedback*

### MCP tool use 

1) connects to a server 
2) discover tools, resources and prompts
3) calls a tool with structured arguments
4) receives structured results and possibly structured errors

The key this time is that **the protocol is the contract**

## What does it change for an agent?

### Token economics and context hygiene

CLI lets the agent filter what it needs before reading. If a command outputs 10,000 lines, the agent can *choose* to only ingest 10 lines (`head`), or only a matching subset. This way we can reduce the noise outside the model then pass the minimal slice into the context window. 

Even though MCP defines tools with schemas, the size of the response is entirely determined by the tool design. If a server returns overly rich payloads by default, the model pays the token bill. 

It is however important to note that MCP is not *inherently* bloated. Servers can design tools to be minimal, provide field selection, paging, summaries...etc. MCP's spec emphasizes structured exposure of capabilities, not "always return everything". 

The bottom line on this matter is :

CLI gives you default pre-ingestion filtering via pipes and shell tooling while MCP requires intentional server-side and schema design to avoid over-fetching. 

### Composability

While CLIs are **composability-native** via pipes and shell scripting, MCP is **orchestration-native**. Indeed MCP is designed around discrete tool calls, and even though we can compose tools, this composition lives in the agent policy/orchestrator (the client in this case) rather than in the substrate.

A practical consequence is that CLI composition is often cheaper in agent reasoning steps because the shell glues things together. However MCP composition is often safer and more explicit, because each tool boundary can enforce permissions, auditing and constraints. 


### Discovery

CLIs have self-describing conventions : `--help`, exit codes, verbose flags and so on. An agent can also install missing tools, but this comes with security concerns. For the MCP, the client can ask a server what it offers in a standardized way which is excellent for cross-environment consistency. Any client can talk to any server. The trade-off here lies in CLIs being flexible but messy while MCP is structured but requires integration work up front. 

### Closing the loop

This is where CLI is legitimately hard to beat. CLI gives you a universal feedback contract. 

- stdout/stderr show what happened
- exit codes tell you success/failure
- running tests locally provides a gate

This is exactly what Peter Steinberger has been often emphasizing: "trust the loop, not the vibes".

**Can MCP close the loop?** Yes, but it depends on server honesty

MCP uses JSON-RPC 2.0, which supports explicit error objects and structured failures. But the lived experience often comes down to:

- Does the MCP server surface raw error logs?
- Does it preserve failure states meaningfully?
- Does it stream partial results?
- Does it expose “run tests” or “execute command” tools that still map to reality?

If MCP is layered over systems that hide the real failure output, the agent loses the tight loop.

### Enterprise reality

This is where MCP earns its keep.

For autonomous agents, CLI is exposing various risks. We can think of destructive actions which are one command away (`rm -rf`). But even without thinking of this, outputs can contain malicious instructions (prompt injection). Environment drift can be another problem with dependency conflicts, installs or path changes. Where MCP shines here is by the clear tool boundaries allowing servers to expose explicitly allowed actions with schemas. MCP separates concerns nicely resulting in agents not needing raw access to everything but only requesting specific capabilities. 

## Practical decision rule or what to keep in mind

Choose CLI-first when:

- the agent needs to write code + run tests locally in a tight loop
- tasks are file/process/compute heavy (search, transform, build, lint, benchmark)
- you want maximum composability with minimal integration overhead

Choose MCP-first when:

- you need safe, permissioned access to external systems and user data
- you want portable integrations across clients (“any MCP client can use this server”)
- you need auditing, policy boundaries, and governance to be first-class

