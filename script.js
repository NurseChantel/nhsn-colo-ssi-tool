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

  function isJointProcedure(procedure) {
    return procedure === "HPRO" || procedure === "KPRO";
  }

  let latestCopyText = "";

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

  function calculateSurveillance() {
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
            : "Select this option only after confirming the exact Chapter 17 site-specific definition outside this tool.";
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

    const reviewSummary =
      $("#reviewSummary")?.value.trim() || "";

    const classification =
      determineResult();

    let summary =
      `${classification} is suggested for the ` +
      `${procedure}` +
      `${procedureName ? ` (${procedureName})` : ""} procedure.`;

    if (evidence.length) {
      summary +=
        ` Supporting evidence includes ` +
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
      ` PATOS: ${patos}. ` +
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

    if (reviewSummary) {
      summary +=
        ` Review notes: ${reviewSummary}`;
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

      const purulentDrainage =
        hasAnyEvidence([
          "Purulent drainage"
        ]);

      const microbiologySelected =
        hasAnyEvidence([
          "Organism identified by culture or non-culture test"
        ]);

      const organismDocumented =
        microbiologySelected &&
        cultureCollected === "Yes" &&
        Boolean(organisms);

      const anatomicEvidence =
        hasAnyEvidence([
          "Gross anatomic evidence of infection",
          "Histopathologic evidence of infection",
          "Imaging evidence definitive or equivocal for infection"
        ]);

      const generalOrganSpacePathway =
        purulentDrainage ||
        organismDocumented ||
        anatomicEvidence;

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
            "success",
            "Potential PJI pathway identified",
            "A major PJI pathway is selected. Verify timing, specimen requirements, anatomy, and exact NHSN wording."
          );

          return;
        }

        if (minorItems.length >= 3) {
          setCriteriaAlert(
            "success",
            "Potential PJI minor-criteria pathway identified",
            `${minorItems.length} qualifying minor findings are selected. Verify that each selected finding meets the exact NHSN requirement.`
          );

          return;
        }

        const stillNeeded =
          3 - minorItems.length;

        setCriteriaAlert(
          "danger",
          "PJI criteria not yet met",
          "The currently selected symptoms and findings are not enough to complete PJI.",
          minorItems.length
            ? [
                `${stillNeeded} additional qualifying PJI minor criterion/criteria are needed for the three-minor-criteria pathway.`
              ]
            : [
                "Select two matching positive periprosthetic specimens; a sinus tract, purulence, or gross joint finding; or at least three qualifying minor criteria."
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
            microbiologySelected &&
            !organismDocumented
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
       * COLO ORGAN/SPACE:
       * GIT, IAB, OREP
       */
      if (!generalOrganSpacePathway) {
        const missing = [];

        if (
          microbiologySelected &&
          !organismDocumented
        ) {
          missing.push(
            "Enter the organism and confirm the specimen is eligible for the selected site-specific definition."
          );
        } else {
          missing.push(
            "Add purulent drainage from an organ/space drain, eligible microbiology, or gross, histopathologic, or imaging evidence."
          );
        }

        missing.push(
          `Confirm that the full ${site} Chapter 17 site-specific definition is met.`
        );

        setCriteriaAlert(
          "danger",
          "Organ/Space criteria not yet supported",
          "The selected symptoms alone are not sufficient for Organ/Space SSI.",
          missing
        );

        return;
      }

      setCriteriaAlert(
        "warning",
        "General organ/space pathway identified",
        `A potential general Organ/Space SSI element is selected. The complete ${site} site-specific definition must also be met before reporting.`
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

  setupTabs();
  setupSearch();
  updateConditionalFields();
  calculateSurveillance();
  updateProgress();
  updateCriteriaGuidance();
});
