"use strict";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const organismField = $("#organismField");
const siteSpecificField = $("#siteSpecificField");
const resultTitle = $("#resultTitle");
const resultContent = $("#resultContent");
const resultBody = $("#resultBody");
const copyButton = $("#copyButton");
const copyStatus = $("#copyStatus");
const tooltip = $("#tooltip");

let latestCopyText = "";

function selectedRadio(name) {
  const selected = $(`input[name="${name}"]:checked`);
  return selected ? selected.value : "";
}

function selectedChecks(name) {
  return $$(`input[name="${name}"]:checked`).map(input => input.value);
}

function formatList(items) {
  if (!items.length) return "<p>None selected.</p>";

  return `
    <ul>
      ${items.map(item => `<li>${escapeHtml(item)}</li>`).join("")}
    </ul>
  `;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateConditionalFields() {
  const culture = selectedRadio("cultureCollected");

  organismField.classList.toggle("hidden", culture !== "Yes");

  const level = selectedRadio("anatomicLevel");

  siteSpecificField.classList.toggle(
    "hidden",
    level !== "Organ/Space SSI"
  );

  if (level !== "Organ/Space SSI") {
    $$('input[name="siteSpecific"]').forEach(input => {
      input.checked = false;
    });
  }

  updateProgress();
}

function updateProgress() {
  const patos = selectedRadio("patos");
  const evidence = selectedChecks("evidence");
  const level = selectedRadio("anatomicLevel");
  const siteSpecific = selectedRadio("siteSpecific");
  const cultureCollected = selectedRadio("cultureCollected");

  $("#progressPatos").classList.toggle(
    "complete",
    Boolean(patos)
  );

  $("#progressEvidence").classList.toggle(
    "complete",
    evidence.length > 0 || Boolean(cultureCollected)
  );

  $("#progressLevel").classList.toggle(
    "complete",
    Boolean(level)
  );

  $("#progressSite").classList.toggle(
    "complete",
    level !== "Organ/Space SSI"
      ? Boolean(level)
      : Boolean(siteSpecific)
  );

  const completed = [
    Boolean(patos),
    evidence.length > 0 || Boolean(cultureCollected),
    Boolean(level),
    level !== "Organ/Space SSI"
      ? Boolean(level)
      : Boolean(siteSpecific)
  ].filter(Boolean).length;

  $("#progressTitle").textContent =
    `${completed} of 4 review items completed`;

  let guidance =
    "Begin with the operative note and PATOS review.";

  if (patos && !level) {
    guidance =
      "Select the deepest anatomic level involved.";
  }

  if (
    level === "Organ/Space SSI" &&
    !siteSpecific
  ) {
    guidance =
      "Select GIT, IAB, or OREP for the Organ/Space site.";
  }

  if (
    level &&
    (level !== "Organ/Space SSI" || siteSpecific) &&
    evidence.length === 0
  ) {
    guidance =
      "Select the supporting evidence documented in the chart.";
  }

  if (completed === 4) {
    guidance =
      "The core sections are complete. Calculate the preliminary result.";
  }

  $("#progressGuidance").textContent = guidance;
}

function determineResult() {
  const level = selectedRadio("anatomicLevel");
  const siteSpecific = selectedRadio("siteSpecific");

  if (!level) {
    return "Anatomic level not selected";
  }

  if (level === "Organ/Space SSI") {
    if (siteSpecific) {
      return `SSI-${siteSpecific} — Organ/Space SSI`;
    }

    return "Organ/Space SSI — site-specific classification not selected";
  }

  return level;
}

function buildWhy(level, siteSpecific, evidence) {
  const reasons = [];

  if (level) {
    reasons.push(`Anatomic level selected: ${level}`);
  }

  if (siteSpecific) {
    reasons.push(
      `Organ/Space site selected: ${siteSpecific}`
    );
  }

  if (evidence.length) {
    reasons.push(
      `${evidence.length} supporting evidence item${
        evidence.length === 1 ? "" : "s"
      } selected`
    );
  }

  if (!reasons.length) {
    reasons.push(
      "Insufficient selections to suggest a classification"
    );
  }

  return reasons;
}

function buildRemaining(
  level,
  siteSpecific,
  cultureCollected,
  organisms,
  evidence
) {
  const remaining = [];

  if (!level) {
    remaining.push(
      "Select the deepest anatomic level involved"
    );
  }

  if (
    level === "Organ/Space SSI" &&
    !siteSpecific
  ) {
    remaining.push(
      "Select GIT, IAB, or OREP"
    );
  }

  if (!evidence.length) {
    remaining.push(
      "Identify supporting SSI evidence"
    );
  }

  if (!cultureCollected) {
    remaining.push(
      "Indicate whether a culture or microbiologic test was collected"
    );
  }

  if (
    cultureCollected === "Yes" &&
    !organisms.trim()
  ) {
    remaining.push(
      "Enter the organism(s) identified, when available"
    );
  }

  remaining.push(
    "Confirm the applicable surveillance period"
  );

  if (level === "Organ/Space SSI") {
    remaining.push(
      "Confirm the selected Chapter 17 site-specific definition is met"
    );
  }

  return remaining;
}

    function calculateResult() {

        const patos = selectedRadio("patos") || "Not documented";
    
        const evidence = selectedChecks("evidence");
    
        const symptoms = selectedChecks("symptom");
    
        const cultureCollected =
            selectedRadio("cultureCollected") || "Not documented";
    
        const organisms =
            $("#organisms").value.trim();
    
        const level =
            selectedRadio("anatomicLevel");
    
        const siteSpecific =
            selectedRadio("siteSpecific");
    
        const reviewSummary =
            $("#reviewSummary").value.trim();
    
        const determination =
            determineResult();
    
        resultTitle.textContent = determination;
    
        //---------------------------------------
        // Build narrative
        //---------------------------------------
    
        let summary = `${determination} is suggested`;
    
        if (evidence.length > 0) {
    
            summary +=
                " based on " +
                evidence.join(", ").toLowerCase();
    
        }
    
        summary += ".";
    
        summary += ` PATOS: ${patos}.`;
    
        summary += ` Culture collected: ${cultureCollected}.`;
    
        if (
            cultureCollected === "Yes" &&
            organisms.length > 0
        ) {
    
            summary +=
                ` Organism(s): ${organisms}.`;
    
        }
    
        if (symptoms.length > 0) {
    
            summary +=
                ` Documented signs/symptoms include ${symptoms.join(", ").toLowerCase()}.`;
    
        }
    
        //---------------------------------------
        // Display
        //---------------------------------------
    
        resultContent.className = "result-output";
    
        resultContent.innerHTML = `
    
            <h3>Summary</h3>
    
            <p>${summary}</p>
    
            ${
                reviewSummary
                    ? `
            <h3>Review Notes</h3>
    
            <p>${escapeHtml(reviewSummary)}</p>
            `
                    : ""
            }
    
        `;
    
        //---------------------------------------
        // Copy text
        //---------------------------------------
    
        latestCopyText = `
    
    NHSN COLO SSI REVIEW
    
    Preliminary Classification:
    ${determination}
    
    Summary:
    ${summary}
    
    ${
    reviewSummary
    ? `Review Notes:
    ${reviewSummary}`
    : ""
    }
    
    `.trim();
    
        copyButton.disabled = false;
    
        copyStatus.textContent = "";
    
        resultBody.classList.remove("collapsed");
    
        $("#minimizeResult").textContent = "−";
    
    }
function sectionText(title, items) {
  if (!items.length) {
    return `${title}\n• None selected`;
  }

  return `
${title}
${items.map(item => `• ${item}`).join("\n")}
`.trim();
}

function buildCopyText(data) {
  const lines = [
    "NHSN COLO SSI REVIEW",
    "────────────────────────────",
    "",
    "PRELIMINARY RESULT",
    data.determination,
    "",
    "PATOS",
    data.patos,
    "",
    sectionText(
      "SUPPORTING EVIDENCE",
      data.evidence
    ),
    "",
    "CULTURE / MICROBIOLOGY",
    `Culture collected: ${data.cultureCollected}`
  ];

  if (data.cultureCollected === "Yes") {
    lines.push(
      `Organism(s): ${
        data.organisms || "Not entered"
      }`
    );
  }

  lines.push(
    "",
    sectionText(
      "SIGNS & SYMPTOMS",
      data.symptoms
    ),
    "",
    sectionText(
      "OPERATIVE FINDINGS / PATOS KEYWORDS",
      data.keywords
    ),
    "",
    "OPERATIVE NOTE",
    data.operativeNote ||
      "No operative note text entered.",
    "",
    "REVIEW SUMMARY",
    data.reviewSummary ||
      "No review summary entered.",
    "",
    sectionText(
      "WHY THIS RESULT WAS SUGGESTED",
      data.why
    ),
    "",
    sectionText(
      "ADDITIONAL ITEMS TO VERIFY",
      data.remaining
    )
  );

  return lines.join("\n");
}

async function copyResult() {
  if (!latestCopyText) {
    return;
  }

  try {
    await navigator.clipboard.writeText(
      latestCopyText
    );

    copyStatus.textContent =
      "Result copied.";
  } catch {
    const textArea =
      document.createElement("textarea");

    textArea.value = latestCopyText;

    document.body.appendChild(textArea);

    textArea.select();

    document.execCommand("copy");

    textArea.remove();

    copyStatus.textContent =
      "Result copied.";
  }
}

function clearForm() {
  const shouldClear = window.confirm(
    "Clear all entered information and selections?"
  );

  if (!shouldClear) {
    return;
  }

  $$(
    'input[type="checkbox"], input[type="radio"]'
  ).forEach(input => {
    input.checked = false;
  });

  $$(
    "textarea, input[type='text']"
  ).forEach(input => {
    input.value = "";
  });

  latestCopyText = "";

  resultTitle.textContent =
    "Complete the review and select Calculate Result";

  resultContent.className =
    "empty-result";

  resultContent.textContent =
    "Your copy-ready review summary will appear here.";

  copyButton.disabled = true;

  copyStatus.textContent = "";

  updateConditionalFields();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

function setupTabs() {
  $$(".tab-button").forEach(button => {
    button.addEventListener("click", () => {
      $$(".tab-button").forEach(item => {
        item.classList.remove("active");

        item.setAttribute(
          "aria-selected",
          "false"
        );
      });

      $$(".tab-panel").forEach(panel => {
        panel.classList.remove("active");
      });

      button.classList.add("active");

      button.setAttribute(
        "aria-selected",
        "true"
      );

      $(`#${button.dataset.tab}`)
        .classList.add("active");
    });
  });
}

function setupTooltips() {
  $$("[data-tooltip]").forEach(button => {
    const show = () => {
      tooltip.textContent =
        button.dataset.tooltip;

      const rect =
        button.getBoundingClientRect();

      tooltip.style.left =
        `${Math.min(
          rect.left,
          window.innerWidth - 300
        )}px`;

      tooltip.style.top =
        `${rect.bottom + 8}px`;

      tooltip.classList.add("show");
    };

    const hide = () => {
      tooltip.classList.remove("show");
    };

    button.addEventListener(
      "mouseenter",
      show
    );

    button.addEventListener(
      "mouseleave",
      hide
    );

    button.addEventListener(
      "focus",
      show
    );

    button.addEventListener(
      "blur",
      hide
    );

    button.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();

        tooltip.classList.toggle("show");

        if (
          tooltip.classList.contains("show")
        ) {
          show();
        }
      }
    );
  });

  document.addEventListener(
    "click",
    () => {
      tooltip.classList.remove("show");
    }
  );
}

document.addEventListener(
  "change",
  event => {
    if (event.target.matches("input")) {
      updateConditionalFields();
    }
  }
);

$("#calculateButton").addEventListener(
  "click",
  calculateResult
);

copyButton.addEventListener(
  "click",
  copyResult
);

$("#clearButton").addEventListener(
  "click",
  clearForm
);

$("#minimizeResult").addEventListener(
  "click",
  () => {
    resultBody.classList.toggle(
      "collapsed"
    );

    $("#minimizeResult").textContent =
      resultBody.classList.contains(
        "collapsed"
      )
        ? "+"
        : "−";
  }
);

setupTabs();
setupTooltips();
updateConditionalFields();