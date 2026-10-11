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
