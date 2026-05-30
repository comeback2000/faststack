document.querySelector("#year").textContent = new Date().getFullYear();

if (window.lucide) {
  window.lucide.createIcons();
} else {
  window.addEventListener("load", () => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  });
}

const whiteLabelRecipient = "ranjancom2000@gmail.com";

function getLicenseField(id) {
  return document.querySelector(`#${id}`)?.value.trim() || "";
}

function buildWhiteLabelMailto() {
  const details = {
    name: getLicenseField("licenseName"),
    company: getLicenseField("licenseCompany"),
    email: getLicenseField("licenseEmail"),
    website: getLicenseField("licenseWebsite"),
    requirements: getLicenseField("licenseRequirements"),
  };

  const subject = "FastStack White Label License Inquiry";
  const body = [
    "Hi Ranjan,",
    "",
    "I am interested in buying the FastStack White Label License for $100 USD.",
    "",
    "Customer Details:",
    `Name: ${details.name || "[Please enter name]"}`,
    `Company Name: ${details.company || "[Please enter company name]"}`,
    `Email Address: ${details.email || "[Please enter email address]"}`,
    `Website / Domain: ${details.website || "[Please enter website or domain]"}`,
    "",
    "Deployment Requirements:",
    details.requirements || "[Please describe deployment requirements, branding changes, Google Sheets setup, domain, and backup needs]",
    "",
    "Please send me the next steps for purchase, onboarding, and deployment.",
  ].join("\n");

  return `mailto:${whiteLabelRecipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

window.buildWhiteLabelMailto = buildWhiteLabelMailto;

document.querySelectorAll(".white-label-mail-link").forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    window.location.href = buildWhiteLabelMailto();
  });
});

document.querySelector("#whiteLabelForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  window.location.href = buildWhiteLabelMailto();
});
