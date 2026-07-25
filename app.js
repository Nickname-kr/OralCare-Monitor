(() => {
  "use strict";

  const screens = [...document.querySelectorAll(".screen")];
  const historyStack = ["intro"];
  const toast = document.getElementById("toast");

  function currentScreen() {
    return historyStack[historyStack.length - 1];
  }

  function showScreen(name, push = true) {
    const target = document.querySelector(`[data-screen="${name}"]`);
    if (!target) return;

    screens.forEach(screen => screen.classList.remove("screen--active"));
    target.classList.add("screen--active");

    if (push && currentScreen() !== name) {
      historyStack.push(name);
    }

    const scrollArea = target.querySelector(".screen-scroll");
    if (scrollArea) scrollArea.scrollTop = 0;
  }

  function goBack() {
    if (historyStack.length > 1) {
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
    notify.timer = setTimeout(() => toast.classList.remove("show"), 2200);
  }

  document.addEventListener("click", event => {
    const goButton = event.target.closest("[data-go]");
    if (goButton) {
      showScreen(goButton.dataset.go);
      return;
    }

    if (event.target.closest("[data-back]")) {
      goBack();
    }
  });

  // 부위 선택
  document.querySelectorAll(".region-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(".region-chip").forEach(item => item.classList.remove("selected"));
      chip.classList.add("selected");
      notify(`${chip.textContent.trim()} 부위를 선택했습니다.`);
    });
  });

  // 오버레이 투명도
  const overlayRange = document.getElementById("overlayRange");
  const overlay = document.getElementById("cameraOverlay");
  const overlayValue = document.getElementById("overlayValue");

  function updateOverlay(value) {
    const safe = Math.max(0, Math.min(100, Number(value)));
    overlayRange.value = safe;
    overlay.style.opacity = String(safe / 100);
    overlayValue.textContent = `${safe}%`;
  }

  overlayRange.addEventListener("input", event => updateOverlay(event.target.value));
  document.getElementById("overlayMinus").addEventListener("click", () => updateOverlay(Number(overlayRange.value) - 10));
  document.getElementById("overlayPlus").addEventListener("click", () => updateOverlay(Number(overlayRange.value) + 10));

  // 목업 촬영
  document.getElementById("mockShutter").addEventListener("click", () => {
    const cameraView = document.querySelector(".camera-view");
    cameraView.animate(
      [{ filter: "brightness(1)" }, { filter: "brightness(2.4)" }, { filter: "brightness(1)" }],
      { duration: 260, easing: "ease-out" }
    );
    setTimeout(() => showScreen("result"), 300);
  });

  // 증상 기록 저장
  document.getElementById("saveRecord").addEventListener("click", () => {
    showScreen("complete");
  });

  // 비교 슬라이더
  const compareRange = document.getElementById("compareRange");
  const compareWrap = document.getElementById("compareAfterWrap");
  const compareDivider = document.getElementById("compareDivider");

  function updateCompare(value) {
    compareWrap.style.width = `${value}%`;
    compareDivider.style.left = `${value}%`;
  }

  compareRange.addEventListener("input", event => updateCompare(event.target.value));

  // 비교 탭
  document.querySelectorAll(".compare-tabs button").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".compare-tabs button").forEach(item => item.classList.remove("active"));
      button.classList.add("active");
      notify(button.textContent.trim() === "나란히 보기"
        ? "2차 구현에서 나란히 보기 레이아웃을 연결합니다."
        : "겹쳐 보기 모드입니다.");
    });
  });

  // 목업 버튼
  document.getElementById("mockPdf").addEventListener("click", () => notify("2차 이후 실제 PDF 생성 기능을 연결할 예정입니다."));
  document.getElementById("mockShare").addEventListener("click", () => notify("현재는 화면을 직접 보여주는 시제품 모드입니다."));
  document.getElementById("resetPrototype").addEventListener("click", () => {
    historyStack.splice(0, historyStack.length, "intro");
    showScreen("intro", false);
    notify("처음 화면으로 돌아왔습니다.");
  });

  // 키보드 접근성: ESC 뒤로가기
  window.addEventListener("keydown", event => {
    if (event.key === "Escape") goBack();
  });

  updateOverlay(45);
  updateCompare(50);
})();
