import { ethers } from "ethers";
// Hardhat이 컴파일한 스마트 컨트랙트의 ABI(설계도) 정보를 가져옵니다.
import DeviceAuthArtifact from "../artifacts/contracts/DeviceAuth.sol/DeviceAuth.json";

// 🚨 스마트 컨트랙트를 새로 배포했다면 주소가 바뀌었을 수 있습니다. 터미널의 새 주소와 동일한지 꼭 확인하세요!
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

let provider;
let signer;
let contract;

// HTML 요소 가져오기
const connectWalletBtn = document.getElementById("connectWalletBtn");
const walletAddressText = document.getElementById("walletAddress");

// [수정] 고정된 temp-001 대신 입력창에서 ID를 가져옵니다.
const deviceIdInput = document.getElementById("deviceIdInput");

const discoverBtn = document.getElementById("discoverBtn");
const registerBtn = document.getElementById("registerBtn");
const registerStatus = document.getElementById("registerStatus");

const authBtn = document.getElementById("authBtn");
const authResult = document.getElementById("authResult");

const deactivateBtn = document.getElementById("deactivateBtn");
const activateBtn = document.getElementById("activateBtn");
const manageStatus = document.getElementById("manageStatus");

// [추가] SPA 메뉴 전환 및 리스트용 요소
const navDashboard = document.querySelector('.sidebar-nav li:nth-child(1)');
const navDeviceList = document.querySelector('.sidebar-nav li:nth-child(2)');
const sectionDashboard = document.getElementById('dashboardSection');
const sectionDeviceList = document.getElementById('deviceListSection');
const deviceTableBody = document.getElementById('deviceTableBody');

// 1. 메타마스크 지갑 연결 (계정 변경 감지 포함)
async function connectWallet() {
  if (window.ethereum) {
    try {
      provider = new ethers.BrowserProvider(window.ethereum);
      
      // 메타마스크 팝업을 띄워 계정 연결 요청 (필수)
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      walletAddressText.innerText = `연결된 지갑: ${address}`;
      
      contract = new ethers.Contract(CONTRACT_ADDRESS, DeviceAuthArtifact.abi, signer);
      console.log("지갑 연결 및 컨트랙트 연동 완료!");

      // [추가] 메타마스크에서 계정을 바꾸거나 네트워크를 바꾸면 자동으로 새로고침
      window.ethereum.on("accountsChanged", () => window.location.reload());
      window.ethereum.on("chainChanged", () => window.location.reload());

    } catch (error) {
      console.error(error);
      alert("지갑 연결에 실패했습니다.");
    }
  } else {
    alert("메타마스크(MetaMask) 확장 프로그램이 설치되어 있지 않습니다.");
  }
}

connectWalletBtn.addEventListener("click", connectWallet);

// 2. 기기 발견 시뮬레이션
discoverBtn.addEventListener("click", () => {
  const currentDeviceId = deviceIdInput.value.trim();
  if (!currentDeviceId) return alert("기기 ID를 먼저 입력해주세요!");

  registerStatus.innerText = `기기(${currentDeviceId})가 감지되었습니다. 등록 대기 중...`;
  registerStatus.className = "status success";
  registerBtn.disabled = false;
});

// 3. 블록체인에 기기 등록
registerBtn.addEventListener("click", async () => {
  if (!contract) return alert("먼저 지갑을 연결해 주세요!");
  
  const currentDeviceId = deviceIdInput.value.trim();
  if (!currentDeviceId) return alert("기기 ID를 먼저 입력해주세요!");

  try {
    registerStatus.innerText = "블록체인에 등록 중... (메타마스크 창에서 승인해 주세요)";
    registerStatus.className = "status";
    
    const tx = await contract.registerDevice(currentDeviceId);
    await tx.wait();
    
    registerStatus.innerText = `기기(${currentDeviceId}) 등록 완료!`;
    registerStatus.className = "status success";
    registerBtn.disabled = true;
  } catch (error) {
    console.error(error);
    registerStatus.innerText = "등록 실패. 이미 등록된 기기이거나 오류가 발생했습니다.";
  }
});

// 4. 실시간 인증 상태 확인
authBtn.addEventListener("click", async () => {
  if (!contract) return alert("먼저 지갑을 연결해 주세요!");
  
  const currentDeviceId = deviceIdInput.value.trim();
  if (!currentDeviceId) return alert("기기 ID를 먼저 입력해주세요!");

  try {
    authResult.innerText = "인증 상태 확인 중...";
    authResult.className = "status";
    
    const isValid = await contract.authenticateDevice(currentDeviceId);
    
    if (isValid) {
      authResult.innerText = "통과 (인증된 정상 기기입니다)";
      authResult.className = "status success";
    } else {
      authResult.innerText = "차단 (미등록, 비활성화 또는 삭제된 기기입니다)";
      authResult.className = "status";
    }
  } catch (error) {
    console.error(error);
    authResult.innerText = "상태 조회에 실패했습니다.";
  }
});

// 5. 기기 상태 관리 (활성화/비활성화)
async function changeStatus(isActive) {
  if (!contract) return alert("먼저 지갑을 연결해 주세요!");
  
  const currentDeviceId = deviceIdInput.value.trim();
  if (!currentDeviceId) return alert("기기 ID를 먼저 입력해주세요!");

  try {
    const actionText = isActive ? "활성화(복구)" : "비활성화(차단)";
    manageStatus.innerText = `기기 ${actionText} 진행 중...`;
    manageStatus.className = "status";

    const tx = await contract.changeDeviceStatus(currentDeviceId, isActive);
    await tx.wait();

    manageStatus.innerText = `기기 ${actionText} 완료!`;
    manageStatus.className = "status success";
  } catch (error) {
    console.error(error);
    manageStatus.innerText = "상태 변경 실패. (기기 소유자가 아니거나 오류 발생)";
  }
}

deactivateBtn.addEventListener("click", () => changeStatus(false));
activateBtn.addEventListener("click", () => changeStatus(true));


// =========================================================
// [추가] 6. SPA 메뉴 전환 및 기기 리스트 관리 로직
// =========================================================

if (navDeviceList && navDashboard) {
  // 'Device List' 메뉴 클릭 시
  navDeviceList.addEventListener('click', () => {
      sectionDashboard.style.display = 'none';
      sectionDeviceList.style.display = 'block';
      navDashboard.classList.remove('active');
      navDeviceList.classList.add('active');
      
      loadDeviceList(); // 화면 전환 시 리스트 로드
  });

  // 'Dashboard' 메뉴 클릭 시
  navDashboard.addEventListener('click', () => {
      sectionDashboard.style.display = 'block';
      sectionDeviceList.style.display = 'none';
      navDashboard.classList.add('active');
      navDeviceList.classList.remove('active');
  });
}

// 블록체인에서 기기 리스트 불러오기
async function loadDeviceList() {
  if (!contract) return;
  try {
      const list = await contract.getAllDevices();
      deviceTableBody.innerHTML = ""; // 기존 목록 초기화

      for (let id of list) {
          const device = await contract.devices(id);
          
          // 삭제(숨김) 처리된 기기는 리스트에 그리지 않음!
          if (device.isDeleted) continue;

          const tr = document.createElement('tr');
          tr.innerHTML = `
              <td style="padding: 15px 0; font-weight: bold;">${id}</td>
              <td>${device.isActive ? "🟢 활성 (정상)" : "🔴 차단 (비활성)"}</td>
              <td>
                  <button onclick="handleDelete('${id}')" class="btn-danger" style="padding: 8px 12px; font-size: 14px;">삭제</button>
              </td>
          `;
          deviceTableBody.appendChild(tr);
      }
  } catch (error) {
      console.error("리스트 로드 실패:", error);
  }
}

// [중요] HTML의 onclick 속성에서 접근할 수 있도록 window 객체에 함수 등록
window.handleDelete = async function(id) {
  if (!contract) return alert("먼저 지갑을 연결해 주세요!");
  
  const isConfirm = confirm(`정말로 '${id}' 기기를 삭제하시겠습니까? (보안 이력은 남습니다)`);
  if (!isConfirm) return;

  try {
      const tx = await contract.deleteDevice(id);
      await tx.wait();
      alert(`${id} 기기가 목록에서 삭제되었습니다.`);
      
      loadDeviceList(); // 삭제 후 목록 다시 새로고침
  } catch (error) {
      console.error(error);
      alert("삭제 실패. (권한이 없거나 이미 삭제된 기기입니다)");
  }
};