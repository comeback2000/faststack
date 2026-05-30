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
