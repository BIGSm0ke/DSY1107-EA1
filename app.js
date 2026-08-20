// Configuración que debe coincidir con tu Terraform
const CONFIG = {
  domain: 'https://dsy1107-grupo777.auth.us-east-1.amazoncognito.com', // Reemplaza si cambia tu región/dominio
  clientId: 'dhdqa9km1f5dcaf4med114d62',                                 
  redirectUri: 'http://localhost:5173/',
  apiUrl: 'https://a6h9dp2hid.execute-api.us-east-1.amazonaws.com/dev/datos'
};

// Referencias de la UI
const loggedOutView = document.getElementById('logged-out-view');
const loggedInView = document.getElementById('logged-in-view');
const btnLogin = document.getElementById('btn-login');
const btnLogout = document.getElementById('btn-logout');
const btnFetchDatos = document.getElementById('btn-fetch-datos');
const apiResult = document.getElementById('api-result');

// --- FUNCIONES CRIPTOGRÁFICAS PARA PKCE ---

// Genera una cadena aleatoria (Code Verifier)
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Genera el Hash SHA-256 (Code Challenge) a partir del Verifier
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// --- FLUJO DE AUTENTICACIÓN ---

// 1. Redirigir a Cognito con PKCE
btnLogin.addEventListener('click', async () => {
  const verifier = generateCodeVerifier();
  sessionStorage.setItem('code_verifier', verifier); // Guardar verifier para el intercambio posterior

  const challenge = await generateCodeChallenge(verifier);

  const loginUrl = `${CONFIG.domain}/login?response_type=code` +
    `&client_id=${CONFIG.clientId}` +
    `&redirect_uri=${encodeURIComponent(CONFIG.redirectUri)}` +
    `&scope=openid+email+profile` +
    `&code_challenge=${challenge}` +
    `&code_challenge_method=S256`;

  window.location.href = loginUrl;
});

// 2. Intercambiar el código por los tokens usando el Code Verifier
async function exchangeCodeForTokens(code) {
  const verifier = sessionStorage.getItem('code_verifier');

  if (!verifier) {
    console.error('No se encontró el code_verifier en sessionStorage');
    return;
  }

  // Usamos URLSearchParams para que el Content-Type sea application/x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('client_id', CONFIG.clientId);
  params.append('code', code);
  params.append('redirect_uri', CONFIG.redirectUri);
  params.append('code_verifier', verifier);

  try {
    const response = await fetch(`${CONFIG.domain}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await response.json();
    console.log('Respuesta de Cognito:', data); // Mira esto en la consola F12

    if (data.id_token) {
      sessionStorage.setItem('id_token', data.id_token);
      sessionStorage.removeItem('code_verifier');
      window.history.replaceState({}, document.title, window.location.pathname);
      renderUI();
    } else {
      alert(`Error de Cognito: ${data.error || 'Token no recibido'}`);
    }
  } catch (error) {
    console.error('Error de red al intercambiar el token:', error);
  }
}

// 3. Consultar la API Protegida /datos
btnFetchDatos.addEventListener('click', async () => {
  const idToken = sessionStorage.getItem('id_token');

  if (!idToken) {
    alert('No hay un token de sesión activo');
    return;
  }

  apiResult.textContent = 'Cargando datos...';

  try {
    const response = await fetch(CONFIG.apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${idToken}` // Token adjuntado en la cabecera
      }
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    apiResult.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    apiResult.textContent = `Error al consultar la API: ${error.message}`;
  }
});

// Logout
btnLogout.addEventListener('click', () => {
  sessionStorage.clear();
  const logoutUrl = `${CONFIG.domain}/logout?client_id=${CONFIG.clientId}&logout_uri=${encodeURIComponent(CONFIG.redirectUri)}`;
  window.location.href = logoutUrl;
});

// Renderizar UI
function renderUI() {
  const token = sessionStorage.getItem('id_token');
  if (token) {
    loggedOutView.style.display = 'none';
    loggedInView.style.display = 'block';
  } else {
    loggedOutView.style.display = 'block';
    loggedInView.style.display = 'none';
  }
}

// Inicialización al cargar la ventana
function init() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    exchangeCodeForTokens(code);
  } else {
    renderUI();
  }
}

init();