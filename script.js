// script.js

// DOM Elements
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const imageCountSelect = document.querySelector(".image-count");
const aspectRatioSelect = document.querySelector(".aspect-ratio");
const generateBtn = document.querySelector(".generate-btn");
const imageGallery = document.querySelector(".image-gallery");
const themeToggle = document.querySelector(".theme-toggle");
const styleSelect = document.querySelector(".style-select");
const recentList = document.querySelector(".recent-list");
const modal = document.querySelector(".image-modal");
const modalImage = document.querySelector(".modal-image");
const downloadLink = document.querySelector(".download-modal");
const closeModal = document.querySelector(".close-btn");

const UNSPLASH_API_KEY = "ZHPlT6yasnGMjssMSeuZFBNXnvo0voWJiQXw-2gKrCg";

// Theme toggle functionality
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
  const themeIcon = themeToggle.querySelector("i");
  themeIcon.classList.toggle("fa-moon");
  themeIcon.classList.toggle("fa-sun");
});

// Form submission handler
promptForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const prompt = promptInput.value.trim();
  const style = styleSelect.value;
  const imageCount = parseInt(imageCountSelect.value) || 2;
  const aspectRatio = aspectRatioSelect.value;

  if (!prompt) return alert("Please enter a prompt description");

  // Save to recent searches
  updateRecentSearches(prompt);

  generateBtn.disabled = true;
  generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
  imageGallery.innerHTML = `<div class="loading-spinner"><i class="fa-solid fa-spinner"></i></div>`;

  try {
    const images = await fetchImagesFromUnsplash(`${prompt} ${style}`, imageCount, aspectRatio);
    displayImages(images, aspectRatio);
  } catch (err) {
    imageGallery.innerHTML = `<div class="gallery-message"><i class="fa-solid fa-triangle-exclamation"></i><p>Error generating images. Please try again.</p></div>`;
  } finally {
    generateBtn.disabled = false;
    generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Generate';
  }
});

async function fetchImagesFromUnsplash(query, count, aspectRatio) {
  let orientation = "squarish";
  if (aspectRatio === "16:9") orientation = "landscape";
  else if (aspectRatio === "9:16") orientation = "portrait";

  const apiUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${count}&orientation=${orientation}`;
  const response = await fetch(apiUrl, {
    headers: { Authorization: `Client-ID ${UNSPLASH_API_KEY}` },
  });

  if (!response.ok) throw new Error("Unsplash API error");

  const data = await response.json();
  return data.results;
}

function displayImages(images, aspectRatio) {
  if (!images.length) {
    imageGallery.innerHTML = `<div class="gallery-message"><i class="fa-solid fa-image-slash"></i><p>No images found. Try a different prompt.</p></div>`;
    return;
  }

  let ratio = "1/1";
  if (aspectRatio === "16:9") ratio = "16/9";
  if (aspectRatio === "9:16") ratio = "9/16";

  const html = images.map(image => `
    <div class="image-card" style="--aspect-ratio: ${ratio}">
      <img src="${image.urls.regular}" alt="${image.alt_description || 'Generated Image'}" />
      <input type="checkbox" class="image-select" data-url="${image.urls.full}" />
      <a href="${image.urls.full}" class="download-btn" download target="_blank">
        <i class="fa-solid fa-download"></i>
      </a>
    </div>
  `).join("");

  imageGallery.innerHTML = html;
}

function updateRecentSearches(prompt) {
  let history = JSON.parse(localStorage.getItem("recentSearches")) || [];
  history.unshift(prompt);
  history = [...new Set(history)].slice(0, 10);
  localStorage.setItem("recentSearches", JSON.stringify(history));
  renderRecentSearches(history);
}

function renderRecentSearches(list = JSON.parse(localStorage.getItem("recentSearches")) || []) {
  recentList.innerHTML = list.map(item => `<li class="recent-item">${item}</li>`).join("");
}

recentList.addEventListener("click", (e) => {
  if (e.target.classList.contains("recent-item")) {
    promptInput.value = e.target.textContent;
  }
});

let savedCollection = [];

imageGallery.addEventListener("change", (e) => {
  if (e.target.classList.contains("image-select")) {
    const url = e.target.dataset.url;
    if (e.target.checked) savedCollection.push(url);
    else savedCollection = savedCollection.filter(img => img !== url);
  }
});

document.querySelector(".save-collection-btn").addEventListener("click", () => {
  localStorage.setItem("savedCollection", JSON.stringify(savedCollection));
  alert("Collection saved!");
});

document.querySelector(".download-zip-btn").addEventListener("click", async () => {
  if (!savedCollection.length) return alert("No images selected.");

  const zip = new JSZip();
  const folder = zip.folder("images");

  for (let i = 0; i < savedCollection.length; i++) {
    const res = await fetch(savedCollection[i]);
    const blob = await res.blob();
    folder.file(`image-${i + 1}.jpg`, blob);
  }

  const content = await zip.generateAsync({ type: "blob" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(content);
  a.download = "collection.zip";
  a.click();
});

imageGallery.addEventListener("click", (e) => {
  if (e.target.tagName === "IMG") {
    const img = e.target;
    modal.classList.remove("hidden");
    modalImage.src = img.src;
    downloadLink.href = img.src;
  }
});

closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});


