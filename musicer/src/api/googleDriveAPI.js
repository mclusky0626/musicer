// --- ⚙️ 설정 (제공해주신 값 유지) ---
const API_KEY = 'AIzaSyDDlmTxON0IFMlWLCj-yIAWRRIStRcj4-g';
const CLIENT_ID = '482572692694-drra2gkj0rvcen83kf15q8hj54crke1b.apps.googleusercontent.com';
const MUSIC_FOLDER_ID = '1XjqADom21Vsd6GL4n678n7_yapFxSiyC';
const PLAYLISTS_FOLDER_ID = '1xi5dUCB1Q14xrHI63XpvU7ojk098SLr2';

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiInited = false;
let gisInited = false;
let tokenClient;

/**
 * gapi와 GIS 클라이언트를 초기화하고, 자동 로그인을 시도합니다.
 * @param {function} updateAuthStatus - 로그인 상태를 업데이트할 콜백 함수
 * @param {function} initialLoadCallback - API 준비 후 초기 데이터 로드를 위한 콜백 함수
 */
export const initClient = (updateAuthStatus, initialLoadCallback) => {
  const gapiScript = document.createElement('script');
  gapiScript.src = 'https://apis.google.com/js/api.js';
  gapiScript.onload = () => window.gapi.load('client', initializeGapiClient);
  document.body.appendChild(gapiScript);

  const initializeGapiClient = async () => {
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    checkClientsReady(updateAuthStatus, initialLoadCallback);
  };

  const gisScript = document.createElement('script');
  gisScript.src = 'https://accounts.google.com/gsi/client';
  gisScript.onload = () => initializeGisClient();
  document.body.appendChild(gisScript);

  const initializeGisClient = () => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          window.gapi.client.setToken(tokenResponse);
          updateAuthStatus(true);
        } else {
          // 토큰 응답에 에러가 있을 경우 로그아웃 상태로 간주
          updateAuthStatus(false);
        }
      },
    });
    gisInited = true;
    checkClientsReady(updateAuthStatus, initialLoadCallback);
  };

  const checkClientsReady = (authCb, loadCb) => {
    if (gapiInited && gisInited) {
      // 자동으로 조용히 토큰 요청. 과거에 승인했다면 콜백을 통해 로그인됨
      tokenClient.requestAccessToken({ prompt: '' });
      // 초기 데이터 로드를 위한 콜백 실행
      loadCb();
    }
  }
};

/**
 * 사용자가 로그인(인증)했는지 확인합니다.
 */
export const isSignedIn = () => {
  const token = window.gapi.client.getToken();
  // 토큰 객체가 있고, access_token 속성이 있는지 확인
  return token && token.access_token;
};

/**
 * (사용자가 직접 클릭 시) 구글 로그인 및 권한 부여 팝업을 띄웁니다.
 */
export const handleAuthClick = () => {
  if (isSignedIn()) {
    tokenClient.requestAccessToken({ prompt: '' });
  } else {
    // 사용자가 계정을 선택하거나 다시 동의하도록 consent 팝업을 띄움
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }
};

/**
 * 로그아웃하고 토큰을 무효화합니다.
 */
export const handleSignoutClick = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
};

/**
 * 재생목록을 파일로 구글 드라이브에 저장합니다. (인증 필요)
 */
export const savePlaylist = async (fileName, playlistContent) => {
  if (!isSignedIn()) throw new Error('로그인이 필요합니다.');
  try {
    const fileMetadata = {
      name: `${fileName}.json`,
      parents: [PLAYLISTS_FOLDER_ID],
    };
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
    const contentType = 'application/json';
    const metadata = JSON.stringify(fileMetadata);
    const fileData = JSON.stringify(playlistContent, null, 2);
    const multipartRequestBody =
      delimiter + 'Content-Type: application/json; charset=UTF-8\r\n\r\n' + metadata +
      delimiter + 'Content-Type: ' + contentType + '\r\n\r\n' + fileData + close_delim;
    const response = await window.gapi.client.request({
      path: 'https://www.googleapis.com/upload/drive/v3/files',
      method: 'POST',
      params: { uploadType: 'multipart' },
      headers: { 'Content-Type': 'multipart/related; boundary=' + boundary },
      body: multipartRequestBody
    });
    console.log("✅ [중요] 구글 서버의 전체 응답:", response);
    return response.result;
  } catch (err) {
    console.error("파일 저장 오류:", err);
    throw err;
  }
};

/**
 * 기존 재생목록 파일의 내용을 수정(덮어쓰기)합니다.
 */
export const updatePlaylist = async (fileId, playlistContent) => {
  if (!isSignedIn()) throw new Error('로그인이 필요합니다.');
  try {
    const response = await window.gapi.client.request({
      path: `https://www.googleapis.com/upload/drive/v3/files/${fileId}`,
      method: 'PATCH',
      params: { uploadType: 'media' },
      body: JSON.stringify(playlistContent, null, 2),
    });
    console.log("✅ [중요] 파일 수정 응답:", response);
    return response.result;
  } catch (err) {
    console.error("파일 수정 오류:", err);
    throw err;
  }
};

/**
 * 재생목록 파일을 삭제합니다.
 */
export const deletePlaylist = async (fileId) => {
  if (!isSignedIn()) throw new Error('로그인이 필요합니다.');
  try {
    await window.gapi.client.drive.files.delete({ fileId: fileId });
    console.log(`✅ 파일(ID: ${fileId})이 성공적으로 삭제되었습니다.`);
  } catch (err) {
    console.error("파일 삭제 오류:", err);
    throw err;
  }
};

/**
 * 음악 폴더의 모든 노래 목록을 가져옵니다.
 */
export const fetchSongs = async () => {
  const response = await window.gapi.client.drive.files.list({
    q: `'${MUSIC_FOLDER_ID}' in parents and (mimeType='audio/mpeg' or mimeType='audio/mp3') and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 200,
  });
  return response.result.files;
};

/**
 * 저장된 재생목록 파일 목록을 가져옵니다.
 */
export const fetchPlaylists = async () => {
  const response = await window.gapi.client.drive.files.list({
    q: `'${PLAYLISTS_FOLDER_ID}' in parents and mimeType='application/json' and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 100,
  });
  return response.result.files;
};

/**
 * 특정 재생목록 파일의 내용을 가져옵니다. (수정된 버전)
 * @param {string} fileId - 가져올 파일의 ID
 */
export const fetchPlaylistContent = async (fileId) => {
  // ▼▼▼ 이 함수 전체를 교체해주세요 ▼▼▼
  if (!isSignedIn()) {
    // 로그인이 안 되어있다면 이전처럼 API 키로 시도 (로그아웃 상태에서 공유된 재생목록을 볼 경우 대비)
    console.log("로그아웃 상태. API 키로 fetch 시도.");
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`);
    if (!response.ok) {
      throw new Error('Failed to fetch playlist content with API Key');
    }
    return await response.json();
  } else {
    // 로그인이 되어있다면, 인증된 gapi 클라이언트로 안전하게 요청
    console.log("로그인 상태. gapi 클라이언트로 fetch 시도.");
    try {
      const response = await window.gapi.client.drive.files.get({
        fileId: fileId,
        alt: 'media'
      });
      // gapi.client.request의 응답 본문은 result 속성에 객체로 파싱되어 있습니다.
      return response.result;
    } catch (error) {
      console.error("GAPI client fetch failed:", error);
      throw new Error('Failed to fetch playlist content with GAPI client');
    }
  }
};
/**
 * 노래 파일의 실제 재생 URL을 반환합니다.
 */
export const getSongUrl = (fileId) => {
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
};