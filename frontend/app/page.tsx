"use client";

import { useEffect } from "react";
import "./landing.css";

export default function LandingPage() {
  useEffect(() => {
    if (!document.getElementById("ca-landing-boot")) {
      const script = document.createElement("script");
      script.id = "ca-landing-boot";
      script.src = "/landing.js";
      document.body.appendChild(script);
    }

    const warmChat = window.setTimeout(() => {
      if (document.getElementById("ca-chat-prefetch")) return;
      const link = document.createElement("link");
      link.id = "ca-chat-prefetch";
      link.rel = "prefetch";
      link.as = "document";
      link.href = "/chat";
      document.head.appendChild(link);
    }, 1200);

    return () => window.clearTimeout(warmChat);
  }, []);

  const goToChat = () => window.location.assign("/chat");

  return (
    <>
      <div id="tubes-cursor-wrap" aria-hidden="true">
        <canvas id="tubes-cursor-canvas"></canvas>
      </div>

      <nav id="nav">
        <div className="wordmark">
          Cancer<b>Atlas</b>
        </div>
        <div className="nav-right">
          <button className="nav-chat" onClick={goToChat}>
            Start Chat
          </button>
          <button className="theme-btn" id="themeBtn" title="Toggle theme">
            ◐
          </button>
        </div>
      </nav>

      <button
        className="play-btn"
        id="playBtn"
        title="Play the journey"
        aria-label="Play the journey"
      >
        ▶
      </button>

      <div className="hero" id="hero">
        <canvas id="shaderBg"></canvas>
        <div className="hero-content">
          <div className="brand-title" aria-label="CancerAtlas">
            <span className="chrom r" aria-hidden="true">
              CancerAtlas
            </span>
            <span className="chrom g" aria-hidden="true">
              CancerAtlas
            </span>
            <span className="brand-main">
              Cancer<b>Atlas</b>
            </span>
          </div>
          <div className="hero-lede">
            <span className="lede-strong">
              Ask about cancer. Understand the evidence.
            </span>
            Every answer traces back to a real medical document.{" "}
            <strong>Nothing invented, nothing generalized</strong> beyond what
            the sources actually say.
          </div>
          <button className="cta" onClick={goToChat}>
            Start Chat
          </button>
          <div className="scroll-hint">Scroll to explore how it works</div>
        </div>
      </div>

      <div className="journey" id="journey">
        <div className="stage" id="stage">
          <canvas id="scene"></canvas>

          <div className="lbl src-blue" data-l="0">
            <span className="name">NCI</span>
          </div>
          <div className="lbl src-red" data-l="1">
            <span className="name">WHO</span>
          </div>
          <div className="lbl src-yellow" data-l="2">
            <span className="name">IARC</span>
          </div>
          <div className="lbl src-green" data-l="3">
            <span className="name">ACS</span>
          </div>
          <div className="lbl" data-l="4">
            <span className="name">Document</span>
          </div>
          <div className="lbl" data-l="5">
            <span className="name">Chunks</span>
          </div>
          <div className="lbl" data-l="6">
            <span className="name">Embeddings</span>
          </div>
          <div className="lbl" data-l="7">
            <span className="name">Vector space</span>
          </div>
          <div className="lbl" data-l="8">
            <span className="name">Semantic space</span>
          </div>
          <div className="lbl accent" data-l="9">
            <span className="name">Cancer knowledge</span>
          </div>
          <div className="lbl accent" data-l="10">
            <span className="name">User query</span>
            <span className="sub">What are common symptoms of lung cancer?</span>
          </div>
          <div className="lbl" data-l="11">
            <span className="name">Relevant chunk</span>
          </div>
          <div className="lbl src-blue" data-l="12">
            <span className="name">Source · NCI</span>
          </div>

          <div className="panel side-l" data-i="0">
            <span className="pnum">01 · User query</span>
            <h4>You ask a question</h4>
            <p>
              A real cancer question enters the system as text. Everything that
              follows is what CancerAtlas does inside to answer it.
            </p>
          </div>
          <div className="panel side-r" data-i="1">
            <span className="pnum">02 · Document loading</span>
            <h4>Four institutions form the corpus</h4>
            <p>
              Medical documents from NCI, WHO, IARC, and the ACS. Each source
              keeps its own color through every stage of the pipeline.
            </p>
          </div>
          <div className="panel side-l" data-i="2">
            <span className="pnum">03 · Text splitting</span>
            <h4>Documents shatter into chunks</h4>
            <p>
              Each PDF breaks into fragments around 1,000 characters long, with
              overlap so no clinical idea gets cut mid-sentence.
            </p>
          </div>
          <div className="panel side-r" data-i="3">
            <span className="pnum">04 · Vector embeddings</span>
            <h4>Chunks become points in meaning-space</h4>
            <p>
              Every chunk is embedded into a 384-dimensional vector using
              MiniLM. Similar meanings land in similar places.
            </p>
          </div>
          <div className="panel side-l" data-i="4">
            <span className="pnum">05 · Cancer knowledge space</span>
            <h4>3,448 chunks form one semantic field</h4>
            <p>
              Dense center holds the corpus core. Outer shell holds edge cases.
              Every point is searchable by meaning, not keyword.
            </p>
          </div>
          <div className="panel side-r" data-i="5">
            <span className="pnum">06 · Vector store</span>
            <h4>Everything persists in Chroma</h4>
            <p>
              The 3,448 vectors, their original text, and their source metadata
              live in a persistent Chroma database on disk.
            </p>
          </div>
          <div className="panel side-l" data-i="6">
            <span className="pnum">07 · Retrieval</span>
            <h4>Your question finds its five nearest chunks</h4>
            <p>
              Your query is embedded the same way. MMR selects five diverse but
              relevant chunks from the vector store.
            </p>
          </div>
          <div className="panel side-r" data-i="7">
            <span className="pnum">08 · Generation</span>
            <h4>Llama 3.3 writes the answer</h4>
            <p>
              The LLM receives your question plus only those five retrieved
              chunks. It cannot invent from outside them.
            </p>
          </div>
        </div>
      </div>

      <section className="finale" id="finale">
        <div className="finale-header">
          <div className="finale-eyebrow">The pipeline at rest</div>
          <h2 className="finale-heading">
            This is what CancerAtlas
            <br />
            actually knows.
          </h2>
        </div>

        <div className="finale-viz-wrap">
          <canvas
            className="finale-particles"
            id="finaleParticles"
            aria-hidden="true"
          ></canvas>
          <svg
            className="finale-svg"
            viewBox="0 0 900 580"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="coreGlow">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity=".38" />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
              </radialGradient>
            </defs>

            <g className="viz-conns">
              <path
                className="viz-conn c-blue"
                d="M 180,130 Q 260,220 445,315"
                pathLength="1"
              />
              <path
                className="viz-conn c-red"
                d="M 380,100 Q 400,210 448,315"
                pathLength="1"
              />
              <path
                className="viz-conn c-yellow"
                d="M 520,100 Q 500,210 452,315"
                pathLength="1"
              />
              <path
                className="viz-conn c-green"
                d="M 720,130 Q 640,220 455,315"
                pathLength="1"
              />
            </g>

            <g className="viz-core">
              <circle
                cx="450"
                cy="320"
                r="42"
                className="core-glow"
                fill="url(#coreGlow)"
              />
              <circle cx="450" cy="320" r="7" className="core-dot" />
              <text x="450" y="360" className="core-label">
                CancerAtlas
              </text>
              <text x="450" y="378" className="core-sub">
                knowledge core
              </text>
            </g>

            <g className="viz-source s-blue">
              <circle cx="180" cy="130" r="6" className="src-dot" />
              <circle cx="180" cy="130" r="13" className="src-ring" />
              <text x="180" y="105" className="src-name">
                NCI · PDQ
              </text>
            </g>
            <g className="viz-source s-red">
              <circle cx="380" cy="100" r="6" className="src-dot" />
              <circle cx="380" cy="100" r="13" className="src-ring" />
              <text x="380" y="75" className="src-name">
                WHO
              </text>
            </g>
            <g className="viz-source s-yellow">
              <circle cx="520" cy="100" r="6" className="src-dot" />
              <circle cx="520" cy="100" r="13" className="src-ring" />
              <text x="520" y="75" className="src-name">
                IARC
              </text>
            </g>
            <g className="viz-source s-green">
              <circle cx="720" cy="130" r="6" className="src-dot" />
              <circle cx="720" cy="130" r="13" className="src-ring" />
              <text x="720" y="105" className="src-name">
                American Cancer Society
              </text>
            </g>

            <g className="viz-stat" data-i="0" data-target="4">
              <line
                x1="120"
                y1="70"
                x2="170"
                y2="122"
                className="ann-line"
                pathLength="1"
              />
              <circle cx="170" cy="122" r="2.6" className="ann-endpoint" />
              <text x="60" y="46" className="ann-num">
                0
              </text>
              <text x="60" y="66" className="ann-lbl">
                Trusted source families
              </text>
            </g>
            <g className="viz-stat" data-i="1" data-target="46">
              <line
                x1="780"
                y1="70"
                x2="730"
                y2="122"
                className="ann-line"
                pathLength="1"
              />
              <circle cx="730" cy="122" r="2.6" className="ann-endpoint" />
              <text x="840" y="46" className="ann-num" textAnchor="end">
                0
              </text>
              <text x="840" y="66" className="ann-lbl" textAnchor="end">
                Curated documents
              </text>
            </g>
            <g className="viz-stat" data-i="2" data-target="1212">
              <line
                x1="120"
                y1="490"
                x2="290"
                y2="432"
                className="ann-line"
                pathLength="1"
              />
              <circle cx="290" cy="432" r="2.6" className="ann-endpoint" />
              <text x="60" y="512" className="ann-num">
                0
              </text>
              <text x="60" y="532" className="ann-lbl">
                Pages of medical evidence
              </text>
            </g>
            <g className="viz-stat" data-i="3" data-target="3448">
              <line
                x1="780"
                y1="490"
                x2="610"
                y2="432"
                className="ann-line"
                pathLength="1"
              />
              <circle cx="610" cy="432" r="2.6" className="ann-endpoint" />
              <text x="840" y="512" className="ann-num" textAnchor="end">
                0
              </text>
              <text x="840" y="532" className="ann-lbl" textAnchor="end">
                Retrievable knowledge chunks
              </text>
            </g>
          </svg>
        </div>

        <div className="finale-cta-row">
          <button className="finale-cta" onClick={goToChat}>
            Start asking questions
          </button>
          <div className="finale-cta-hint">
            Every answer traced back to one of the four sources above.
          </div>
        </div>
      </section>

      <div className="disc-section">
        <div className="disclaimer">
          CancerAtlas provides educational, evidence-grounded information. It is
          not a substitute for professional medical advice, diagnosis, or
          treatment. Always talk to a qualified physician about your own health.
        </div>
      </div>

      <footer>
        <span>Built by Daniyal</span>
        <span>·</span>
        <a href="#">GitHub</a>
        <span>·</span>
        <span className="stack">
          Powered by <i className="dot b"></i>LangChain{" "}
          <i className="dot r"></i>Chroma <i className="dot y"></i>Groq
        </span>
        <span>·</span>
        <span className="live">
          <span className="pulse"></span>Sources current
        </span>
      </footer>
    </>
  );
}
