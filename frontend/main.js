import { ethers } from "ethers";
// Hardhat이 컴파일한 스마트 컨트랙트의 ABI(설계도) 정보를 가져옵니다.
import DeviceAuthArtifact from "../artifacts/contracts/DeviceAuth.sol/DeviceAuth.json";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

let provider;
let signer;
let contract;

const deviceId = "temp-001"; // 기획서에 작성한 시뮬레이션용 기기 ID

// HTML 요소 가져오기
const connectWalletBtn = document.getElementById("connectWalletBtn");
const walletAddressText = document.getElementById("walletAddress");

const discoverBtn = document.getElementById("discoverBtn");
const registerBtn = document.getElementById("registerBtn");
const registerStatus = document.getElementById("registerStatus");

const authBtn = document.getElementById("authBtn");
const authResult = document.getElementById("authResult");

const deactivateBtn = document.getElementById("deactivateBtn");
const activateBtn = document.getElementById("activateBtn");
const manageStatus = document.getElementById("manageStatus");

// 1. 메타마스크 지갑 연결
connectWalletBtn.addEventListener("click", async () => {
  if (window.ethereum) {
    try {
      // Ethers.js v6 문법 적용
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      walletAddressText.innerText = `연결된 지갑: ${address}`;
      
      // 컨트랙트 객체 생성 (주소, ABI, 서명자)
      contract = new ethers.Contract(CONTRACT_ADDRESS, DeviceAuthArtifact.abi, signer);
      console.log("지갑 연결 및 컨트랙트 연동 완료!");
    } catch (error) {
      console.error(error);
      alert("지갑 연결에 실패했습니다.");
    }
  } else {
    alert("메타마스크(MetaMask) 확장 프로그램이 설치되어 있지 않습니다.");
  }
});

// 2. 기기 발견 시뮬레이션
discoverBtn.addEventListener("click", () => {
  registerStatus.innerText = `기기(${deviceId})가 감지되었습니다. 등록 대기 중...`;
  registerStatus.className = "status success";
  registerBtn.disabled = false; // 블록체인 등록 버튼 활성화
});

// 3. 블록체인에 기기 등록
registerBtn.addEventListener("click", async () => {
  if (!contract) return alert("먼저 지갑을 연결해 주세요!");
  try {
    registerStatus.innerText = "블록체인에 등록 중... (메타마스크 창에서 승인해 주세요)";
    registerStatus.className = "status";
    
    // 스마트 컨트랙트의 registerDevice 함수 호출
    const tx = await contract.registerDevice(deviceId);
    await tx.wait(); // 트랜잭션이 처리될 때까지 대기
    
    registerStatus.innerText = `기기(${deviceId}) 등록 완료!`;
    registerStatus.className = "status success";
    registerBtn.disabled = true; // 중복 클릭 방지
  } catch (error) {
    console.error(error);
    registerStatus.innerText = "등록 실패. 이미 등록된 기기이거나 오류가 발생했습니다.";
  }
});

// 4. 실시간 인증 상태 확인
authBtn.addEventListener("click", async () => {
  if (!contract) return alert("먼저 지갑을 연결해 주세요!");
  try {
    authResult.innerText = "인증 상태 확인 중...";
    authResult.className = "status";
    
    // 스마트 컨트랙트의 authenticateDevice 함수 호출 (가스비 발생 안 함)
    const isValid = await contract.authenticateDevice(deviceId);
    
    if (isValid) {
      authResult.innerText = "통과 (인증된 정상 기기입니다)";
      authResult.className = "status success";
    } else {
      authResult.innerText = "차단 (미등록 또는 비활성화된 기기입니다)";
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
  try {
    const actionText = isActive ? "활성화(복구)" : "비활성화(차단)";
    manageStatus.innerText = `기기 ${actionText} 진행 중...`;
    manageStatus.className = "status";

    const tx = await contract.changeDeviceStatus(deviceId, isActive);
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