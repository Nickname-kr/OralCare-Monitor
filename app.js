(() => {
  "use strict";

  const screens = [...document.querySelectorAll(".screen")];
  const historyStack = ["intro"];
  const toast = document.getElementById("toast");

  const state = {
    mainRegion: "",
    subsite: "",
    selectedRegion: "",
    stream: null,
    facingMode: "environment",
    baselineDataUrl: "",
    capturedDataUrl: ""
  };

  const regionOptions = {
    "입술": ["윗입술", "아랫입술"],
    "잇몸": ["위", "아래"],
    "입천장": ["앞쪽", "뒤쪽"],
    "볼": ["왼쪽", "오른쪽"],
    "혀": ["윗면", "아랫면", "왼쪽 옆면", "오른쪽 옆면"],
    "입바닥": ["왼쪽", "가운데", "오른쪽"],
    "어금니 뒤": ["왼쪽", "오른쪽"],
    "목 안쪽": ["왼쪽", "오른쪽"]
  };

  const guideCopy = {
    "볼": ["렌즈를 깨끗이 닦아주세요.", "입을 충분히 벌려주세요.", "볼을 바깥쪽으로 당겨 점막을 펴주세요.", "기준 사진의 치아 배열과 각도를 맞춰주세요."],
    "혀": ["렌즈를 깨끗이 닦아주세요.", "혀를 선택한 방향으로 충분히 움직여주세요.", "필요하면 깨끗한 거즈로 혀 끝을 잡아주세요.", "기준 사진과 같은 면이 화면 중앙에 오도록 맞춰주세요."],
    "입천장": ["렌즈를 깨끗이 닦아주세요.", "고개를 약간 뒤로 젖혀주세요.", "입을 크게 벌리고 혀를 아래로 내려주세요.", "입천장 전체가 보이도록 정면에서 촬영해주세요."],
    "입바닥": ["렌즈를 깨끗이 닦아주세요.", "혀끝을 입천장에 붙여주세요.", "입바닥이 접히지 않도록 입을 충분히 벌려주세요.", "기준 사진과 같은 방향으로 촬영해주세요."],
    "잇몸": ["렌즈를 깨끗이 닦아주세요.", "입술이나 볼을 충분히 당겨주세요.", "치아와 잇몸 경계가 함께 보이게 해주세요.", "기준 사진과 같은 치아가 화면에 들어오게 맞춰주세요."],
    "입술": ["렌즈를 깨끗이 닦아주세요.", "선택한 입술을 부드럽게 뒤집어주세요.", "점막이 접히지 않도록 펴주세요.", "기준 사진과 같은 범위가 보이도록 촬영해주세요."],
    "어금니 뒤": ["렌즈를 깨끗이 닦아주세요.", "입을 최대한 크게 벌려주세요.", "볼을 바깥쪽으로 당겨 어금니 뒤를 노출해주세요.", "가능하면 보호자의 도움을 받아 촬영해주세요."],
    "목 안쪽": ["렌즈를 깨끗이 닦아주세요.", "입을 크게 벌리고 '아' 소리를 내주세요.", "혀가 시야를 가리면 아래로 내려주세요.", "무리하게 깊숙이 기기를 넣지 마세요."]
  };

  const els = {
    subsiteTitle: document.getElementById("subsiteTitle"),
    subsiteOptions: document.getElementById("subsiteOptions"),
    summary: document.getElementById("selectedRegionSummary"),
    regionNext: document.getElementById("regionNextButton"),
    guideRegion: document.getElementById("guideRegionLabel"),
    guideList: document.getElementById("guideList"),
    cameraRegion: document.getElementById("cameraRegionLabel"),
    cameraStatus: document.getElementById("cameraStatus"),
    cameraVideo: document.getElementById("cameraVideo"),
    cameraPlaceholder: document.getElementById("cameraPlaceholder"),
    cameraCaption: document.getElementById("cameraCaption"),
    baselineInput: document.getElementById("baselineInput"),
    baselineOverlay: document.getElementById("baselineOverlayImage"),
    overlayEmpty: document.getElementById("overlayEmpty"),
    removeBaseline: document.getElementById("removeBaselineButton"),
    fallbackInput: document.getElementById("fallbackCaptureInput"),
    overlayRange: document.getElementById("overlayRange"),
    overlayValue: document.getElementById("overlayValue"),
    captureCanvas: document.getElementById("captureCanvas"),
    resultImage: document.getElementById("resultCapturedImage"),
    resultEmpty: document.getElementById("resultImageEmpty"),
    resultTag: document.getElementById("resultRegionTag"),
    qualityTitle: document.getElementById("qualityTitle"),
    qualityScore: document.getElementById("qualityScore"),
    qualityList: document.getElementById("qualityList")
  };

  function currentScreen() {
    return historyStack[historyStack.length - 1];
  }

  function showScreen(name, push = true) {
    const target = document.querySelector(`[data-screen="${name}"]`);
    if (!target) return;

    if (currentScreen() === "camera" && name !== "camera") stopCamera();
    screens.forEach(screen => screen.classList.remove("screen--active"));
    target.classList.add("screen--active");

    if (push && currentScreen() !== name) historyStack.push(name);
    const scrollArea = target.querySelector(".screen-scroll");
    if (scrollArea) scrollArea.scrollTop = 0;

    if (name === "camera") startCamera();
  }

  function goBack() {
    if (historyStack.length > 1) {
      if (currentScreen() === "camera") stopCamera();
      historyStack.pop();
      showScreen(currentScreen(), false);
    } else {
      showScreen("intro", false);
    }
  }

  function notify(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => toast.classList.remove("show"), 2400);
  }

  document.addEventListener("click", event => {
    const goButton = event.target.closest("[data-go]");
    if (goButton) {
      showScreen(goButton.dataset.go);
      return;
    }
    if (event.target.closest("[data-back]")) goBack();
  });

  function selectMainRegion(region) {
    state.mainRegion = region;
    state.subsite = "";
    state.selectedRegion = "";

    document.querySelectorAll(".main-region-chip").forEach(button => {
      button.classList.toggle("selected", button.dataset.region === region);
    });
    document.querySelectorAll(".anatomy-zone").forEach(zone => {
      zone.classList.toggle("selected", zone.dataset.region === region);
    });

    els.subsiteTitle.textContent = region === "혀" ? "혀의 어느 면을 촬영하나요?" : `${region}의 세부 위치를 선택하세요.`;
    els.subsiteOptions.innerHTML = "";
    regionOptions[region].forEach(option => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "subsite-option";
      button.textContent = option;
      button.addEventListener("click", () => selectSubsite(option));
      els.subsiteOptions.appendChild(button);
    });
    els.summary.textContent = `${region} · 세부 위치를 선택해주세요.`;
    els.regionNext.disabled = true;
    els.subsiteOptions.firstElementChild?.focus({ preventScroll: true });
  }

  function selectSubsite(subsite) {
    state.subsite = subsite;
    state.selectedRegion = `${state.mainRegion} · ${subsite}`;
    document.querySelectorAll(".subsite-option").forEach(button => {
      button.classList.toggle("selected", button.textContent === subsite);
    });
    els.summary.textContent = state.selectedRegion;
    els.regionNext.disabled = false;
    notify(`${state.selectedRegion}을 선택했습니다.`);
  }

  document.querySelectorAll(".main-region-chip, .anatomy-zone").forEach(element => {
    const activate = () => selectMainRegion(element.dataset.region);
    element.addEventListener("click", activate);
    element.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    });
  });

  els.regionNext.addEventListener("click", () => {
    if (!state.selectedRegion) return;
    updateSelectedRegionUI();
    showScreen("guide");
  });

  function updateSelectedRegionUI() {
    const label = state.selectedRegion || "촬영 부위 미선택";
    els.guideRegion.textContent = label;
    els.cameraRegion.textContent = label;
    els.resultTag.textContent = label;

    const steps = guideCopy[state.mainRegion] || guideCopy["볼"];
    els.guideList.innerHTML = steps.map((step, index) => `
      <article><span>${index + 1}</span><div><strong>${step}</strong><p>${index === 3 ? "반투명 기준 사진을 이용하면 각도 맞추기에 도움이 됩니다." : "안전하고 선명한 촬영을 위한 안내입니다."}</p></div></article>
    `).join("");
  }

  function updateOverlay(value) {
    const safe = Math.max(0, Math.min(100, Number(value)));
    els.overlayRange.value = String(safe);
    els.baselineOverlay.style.opacity = String(safe / 100);
    els.overlayValue.textContent = `${safe}%`;
  }

  els.overlayRange.addEventListener("input", event => updateOverlay(event.target.value));
  document.getElementById("overlayMinus").addEventListener("click", () => updateOverlay(Number(els.overlayRange.value) - 10));
  document.getElementById("overlayPlus").addEventListener("click", () => updateOverlay(Number(els.overlayRange.value) + 10));

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      showCameraError("이 브라우저는 실시간 카메라를 지원하지 않습니다.");
      return;
    }

    stopCamera();
    els.cameraStatus.textContent = "카메라 권한 요청 중";
    els.cameraPlaceholder.classList.remove("hidden");

    try {
      state.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: state.facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      els.cameraVideo.srcObject = state.stream;
      await els.cameraVideo.play();
      els.cameraPlaceholder.classList.add("hidden");
      els.cameraStatus.textContent = state.facingMode === "environment" ? "후면 카메라 연결됨" : "전면 카메라 연결됨";
      els.cameraCaption.textContent = "오버레이는 촬영 결과에 포함되지 않습니다.";
    } catch (error) {
      const message = error?.name === "NotAllowedError"
        ? "카메라 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요."
        : "카메라를 시작하지 못했습니다. 휴대폰 기본 카메라를 이용할 수 있습니다.";
      showCameraError(message);
    }
  }

  function stopCamera() {
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
      state.stream = null;
    }
    if (els.cameraVideo) els.cameraVideo.srcObject = null;
  }

  function showCameraError(message) {
    els.cameraStatus.textContent = "카메라 연결 필요";
    els.cameraPlaceholder.classList.remove("hidden");
    els.cameraPlaceholder.querySelector("strong").textContent = "카메라를 열지 못했습니다.";
    els.cameraPlaceholder.querySelector("p").textContent = message;
    els.cameraCaption.textContent = "GitHub Pages 주소(HTTPS)에서 다시 시도해주세요.";
  }

  document.getElementById("startCameraButton").addEventListener("click", startCamera);
  document.getElementById("switchCameraButton").addEventListener("click", async () => {
    state.facingMode = state.facingMode === "environment" ? "user" : "environment";
    await startCamera();
  });

  document.getElementById("baselineSelectButton").addEventListener("click", () => els.baselineInput.click());
  els.baselineInput.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;
    readImageFile(file, dataUrl => {
      state.baselineDataUrl = dataUrl;
      els.baselineOverlay.src = dataUrl;
      els.baselineOverlay.classList.add("visible");
      els.overlayEmpty.style.display = "none";
      els.removeBaseline.disabled = false;
      notify("기준 사진을 반투명 오버레이로 불러왔습니다.");
    });
    event.target.value = "";
  });

  els.removeBaseline.addEventListener("click", () => {
    state.baselineDataUrl = "";
    els.baselineOverlay.removeAttribute("src");
    els.baselineOverlay.classList.remove("visible");
    els.overlayEmpty.style.display = "flex";
    els.removeBaseline.disabled = true;
    notify("기준 사진을 해제했습니다.");
  });

  document.getElementById("fallbackCaptureButton").addEventListener("click", () => els.fallbackInput.click());
  els.fallbackInput.addEventListener("change", event => {
    const file = event.target.files?.[0];
    if (!file) return;
    readImageFile(file, dataUrl => setCapturedImage(dataUrl));
    event.target.value = "";
  });

  function readImageFile(file, callback) {
    if (!file.type.startsWith("image/")) {
      notify("이미지 파일을 선택해주세요.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result));
    reader.onerror = () => notify("이미지를 읽지 못했습니다.");
    reader.readAsDataURL(file);
  }

  document.getElementById("cameraShutter").addEventListener("click", () => {
    const video = els.cameraVideo;
    if (!state.stream || !video.videoWidth || !video.videoHeight) {
      notify("카메라가 준비되지 않았습니다. 기본 카메라 사용을 눌러주세요.");
      return;
    }

    const canvas = els.captureCanvas;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      notify("촬영 화면을 처리하지 못했습니다.");
      return;
    }

    if (state.facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const cameraView = document.getElementById("cameraView");
    cameraView.animate(
      [{ filter: "brightness(1)" }, { filter: "brightness(2.3)" }, { filter: "brightness(1)" }],
      { duration: 230, easing: "ease-out" }
    );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setTimeout(() => setCapturedImage(dataUrl, canvas), 240);
  });

  function setCapturedImage(dataUrl, sourceCanvas = null) {
    state.capturedDataUrl = dataUrl;
    els.resultImage.src = dataUrl;
    els.resultImage.classList.add("visible");
    els.resultEmpty.style.display = "none";
    updateSelectedRegionUI();
    showScreen("result");

    if (sourceCanvas) {
      evaluateBasicQuality(sourceCanvas);
    } else {
      const image = new Image();
      image.onload = () => {
        const canvas = els.captureCanvas;
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d", { alpha: false });
        context.drawImage(image, 0, 0);
        evaluateBasicQuality(canvas);
      };
      image.src = dataUrl;
    }
  }

  function evaluateBasicQuality(canvas) {
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const sampleWidth = Math.min(180, canvas.width);
    const sampleHeight = Math.max(1, Math.round(canvas.height * (sampleWidth / canvas.width)));
    const sample = document.createElement("canvas");
    sample.width = sampleWidth;
    sample.height = sampleHeight;
    const sampleContext = sample.getContext("2d", { willReadFrequently: true });
    sampleContext.drawImage(canvas, 0, 0, sampleWidth, sampleHeight);
    const pixels = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;

    let total = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      total += 0.2126 * pixels[i] + 0.7152 * pixels[i + 1] + 0.0722 * pixels[i + 2];
    }
    const brightness = total / (pixels.length / 4);
    const resolutionOk = canvas.width >= 720 && canvas.height >= 720;
    const brightnessOk = brightness >= 45 && brightness <= 220;
    const score = Number(resolutionOk) + Number(brightnessOk);

    els.qualityScore.textContent = `${score}/2`;
    els.qualityTitle.textContent = score === 2 ? "기본 촬영 조건이 확인되었습니다." : "재촬영이 필요한지 확인해주세요.";
    els.qualityList.innerHTML = `
      <li class="${resolutionOk ? "" : "warning"}"><span>${resolutionOk ? "✓" : "!"}</span>해상도: ${canvas.width} × ${canvas.height}px ${resolutionOk ? "(충분)" : "(낮을 수 있음)"}</li>
      <li class="${brightnessOk ? "" : "warning"}"><span>${brightnessOk ? "✓" : "!"}</span>평균 밝기: ${Math.round(brightness)} ${brightnessOk ? "(적정 범위)" : "(너무 어둡거나 밝을 수 있음)"}</li>
      <li><span>•</span>병소 포함 여부와 초점은 사용자가 직접 확인해주세요.</li>
    `;
  }

  document.getElementById("saveRecord").addEventListener("click", () => showScreen("complete"));

  const compareRange = document.getElementById("compareRange");
  const compareWrap = document.getElementById("compareAfterWrap");
  const compareDivider = document.getElementById("compareDivider");
  function updateCompare(value) {
    compareWrap.style.width = `${value}%`;
    compareDivider.style.left = `${value}%`;
  }
  compareRange.addEventListener("input", event => updateCompare(event.target.value));

  document.querySelectorAll(".compare-tabs button").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".compare-tabs button").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      notify(button.textContent.trim() === "나란히 보기" ? "다음 단계에서 실제 촬영 사진과 연결합니다." : "겹쳐 보기 모드입니다.");
    });
  });

  document.getElementById("mockPdf").addEventListener("click", () => notify("3차 이후 실제 PDF 생성 기능을 연결할 예정입니다."));
  document.getElementById("mockShare").addEventListener("click", () => notify("현재는 화면을 직접 보여주는 시제품 모드입니다."));
  document.getElementById("resetPrototype").addEventListener("click", () => {
    stopCamera();
    historyStack.splice(0, historyStack.length, "intro");
    showScreen("intro", false);
    notify("처음 화면으로 돌아왔습니다.");
  });

  window.addEventListener("keydown", event => {
    if (event.key === "Escape") goBack();
  });
  window.addEventListener("pagehide", stopCamera);

  updateOverlay(45);
  updateCompare(50);
})();
