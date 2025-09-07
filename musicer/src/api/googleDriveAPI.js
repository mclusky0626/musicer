// --- ⚙️ 설정 (이곳을 실제 값으로 정확하게 입력해야 합니다) ---
const API_KEY = 'AIzaSyDDlmTxON0IFMlWLCj-yIAWRRIStRcj4-g'; // Google Cloud에서 발급받은 API 키
const CLIENT_ID = '482572692694-drra2gkj0rvcen83kf15q8hj54crke1b.apps.googleusercontent.com'; // Google Cloud에서 발급받은 OAuth 2.0 클라이언트 ID
const MUSIC_FOLDER_ID = '1XjqADom21Vsd6GL4n678n7_yapFxSiyC'; // 음악 파일이 있는 폴더의 ID
const PLAYLISTS_FOLDER_ID = '1xi5dUCB1Q14xrHI63XpvU7ojk098SLr2'; // 재생목록을 저장할 폴더의 ID

const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file'; // 앱이 생성한 파일을 관리할 수 있는 권한

let gapiInited = false;
let gisInited = false;
let tokenClient;

/**
 * gapi 클라이언트와 GIS 클라이언트를 초기화합니다.
 * 두 클라이언트가 모두 준비되면 콜백 함수를 실행합니다.
 * @param {function} callback - 초기화 완료 후 실행될 함수
 */
export const initClient = (callback) => {
  // gapi 스크립트 로드
  const script = document.createElement('script');
  script.src = 'https://apis.google.com/js/api.js';
  script.onload = () => gapiLoaded();
  document.body.appendChild(script);

  const gapiLoaded = () => {
    window.gapi.load('client', initializeGapiClient);
  };

  const initializeGapiClient = async () => {
    await window.gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    checkClientsReady(callback);
  };

  // Google Identity Services (GIS) 스크립트 로드
  const gisScript = document.createElement('script');
  gisScript.src = 'https://accounts.google.com/gsi/client';
  gisScript.onload = () => initializeGisClient();
  document.body.appendChild(gisScript);
  
  const initializeGisClient = () => {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // API 호출 시 동적으로 설정
    });
    gisInited = true;
    checkClientsReady(callback);
  };

  // gapi와 GIS가 모두 준비되었는지 확인
  const checkClientsReady = (cb) => {
    if (gapiInited && gisInited) {
      cb();
    }
  }
};

/**
 * 사용자가 로그인(인증)했는지 확인합니다.
 * @returns {boolean}
 */
export const isSignedIn = () => {
  return window.gapi.client.getToken() !== null;
};

/**
 * 구글 로그인 및 권한 부여 팝업을 띄웁니다.
 */
export const handleAuthClick = () => {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    // 성공적으로 토큰을 받으면 gapi 클라이언트에 설정
    window.gapi.client.setToken({ access_token: resp.access_token });
  };

  if (window.gapi.client.getToken() === null) {
    // 토큰이 없으면 동의 팝업을 띄워 요청
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    // 토큰이 만료되었을 수 있으므로 팝업 없이 재요청
    tokenClient.requestAccessToken({ prompt: '' });
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
 * @param {string} fileName - 저장할 파일의 이름
 * @param {object} playlistContent - 저장할 재생목록 데이터 (배열)
 */
export const savePlaylist = async (fileName, playlistContent) => {
  if (!isSignedIn()) {
    throw new Error('로그인이 필요합니다.');
  }
  try {
    const fileMetadata = {
      name: `${fileName}.json`,
      parents: [PLAYLISTS_FOLDER_ID], // 이 폴더 ID에 파일을 생성
    };

    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";

    const contentType = 'application/json';
    const metadata = JSON.stringify(fileMetadata);
    const fileData = JSON.stringify(playlistContent, null, 2);

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
        metadata +
        delimiter +
        'Content-Type: ' + contentType + '\r\n\r\n' +
        fileData +
        close_delim;

    const response = await window.gapi.client.request({
      path: 'https://www.googleapis.com/upload/drive/v3/files',
      method: 'POST',
      params: { uploadType: 'multipart' },
      headers: {
        'Content-Type': 'multipart/related; boundary=' + boundary
      },
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
 * 특정 재생목록 파일의 내용을 가져옵니다.
 * @param {string} fileId - 가져올 파일의 ID
 */
export const fetchPlaylistContent = async (fileId) => {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`);
  if (!response.ok) {
    throw new Error('Failed to fetch playlist content');
  }
  return await response.json();
};

/**
 * 노래 파일의 실제 재생 URL을 반환합니다.
 * @param {string} fileId - 노래 파일의 ID
 */
export const getSongUrl = (fileId) => {
  return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&key=${API_KEY}`;
};