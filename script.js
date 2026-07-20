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
    }

    const pageTitle =
      $("#pageTitle");

    const procedureSearch =
      $("#procedureSearch");

    const procedureSearchResults =
      $("#procedureSearchResults");

    if (pageTitle) {
      pageTitle.textContent =
        PROCEDURES[procedure].title;
    }

    if (procedureSearch) {
      procedureSearch.value =
        `${procedure} — ${PROCEDURES[procedure].name}`;
    }

    if (procedureSearchResults) {
      procedureSearchResults.classList.add(
        "hidden"
      );
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

    summary +=
      ` PATOS at the index procedure: ${patos}. ` +
      `Culture collected: ${culture}.`;

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

    $$(
      'input[type="text"], input[type="date"], textarea'
    ).forEach(input => {
      input.value = "";
    });

    const pageTitle =
      $("#pageTitle");

    const searchResults =
      $("#procedureSearchResults");

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

    searchResults?.classList.add(
      "hidden"
    );

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
      $("#pageTitle").textContent =
        "NHSN SSI Review Tool";
      $("#procedureSearch").value = "";
      $("#procedureSearchResults")?.classList.add("hidden");
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
          "Add purulent drainage, gross anatomic evidence, histopathologic evidence, imaging evidence, or a qualifying opening/dehiscence pathway."
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
          "Site-specific definition required",
          "Organ/Space SSI cannot be completed until an eligible site-specific definition is selected.",
          procedure === "COLO"
            ? [
                "Select GIT, IAB, or OREP after confirming the corresponding Chapter 17 definition."
              ]
            : isJointProcedure(procedure)
              ? [
                  "Select PJI or BONE after confirming the corresponding Chapter 17 definition."
                ]
              : [
                  "Confirm the exact eligible Chapter 17 site-specific definition, then select the documented review option."
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

      if (SITE_CRITERIA_PROMPTS[site]) {
        missing.push(
          SITE_CRITERIA_PROMPTS[site]
        );
      } else {
        missing.push(
          `Confirm that the full ${site} Chapter 17 site-specific definition is met.`
        );
      }

      setCriteriaAlert(
        "danger",
        "Organ/Space criteria still needed",
        `The selected ${site} site requires both an eligible Organ/Space SSI finding and its complete Chapter 17 site-specific pathway.`,
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

  function setupSearch() {
    const input =
      $("#procedureSearch");

    const results =
      $("#procedureSearchResults");

    if (
      !input ||
      !results
    ) {
      return;
    }

    function render(query = "") {
      const normalized =
        query
          .trim()
          .toLowerCase();

      if (!normalized) {
        results.classList.add(
          "hidden"
        );

        results.innerHTML = "";

        return;
      }

      const matches =
        Object.entries(PROCEDURES)
          .filter(
            ([code, item]) =>
              code
                .toLowerCase()
                .includes(normalized) ||
              item.name
                .toLowerCase()
                .includes(normalized)
          );

      results.innerHTML =
        matches.length
          ? matches
              .map(
                ([code, item]) => `
                  <button
                    class="search-result"
                    type="button"
                    data-procedure="${code}"
                  >
                    <span>
                      <strong>${code}</strong>
                      <small>${item.name}</small>
                    </span>
                    <span>Open</span>
                  </button>
                `
              )
              .join("")
          : `
              <div class="search-result">
                <span>No matching procedure</span>
              </div>
            `;

      results.classList.remove(
        "hidden"
      );
    }

    input.addEventListener(
      "input",
      event => {
        render(
          event.target.value
        );
      }
    );

    input.addEventListener(
      "focus",
      event => {
        if (
          event.target.value.trim()
        ) {
          render(
            event.target.value
          );
        }
      }
    );

    results.addEventListener(
      "click",
      event => {
        const button =
          event.target.closest(
            "[data-procedure]"
          );

        if (!button) {
          return;
        }

        setProcedure(
          button.dataset.procedure
        );

        $("#procedure")
          ?.scrollIntoView({
            behavior: "smooth"
          });
      }
    );

    document.addEventListener(
      "click",
      event => {
        if (
          !event.target.closest(
            ".procedure-search"
          )
        ) {
          results.classList.add(
            "hidden"
          );
        }
      }
    );
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
      updateCriteriaGuidance
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
    "procedureDate": "The date the NHSN operative procedure was performed. It is surveillance day 1.",
    "eventDate": "The date the first element used to meet an NHSN infection criterion occurs. It must fall within the procedure's applicable surveillance period.",
    "procedureCategory": "Choose the NHSN operative-procedure category that matches the index operation. Confirm the full category definition in the current NHSN Patient Safety Component Manual.",
    "patosKeyword": "PATOS means infection was documented as present at the time of the index procedure. It is determined from intraoperative evidence, not from postoperative findings.",
    "Abscess": "A localized collection of pus. In NHSN SSI criteria, an abscess may be evidence of infection when it involves the applicable anatomic level.",
    "Infection": "Use documentation that infection was present at the index procedure for PATOS. Apply the full NHSN criteria before final reporting.",
    "Phlegmon": "An inflammatory mass or diffuse inflammatory process. When documented at surgery, it may support PATOS review.",
    "Feculent peritonitis": "Feculent peritonitis documented in the narrative portion of the operative note is eligible evidence of infection for PATOS.",
    "Purulence or pus": "NHSN accepts the terms pus or purulence as documentation of purulence. Without those terms, both an accepted color and consistency descriptor are required.",
    "Ruptured or perforated appendix": "A ruptured or perforated appendix documented in the narrative portion of the operative note is eligible evidence of infection for PATOS.",
    "Osteomyelitis": "Infection involving bone. For HPRO/KPRO organ/space review, apply the NHSN BONE definition; when PJI and BONE are both met, report BONE.",
    "Sinus tract": "An abnormal channel from a deeper site to the skin or another surface. For PJI, it must communicate with the joint to meet that pathway.",
    "Purulent drainage": "Drainage documented as purulent from the applicable superficial or deep incision, or from a drain placed into the organ/space, as specified by the relevant NHSN criterion.",
    "Organism identified by culture or non-culture test": "Organism(s) identified from an aseptically obtained specimen from the applicable incision, tissue, fluid, or organ/space using an eligible microbiologic test performed for clinical diagnosis or treatment.",
    "Incision deliberately opened, re-accessed, or aspirated": "An applicable incision is deliberately opened, re-accessed, or aspirated by a surgeon, physician, or physician designee. Additional NHSN requirements, including treatment and symptoms where applicable, still apply.",
    "Spontaneous dehiscence": "Re-opening of a surgical incision that is not caused by an external factor such as direct trauma. In deep-incisional SSI criteria, other requirements also apply.",
    "Gross anatomic evidence of infection": "Evidence of infection observed during direct examination of the applicable tissue or organ/space, such as an abscess. Imaging alone is not gross anatomic evidence.",
    "Histopathologic evidence of infection": "Evidence of infection identified on histopathologic examination of the applicable tissue.",
    "Imaging evidence definitive or equivocal for infection": "Imaging that is definitive or equivocal for infection may support organ/space SSI review when the other NHSN requirements are met.",
    "Physician or physician designee diagnosis": "A diagnosis documented by a physician or physician designee. It is a qualifying pathway for superficial-incisional SSI, but is not by itself a general substitute for every NHSN SSI criterion.",
    "Antibiotic or antifungal therapy initiated or continued": "For the deliberate-opening/dehiscence pathways, therapy must be initiated or continued on or within two calendar days of the procedure and continue for at least two calendar days; verify the full criterion.",
    "cultureCollected": "Record whether a culture or eligible non-culture microbiologic test was collected. A result qualifies only when its specimen source and testing method meet the applicable NHSN criterion.",
    "organisms": "Enter organism(s) identified from the relevant specimen. NHSN qualification depends on the specimen source, collection method, and applicable criterion.",
    "pjiEvidence": "These are PJI review elements. NHSN PJI may be met through two matching positive periprosthetic specimens, a communicating sinus tract or gross joint evidence, or the required combination of minor criteria; verify the current definition.",
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
    "symptom": "Signs and symptoms are selected as documented clinical findings. Whether they qualify depends on the SSI site and the complete NHSN criterion.",
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
    "GIT": "GIT is the NHSN gastrointestinal tract organ/space infection site. Apply its full Chapter 17 site-specific definition.",
    "IAB": "IAB is the NHSN intraabdominal infection, not specified elsewhere, organ/space site. Apply its full Chapter 17 site-specific definition.",
    "OREP": "OREP is the NHSN other reproductive tract infection organ/space site. Apply its full Chapter 17 site-specific definition.",
    "PJI": "PJI is the NHSN periprosthetic joint infection organ/space site. Apply its full site-specific definition and report BONE if both PJI and BONE are met.",
    "BONE": "BONE is the NHSN osteomyelitis organ/space site. For HPRO/KPRO, report BONE when both BONE and PJI definitions are met.",
    "Other eligible Chapter 17 site": "Choose only after confirming an eligible NHSN Chapter 17 site-specific definition and documenting the exact site.",
    "procedureSearch": "Search the operative-procedure categories included in this review tool. Verify the selected category against the full NHSN procedure definition."
  };

  function definitionFor(control) {
    return NHSN_DEFINITIONS[control.value] ||
      NHSN_DEFINITIONS[control.name] ||
      NHSN_DEFINITIONS[control.id] ||
      "Review this field using the applicable NHSN Patient Safety Component Manual definition and criterion.";
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
      trigger.setAttribute("aria-label", `Show NHSN definition for ${control.value || control.name || control.id}`);
      trigger.setAttribute("aria-describedby", "tooltip");
      trigger.textContent = "i";

      const showTooltip = event => {
        event.preventDefault();
        event.stopPropagation();
        const title = document.createElement("strong");
        title.textContent = "NHSN definition";
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

  setupDefinitionTooltips();
  setupTabs();
  setupSearch();
  updateConditionalFields();
  calculateSurveillance();
  updateProgress();
  updateCriteriaGuidance();
});
