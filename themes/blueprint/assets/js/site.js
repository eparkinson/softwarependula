// Software Pendula: the light/dark switch and the copy buttons on code blocks.
(function () {
  "use strict";

  // Light/dark switch. The reader's choice is remembered; without one the page
  // follows the system setting (see the small script in the page head).
  var toggle = document.getElementById("theme-toggle");
  if (toggle) {
    var root = document.documentElement;
    var current = function () {
      var set = root.getAttribute("data-theme");
      if (set) { return set; }
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };
    var label = function () {
      toggle.setAttribute("aria-label", current() === "dark" ? "Switch to light mode" : "Switch to dark mode");
    };
    toggle.addEventListener("click", function () {
      var next = current() === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("theme", next); } catch (e) {}
      label();
    });
    label();
  }

  // Diagrams: a fenced code block marked "mermaid" is drawn as a diagram. The Mermaid
  // library is fetched only on pages that have one, and redrawn when the theme changes.
  var diagramCode = document.querySelectorAll(".content pre > code.language-mermaid");
  if (diagramCode.length) {
    var diagrams = [];
    Array.prototype.forEach.call(diagramCode, function (code) {
      var pre = code.parentNode;
      var box = pre.parentNode.classList.contains("highlight") ? pre.parentNode : pre;
      var figure = document.createElement("div");
      figure.className = "diagram";
      figure.setAttribute("data-source", code.textContent);
      figure.textContent = code.textContent;
      box.parentNode.replaceChild(figure, box);
      diagrams.push(figure);
    });
    var isDark = function () {
      var set = document.documentElement.getAttribute("data-theme");
      if (set) { return set === "dark"; }
      return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    };
    var draw = function () {
      window.mermaid.initialize({ startOnLoad: false, securityLevel: "strict", theme: isDark() ? "dark" : "neutral", fontFamily: "inherit" });
      diagrams.forEach(function (figure) {
        figure.removeAttribute("data-processed");
        figure.textContent = figure.getAttribute("data-source");
      });
      window.mermaid.run({ nodes: diagrams });
    };
    var library = document.createElement("script");
    library.src = "https://cdn.jsdelivr.net/npm/mermaid@10.9.3/dist/mermaid.min.js";
    library.integrity = "sha384-R63zfMfSwJF4xCR11wXii+QUsbiBIdiDzDbtxia72oGWfkT7WHJfmD/I/eeHPJyT";
    library.crossOrigin = "anonymous";
    library.onload = draw;
    document.head.appendChild(library);
    if (toggle) { toggle.addEventListener("click", function () { if (window.mermaid) { draw(); } }); }
  }

  // A "Copy" button on every code block.
  var blocks = document.querySelectorAll(".content pre");
  Array.prototype.forEach.call(blocks, function (pre) {
    var holder = pre.parentNode;
    if (!holder.classList.contains("highlight")) {
      holder = document.createElement("div");
      holder.className = "highlight";
      pre.parentNode.insertBefore(holder, pre);
      holder.appendChild(pre);
    }
    var button = document.createElement("button");
    button.type = "button";
    button.className = "copy-code";
    button.textContent = "Copy";
    button.setAttribute("aria-label", "Copy this code");
    button.addEventListener("click", function () {
      var text = (pre.querySelector("code") || pre).innerText.replace(/\n$/, "");
      var done = function (word) {
        button.textContent = word;
        setTimeout(function () { button.textContent = "Copy"; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done("Copied"); }, function () { done("Press Ctrl+C"); });
      } else {
        var range = document.createRange();
        range.selectNodeContents(pre);
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        done("Press Ctrl+C");
      }
    });
    holder.appendChild(button);
  });
})();
