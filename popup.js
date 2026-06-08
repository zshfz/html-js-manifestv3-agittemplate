const MSGS = {
  office:
    "오피스 라이선스 지급 드렸습니다. <a href='https://www.office.com/' target='_blank'>https://www.office.com/</a> 에서 오피스 다운로드 후 본인계정@kakaomobility.com 계정으로 로그인 하신뒤 OKTA 인증 후 사용 바랍니다.",
  hangul:
    "구글드라이브 재공유 드렸습니다. pkg 파일 설치 후 폴더에 있는 시리얼 넘버 입력하시고 사용하시면 됩니다.",
  retireFooter:
    "@jay.jjj\ncc @beom.bb @kate.j2\n금일 퇴근 전 출입 권한 회수 부탁드립니다:)",
  surveyHtml: `<blockquote><div class="marked__paragraph">PC 교체자의 경우, 반납한 PC를 크루분들이 자택에서 개인용도로 사용 할 목적으로 구입을 원하는 경우에 한하여 판매하고있습니다.<br>단가 확인 후 구매 의사가 있으실경우 <strong>1주일 이내로</strong> 설문지 작성 부탁 드립니다.</div><div class="marked__paragraph marked__paragraph--empty"><br></div><div class="marked__paragraph">- 구매 설문지 작성 : <a href="https://docs.google.com/forms/d/1U_Cswe_6g9nEei0KwCbYqHbRn55Dfk4UW-Avpe8bPxA/edit" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">바로가기</a></div><div class="marked__paragraph">- 판매 단가표 : <a href="https://docs.google.com/spreadsheets/d/1TdcPoPu6qa4Xp4akkwJ27ATd-DaK8EndiK5OBOjflwc/edit?gid=0#gid=0" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">바로가기</a></div><div class="marked__paragraph">&nbsp;&nbsp;&nbsp;<strong>ㄴ반납 예정에 적혀있는 PC의 모델명을 확인 후 단가표를 확인해주세요.</strong></div></blockquote>`,
  laptopReturnNotice: `<blockquote><div class="marked__paragraph"><strong>*노트북 반납 시 확인사항</strong></div><div class="marked__paragraph">- 데이터 구글 드라이브에 백업</div><div class="marked__paragraph">- 시스템 환경설정 -> APPLE ID -> i Cloud -> 나의 맥 찾기 해제 -> APPLE ID 로그아웃 진행</div><div class="marked__paragraph">- icloud.com/find 접속 -> 로그인 -> 모든기기 -> 기기 선택 -> <strong>이 기기 제거 (꼭 눌러주세요!)</strong></div><div class="marked__paragraph">- 반납 시 초기화 진행을 위해 비밀번호를 입력 해 주셔야하는 점 참고 바랍니다.</div><div class="marked__paragraph"><strong>- 데이터 백업(구글 드라이브)</strong></div><div class="marked__paragraph"><a href="https://support.google.com/drive/answer/12178485?hl=ko" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">https://support.google.com/drive/answer/12178485?hl=ko</a></div></blockquote>`,
};

document.addEventListener("DOMContentLoaded", () => {
  const inputs = document.querySelectorAll("input, textarea, select");
  inputs.forEach((el) =>
    el.addEventListener("input", () => {
      syncLogic(el.id);
      generateText();
    }),
  );

  document.getElementById("uncheckBtn").addEventListener("click", () => {
    document
      .querySelectorAll('input[name="cc"]')
      .forEach((cb) => (cb.checked = false));
    generateText();
  });

  document.getElementById("copyBtn").addEventListener("click", copyToClipboard);
  document.getElementById("resetBtn").addEventListener("click", resetAll);

  // 북마크릿 버튼 이벤트
  document
    .getElementById("scrapeBothBtn")
    .addEventListener("click", (e) => runScraper("both", e.target));
  document
    .getElementById("scrapeCodeBtn")
    .addEventListener("click", (e) => runScraper("codeOnly", e.target));

  generateText();
});

// 초기화 함수 (alert 없음)
function resetAll() {
  document.getElementById("targetId").value = "";
  document.getElementById("middleMsg").value = "";
  document.getElementById("giveInfo").value = "";
  document.getElementById("returnInfo").value = "";
  document.getElementById("rentInfo").value = "";
  document.getElementById("receiverId").value = "";
  document.getElementById("swInfo").value = "";

  document.getElementById("giveStatus").value = "지급완료";
  document.getElementById("returnStatus").value = "반납완료";
  document.getElementById("rentStatus").value = "대여완료";

  const defaultCC = ["@dino.mater", "@click.me", "@jay.jjj", "@roy.00"];
  document.querySelectorAll('input[name="cc"]').forEach((cb) => {
    cb.checked = defaultCC.includes(cb.value);
  });

  const toggles = [
    "useLaptopGivePlan",
    "useLaptopGiveDone",
    "useSurvey",
    "useOffice",
    "useHangul",
    "useSW",
    "useLeave",
    "useRetireO",
    "useRetireX",
  ];
  toggles.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.checked = false;
  });

  syncLogic();
  generateText();
}

function showButtonFeedback(btn, text, isError = false) {
  const originalText = btn.innerText;
  const originalColor = btn.className;
  btn.innerText = text;
  if (isError) {
    btn.classList.add("bg-red-500", "text-white");
    btn.classList.remove("bg-white", "bg-gray-800", "text-yellow-800");
  } else {
    btn.classList.add("bg-green-500", "text-white");
    btn.classList.remove("bg-white", "bg-gray-800", "text-yellow-800");
  }
  setTimeout(() => {
    btn.innerText = originalText;
    btn.className = originalColor;
  }, 1500);
}

async function runScraper(mode, btnElement) {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (
    !tab ||
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("edge://")
  ) {
    showButtonFeedback(btnElement, "❌ 일반 웹페이지가 아닙니다", true);
    return;
  }
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      func: (scrapeMode) => {
        let rows = document.querySelectorAll("table tbody tr");
        let result = "";
        rows.forEach((row) => {
          let checkbox = row.querySelector('input[type="checkbox"]');
          if (checkbox && checkbox.checked) {
            let cells = row.querySelectorAll("td");
            if (cells.length > 5) {
              let name = cells[4].innerText.trim();
              let code = cells[5].innerText.trim();
              if (scrapeMode === "both" && name && code)
                result += `${name} / ${code}\n`;
              if (scrapeMode === "codeOnly" && code) result += `${code}\n`;
            }
          }
        });
        return result.trim();
      },
      args: [mode],
    },
    async (injectionResults) => {
      if (
        chrome.runtime.lastError ||
        !injectionResults ||
        !injectionResults[0]
      ) {
        console.warn("Script injection failed: ", chrome.runtime.lastError);
        showButtonFeedback(btnElement, "❌ 스크립트 실행 불가", true);
        return;
      }
      const text = injectionResults[0].result;
      if (text) {
        await navigator.clipboard.writeText(text);
        showButtonFeedback(btnElement, "✅ 복사 완료");
      } else {
        showButtonFeedback(btnElement, "❌ 체크된 자산 없음", true);
      }
    },
  );
}

function syncLogic(changedId) {
  const plan = document.getElementById("useLaptopGivePlan");
  const done = document.getElementById("useLaptopGiveDone");
  const survey = document.getElementById("useSurvey");

  if (changedId === "useLaptopGivePlan" && plan.checked) {
    done.checked = false;
    survey.checked = false;
  }
  if (changedId === "useLaptopGiveDone" && done.checked) {
    plan.checked = false;
    survey.checked = false;
  }
  if (changedId === "useSurvey" && survey.checked) {
    plan.checked = false;
    done.checked = false;
  }

  document
    .getElementById("retireOInput")
    .classList.toggle("hidden", !document.getElementById("useRetireO").checked);
  document
    .getElementById("swInput")
    .classList.toggle("hidden", !document.getElementById("useSW").checked);
}

function escapeHtml(text) {
  return text.replace(
    /[&<>"']/g,
    (match) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[match],
  );
}
function makeP(content) {
  return !content || content.trim() === ""
    ? `<div class="marked__paragraph marked__paragraph--empty"><br></div>`
    : `<div class="marked__paragraph">${content}</div>`;
}
function pushMultiLine(targetArray, text) {
  if (text)
    text
      .split("\n")
      .forEach((line) => targetArray.push(makeP(escapeHtml(line))));
}

// 꼬리표 붙이는 로직 (지급, 반납, 대여 모두 대응)
function appendDeviceSuffixes(text, status) {
  if (!text) return text;

  let laptopSuffix = "";
  let phoneSuffix = ""; // 휴대폰용 접미사 추가

  // 지급이나 대여인 경우
  if (status.includes("지급") || status.includes("대여")) {
    laptopSuffix = " (충전기 포함, MAC등록 완료)";
    phoneSuffix = " (MAC등록 완료)";
  } else if (status.includes("예정")) {
    // 반납예정
    laptopSuffix = " (충전기 포함, MAC삭제 예정)";
    phoneSuffix = " (MAC삭제 예정)";
  } else {
    // 반납완료 계열 (반납완료, 매각대기, 폐기 등)
    laptopSuffix = " (충전기 포함, MAC삭제 완료)";
    phoneSuffix = " (MAC삭제 완료)";
  }

  return text
    .split("\n")
    .map((line) => {
      let pLine = line.trim();
      if (pLine.includes("노트북") && !pLine.includes("충전기 포함"))
        pLine += laptopSuffix;
      if (pLine.includes("모니터") && !pLine.includes("전원선 포함"))
        pLine += " (전원선 포함, 연결선 포함)";
      // 휴대폰 로직 추가 (이미 MAC 글자가 있으면 중복 추가 방지)
      if (pLine.includes("휴대폰") && !pLine.includes("MAC"))
        pLine += phoneSuffix;
      return pLine;
    })
    .join("\n");
}

function generateText() {
  const targetId = document.getElementById("targetId").value.trim();
  const targetMention = targetId ? `@${targetId}` : "[아이디]";
  const selectedCC = Array.from(
    document.querySelectorAll('input[name="cc"]:checked'),
  )
    .map((cb) => cb.value)
    .join(" ");
  const ccPart = selectedCC ? `cc ${selectedCC}` : "";

  const returnDateStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
  })();

  let htmlLines = [];
  htmlLines.push(makeP(`${targetMention} ${ccPart}`.trim()));
  pushMultiLine(htmlLines, document.getElementById("middleMsg").value);

  // 오피스/한글 메시지
  if (document.getElementById("useOffice").checked)
    htmlLines.push(makeP(MSGS.office));
  if (document.getElementById("useHangul").checked)
    htmlLines.push(makeP(MSGS.hangul));

  const giveInfo = appendDeviceSuffixes(
    document.getElementById("giveInfo").value,
    document.getElementById("giveStatus").value,
  );
  const returnInfo = appendDeviceSuffixes(
    document.getElementById("returnInfo").value,
    document.getElementById("returnStatus").value,
  );
  const rentInfo = appendDeviceSuffixes(
    document.getElementById("rentInfo").value,
    document.getElementById("rentStatus").value,
  );

  const planChecked = document.getElementById("useLaptopGivePlan").checked;
  const doneChecked = document.getElementById("useLaptopGiveDone").checked;
  const surveyChecked = document.getElementById("useSurvey").checked;

  if (planChecked || doneChecked || surveyChecked) {
    htmlLines.push(makeP(""));
    if (planChecked) {
      htmlLines.push(
        makeP(
          `8층 서비스 데스크에서 수령해주시고 기존 노트북은 신규 노트북 수령 후 백업하여 2주 이내 반납 바랍니다:)`,
        ),
      );
      htmlLines.push(
        makeP(`초기 불량시 교체를 위해 신품 박스는 1개월간 보관 부탁드립니다!`),
      );
      htmlLines.push(makeP(""));
      htmlLines.push(makeP(`[지급예정]`));
      pushMultiLine(htmlLines, giveInfo || "지급 자산 정보 입력");
      htmlLines.push(makeP(""));
      htmlLines.push(makeP(`[반납예정] - 수령 후 2주 이내 반납`));
      pushMultiLine(htmlLines, returnInfo || "반납 자산 정보 입력");
      htmlLines.push(MSGS.laptopReturnNotice);
    } else if (doneChecked) {
      htmlLines.push(
        makeP(
          `기존 노트북은 신규 노트북 수령 후 백업하여 <strong>${returnDateStr} 이내 반납</strong> 바랍니다:)`,
        ),
      );
      htmlLines.push(
        makeP(`초기 불량시 교체를 위해 신품 박스는 1개월간 보관 부탁드립니다!`),
      );
      htmlLines.push(makeP(""));
      htmlLines.push(makeP(`[지급완료]`));
      pushMultiLine(htmlLines, giveInfo || "지급 자산 정보 입력");
      htmlLines.push(makeP(""));
      htmlLines.push(
        makeP(`[반납예정] - <strong>${returnDateStr} 이내 반납</strong>`),
      );
      pushMultiLine(htmlLines, returnInfo || "반납 자산 정보 입력");
      htmlLines.push(MSGS.laptopReturnNotice);
    } else if (surveyChecked) {
      htmlLines.push(
        makeP(`[반납예정] - <strong>${returnDateStr} 이내 반납</strong>`),
      );
      pushMultiLine(htmlLines, returnInfo || "반납 자산 정보 입력");
      htmlLines.push(MSGS.surveyHtml);
    }
  } else {
    if (giveInfo) {
      htmlLines.push(makeP(`[${document.getElementById("giveStatus").value}]`));
      pushMultiLine(htmlLines, giveInfo);
    }
    if (returnInfo) {
      htmlLines.push(
        makeP(`[${document.getElementById("returnStatus").value}]`),
      );
      pushMultiLine(htmlLines, returnInfo);
    }
  }

  // 대여 정보 렌더링 (지급/반납 내용과 별개로 하단에 출력)
  if (rentInfo) {
    if (giveInfo || returnInfo || planChecked || doneChecked || surveyChecked)
      htmlLines.push(makeP(""));

    // 대여기간 텍스트 추가
    htmlLines.push(makeP(`대여기간 : `));

    htmlLines.push(makeP(`[${document.getElementById("rentStatus").value}]`));
    pushMultiLine(htmlLines, rentInfo);
  }

  const retireO = document.getElementById("useRetireO").checked;
  const retireX = document.getElementById("useRetireX").checked;
  const leave = document.getElementById("useLeave").checked;
  const useSW = document.getElementById("useSW").checked;

  if (retireO || retireX || leave) {
    htmlLines.push(makeP(""));
    htmlLines.push(makeP(`반납이유 : ${leave ? "휴직" : "퇴사"}`));
    htmlLines.push(makeP(`신청자 : ${targetMention}`));
  }

  if (useSW || retireO || retireX || leave) {
    htmlLines.push(makeP(""));
    htmlLines.push(makeP(`@dino.mater @click.me`));

    if (useSW) {
      htmlLines.push(
        makeP(
          `[소프트웨어] - 회수 부탁드립니다. (자산관리 시스템 상 반납 완료)`,
        ),
      );
      let swInfoRaw = document.getElementById("swInfo").value.trim();
      if (swInfoRaw) pushMultiLine(htmlLines, swInfoRaw);
      htmlLines.push(makeP(""));
    }

    htmlLines.push(makeP(`SLACK 비활성화 부탁드립니다.`));

    if (retireO) {
      htmlLines.push(
        makeP(
          `WorkSpace 이관 필요 ${targetMention} -&gt; @${escapeHtml(document.getElementById("receiverId").value || "이관대상")}`,
        ),
      );
    } else if (retireX || useSW) {
      htmlLines.push(makeP(`WorkSpace 이관 필요 없음, 계정 삭제 완료`));
    } else if (leave) {
      htmlLines.push(makeP(`구글 계정 일시정지 완료`));
    }

    htmlLines.push(
      makeP(`${targetMention} &lt;- 계정으로 등록되어 있는 MAC 전부 삭제 완료`),
    );
    htmlLines.push(makeP(""));
    pushMultiLine(htmlLines, MSGS.retireFooter);
  }

  const agitWrapperStart = `<div class="wall-message__body"><div class="agit__message"><div class="marked react-afm">`;
  const agitWrapperEnd = `</div></div></div>`;
  document.getElementById("resultArea").innerHTML =
    agitWrapperStart + htmlLines.join("") + agitWrapperEnd;
}

async function copyToClipboard(e) {
  const area = document.getElementById("resultArea");
  const btn = e.target;
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([area.innerHTML], { type: "text/html" }),
        "text/plain": new Blob([area.innerText], { type: "text/plain" }),
      }),
    ]);
    showButtonFeedback(btn, "✅ 복사 완료되었습니다!");
  } catch (err) {
    showButtonFeedback(btn, "❌ 복사 실패", true);
  }
}
