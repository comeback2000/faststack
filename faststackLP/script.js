const yearElement = document.querySelector("#year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

if (window.lucide) {
  refreshIcons();
} else {
  window.addEventListener("load", refreshIcons);
}

const form = document.querySelector("#whiteLabelForm");
const formMessage = document.querySelector("#licenseFormMessage");

function getLicenseField(id) {
  return document.querySelector(`#${id}`)?.value.trim() || "";
}

function showFormMessage(message, isError = false) {
  if (!formMessage) {
    return;
  }
  formMessage.textContent = message;
  formMessage.classList.toggle("error", isError);
  formMessage.classList.toggle("success", Boolean(message) && !isError);
}

function setFormBusy(isBusy) {
  const button = form?.querySelector("button[type='submit']");
  if (button) {
    button.disabled = isBusy;
    button.dataset.originalText ||= button.textContent.trim();
    button.lastChild.textContent = isBusy ? " Sending..." : ` ${button.dataset.originalText}`;
  }
}

function isBackendConfigured() {
  return Boolean(
    window.FASTSTACK_BACKEND
      && window.FASTSTACK_BACKEND.apiUrl
      && /^https:\/\/script\.google\.com\/macros\/s\//.test(window.FASTSTACK_BACKEND.apiUrl)
  );
}

function buildBackendUrl(callbackName, payload) {
  const url = new URL(window.FASTSTACK_BACKEND.apiUrl);
  url.searchParams.set("callback", callbackName);
  url.searchParams.set("payload", JSON.stringify(payload));
  return url.toString();
}

function sendContactInquiry(payload) {
  if (!isBackendConfigured()) {
    return Promise.reject(new Error("Backend API is not configured. Please add the Google Apps Script Web App URL in config.js."));
  }

  return new Promise((resolve, reject) => {
    const callbackName = `faststackContact_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error("Could not reach the FastStack backend. Please try again in a moment."));
    }, 30000);

    function cleanup() {
      window.clearTimeout(timeoutId);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = (result) => {
      cleanup();
      if (!result || !result.ok) {
        const backendError = result?.error || "Inquiry could not be sent.";
        if (/Invalid session token|Unsupported action/i.test(backendError)) {
          reject(new Error("Contact email service is not deployed yet. Please redeploy the latest Google Apps Script backend."));
          return;
        }
        reject(new Error(backendError));
        return;
      }
      resolve(result.data || {});
    };

    script.onerror = () => {
      cleanup();
      reject(new Error("Could not reach the FastStack backend. Check the Web App deployment and access settings."));
    };

    script.src = buildBackendUrl(callbackName, { action: "contactInquiry", ...payload });
    document.body.appendChild(script);
  });
}

function focusWhiteLabelForm() {
  const section = document.querySelector("#white-label");
  section?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => {
    document.querySelector("#licenseName")?.focus({ preventScroll: true });
  }, 450);
}

document.querySelectorAll(".white-label-mail-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    focusWhiteLabelForm();
  });
});

form?.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!form.reportValidity()) {
    return;
  }

  const payload = {
    name: getLicenseField("licenseName"),
    company: getLicenseField("licenseCompany"),
    email: getLicenseField("licenseEmail"),
    website: getLicenseField("licenseWebsite"),
    subject: getLicenseField("licenseSubject"),
    message: getLicenseField("licenseMessage"),
    sourceUrl: window.location.href,
    userAgent: navigator.userAgent,
  };

  try {
    showFormMessage("Sending your inquiry...");
    setFormBusy(true);
    await sendContactInquiry(payload);
    form.reset();
    document.querySelector("#licenseSubject").value = "White Label License Inquiry";
    showFormMessage("Your inquiry was sent successfully. We will contact you by email.", false);
  } catch (error) {
    showFormMessage(error.message || "Inquiry could not be sent. Please try again.", true);
  } finally {
    setFormBusy(false);
    refreshIcons();
  }
});
