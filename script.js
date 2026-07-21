"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, scope = document) =>
    scope.querySelector(selector);

  const $$ = (selector, scope = document) =>
    [...scope.querySelectorAll(selector)];

  const PROCEDURES = {
    COLO: {
      name: "Colon Surgery",
      title: "NHSN COLO SSI Review Tool",
      surveillanceDays: 30,
      workup: [
        "Confirm the procedure meets the NHSN COLO category definition.",
        "For organ/space review, determine whether GIT, IAB, OREP, or another eligible Chapter 17 site-specific definition applies."
      ]
    },

    HYST: {
      name: "Abdominal Hysterectomy",
      title: "NHSN HYST SSI Review Tool",
      surveillanceDays: 30,
      workup: [
        "Confirm the procedure meets the NHSN HYST category definition and is not a cesarean section.",
        "For organ/space review, apply the eligible Chapter 17 reproductive-tract or intraabdominal site-specific definition."
      ]
    },

    CBGB: {
      name: "Coronary Artery Bypass Graft with Chest and Donor-site Incisions",
      title: "NHSN CBGB SSI Review Tool",
      surveillanceDays: 90,
      workup: [
        "Confirm both the chest and donor-site incisions are part of the indexed CABG procedure.",
        "Document the involved incision so primary versus secondary incisional SSI can be assigned when applicable.",
        "For organ/space review, apply the eligible Chapter 17 site-specific definition."
      ]
    },

    CBGC: {
      name: "Coronary Artery Bypass Graft with Chest Incision Only",
      title: "NHSN CBGC SSI Review Tool",
      surveillanceDays: 90,
      workup: [
        "Confirm the indexed CABG procedure has a chest incision only; do not use CBGC when a donor-site incision is present.",
        "For organ/space review, apply the eligible Chapter 17 site-specific definition."
      ]
    },

    CRAN: {
      name: "Craniotomy",
      title: "NHSN CRAN SSI Review Tool",
      surveillanceDays: 90,
      workup: [
        "Confirm the procedure meets the NHSN CRAN category definition.",
        "For organ/space review, apply the eligible intracranial or other Chapter 17 site-specific definition."
      ]
    },

    CSEC: {
      name: "Cesarean Section",
      title: "NHSN CSEC SSI Review Tool",
      surveillanceDays: 30,
      workup: [
        "Confirm the procedure meets the NHSN CSEC category definition.",
        "For organ/space review, apply the eligible Chapter 17 reproductive-tract or intraabdominal site-specific definition."
      ]
    },

    FUSN: {
      name: "Spinal Fusion",
      title: "NHSN FUSN SSI Review Tool",
      surveillanceDays: 90,
      workup: [
        "Confirm the procedure meets the NHSN FUSN category definition.",
        "For organ/space review, apply the eligible Chapter 17 spinal, bone, or other site-specific definition."
      ]
    },

    HPRO: {
      name: "Hip Prosthesis",
      title: "NHSN HPRO SSI Review Tool",
      surveillanceDays: null,
      workup: [
        "Confirm the procedure meets the NHSN HPRO category definition.",
        "Use 30 days for superficial incisional SSI and 90 days for deep-incisional or organ/space SSI.",
        "For organ/space review, apply PJI or BONE; if both definitions are met, report BONE."
      ]
    },

    KPRO: {
      name: "Knee Prosthesis",
      title: "NHSN KPRO SSI Review Tool",
      surveillanceDays: null,
      workup: [
        "Confirm the procedure meets the NHSN KPRO category definition.",
        "Use 30 days for superficial incisional SSI and 90 days for deep-incisional or organ/space SSI.",
        "For organ/space review, apply PJI or BONE; if both definitions are met, report BONE."
      ]
    }
  };

  /*
   * Organ/space is not one diagnosis.  The site-specific definition is the
   * part of the review that determines which signs, symptoms, specimen, and
   * imaging findings count.  Keep the choices tied to the operation rather
   * than leaving every non-COLO procedure behind a catch-all option.
   */
  const PROCEDURE_SITES = {
    HYST: [
      ["CUL", "Cuff cellulitis"],
      ["EMET", "Endometritis"],
      ["OREP", "Other reproductive tract infection"],
      ["VCUF", "Vaginal cuff infection"]
    ],
    CBGB: [["MED", "Mediastinitis"]],
    CBGC: [["MED", "Mediastinitis"]],
    CRAN: [
      ["IC", "Intracranial infection"],
      ["MEN", "Meningitis or ventriculitis"],
      ["VENT", "Ventriculitis"]
    ],
    CSEC: [
      ["EMET", "Endometritis"],
      ["OREP", "Other reproductive tract infection"]
    ],
    FUSN: [
      ["BONE", "Osteomyelitis"],
      ["DISC", "Disc space infection"]
    ]
  };

  const SITE_CRITERIA_PROMPTS = {
    CUL: "Document the cuff finding and the qualifying reproductive-tract evidence required by the CUL definition; a generic postoperative symptom does not establish CUL.",
    EMET: "Document fever and the required uterine finding or qualifying microbiology specified in the EMET definition. Do not treat abdominal symptoms alone as endometritis.",
    VCUF: "Document the vaginal-cuff finding and the required qualifying evidence in the VCUF definition; record the source of any drainage or specimen.",
    MED: "Document a mediastinal finding: purulent drainage or eligible mediastinal fluid/tissue microbiology, or mediastinal evidence on direct examination, histopathology, or imaging. Also document the required MED clinical finding when that pathway is used.",
    IC: "Document eligible intracranial tissue/fluid microbiology, direct or histopathologic intracranial evidence, or the complete IC clinical-and-diagnostic pathway. Fever alone is not enough.",
    MEN: "Document the MEN clinical signs and the required cerebrospinal-fluid, blood, or diagnostic evidence for the selected pathway. Do not use a non-CNS specimen as MEN evidence.",
    VENT: "Document eligible ventricular-fluid microbiology or the complete VENT clinical-and-diagnostic pathway, including the required signs or symptoms when applicable.",
    DISC: "Document eligible disc-space microbiology, direct or histopathologic evidence, or the complete DISC symptom-plus-diagnostic pathway. Back pain alone is not enough.",
    GIT: "Document the complete GIT pathway: the required gastrointestinal signs or symptoms and the eligible specimen, imaging, or direct-anatomic evidence for that pathway.",
    IAB: "Document the complete IAB pathway: the required abdominal signs or symptoms and the eligible specimen, imaging, or direct-anatomic evidence for that pathway.",
    OREP: "Document the reproductive-tract anatomy and the qualifying OREP signs, symptoms, and diagnostic evidence. Do not use a nonspecific postoperative symptom by itself."
  };

  function isJointProcedure(procedure) {
    return procedure === "HPRO" || procedure === "KPRO";
  }

  let latestCopyText = "";

  const manualDialog = $("#manualDialog");
  const openManual = $("#openManual");
  const closeManual = $("#closeManual");

  if (manualDialog && openManual && closeManual) {
    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "iframe",
      "[tabindex]:not([tabindex=\"-1\"])"
    ].join(",");

    function closeManualDialog() {
      if (manualDialog.open) {
        manualDialog.close();
      }
    }

    openManual.addEventListener("click", () => {
      manualDialog.showModal();
      document.body.classList.add("manual-open");
      closeManual.focus();
    });

    closeManual.addEventListener("click", closeManualDialog);

    manualDialog.addEventListener("click", event => {
      if (event.target === manualDialog) {
        closeManualDialog();
      }
    });

    manualDialog.addEventListener("cancel", event => {
      event.preventDefault();
      closeManualDialog();
    });

    manualDialog.addEventListener("keydown", event => {
      if (event.key !== "Tab") {
        return;
      }

      const focusable = $$(focusableSelector, manualDialog)
        .filter(element => !element.hasAttribute("disabled"));

      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1);

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    manualDialog.addEventListener("close", () => {
      document.body.classList.remove("manual-open");
      openManual.focus();
    });
  }

  const keywordDetectorDialog = $("#keywordDetectorDialog");
  const openKeywordDetector = $("#openKeywordDetector");
  const closeKeywordDetector = $("#closeKeywordDetector");
  const operativeNarrative = $("#operativeNarrative");
  const keywordDetectorResults = $("#keywordDetectorResults");

  const KEYWORD_RULES = [
    ["patosKeyword", "Abscess", /\babscess(?:es)?\b/i, "abscess"],
    ["patosKeyword", "Infection", /\binfect(?:ion|ed|ious)\b/i, "infection"],
    ["patosKeyword", "Phlegmon", /\bphlegmon\b/i, "phlegmon"],
    ["patosKeyword", "Feculent peritonitis", /\bfeculent\s+peritonitis\b/i, "feculent peritonitis"],
    ["patosKeyword", "Purulence or pus", /\b(?:purulen\w*|pus)\b/i, "purulence or pus"],
    ["patosKeyword", "Purulence or pus", /\b(?:green|yellow)\b[\s\S]{0,40}\b(?:milky|thick|creamy|opaque|viscous)\b|\b(?:milky|thick|creamy|opaque|viscous)\b[\s\S]{0,40}\b(?:green|yellow)\b/i, "qualifying purulence color and consistency"],
    ["patosKeyword", "Ruptured or perforated appendix", /\b(?:ruptured|perforated)\s+(?:appendix|appendiceal)\b/i, "ruptured or perforated appendix"],
    ["patosKeyword", "Osteomyelitis", /\bosteomyelitis\b/i, "osteomyelitis"],
    ["patosKeyword", "Sinus tract", /\bsinus\s+tract\b/i, "sinus tract"],
    ["evidence", "Purulent drainage", /\b(?:purulent|purulence|pus)\b[\s\S]{0,50}\bdrainage\b|\bdrainage\b[\s\S]{0,50}\b(?:purulent|purulence|pus)\b/i, "purulent drainage"],
    ["evidence", "Organism identified by culture or non-culture test", /\b(?:culture|cultures|specimen|specimens)\b[\s\S]{0,60}\b(?:positive|grew|growth|isolated|identified)\b|\b(?:positive|grew|growth|isolated|identified)\b[\s\S]{0,60}\b(?:culture|cultures|specimen|specimens)\b/i, "positive culture or organism identification"],
    ["cultureCollected", "Yes", /\b(?:culture|cultures|specimen|specimens)\b/i, "culture or specimen collected"],
    ["evidence", "Incision deliberately opened, re-accessed, or aspirated", /\b(?:incision|wound)\b[\s\S]{0,45}\b(?:opened|re-?accessed|aspirat\w*)\b|\b(?:opened|re-?accessed|aspirat\w*)\b[\s\S]{0,45}\b(?:incision|wound)\b/i, "incision opened, re-accessed, or aspirated"],
    ["evidence", "Spontaneous dehiscence", /\b(?:spontaneous\w*\s+)?dehisc(?:ence|ed)\b/i, "dehiscence"],
    ["evidence", "Gross anatomic evidence of infection", /\b(?:gross|direct)\s+(?:anatomic|anatomical|operative)\s+evidence\b/i, "gross anatomic evidence"],
    ["evidence", "Histopathologic evidence of infection", /\b(?:histopathology|histopathologic|pathology)\b/i, "histopathology"],
    ["evidence", "Imaging evidence definitive or equivocal for infection", /\b(?:ct|mri|ultrasound|imaging|radiograph\w*)\b[\s\S]{0,80}\b(?:infection|abscess|collection)\b/i, "imaging evidence"],
    ["evidence", "Physician or physician designee diagnosis", /\b(?:diagnos(?:is|ed)|assessment)\b[\s\S]{0,60}\b(?:ssi|surgical site infection|wound infection)\b/i, "SSI diagnosis"],
    ["evidence", "Antibiotic or antifungal therapy initiated or continued", /\b(?:antibiotic|antifungal|antimicrobial)\w*\b/i, "antibiotic or antifungal therapy"],
    ["symptom", "Fever greater than 38°C", /\b(?:fever|febrile|temperature)\b[\s\S]{0,20}\b(?:3[89](?:\.\d+)?|[4-9]\d(?:\.\d+)?)\s*(?:°?\s*c|celsius)\b|\b(?:3[89](?:\.\d+)?|[4-9]\d(?:\.\d+)?)\s*(?:°?\s*c|celsius)\b[\s\S]{0,20}\b(?:fever|febrile|temperature)\b/i, "fever greater than 38°C"],
    ["symptom", "New or worsening localized pain or tenderness", /\b(?:new|worsening|increased)?\s*(?:localized\s+)?(?:pain|tenderness)\b/i, "pain or tenderness"],
    ["symptom", "Localized swelling", /\b(?:localized\s+)?swelling\b/i, "swelling"],
    ["symptom", "Erythema", /\b(?:erythema|erythematous|redness)\b/i, "erythema or redness"],
    ["symptom", "Heat", /\b(?:warmth|hot\s+to\s+touch|heat)\b/i, "heat or warmth"],
    ["symptom", "Drainage", /\bdrainage\b/i, "drainage"],
    ["symptom", "Joint effusion", /\b(?:joint\s+)?effusion\b/i, "joint effusion"],
    ["symptom", "Limitation of motion", /\b(?:limited|decreased|reduced)\s+(?:range\s+of\s+)?motion\b/i, "limited motion"],
    ["symptom", "Nausea", /\bnausea\b/i, "nausea"],
    ["symptom", "Vomiting", /\b(?:vomiting|emesis)\b/i, "vomiting"],
    ["symptom", "Abdominal pain or tenderness", /\b(?:abdominal|abdomen)\b[\s\S]{0,30}\b(?:pain|tenderness)\b|\b(?:pain|tenderness)\b[\s\S]{0,30}\b(?:abdominal|abdomen)\b/i, "abdominal pain or tenderness"]
  ];

  function selectDetectedField(name, value) {
    const field = $(`input[name="${name}"][value="${value}"]`);

    if (!field || field.checked) {
      return false;
    }

    field.checked = true;
    return true;
  }

  function detectKeywords() {
    const narrative = operativeNarrative?.value.trim() || "";

    if (!keywordDetectorResults) {
      return;
    }

    if (!narrative) {
      keywordDetectorResults.textContent = "Paste an operative narrative before detecting keywords.";
      operativeNarrative?.focus();
      return;
    }

    const detected = [];
    let added = 0;

    KEYWORD_RULES.forEach(([name, value, pattern, label]) => {
      if (!pattern.test(narrative)) {
        return;
      }

      if (!detected.includes(label)) {
        detected.push(label);
      }

      if (selectDetectedField(name, value)) {
        added += 1;
      }
    });

    updateConditionalFields();

    if (!detected.length) {
      keywordDetectorResults.innerHTML = "<strong>No matching terms found.</strong> Review the narrative manually and use the NHSN Manual to determine applicable fields.";
      return;
    }

    keywordDetectorResults.innerHTML = `
      <strong>${added ? `${added} field${added === 1 ? "" : "s"} added to the form.` : "All detected fields were already selected."}</strong>
      <div>Detected terms:</div>
      <ul>${detected.map(label => `<li>${escapeHtml(label)}</li>`).join("")}</ul>
      <div>Confirm the context and NHSN eligibility of every selection before reporting.</div>
    `;
  }

  if (keywordDetectorDialog && openKeywordDetector && closeKeywordDetector) {
    const closeDetectorDialog = () => {
      if (keywordDetectorDialog.open) {
        keywordDetectorDialog.close();
      }
    };

    openKeywordDetector.addEventListener("click", () => {
      keywordDetectorDialog.showModal();
      document.body.classList.add("manual-open");
      operativeNarrative?.focus();
    });

    closeKeywordDetector.addEventListener("click", closeDetectorDialog);
    $("#detectKeywords")?.addEventListener("click", detectKeywords);
    $("#clearOperativeNarrative")?.addEventListener("click", () => {
      if (operativeNarrative) {
        operativeNarrative.value = "";
        operativeNarrative.focus();
      }
      if (keywordDetectorResults) {
        keywordDetectorResults.textContent = "Paste a narrative, then select Detect keywords.";
      }
    });

    keywordDetectorDialog.addEventListener("click", event => {
      if (event.target === keywordDetectorDialog) {
        closeDetectorDialog();
      }
    });

    keywordDetectorDialog.addEventListener("close", () => {
      document.body.classList.remove("manual-open");
      openKeywordDetector.focus();
    });
  }

  function selectedRadio(name) {
    const input = $(`input[name="${name}"]:checked`);
    const select = $(`select[name="${name}"]`);

    return input ? input.value : select?.value || "";
  }

  function selectedChecks(name) {
    return $$(`input[name="${name}"]:checked`).map(
      input => input.value
    );
  }

  function syncProcedurePicker(value) {
    const button = $("#procedurePickerButton");
    const selectedOption = $(`.procedure-option[data-procedure-value="${value}"]`);

    $$(".procedure-option").forEach(option => {
      const selected = option.dataset.procedureValue === value;
      option.setAttribute("aria-selected", String(selected));
    });

    if (!button) {
      return;
    }

    const label = $(".procedure-picker-button-label", button);

    if (selectedOption) {
      label.textContent = selectedOption.querySelector("strong")?.textContent || "Choose an NHSN procedure";
    } else {
      label.textContent = "Choose an NHSN procedure";
    }
  }

  function setupProcedurePicker() {
    const picker = $("[data-procedure-picker]");
    const select = $("#procedureCategory");
    const button = $("#procedurePickerButton");
    const menu = $("#procedurePickerList");

    if (!picker || !select || !button || !menu) {
      return;
    }

    const closeMenu = () => {
      menu.hidden = true;
      button.setAttribute("aria-expanded", "false");
    };

    const openMenu = () => {
      menu.hidden = false;
      button.setAttribute("aria-expanded", "true");
    };

    const chooseProcedure = value => {
      select.value = value;
      syncProcedurePicker(value);
      closeMenu();
      select.dispatchEvent(new Event("change", { bubbles: true }));
      button.focus();
    };

    button.addEventListener("click", () => {
      if (menu.hidden) {
        openMenu();
        const selected = $(".procedure-option[aria-selected=\"true\"]", menu) || $(".procedure-option", menu);
        selected?.focus();
      } else {
        closeMenu();
      }
    });

    $$(".procedure-option", menu).forEach(option => {
      option.addEventListener("click", () => chooseProcedure(option.dataset.procedureValue));
    });

    menu.addEventListener("keydown", event => {
      const options = $$(".procedure-option", menu);
      const current = document.activeElement;
      const index = options.indexOf(current);

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        button.focus();
      } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const direction = event.key === "ArrowDown" ? 1 : -1;
        options.at((index + direction + options.length) % options.length)?.focus();
      } else if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        options.at(event.key === "Home" ? 0 : -1)?.focus();
      }
    });

    document.addEventListener("click", event => {
      if (!picker.contains(event.target)) {
        closeMenu();
      }
    });

    syncProcedurePicker(select.value);
  }

  function calculatePatos() {
    return selectedChecks("patosKeyword").length > 0
      ? "Yes"
      : "No";
  }

  function updatePatosResult() {
    const result = $("#patosResult");
    const patos = calculatePatos();

    if (!result) {
      return;
    }

    result.textContent = `PATOS = ${patos.toUpperCase()}`;
    result.classList.toggle("is-yes", patos === "Yes");
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function joinNatural(items) {
    if (!items.length) {
      return "";
    }

    if (items.length === 1) {
      return items[0];
    }

    if (items.length === 2) {
      return `${items[0]} and ${items[1]}`;
    }

    return `${items.slice(0, -1).join(", ")}, and ${items.at(-1)}`;
  }

  function parseLocalDate(value) {
    if (!value) {
      return null;
    }

    const [year, month, day] = value
      .split("-")
      .map(Number);

    return new Date(year, month - 1, day);
  }

  function formatDate(date) {
    if (!date) {
      return "—";
    }

    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    });
  }

  function applicableDays() {
    const procedure =
      selectedRadio("procedureCategory");

    const level =
      selectedRadio("anatomicLevel");

    if (!procedure) {
      return null;
    }

    const configuredDays =
      PROCEDURES[procedure]?.surveillanceDays;

    if (configuredDays) {
      return configuredDays;
    }

    if (level === "Superficial incisional SSI") {
      return 30;
    }

    if (
      level === "Deep incisional SSI" ||
      level === "Organ/Space SSI"
    ) {
      return 90;
    }

    return null;
  }

  function updateSsiEvidenceTimeframe() {
    const timeframe =
      $("#ssiEvidenceTimeframe");

    if (!timeframe) {
      return;
    }

    const procedure =
      selectedRadio("procedureCategory");

    const procedureDate =
      parseLocalDate(
        $("#procedureDate")?.value || ""
      );

    const days =
      applicableDays();

    if (!procedure || !days) {
      timeframe.textContent =
        "Select the index procedure and anatomic level to show the SSI evidence review window.";
      return;
    }

    if (!procedureDate) {
      timeframe.textContent =
        `For ${procedure}, review postoperative SSI evidence within the ${days}-day surveillance period after entering the index procedure date.`;
      return;
    }

    const endDate =
      new Date(procedureDate);

    endDate.setDate(
      endDate.getDate() + days - 1
    );

    timeframe.textContent =
      `Review postoperative SSI evidence dated on or after ${formatDate(procedureDate)} through ${formatDate(endDate)}. The procedure date is surveillance day 1 of this ${days}-day window.`;
  }

  function calculateSurveillance() {
    updateSsiEvidenceTimeframe();

    const procedure =
      selectedRadio("procedureCategory");

    const level =
      selectedRadio("anatomicLevel");

    const procedureDateInput =
      $("#procedureDate");

    const eventDateInput =
      $("#eventDate");

    const surveillanceDays =
      $("#surveillanceDays");

    const surveillanceEndDate =
      $("#surveillanceEndDate");

    const eventDateStatus =
      $("#eventDateStatus");

    const surveillanceNote =
      $("#surveillanceNote");

    if (
      !procedureDateInput ||
      !eventDateInput ||
      !surveillanceDays ||
      !surveillanceEndDate ||
      !eventDateStatus ||
      !surveillanceNote
    ) {
      return;
    }

    const procedureDate =
      parseLocalDate(procedureDateInput.value);

    const eventDate =
      parseLocalDate(eventDateInput.value);

    const days =
      applicableDays();

    if (!procedure) {
      surveillanceDays.textContent =
        "Select a procedure";

      surveillanceEndDate.textContent =
        "—";

      eventDateStatus.textContent =
        "—";

      surveillanceNote.textContent =
        "Select a procedure and anatomic level to determine the surveillance window.";

      return;
    }

    if (
      (
        isJointProcedure(procedure)
      ) &&
      !level
    ) {
      surveillanceDays.textContent =
        "30 days superficial; 90 days deep/organ-space";

      surveillanceEndDate.textContent =
        "Select anatomic level";

      eventDateStatus.textContent =
        "—";

      surveillanceNote.textContent =
        `${procedure} uses 30 days for superficial SSI and 90 days for deep-incisional or organ/space SSI.`;

      return;
    }

    surveillanceDays.textContent =
      `${days} days`;

    surveillanceNote.textContent =
      PROCEDURES[procedure]?.surveillanceDays
        ? `${procedure} uses a ${days}-day SSI surveillance period.`
        : `${procedure} uses 30 days for superficial SSI and 90 days for deep-incisional or organ/space SSI.`;

    if (!procedureDate || !days) {
      surveillanceEndDate.textContent =
        "—";

      eventDateStatus.textContent =
        "—";

      return;
    }

    /*
     * Procedure date is counted as day 1.
     */
    const endDate =
      new Date(procedureDate);

    endDate.setDate(
      endDate.getDate() + days - 1
    );

    surveillanceEndDate.textContent =
      formatDate(endDate);

    if (!eventDate) {
      eventDateStatus.textContent =
        "Enter date of event";
    } else if (eventDate < procedureDate) {
      eventDateStatus.textContent =
        "Before procedure date";
    } else if (eventDate <= endDate) {
      eventDateStatus.textContent =
        "Within surveillance period";
    } else {
      eventDateStatus.textContent =
        "Outside surveillance period";
    }
  }

  function updateProcedureWorkup(procedure) {
    const panel = $("#procedureWorkup");
    const title = $("#procedureWorkupTitle");
    const intro = $("#procedureWorkupIntro");
    const list = $("#procedureWorkupList");
    const procedureConfig = PROCEDURES[procedure];

    if (!panel || !title || !intro || !list) {
      return;
    }

    if (!procedureConfig) {
      panel.classList.add("hidden");
      return;
    }

    title.textContent = `${procedure} procedure-specific workup`;
    intro.textContent =
      "Use these prompts with the full NHSN procedure definition and SSI criteria.";
    list.innerHTML = procedureConfig.workup
      .map(item => `<li>${escapeHtml(item)}</li>`)
      .join("");
    panel.classList.remove("hidden");
  }

  function renderProcedureSiteOptions(procedure) {
    const container = $("#genericSiteOptions");
    const sites = PROCEDURE_SITES[procedure];

    if (!container || !sites) {
      return;
    }

    container.innerHTML = sites
      .map(([code, label]) => `
        <label class="radio-card">
          <input type="radio" name="siteSpecific" value="${escapeHtml(code)}">
          <span>
            <strong>${escapeHtml(code)}</strong>
            <small>${escapeHtml(label)}</small>
          </span>
        </label>
      `)
      .join("");
  }

  function setProcedure(procedure) {
    if (!PROCEDURES[procedure]) {
      return;
    }

    const procedureCategory =
      $("#procedureCategory");

    if (procedureCategory) {
      procedureCategory.value = procedure;
      syncProcedurePicker(procedure);
    }

    const pageTitle =
      $("#pageTitle");

    if (pageTitle) {
      pageTitle.textContent =
        PROCEDURES[procedure].title;
    }

    const jointProcedure =
      isJointProcedure(procedure);

    const coloProcedure =
      procedure === "COLO";

    $$(".colo-only").forEach(element => {
      element.classList.toggle(
        "hidden",
        !coloProcedure
      );
    });

    $$(".joint-only").forEach(element => {
      element.classList.toggle(
        "hidden",
        !jointProcedure
      );
    });

    const coloSiteOptions =
      $("#coloSiteOptions");

    const jointSiteOptions =
      $("#jointSiteOptions");

    const genericSiteOptions =
      $("#genericSiteOptions");

    const coloEvidenceCards =
      $("#coloEvidenceCards");

    const jointEvidenceCards =
      $("#jointEvidenceCards");

    const siteSpecificNote =
      $("#siteSpecificNote");

    coloSiteOptions?.classList.toggle(
      "hidden",
      !coloProcedure
    );

    jointSiteOptions?.classList.toggle(
      "hidden",
      !jointProcedure
    );

    genericSiteOptions?.classList.toggle(
      "hidden",
      coloProcedure || jointProcedure
    );

    renderProcedureSiteOptions(procedure);

    coloEvidenceCards?.classList.toggle(
      "hidden",
      !coloProcedure
    );

    jointEvidenceCards?.classList.toggle(
      "hidden",
      !jointProcedure
    );

    if (siteSpecificNote) {
      siteSpecificNote.textContent =
        jointProcedure
          ? "For HPRO/KPRO, use PJI or BONE. If both definitions are met, report BONE."
          : coloProcedure
            ? "For COLO, select the site-specific definition supported by the anatomy and evidence."
            : "Select the anatomic site actually involved. The Criteria guidance panel will identify the site-specific evidence that still needs to be documented.";
    }

    /*
     * Clear the old procedure's organ/space
     * selection when switching procedures.
     */
    $$(
      'input[name="siteSpecific"]'
    ).forEach(input => {
      input.checked = false;
    });

    updateProcedureWorkup(procedure);
    updateConditionalFields();
  }

  /*
   * NHSN excludes these organisms from meeting an SSI criterion.  The
   * species aliases below make the input feedback useful when a laboratory
   * result uses a common abbreviated name rather than "coagulase-negative".
   */
  const SSI_ORGANISM_EXCLUSIONS = [
    {
      label: "coagulase-negative Staphylococcus",
      pattern: /\b(?:coagulase[-\s]*negative|coag[-\s]*negative|cons)\s+(?:staph(?:ylococcus)?\.?|staphylococci)\b|\b(?:staph(?:ylococcus)?\.?|staphylococci)\s+(?:coagulase[-\s]*negative|coag[-\s]*negative)\b/i
    },
    {
      label: "Staphylococcus epidermidis (a coagulase-negative Staphylococcus)",
      pattern: /\b(?:staph(?:ylococcus)?\.?|s\.)\s*epidermidis\b/i
    },
    {
      label: "Staphylococcus hominis (a coagulase-negative Staphylococcus)",
      pattern: /\b(?:staph(?:ylococcus)?\.?|s\.)\s*hominis\b/i
    },
    {
      label: "Staphylococcus capitis (a coagulase-negative Staphylococcus)",
      pattern: /\b(?:staph(?:ylococcus)?\.?|s\.)\s*capitis\b/i
    },
    {
      label: "Staphylococcus haemolyticus (a coagulase-negative Staphylococcus)",
      pattern: /\b(?:staph(?:ylococcus)?\.?|s\.)\s*haemolyticus\b/i
    },
    {
      label: "Staphylococcus warneri (a coagulase-negative Staphylococcus)",
      pattern: /\b(?:staph(?:ylococcus)?\.?|s\.)\s*warneri\b/i
    },
    {
      label: "Micrococcus",
      pattern: /\bmicrococcus\b/i
    },
    {
      label: "Cutibacterium acnes (formerly Propionibacterium acnes)",
      pattern: /\b(?:cutibacterium|propionibacterium)\s+acnes\b/i
    }
  ];

  function updateOrganismEligibility() {
    const input = $("#organisms");
    const status = $("#organismEligibility");

    if (!input || !status) return;

    const organism = input.value.trim();
    status.className = "organism-eligibility";

    if (!organism) {
      status.textContent = "Enter an organism to review NHSN SSI microbiology eligibility.";
      return;
    }

    const exclusions = SSI_ORGANISM_EXCLUSIONS
      .filter(({ pattern }) => pattern.test(organism))
      .map(({ label }) => label);

    if (exclusions.length) {
      status.classList.add("is-excluded");
      status.textContent = `Not eligible to meet an NHSN SSI criterion: ${exclusions.join("; ")}. Any other organism entered may be eligible only if the specimen and all selected SSI-criterion requirements are met.`;
      return;
    }

    status.classList.add("is-potentially-eligible");
    status.textContent = "Potentially eligible for an NHSN SSI microbiology pathway. Confirm it was identified from an aseptically obtained specimen from the applicable incision, tissue, fluid, or organ/space by a test performed for clinical diagnosis or treatment, and that all selected SSI-criterion requirements are met.";
  }

  function updateConditionalFields() {
    const culture =
      selectedRadio("cultureCollected");

    const organismField =
      $("#organismField");

    organismField?.classList.toggle(
      "hidden",
      culture !== "Yes"
    );

    const level =
      selectedRadio("anatomicLevel");

    const siteSpecificField =
      $("#siteSpecificField");

    siteSpecificField?.classList.toggle(
      "hidden",
      level !== "Organ/Space SSI"
    );

    if (level !== "Organ/Space SSI") {
      $$(
        'input[name="siteSpecific"]'
      ).forEach(input => {
        input.checked = false;
      });
    }

    calculateSurveillance();
    updatePatosResult();
    updateProgress();
    updateOrganismEligibility();
    updateCriteriaGuidance();
  }

  function determineResult() {
    const procedure =
      selectedRadio("procedureCategory");

    const level =
      selectedRadio("anatomicLevel");

    const site =
      selectedRadio("siteSpecific");

    if (!procedure) {
      return "Procedure category not selected";
    }

    if (!level) {
      return `${procedure} — anatomic level not selected`;
    }

    if (level === "Organ/Space SSI") {
      return site
        ? `SSI-${site} — Organ/Space SSI after ${procedure}`
        : `Organ/Space SSI after ${procedure} — site not selected`;
    }

    return `${level} after ${procedure}`;
  }

  function buildSummary() {
    const procedure =
      selectedRadio("procedureCategory") ||
      "Procedure not selected";

    const procedureName =
      PROCEDURES[procedure]?.name || "";

    const level =
      selectedRadio("anatomicLevel");

    const site =
      selectedRadio("siteSpecific");

    const patos =
      calculatePatos();

    const evidence =
      selectedChecks("evidence");

    const pjiEvidence =
      selectedChecks("pjiEvidence");

    const symptoms =
      selectedChecks("symptom");

    const keywords =
      selectedChecks("patosKeyword");

    const culture =
      selectedRadio("cultureCollected") ||
      "not selected";

    const organisms =
      $("#organisms")?.value.trim() || "";

    const indexDate =
      parseLocalDate(
        $("#procedureDate")?.value || ""
      );

    const eventDate =
      parseLocalDate(
        $("#eventDate")?.value || ""
      );

    const days =
      applicableDays();

    const classification =
      determineResult();

    let summary =
      `${classification} is suggested for the ` +
      `${procedure}` +
      `${procedureName ? ` (${procedureName})` : ""} procedure.`;

    if (evidence.length) {
      summary +=
        ` Post-index supporting evidence includes ` +
        `${joinNatural(
          evidence.map(
            item => item.toLowerCase()
          )
        )}.`;
    }

    if (pjiEvidence.length) {
      summary +=
        ` PJI-specific findings include ` +
        `${joinNatural(
          pjiEvidence.map(
            item => item.toLowerCase()
          )
        )}.`;
    }

    if (symptoms.length) {
      summary +=
        ` Documented signs/symptoms include ` +
        `${joinNatural(
          symptoms.map(
            item => item.toLowerCase()
          )
        )}.`;
    }

    if (keywords.length) {
      summary +=
        ` Selected PATOS findings include ` +
        `${joinNatural(
          keywords.map(
            item => item.toLowerCase()
          )
        )}.`;
    }

    if (keywords.length) {
      summary +=
        ` PATOS at the index procedure: ${patos}.`;
    }

    if (culture !== "not selected") {
      summary +=
        ` Culture collected: ${culture}.`;
    }

    if (
      culture === "Yes" &&
      organisms
    ) {
      summary +=
        ` Organism(s): ${organisms}.`;
    }

    if (
      indexDate &&
      days
    ) {
      summary +=
        ` The applicable surveillance period is ` +
        `${days} days from ` +
        `${formatDate(indexDate)}.`;
    }

    if (eventDate) {
      const eventStatus =
        $("#eventDateStatus")?.textContent ||
        "";

      summary +=
        ` Possible date of event: ` +
        `${formatDate(eventDate)}; ` +
        `${eventStatus.toLowerCase()}.`;
    }

    if (
      level === "Organ/Space SSI" &&
      !site
    ) {
      summary +=
        " A site-specific organ/space definition still needs to be selected.";
    }

    return {
      classification,
      summary
    };
  }

  function calculateResult() {
    const resultTitle =
      $("#resultTitle");

    const resultContent =
      $("#resultContent");

    const copyButton =
      $("#copyButton");

    const copyStatus =
      $("#copyStatus");

    const resultBody =
      $("#resultBody");

    const minimizeResult =
      $("#minimizeResult");

    if (
      !resultTitle ||
      !resultContent
    ) {
      return;
    }

    const {
      classification,
      summary
    } = buildSummary();

    resultTitle.textContent =
      classification;

    resultContent.className =
      "result-output";

    resultContent.innerHTML = `
      <h3>Summary</h3>
      <p>${escapeHtml(summary)}</p>
    `;

    latestCopyText = [
      "NHSN SSI REVIEW",
      "",
      `Preliminary Classification: ${classification}`,
      "",
      `Summary: ${summary}`
    ].join("\n");

    if (copyButton) {
      copyButton.disabled = false;
    }

    if (copyStatus) {
      copyStatus.textContent = "";
    }

    resultBody?.classList.remove(
      "collapsed"
    );

    if (minimizeResult) {
      minimizeResult.textContent = "−";
    }
  }

  async function copyResult() {
    if (!latestCopyText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        latestCopyText
      );
    } catch (error) {
      const textarea =
        document.createElement("textarea");

      textarea.value =
        latestCopyText;

      textarea.style.position =
        "fixed";

      textarea.style.opacity =
        "0";

      document.body.appendChild(
        textarea
      );

      textarea.select();

      document.execCommand(
        "copy"
      );

      textarea.remove();
    }

    const copyStatus =
      $("#copyStatus");

    if (copyStatus) {
      copyStatus.textContent =
        "Result copied.";
    }
  }

  function clearForm() {
    const confirmed =
      window.confirm(
        "Clear all entered information and selections?"
      );

    if (!confirmed) {
      return;
    }

    $$(
      'input[type="checkbox"], input[type="radio"]'
    ).forEach(input => {
      input.checked = false;
    });

    $$("select").forEach(select => {
      select.value = "";
    });

    syncProcedurePicker("");

    $$(
      'input[type="text"], input[type="date"], textarea'
    ).forEach(input => {
      input.value = "";
    });

    const pageTitle =
      $("#pageTitle");

    const resultTitle =
      $("#resultTitle");

    const resultContent =
      $("#resultContent");

    const copyButton =
      $("#copyButton");

    const copyStatus =
      $("#copyStatus");

    if (pageTitle) {
      pageTitle.textContent =
        "NHSN SSI Review Tool";
    }

    if (resultTitle) {
      resultTitle.textContent =
        "Complete the review and select Calculate Result";
    }

    if (resultContent) {
      resultContent.className =
        "empty-result";

      resultContent.textContent =
        "Your copy-ready paragraph summary will appear here.";
    }

    if (copyButton) {
      copyButton.disabled = true;
    }

    if (copyStatus) {
      copyStatus.textContent = "";
    }

    latestCopyText = "";

    $$(".colo-only").forEach(element => {
      element.classList.remove(
        "hidden"
      );
    });

    $$(".joint-only").forEach(element => {
      element.classList.add(
        "hidden"
      );
    });

    $("#coloSiteOptions")
      ?.classList.remove("hidden");

    $("#jointSiteOptions")
      ?.classList.add("hidden");

    $("#genericSiteOptions")
      ?.classList.add("hidden");

    $("#procedureWorkup")
      ?.classList.add("hidden");

    $("#coloEvidenceCards")
      ?.classList.remove("hidden");

    $("#jointEvidenceCards")
      ?.classList.add("hidden");

    updateConditionalFields();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function resetSection(sectionId) {
    const section = document.getElementById(sectionId);

    if (!section) {
      return;
    }

    $$("input, select, textarea", section).forEach(control => {
      if (
        control.type === "checkbox" ||
        control.type === "radio"
      ) {
        control.checked = false;
      } else {
        control.value = "";
      }
    });

    if (sectionId === "procedure") {
      syncProcedurePicker("");
      $("#pageTitle").textContent =
        "NHSN SSI Review Tool";
      $("#procedureWorkup")?.classList.add("hidden");

      $$(".colo-only").forEach(element => {
        element.classList.remove("hidden");
      });

      $$(".joint-only").forEach(element => {
        element.classList.add("hidden");
      });

      $("#coloSiteOptions")?.classList.remove("hidden");
      $("#jointSiteOptions")?.classList.add("hidden");
      $("#genericSiteOptions")?.classList.add("hidden");
      $("#coloEvidenceCards")?.classList.remove("hidden");
      $("#jointEvidenceCards")?.classList.add("hidden");
      $("#siteSpecificNote").textContent = "";
    }

    updateConditionalFields();
  }

  function updateProgress() {
    const procedure =
      selectedRadio("procedureCategory");

    const evidenceComplete =
      selectedChecks("evidence").length > 0 ||
      Boolean(
        selectedRadio("cultureCollected")
      );

    const level =
      selectedRadio("anatomicLevel");

    const site =
      selectedRadio("siteSpecific");

    $("#progressProcedure")
      ?.classList.toggle(
        "complete",
        Boolean(procedure)
      );

    $("#progressPatos")
      ?.classList.toggle(
        "complete",
        true
      );

    $("#progressEvidence")
      ?.classList.toggle(
        "complete",
        evidenceComplete
      );

    $("#progressLevel")
      ?.classList.toggle(
        "complete",
        Boolean(level)
      );

    $("#progressSite")
      ?.classList.toggle(
        "complete",
        Boolean(level) &&
        (
          level !== "Organ/Space SSI" ||
          Boolean(site)
        )
      );

    const completed = [
      Boolean(procedure),
      true,
      evidenceComplete,
      Boolean(level),
      Boolean(level) &&
      (
        level !== "Organ/Space SSI" ||
        Boolean(site)
      )
    ].filter(Boolean).length;

    const progressTitle =
      $("#progressTitle");

    if (progressTitle) {
      progressTitle.textContent =
        `${completed} of 5 review items completed`;
    }

    let guidance =
      "Select the index procedure category.";

    if (
      procedure &&
      !evidenceComplete
    ) {
      guidance =
        "Select the supporting evidence.";
    }

    if (
      evidenceComplete &&
      !level
    ) {
      guidance =
        "Select the deepest anatomic level.";
    }

    if (
      level === "Organ/Space SSI" &&
      !site
    ) {
      guidance =
        "Select the site-specific organ/space definition.";
    }

    if (completed === 5) {
      guidance =
        "The core review is complete. Calculate the preliminary result.";
    }

    const progressGuidance =
      $("#progressGuidance");

    if (progressGuidance) {
      progressGuidance.textContent =
        guidance;
    }
  }

  function setCriteriaAlert(
    state,
    title,
    message,
    items = []
  ) {
    const alert =
      $("#criteriaAlert");

    const icon =
      $("#criteriaAlertIcon");

    const titleElement =
      $("#criteriaAlertTitle");

    const messageElement =
      $("#criteriaAlertMessage");

    const list =
      $("#criteriaAlertList");

    if (
      !alert ||
      !icon ||
      !titleElement ||
      !messageElement ||
      !list
    ) {
      return;
    }

    alert.className =
      `criteria-alert ${state}`;

    if (state === "success") {
      icon.textContent = "✓";
    } else if (
      state === "danger" ||
      state === "warning"
    ) {
      icon.textContent = "!";
    } else {
      icon.textContent = "i";
    }

    titleElement.textContent =
      title;

    messageElement.textContent =
      message;

    list.innerHTML =
      items
        .map(
          item =>
            `<li>${escapeHtml(item)}</li>`
        )
        .join("");
  }

  function hasAnyEvidence(values) {
    const selected =
      selectedChecks("evidence");

    return values.some(
      value => selected.includes(value)
    );
  }

  function organSpaceCoreRequirements() {
    const procedureDate = parseLocalDate(
      $("#procedureDate")?.value || ""
    );
    const eventDate = parseLocalDate(
      $("#eventDate")?.value || ""
    );
    const days = applicableDays();
    const purulentDrainage = hasAnyEvidence([
      "Purulent drainage"
    ]);
    const microbiologySelected = hasAnyEvidence([
      "Organism identified by culture or non-culture test"
    ]);
    const organismDocumented =
      microbiologySelected &&
      selectedRadio("cultureCollected") === "Yes" &&
      Boolean($("#organisms")?.value.trim());
    const anatomicEvidence = hasAnyEvidence([
      "Gross anatomic evidence of infection",
      "Histopathologic evidence of infection",
      "Imaging evidence definitive or equivocal for infection"
    ]);
    const independentCoreEvidence =
      purulentDrainage ||
      anatomicEvidence;
    const coreEvidence =
      independentCoreEvidence ||
      organismDocumented;
    const missing = [];

    if (!procedureDate || !eventDate || !days) {
      missing.push(
        "Enter the procedure date and possible date of event to verify the applicable 30- or 90-day surveillance period."
      );
    } else {
      const endDate = new Date(procedureDate);
      endDate.setDate(endDate.getDate() + days - 1);

      if (eventDate < procedureDate || eventDate > endDate) {
        missing.push(
          "The possible date of event must fall within the applicable surveillance period."
        );
      }
    }

    if (!coreEvidence) {
      missing.push(
        microbiologySelected
          ? "For the microbiology pathway, select “Yes” for a collected test and enter the organism(s); also verify the fluid or tissue specimen is from the organ/space."
          : "Add one organ/space finding: purulent drainage from an organ/space drain, eligible fluid/tissue microbiology, or gross, histopathologic, or imaging evidence of infection."
      );
    }

    return {
      coreEvidence,
      microbiologySelected,
      organismDocumented,
      missing
    };
  }

  function updateCriteriaGuidance() {
    const procedure =
      selectedRadio("procedureCategory");

    const level =
      selectedRadio("anatomicLevel");

    const site =
      selectedRadio("siteSpecific");

    const cultureCollected =
      selectedRadio("cultureCollected");

    const organisms =
      $("#organisms")?.value.trim() || "";

    const pjiItems =
      selectedChecks("pjiEvidence");

    if (
      !procedure ||
      !level
    ) {
      setCriteriaAlert(
        "neutral",
        "Criteria guidance",
        "Select a procedure and anatomic level to see what is still needed."
      );

      return;
    }

    /*
     * SUPERFICIAL INCISIONAL
     */
    if (
      level ===
      "Superficial incisional SSI"
    ) {
      const purulentDrainage =
        hasAnyEvidence([
          "Purulent drainage"
        ]);

      const microbiology =
        hasAnyEvidence([
          "Organism identified by culture or non-culture test"
        ]);

      const opened =
        hasAnyEvidence([
          "Incision deliberately opened, re-accessed, or aspirated"
        ]);

      const physicianDiagnosis =
        hasAnyEvidence([
          "Physician or physician designee diagnosis"
        ]);

      const symptoms =
        selectedChecks("symptom");

      const qualifyingLocalSymptom =
        symptoms.some(item =>
          [
            "New or worsening localized pain or tenderness",
            "Localized swelling",
            "Erythema",
            "Heat"
          ].includes(item)
        );

      const treatment =
        hasAnyEvidence([
          "Antibiotic or antifungal therapy initiated or continued"
        ]);

      if (
        purulentDrainage ||
        physicianDiagnosis
      ) {
        setCriteriaAlert(
          "success",
          "Potential superficial pathway identified",
          "The selected findings may support a superficial-incisional SSI pathway. Confirm the evidence involves only skin and subcutaneous tissue."
        );

        return;
      }

      if (microbiology) {
        if (
          cultureCollected === "Yes" &&
          organisms
        ) {
          setCriteriaAlert(
            "success",
            "Microbiology pathway selected",
            "Eligible microbiology is documented. Confirm the specimen source and organism meet the superficial-incisional definition."
          );
        } else {
          setCriteriaAlert(
            "danger",
            "Organism documentation required",
            "Microbiology was selected, but the organism information is incomplete.",
            [
              "Select that a culture or microbiologic test was collected.",
              "Enter the organism identified.",
              "Confirm the specimen source is eligible."
            ]
          );
        }

        return;
      }

      if (opened) {
        const missing = [];

        if (!qualifyingLocalSymptom) {
          missing.push(
            "Select localized pain/tenderness, swelling, erythema, or heat."
          );
        }

        if (!treatment) {
          missing.push(
            "Confirm antibiotic or antifungal therapy was initiated or continued when required by the pathway."
          );
        }

        if (!missing.length) {
          setCriteriaAlert(
            "success",
            "Potential opening pathway identified",
            "The opening/re-access pathway may be supported. Verify the exact NHSN companion requirements."
          );
        } else {
          setCriteriaAlert(
            "danger",
            "Additional superficial criteria required",
            "The incision opening/re-access selection is not enough by itself.",
            missing
          );
        }

        return;
      }

      setCriteriaAlert(
        "danger",
        "Superficial criteria not yet supported",
        "Symptoms alone do not establish superficial-incisional SSI.",
        [
          "Add purulent drainage, eligible microbiology, a qualifying incision opening/re-access pathway, or physician/designee diagnosis."
        ]
      );

      return;
    }

    /*
     * DEEP INCISIONAL
     */
    if (
      level ===
      "Deep incisional SSI"
    ) {
      const directEvidence =
        hasAnyEvidence([
          "Purulent drainage",
          "Gross anatomic evidence of infection",
          "Histopathologic evidence of infection",
          "Imaging evidence definitive or equivocal for infection"
        ]);

      const openingOrDehiscence =
        hasAnyEvidence([
          "Incision deliberately opened, re-accessed, or aspirated",
          "Spontaneous dehiscence"
        ]);

      const symptoms =
        selectedChecks("symptom");

      const feverOrPain =
        symptoms.some(item =>
          item === "Fever greater than 38°C" ||
          item ===
            "New or worsening localized pain or tenderness"
        );

      const treatment =
        hasAnyEvidence([
          "Antibiotic or antifungal therapy initiated or continued"
        ]);

      if (directEvidence) {
        setCriteriaAlert(
          "success",
          "Potential deep-incisional pathway identified",
          "A potentially qualifying deep-incisional finding is selected. Confirm it involves fascia and/or muscle."
        );

        return;
      }

      if (openingOrDehiscence) {
        const missing = [];

        if (!feverOrPain) {
          missing.push(
            "Fever >38°C or new/worsening localized pain or tenderness is still required for this pathway."
          );
        }

        if (!treatment) {
          missing.push(
            "Antibiotic or antifungal therapy is still required for this pathway."
          );
        }

        if (!missing.length) {
          setCriteriaAlert(
            "success",
            "Potential deep opening pathway identified",
            "The selected opening/dehiscence pathway may be complete. Confirm fascia or muscle involvement."
          );
        } else {
          setCriteriaAlert(
            "danger",
            "Additional deep-incisional criteria required",
            "The opening or dehiscence finding is not sufficient by itself.",
            missing
          );
        }

        return;
      }

      setCriteriaAlert(
        "danger",
        "Deep-incisional criteria not yet supported",
        "The current selections do not complete a deep-incisional SSI pathway.",
        [
          "Choose one qualifying pathway:",
          "Purulent drainage, gross anatomic evidence, histopathologic evidence, or imaging evidence involving fascia and/or muscle.",
          "OR: a qualifying opening/dehiscence pathway, plus fever or localized pain/tenderness and required antimicrobial therapy."
        ]
      );

      return;
    }

    /*
     * ORGAN/SPACE
     */
    if (
      level ===
      "Organ/Space SSI"
    ) {
      if (!site) {
        setCriteriaAlert(
          "danger",
          "Start with the Organ/Space site",
          "Organ/Space SSI requires a matching Chapter 17 site-specific definition before the remaining criteria can be evaluated.",
          procedure === "COLO"
            ? [
                "Choose the matching site: GIT, IAB, or OREP.",
                "Then document both a general Organ/Space finding and the complete definition for the selected site."
              ]
            : isJointProcedure(procedure)
              ? [
                  "Choose the matching site: PJI or BONE.",
                  "Then document both a general Organ/Space finding and the complete definition for the selected site."
                ]
              : [
                  "Identify and select the exact eligible Chapter 17 site-specific definition.",
                  "Then document both a general Organ/Space finding and the complete definition for that site."
                ]
        );

        return;
      }

      const organSpaceCore =
        organSpaceCoreRequirements();

      const generalOrganSpacePathway =
        organSpaceCore.coreEvidence;

      /*
       * PJI
       */
      if (site === "PJI") {
        const twoMatching =
          pjiItems.includes(
            "Two positive periprosthetic specimens with a matching organism"
          );

        const majorFinding =
          pjiItems.some(item =>
            item ===
              "Sinus tract communicating with the joint" ||
            item ===
              "Purulence or other gross anatomic joint evidence"
          );

        const minorItems =
          pjiItems.filter(item =>
            ![
              "Two positive periprosthetic specimens with a matching organism",
              "Sinus tract communicating with the joint",
              "Purulence or other gross anatomic joint evidence"
            ].includes(item)
          );

        if (
          twoMatching ||
          majorFinding
        ) {
          setCriteriaAlert(
            organSpaceCore.missing.length ? "danger" : "success",
            organSpaceCore.missing.length
              ? "PJI pathway selected; Organ/Space criteria still needed"
              : "Potential PJI pathway identified",
            organSpaceCore.missing.length
              ? "A PJI pathway is selected, but the Organ/Space SSI requirements below are still incomplete."
              : "A major PJI pathway is selected. Verify timing, specimen requirements, anatomy, and exact NHSN wording.",
            organSpaceCore.missing
          );

          return;
        }

        if (minorItems.length >= 3) {
          setCriteriaAlert(
            organSpaceCore.missing.length ? "danger" : "success",
            organSpaceCore.missing.length
              ? "PJI minor criteria selected; Organ/Space criteria still needed"
              : "Potential PJI minor-criteria pathway identified",
            organSpaceCore.missing.length
              ? `${minorItems.length} qualifying PJI minor findings are selected, but the Organ/Space SSI requirements below are still incomplete.`
              : `${minorItems.length} qualifying minor findings are selected. Verify that each selected finding meets the exact NHSN requirement.`,
            organSpaceCore.missing
          );

          return;
        }

        const stillNeeded =
          3 - minorItems.length;

        setCriteriaAlert(
          "danger",
          "PJI criteria not yet met",
          "The currently selected symptoms and findings are not enough to complete PJI.",
          [
            ...(minorItems.length
              ? [
                  `${stillNeeded} additional qualifying PJI minor criterion/criteria are needed for the three-minor-criteria pathway.`
                ]
              : [
                  "Select two matching positive periprosthetic specimens; a sinus tract, purulence, or gross joint finding; or at least three qualifying minor criteria."
                ]),
            ...organSpaceCore.missing
          ]
        );

        return;
      }

      /*
       * BONE
       */
      if (site === "BONE") {
        if (!generalOrganSpacePathway) {
          const missing = [
            "Document eligible microbiology from bone, gross or histopathologic evidence, or another qualifying BONE pathway."
          ];

          if (
            organSpaceCore.microbiologySelected &&
            !organSpaceCore.organismDocumented
          ) {
            missing.push(
              "Enter the organism and confirm it came from an eligible specimen."
            );
          } else {
            missing.push(
              "Eligible microbiology may be required depending on the BONE pathway used."
            );
          }

          setCriteriaAlert(
            "danger",
            "Additional BONE evidence required",
            "Symptoms alone are not enough to complete an organ/space BONE SSI.",
            missing
          );

          return;
        }

        setCriteriaAlert(
          "warning",
          "General organ/space evidence selected",
          "The selected evidence may support the general Organ/Space SSI component, but the complete BONE Chapter 17 definition must still be verified."
        );

        return;
      }

      /*
       * Site-specific organ/space review. A general evidence checkbox never
       * substitutes for the signs/symptoms and source requirements of the
       * selected Chapter 17 site.
       */
      const missing = [
        ...organSpaceCore.missing
      ];
      const siteSpecificRequirement =
        SITE_CRITERIA_PROMPTS[site] ||
        `Confirm that the full ${site} Chapter 17 site-specific definition is met.`;

      missing.push(
        `Complete the ${site} site-specific pathway: ${siteSpecificRequirement}`
      );

      setCriteriaAlert(
        "danger",
        "Organ/Space: complete the remaining checkpoints",
        `For ${site}, work through the remaining requirements in order. Both the general Organ/Space evidence and the ${site} definition must be met.`,
        missing
      );
    }
  }

  function setupTabs() {
    $$(".tab-button").forEach(
      button => {
        button.addEventListener(
          "click",
          () => {
            $$(".tab-button").forEach(
              item => {
                item.classList.remove(
                  "active"
                );
              }
            );

            $$(".tab-panel").forEach(
              panel => {
                panel.classList.remove(
                  "active"
                );
              }
            );

            button.classList.add(
              "active"
            );

            const panel =
              $(`#${button.dataset.tab}`);

            panel?.classList.add(
              "active"
            );
          }
        );
      }
    );

    $$(
      '[data-open-tab="nhsnEvidence"]'
    ).forEach(link => {
      link.addEventListener(
        "click",
        () => {
          const evidenceTab =
            $(
              '.tab-button[data-tab="nhsnEvidence"]'
            );

          evidenceTab?.click();
        }
      );
    });
  }

  /*
   * Listen for checkbox, radio, and date changes.
   */
  document.addEventListener(
    "change",
    event => {
      if (
        !event.target.matches("input, select")
      ) {
        return;
      }

      if (
        event.target.name ===
        "procedureCategory"
      ) {
        setProcedure(
          event.target.value
        );
      } else {
        updateConditionalFields();
      }
    }
  );

  $("#procedureDate")
    ?.addEventListener(
      "change",
      calculateSurveillance
    );

  $("#eventDate")
    ?.addEventListener(
      "change",
      calculateSurveillance
    );

  $("#organisms")
    ?.addEventListener(
      "input",
      () => {
        updateOrganismEligibility();
        updateCriteriaGuidance();
      }
    );

  $("#calculateButton")
    ?.addEventListener(
      "click",
      calculateResult
    );

  $("#copyButton")
    ?.addEventListener(
      "click",
      copyResult
    );

  $("#clearButton")
    ?.addEventListener(
      "click",
      clearForm
    );

  $$("[data-reset-section]").forEach(button => {
    button.addEventListener("click", () => {
      resetSection(button.dataset.resetSection);
    });
  });

  $("#minimizeResult")
    ?.addEventListener(
      "click",
      () => {
        const resultBody =
          $("#resultBody");

        const button =
          $("#minimizeResult");

        if (
          !resultBody ||
          !button
        ) {
          return;
        }

        resultBody.classList.toggle(
          "collapsed"
        );

        button.textContent =
          resultBody.classList.contains(
            "collapsed"
          )
            ? "+"
            : "−";
      }
    );

  const NHSN_DEFINITIONS = {
    "procedureDate": "Enter the calendar date on which the indexed NHSN operative procedure was performed. This is surveillance day 1, not the day after surgery.",
    "eventDate": "Enter the date on which the first element used to meet the SSI criterion occurred. That date—not the culture-result or diagnosis date—must be within the applicable surveillance period.",
    "procedureCategory": "Select the NHSN operative-procedure category for the indexed operation. Confirm that the operation meets that category's full NHSN definition before assigning surveillance.",
    "patosKeyword": "PATOS is assigned only when an eligible finding is documented in the narrative portion of the operative note at the index procedure. Do not use postoperative findings or a diagnosis recorded after surgery.",
    "Abscess": "For PATOS, select only when an abscess is documented in the narrative operative note at the index procedure. The abscess must be present at surgery, not first identified postoperatively.",
    "Infection": "For PATOS, select only when infection is documented in the narrative operative note at the index procedure. A later postoperative diagnosis does not establish PATOS.",
    "Phlegmon": "For PATOS, select only when phlegmon is documented in the narrative operative note at the index procedure. It is evidence of infection present at surgery, not a postoperative finding.",
    "Feculent peritonitis": "For PATOS, select only when feculent peritonitis is documented in the narrative operative note at the index procedure.",
    "Purulence or pus": "For PATOS, select when pus or purulence is documented in the narrative operative note at the index procedure. If neither term is used, NHSN requires both an accepted color descriptor and an accepted consistency descriptor.",
    "Ruptured or perforated appendix": "For PATOS, select only when a ruptured or perforated appendix is documented in the narrative operative note at the index procedure.",
    "Osteomyelitis": "For PATOS, select only when osteomyelitis is documented in the narrative operative note at the index procedure. For HPRO/KPRO organ/space review, BONE is reported when both BONE and PJI definitions are met.",
    "Sinus tract": "For PATOS, select only when a sinus tract is documented in the narrative operative note at the index procedure. In the PJI pathway, the tract must communicate with the joint.",
    "Purulent drainage": "Drainage documented as purulent from the applicable superficial or deep incision, or from a drain placed into the organ/space, as specified by the relevant NHSN criterion.",
    "Organism identified by culture or non-culture test": "An eligible organism is identified from an aseptically obtained specimen from the applicable incision, tissue, fluid, or organ/space by a microbiologic test performed for clinical diagnosis or treatment. The specimen source and collection method must meet the selected SSI criterion.",
    "Incision deliberately opened, re-accessed, or aspirated": "An applicable incision is deliberately opened, re-accessed, or aspirated by a surgeon, physician, or physician designee. Additional NHSN requirements, including treatment and symptoms where applicable, still apply.",
    "Spontaneous dehiscence": "Re-opening of a surgical incision that is not caused by an external factor such as direct trauma. In deep-incisional SSI criteria, other requirements also apply.",
    "Gross anatomic evidence of infection": "Evidence of infection observed during direct examination of the applicable tissue or organ/space, such as an abscess. Imaging alone is not gross anatomic evidence.",
    "Histopathologic evidence of infection": "Evidence of infection identified on histopathologic examination of the applicable tissue.",
    "Imaging evidence definitive or equivocal for infection": "Imaging that is definitive or equivocal for infection may support organ/space SSI review when the other NHSN requirements are met.",
    "Physician or physician designee diagnosis": "A diagnosis documented by a physician or physician designee. It is a qualifying pathway for superficial-incisional SSI, but is not by itself a general substitute for every NHSN SSI criterion.",
    "Antibiotic or antifungal therapy initiated or continued": "For the deliberate-opening or dehiscence pathways, antimicrobial therapy must be started or continued within the NHSN-specified two-calendar-day timeframe and continued for at least two calendar days. This does not replace the other pathway requirements.",
    "cultureCollected": "Record whether a culture or other eligible microbiologic test was collected from the relevant site. A collected test is not automatically qualifying; its source, collection method, and result must fit the selected NHSN criterion.",
    "organisms": "An organism is potentially eligible only when it is identified from an aseptically obtained specimen from the applicable incision, tissue, fluid, or organ/space by a microbiologic test performed for clinical diagnosis or treatment, and all selected SSI-criterion requirements are met. Exclusions: coagulase-negative Staphylococci, Micrococcus, and Cutibacterium acnes (formerly Propionibacterium acnes) do not meet NHSN SSI criteria.",
    "pjiEvidence": "Review each PJI element against the NHSN PJI definition. PJI can be met through two matching positive periprosthetic specimens, a sinus tract communicating with the joint, purulence or other gross joint evidence, or the required combination of minor criteria.",
    "Two positive periprosthetic specimens with a matching organism": "Two positive periprosthetic tissue or fluid specimens with at least one matching organism are a qualifying PJI pathway.",
    "Sinus tract communicating with the joint": "A sinus tract that communicates with the joint is a qualifying PJI pathway.",
    "Purulence or other gross anatomic joint evidence": "Purulence or other gross anatomic evidence involving the joint is a qualifying PJI pathway.",
    "Elevated CRP and ESR": "Elevated C-reactive protein and erythrocyte sedimentation rate are PJI minor criteria; required thresholds and combinations are defined by NHSN.",
    "Elevated synovial WBC or leukocyte esterase": "Elevated synovial white blood cells or positive leukocyte esterase is a PJI minor criterion; use NHSN thresholds.",
    "Elevated synovial PMN percentage": "An elevated synovial polymorphonuclear-neutrophil percentage is a PJI minor criterion; use NHSN thresholds.",
    "Positive periprosthetic histology": "Positive histology of periprosthetic tissue is a PJI minor criterion.",
    "Single positive periprosthetic specimen": "A single positive periprosthetic specimen is a PJI minor criterion, not the two-matching-specimens pathway.",
    "Synovial alpha-defensin positive": "A positive synovial alpha-defensin test is a PJI minor criterion.",
    "Physician diagnosis of periprosthetic joint infection": "A physician diagnosis of PJI is a PJI minor criterion in the NHSN definition; it must be assessed with the required combination of criteria.",
    "symptom": "Select only findings documented for this event. A finding counts only when it is permitted by the selected SSI or site-specific criterion and all required accompanying elements are present.",
    "Fever greater than 38°C": "Fever greater than 38°C is an NHSN symptom element in the deep-incisional deliberate-opening or dehiscence pathway.",
    "New or worsening localized pain or tenderness": "New or worsening localized pain or tenderness is an NHSN symptom element in applicable superficial- or deep-incisional criteria.",
    "Localized swelling": "Localized swelling is an NHSN symptom element in the superficial-incisional deliberate-opening pathway.",
    "Erythema": "Erythema is an NHSN symptom element in the superficial-incisional deliberate-opening pathway.",
    "Heat": "Heat is an NHSN symptom element in the superficial-incisional deliberate-opening pathway.",
    "Drainage": "Drainage is a documented finding. For SSI classification, apply the relevant NHSN requirement for purulent drainage and the applicable anatomic level.",
    "Joint effusion": "An increased amount of fluid in a joint. Use it only as directed by the applicable NHSN PJI or BONE criteria.",
    "Limitation of motion": "Reduced joint movement. Use it only as directed by the applicable NHSN PJI or BONE criteria.",
    "Nausea": "Nausea is a documented clinical finding. It is not, by itself, a general NHSN SSI criterion.",
    "Vomiting": "Vomiting is a documented clinical finding. It is not, by itself, a general NHSN SSI criterion.",
    "Abdominal pain or tenderness": "Abdominal pain or tenderness is a documented clinical finding; its use depends on the applicable organ/space site-specific definition.",
    "Superficial incisional SSI": "Involves only skin and subcutaneous tissue of the incision and must meet the applicable 30-day NHSN criterion.",
    "Deep incisional SSI": "Involves deep soft tissues of the incision, such as fascial and muscle layers, and must meet the applicable 30- or 90-day NHSN criterion.",
    "Organ/Space SSI": "Involves anatomy deeper than fascia or muscle and requires both an organ/space SSI criterion and an eligible NHSN site-specific definition.",
    "GIT": "GIT is the NHSN gastrointestinal-tract organ/space site. Select it only when the infected anatomy is gastrointestinal tract and the complete GIT Chapter 17 definition is met.",
    "IAB": "IAB is the NHSN intraabdominal infection site used when no more specific eligible intraabdominal site applies. Select it only when the complete IAB Chapter 17 definition is met.",
    "OREP": "OREP is the NHSN other-reproductive-tract infection site. Select it only when the infected anatomy and the complete OREP Chapter 17 definition are met.",
    "PJI": "PJI is the NHSN periprosthetic-joint infection site. Select it only when the complete PJI definition is met; for HPRO/KPRO, report BONE instead if both BONE and PJI are met.",
    "BONE": "BONE is the NHSN osteomyelitis site. Select it only when the complete BONE definition is met; for HPRO/KPRO, it takes precedence when both BONE and PJI are met.",
    "Other eligible Chapter 17 site": "Select this only after identifying the exact eligible NHSN Chapter 17 site and confirming that its complete site-specific definition is met. Document the exact site before reporting."
  };

  const TOOLTIP_LABELS = {
    procedureDate: "index procedure date",
    eventDate: "possible SSI date of event",
    procedureCategory: "NHSN procedure category",
    cultureCollected: "culture or microbiologic test collection",
    organisms: "identified organism(s)",
    pjiEvidence: "PJI-specific findings",
    symptom: "sign or symptom"
  };

  function definitionFor(control) {
    return NHSN_DEFINITIONS[control.value] ||
      NHSN_DEFINITIONS[control.name] ||
      NHSN_DEFINITIONS[control.id] ||
      "Review this field using the applicable NHSN Patient Safety Component Manual definition and criterion.";
  }

  function definitionLabelFor(control) {
    return TOOLTIP_LABELS[control.id] ||
      TOOLTIP_LABELS[control.name] ||
      control.value || control.name || control.id;
  }

  function setupDefinitionTooltips() {
    const tooltip = $("#tooltip");

    if (!tooltip) return;

    function hideTooltip() {
      tooltip.classList.remove("visible");
    }

    $$("input, select, textarea").forEach(control => {
      if (control.type === "hidden" || control.closest(".purulence-option")) return;
      const container = control.closest(".check-card, .radio-card") ||
        document.querySelector(`label[for="${control.id}"]`) ||
        control.closest(".field-group, fieldset");

      if (!container || container.querySelector(":scope > .definition-trigger")) return;

      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "definition-trigger";
      trigger.setAttribute("aria-label", `Show NHSN definition for ${definitionLabelFor(control)}`);
      trigger.setAttribute("aria-describedby", "tooltip");
      trigger.textContent = "i";

      const showTooltip = event => {
        event.preventDefault();
        event.stopPropagation();
        const title = document.createElement("strong");
        title.textContent = `NHSN definition: ${definitionLabelFor(control)}`;
        const content = document.createElement("span");
        content.textContent = definitionFor(control);
        const source = document.createElement("small");
        source.textContent = "Based on the NHSN Patient Safety Component Manual; verify the current edition.";
        tooltip.replaceChildren(title, content, source);
        tooltip.classList.add("visible");
        const rect = trigger.getBoundingClientRect();
        tooltip.style.top = `${Math.min(window.innerHeight - 16, rect.bottom + 10)}px`;
        tooltip.style.left = `${Math.min(window.innerWidth - 16, Math.max(16, rect.left + rect.width / 2))}px`;
      };

      trigger.addEventListener("mouseenter", showTooltip);
      trigger.addEventListener("focus", showTooltip);
      trigger.addEventListener("click", showTooltip);
      trigger.addEventListener("mouseleave", hideTooltip);
      trigger.addEventListener("blur", hideTooltip);
      container.appendChild(trigger);
    });
  }

  setupProcedurePicker();
  setupDefinitionTooltips();
  setupTabs();
  updateConditionalFields();
  calculateSurveillance();
  updateProgress();
  updateCriteriaGuidance();
});
