/**
 * PolliForge — Client-Side Application Logic
 * Powered by Pollinations.ai (Flux + DeepSeek/OpenAI) with BYOP OAuth PKCE
 */

// State
const state = {
  appName: "PolliForge",
  appDesc: "Fast AI icon forge and brand generator for developers",
  selectedStyle: "ios-glass",
  selectedPalette: "amber-violet",
  selectedModel: "flux",
  customAddon: "",
  activeIconIndex: 0,
  isGenerating: false,
  apiKey: localStorage.getItem("polliforge_api_key") || "",
  accessToken: localStorage.getItem("polliforge_access_token") || "",
  appKey: "", // Discovered from /api/config or fallback
  generatedImages: [
    "https://image.pollinations.ai/prompt/app%20icon%20for%20PolliForge%2C%20glowing%20golden%20anvil%20and%20stylized%20flame%2C%20iOS%20glassmorphism%20squircle%2C%20isolated%20centered%2C%20high%20contrast%2C%20clean%20dark%20background%2C%20vector%20graphic%2C%20no%20text?width=512&height=512&nologo=true&seed=42",
    "https://image.pollinations.ai/prompt/app%20icon%20for%20PolliForge%2C%20minimalist%20geometric%20flaming%20hammer%20and%20sparks%2C%20purple%20and%20amber%20colors%2C%20iOS%20squircle%2C%20centered%2C%20clean%20dark%20background%2C%20no%20text?width=512&height=512&nologo=true&seed=108",
    "https://image.pollinations.ai/prompt/modern%20tech%20monogram%20icon%20for%20PolliForge%2C%20futuristic%20letter%20P%20and%20flame%20symbol%2C%20isometric%203D%20glass%2C%20clean%20dark%20background%2C%20no%20text?width=512&height=512&nologo=true&seed=333",
    "https://image.pollinations.ai/prompt/cyberpunk%20neon%20app%20icon%20for%20PolliForge%2C%20electric%20forge%20with%20violet%20and%20cyan%20plasma%2C%20sleek%20iOS%20squircle%2C%20centered%2C%20no%20text?width=512&height=512&nologo=true&seed=777"
  ]
};

// Style Presets with High-Performance Prompt Engineering
const stylePrompts = {
  "ios-glass": "modern iOS 3D glassmorphic squircle app icon, translucent frosted glass layers, soft ambient inner glow, volumetric lighting, tactile depth, centered glyph, clean dark gradient background, 8k resolution, app store featured design",
  "flat-vector": "minimalist vector app icon, flat design, modern geometric tech glyph, crisp bold silhouette, centered composition, clean solid background, Swiss graphic design style, SVG aesthetic",
  "cyberpunk-neon": "cyberpunk neon app icon, dark tech aesthetic, glowing illuminated circuits, vibrant magenta and cyan lasers, synthwave futuristic insignia, high contrast, centered",
  "retro-pixel": "16-bit retro pixel art app icon, crisp pixelated edges, vibrant arcade color palette, isometric video game emblem, centered, nostalgic clean background",
  "geometric-monogram": "luxury geometric tech monogram logo icon, interlocking architectural letters, modern corporate identity, precision symmetry, golden ratio composition, centered",
  "playful-clay": "playful 3D clay app icon, cute stylized mascot or object, soft tactile claymorphism texture, smooth rounded curves, cheerful lighting, centered"
};

const palettePrompts = {
  "amber-violet": "vibrant warm amber and deep violet color scheme, subtle golden highlights",
  "cyan-blue": "electric cyan, teal, and cobalt blue gradient color scheme",
  "emerald-dark": "emerald green and obsidian dark slate tech colors",
  "crimson-gold": "royal crimson ruby and burnished metallic gold colors",
  "pure-monochrome": "ultra clean monochrome black, metallic platinum and silver colors"
};

// Initialize Application
document.addEventListener("DOMContentLoaded", async () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Load server config (e.g. public Pollinations App Key pk_...)
  await loadServerConfig();

  // Handle OAuth PKCE Redirect Callback
  await handleOAuthCallback();

  // Check Pollen balance if user has token or key
  await refreshPollenBalance();

  // Setup DOM Event Listeners
  setupEventListeners();

  // Update initial mockups
  updateMockups();
});

// Load Server Configuration
async function loadServerConfig() {
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const data = await res.json();
      if (data.appKey) {
        state.appKey = data.appKey;
      }
    }
  } catch (err) {
    console.warn("Could not load /api/config, continuing in standalone mode", err);
  }
}

// Setup UI Event Listeners
function setupEventListeners() {
  // App Name & Desc live updates
  const inputName = document.getElementById("input-app-name");
  const inputDesc = document.getElementById("input-app-desc");

  inputName.addEventListener("input", (e) => {
    state.appName = e.target.value.trim() || "App";
    updateMockups();
  });

  inputDesc.addEventListener("input", (e) => {
    state.appDesc = e.target.value.trim();
    updateMockups();
  });

  // Style Card Selection
  const styleCards = document.querySelectorAll(".style-card");
  styleCards.forEach((card) => {
    card.addEventListener("click", () => {
      styleCards.forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      state.selectedStyle = card.getAttribute("data-style") || "ios-glass";
    });
  });

  // Color Palette Selection
  const paletteBtns = document.querySelectorAll(".palette-btn");
  paletteBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      paletteBtns.forEach((b) => b.classList.remove("active", "ring-2", "ring-amber-400"));
      btn.classList.add("active", "ring-2", "ring-amber-400");
      state.selectedPalette = btn.getAttribute("data-palette") || "amber-violet";
    });
  });

  // Advanced Toggle
  const btnAdvanced = document.getElementById("btn-toggle-advanced");
  const panelAdvanced = document.getElementById("advanced-settings-panel");
  const arrowAdvanced = document.getElementById("icon-advanced-arrow");

  btnAdvanced.addEventListener("click", () => {
    panelAdvanced.classList.toggle("hidden");
    arrowAdvanced.classList.toggle("rotate-180");
  });

  // Model selection
  const selectModel = document.getElementById("select-model");
  selectModel.addEventListener("change", (e) => {
    state.selectedModel = e.target.value;
  });

  // Custom Addon
  const inputCustom = document.getElementById("input-custom-addon");
  inputCustom.addEventListener("input", (e) => {
    state.customAddon = e.target.value.trim();
  });

  // Main Forge Button
  document.getElementById("btn-forge").addEventListener("click", generateIcons);

  // Icon Result Cards selection
  const resultCards = document.querySelectorAll(".icon-result-card");
  resultCards.forEach((card, idx) => {
    card.addEventListener("click", () => {
      resultCards.forEach((c) => c.classList.remove("active", "border-amber-400/80", "border-2"));
      card.classList.add("active", "border-amber-400/80", "border-2");
      state.activeIconIndex = idx;
      updateMockups();
    });
  });

  // Mockup Tabs
  const tabPhone = document.getElementById("tab-phone");
  const tabBrowser = document.getElementById("tab-browser");
  const tabStore = document.getElementById("tab-store");
  const viewPhone = document.getElementById("preview-phone-view");
  const viewBrowser = document.getElementById("preview-browser-view");
  const viewStore = document.getElementById("preview-store-view");

  const switchTab = (activeTab, activeView) => {
    [tabPhone, tabBrowser, tabStore].forEach((t) => {
      t.classList.remove("active", "bg-amber-500/20", "text-amber-300");
      t.classList.add("text-slate-400");
    });
    [viewPhone, viewBrowser, viewStore].forEach((v) => v.classList.add("hidden"));

    activeTab.classList.add("active", "bg-amber-500/20", "text-amber-300");
    activeTab.classList.remove("text-slate-400");
    activeView.classList.remove("hidden");
  };

  tabPhone.addEventListener("click", () => switchTab(tabPhone, viewPhone));
  tabBrowser.addEventListener("click", () => switchTab(tabBrowser, viewBrowser));
  tabStore.addEventListener("click", () => switchTab(tabStore, viewStore));

  // Downloads & Export
  document.getElementById("btn-download-png").addEventListener("click", () => downloadActiveIcon(512));
  document.getElementById("btn-download-hd").addEventListener("click", () => downloadActiveIcon(1024));
  document.getElementById("btn-export-zip").addEventListener("click", exportDevBundleZip);

  // BYOP Wallet Connection
  document.getElementById("btn-connect-wallet").addEventListener("click", startBYOPLogin);
  document.getElementById("btn-disconnect-wallet").addEventListener("click", disconnectWallet);

  // API Settings Modal
  const modal = document.getElementById("modal-api-settings");
  const inputCustomKey = document.getElementById("input-custom-key");
  document.getElementById("btn-open-api-modal").addEventListener("click", () => {
    inputCustomKey.value = state.apiKey;
    modal.classList.remove("hidden");
  });
  document.getElementById("btn-close-modal").addEventListener("click", () => {
    modal.classList.add("hidden");
  });
  document.getElementById("btn-save-key").addEventListener("click", () => {
    state.apiKey = inputCustomKey.value.trim();
    if (state.apiKey) {
      localStorage.setItem("polliforge_api_key", state.apiKey);
    } else {
      localStorage.removeItem("polliforge_api_key");
    }
    modal.classList.add("hidden");
    refreshPollenBalance();
  });
  document.getElementById("btn-clear-key").addEventListener("click", () => {
    inputCustomKey.value = "";
    state.apiKey = "";
    localStorage.removeItem("polliforge_api_key");
    modal.classList.add("hidden");
    refreshPollenBalance();
  });
}

// Update Mockups with Active Icon & Texts
function updateMockups() {
  const activeUrl = state.generatedImages[state.activeIconIndex] || state.generatedImages[0];

  document.getElementById("active-preview-icon").src = activeUrl;
  document.getElementById("browser-tab-favicon").src = activeUrl;
  document.getElementById("store-preview-icon").src = activeUrl;

  document.getElementById("preview-app-name").textContent = state.appName;
  document.getElementById("browser-tab-title").textContent = `${state.appName} — App`;
  document.getElementById("store-app-name").textContent = state.appName;
  document.getElementById("store-app-desc").textContent = state.appDesc || "Modern Mobile App";
}

// Primary Icon Generation Pipeline
async function generateIcons() {
  if (state.isGenerating) return;

  const btnForge = document.getElementById("btn-forge");
  const btnText = document.getElementById("btn-forge-text");
  const statusPill = document.getElementById("generation-status-pill");

  state.isGenerating = true;
  btnForge.disabled = true;
  btnForge.classList.add("opacity-75", "cursor-not-allowed");
  btnText.textContent = "Forging 4 Icons...";
  statusPill.textContent = "Synthesizing with Flux...";
  statusPill.classList.add("text-amber-400", "animate-pulse");

  // Construct High-Detail Prompt
  const stylePrompt = stylePrompts[state.selectedStyle] || stylePrompts["ios-glass"];
  const palettePrompt = palettePrompts[state.selectedPalette] || palettePrompts["amber-violet"];
  const customExtra = state.customAddon ? `, ${state.customAddon}` : "";

  const basePrompt = `app icon for "${state.appName}", ${state.appDesc}, ${stylePrompt}, ${palettePrompt}${customExtra}, isolated centered on clean dark background, high contrast, crisp edges, app store quality, vector aesthetics, no text, no letters, no watermark`;

  // 4 Distinct Random Seeds for Variation
  const seeds = Array.from({ length: 4 }, () => Math.floor(Math.random() * 9999999) + 1);

  // Active Key: Access token from BYOP or manual key
  const activeKey = state.apiKey || state.accessToken;

  // Build 4 URLs
  const newUrls = seeds.map((seed) => {
    let url = `https://image.pollinations.ai/prompt/${encodeURIComponent(basePrompt)}?width=512&height=512&seed=${seed}&model=${state.selectedModel}&nologo=true`;
    if (activeKey) {
      url += `&key=${encodeURIComponent(activeKey)}`;
    }
    return url;
  });

  // Set card loading skeletons
  const cards = document.querySelectorAll(".icon-result-card");
  cards.forEach((card) => {
    const img = card.querySelector("img");
    if (img) {
      img.classList.add("opacity-20");
    }
    card.classList.add("skeleton-loading");
  });

  // Pre-load all 4 images
  try {
    await Promise.all(
      newUrls.map((url, i) => {
        return new Promise((resolve) => {
          const testImg = new Image();
          testImg.crossOrigin = "anonymous";
          testImg.onload = () => {
            state.generatedImages[i] = url;
            const cardImg = cards[i]?.querySelector("img");
            if (cardImg) {
              cardImg.src = url;
              cardImg.classList.remove("opacity-20");
            }
            cards[i]?.classList.remove("skeleton-loading");
            resolve(true);
          };
          testImg.onerror = () => {
            // Fallback even if one fails
            state.generatedImages[i] = url;
            const cardImg = cards[i]?.querySelector("img");
            if (cardImg) {
              cardImg.src = url;
              cardImg.classList.remove("opacity-20");
            }
            cards[i]?.classList.remove("skeleton-loading");
            resolve(false);
          };
          testImg.src = url;
        });
      })
    );
  } finally {
    state.isGenerating = false;
    btnForge.disabled = false;
    btnForge.classList.remove("opacity-75", "cursor-not-allowed");
    btnText.textContent = "Forge 4 App Icons";
    statusPill.textContent = "Completed";
    statusPill.classList.remove("text-amber-400", "animate-pulse");

    updateMockups();
    refreshPollenBalance();
  }
}

// Download Active Selected Icon
async function downloadActiveIcon(resolution = 512) {
  const activeUrl = state.generatedImages[state.activeIconIndex];
  if (!activeUrl) return;

  // If retina requested, replace 512 with resolution
  const targetUrl = activeUrl.replace("width=512&height=512", `width=${resolution}&height=${resolution}`);
  const safeName = state.appName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "icon";

  try {
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxyUrl);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${safeName}-icon-${resolution}x${resolution}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    // Direct link fallback
    window.open(targetUrl, "_blank");
  }
}

// Export Full Developer Bundle (.ZIP)
async function exportDevBundleZip() {
  if (typeof JSZip === "undefined") {
    alert("JSZip library is still loading. Please try again in a moment.");
    return;
  }

  const btnZip = document.getElementById("btn-export-zip");
  const btnZipText = document.getElementById("btn-zip-text");
  const originalText = btnZipText.textContent;

  try {
    btnZip.disabled = true;
    btnZipText.textContent = "Packaging Bundle...";

    const activeUrl = state.generatedImages[state.activeIconIndex];
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(activeUrl.replace("width=512&height=512", "width=1024&height=1024"))}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Could not fetch source icon image");
    const sourceBlob = await response.blob();
    const sourceImg = await createImageBitmap(sourceBlob);

    const zip = new JSZip();
    const safeName = state.appName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "app";

    // Helper to draw resized PNG canvas blob
    const renderCanvasBlob = (size) => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(sourceImg, 0, 0, size, size);
      }
      return new Promise((res) => canvas.toBlob(res, "image/png"));
    };

    // Render 512, 192, 180 (apple touch), and 32 (favicon)
    const [blob512, blob192, blobApple, blobFavicon] = await Promise.all([
      renderCanvasBlob(512),
      renderCanvasBlob(192),
      renderCanvasBlob(180),
      renderCanvasBlob(32)
    ]);

    // Add files to ZIP
    zip.file("icon-512x512.png", blob512);
    zip.file("icon-192x192.png", blob192);
    zip.file("apple-touch-icon.png", blobApple);
    zip.file("favicon.png", blobFavicon);

    // Web App Manifest
    const manifest = {
      name: state.appName,
      short_name: state.appName,
      description: state.appDesc,
      start_url: "/",
      display: "standalone",
      background_color: "#090b11",
      theme_color: "#f59e0b",
      icons: [
        {
          src: "/icon-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "/icon-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ]
    };
    zip.file("site.webmanifest", JSON.stringify(manifest, null, 2));

    // README snippet
    const snippet = `<!-- PolliForge Icon Bundle for ${state.appName} -->
<link rel="icon" type="image/png" sizes="32x32" href="/favicon.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#f59e0b">
`;
    zip.file("HTML-HEAD-SNIPPET.html", snippet);

    // Generate ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const blobUrl = URL.createObjectURL(zipBlob);

    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${safeName}-icon-bundle.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

  } catch (err) {
    console.error("Bundle error:", err);
    alert("Could not build ZIP bundle. You can still download individual PNG icons directly.");
  } finally {
    btnZip.disabled = false;
    btnZipText.textContent = originalText;
  }
}

// ------------------------------------------------------------
// BYOP (Bring Your Own Pollen) OAuth 2.0 PKCE Implementation
// ------------------------------------------------------------

function base64UrlEncode(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256(plain) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function generateRandomString(length = 64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

// Start OAuth PKCE Flow
async function startBYOPLogin() {
  const verifier = generateRandomString(64);
  const challengeBuffer = await sha256(verifier);
  const challenge = base64UrlEncode(challengeBuffer);

  // Store verifier for callback
  localStorage.setItem("polliforge_pkce_verifier", verifier);

  const redirectUri = window.location.origin + window.location.pathname;
  const clientId = state.appKey || "pk_polliforge"; // Publishable App Key
  const stateVal = generateRandomString(16);

  const authUrl = new URL("https://enter.pollinations.ai/authorize");
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", "usage profile");
  authUrl.searchParams.set("code_challenge", challenge);
  authUrl.searchParams.set("code_challenge_method", "S256");
  authUrl.searchParams.set("state", stateVal);

  window.location.href = authUrl.toString();
}

// Handle OAuth PKCE Callback
async function handleOAuthCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get("code");
  if (!code) return;

  const verifier = localStorage.getItem("polliforge_pkce_verifier");
  const redirectUri = window.location.origin + window.location.pathname;

  try {
    const tokenRes = await fetch("/api/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
        client_id: state.appKey || "pk_polliforge",
        code_verifier: verifier || ""
      })
    });

    if (tokenRes.ok) {
      const data = await tokenRes.json();
      const token = data.access_token || data.key || data.apiKey;
      if (token) {
        state.accessToken = token;
        localStorage.setItem("polliforge_access_token", token);
      }
    }
  } catch (err) {
    console.error("Token exchange failed:", err);
  } finally {
    localStorage.removeItem("polliforge_pkce_verifier");
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

// Disconnect Wallet
function disconnectWallet() {
  state.accessToken = "";
  localStorage.removeItem("polliforge_access_token");
  const pill = document.getElementById("wallet-connected-pill");
  const btnConnect = document.getElementById("btn-connect-wallet");
  pill.classList.add("hidden");
  pill.classList.remove("flex");
  btnConnect.classList.remove("hidden");
}

// Refresh Pollen Balance
async function refreshPollenBalance() {
  const activeKey = state.apiKey || state.accessToken;
  const pill = document.getElementById("wallet-connected-pill");
  const btnConnect = document.getElementById("btn-connect-wallet");
  const balanceText = document.getElementById("wallet-balance-text");

  if (!activeKey) {
    pill.classList.add("hidden");
    pill.classList.remove("flex");
    btnConnect.classList.remove("hidden");
    return;
  }

  // Active key present -> Show connected state
  btnConnect.classList.add("hidden");
  pill.classList.remove("hidden");
  pill.classList.add("flex");

  try {
    const res = await fetch("https://gen.pollinations.ai/account/balance", {
      headers: {
        Authorization: `Bearer ${activeKey}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      const totalPollen = data.balance ?? data.pollen ?? data.total ?? "Active";
      balanceText.textContent = typeof totalPollen === "number" ? `${totalPollen.toFixed(1)} Pollen` : `${totalPollen}`;
    } else {
      balanceText.textContent = "Connected";
    }
  } catch {
    balanceText.textContent = "Connected";
  }
}
