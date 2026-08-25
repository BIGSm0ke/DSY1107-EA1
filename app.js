console.log("🚀 1. El script app.js ha empezado a cargar.");

// Configuración de tu entorno (Tus valores exactos)
const CONFIG = {
  domain: 'https://dsy1107-grupo777.auth.us-east-1.amazoncognito.com',
  clientId: '57hhl70565svsv0o25iavehd3f',                                
  redirectUri: 'http://localhost:5173/',
  apiUrl: 'https://4x3tfgbts8.execute-api.us-east-1.amazonaws.com/dev/datos'
};

// --- FUNCIONES CRIPTOGRÁFICAS PARA PKCE ---
function generateCodeVerifier() {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode.apply(null, new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}


// --- FLUJO PRINCIPAL (Espera a que el HTML cargue) ---
document.addEventListener('DOMContentLoaded', () => {
  console.log("✅ 2. El HTML cargó por completo. Buscando elementos de la interfaz...");

  // Referencias de la UI
  const loggedOutView = document.getElementById('logged-out-view');
  const loggedInView = document.getElementById('logged-in-view');
  const btnLogin = document.getElementById('btn-login');
  const btnLogout = document.getElementById('btn-logout');
  const btnFetchDatos = document.getElementById('btn-fetch-datos');
  const apiResult = document.getElementById('api-result');

  // Si no encuentra el botón de login, avisa de inmediato
  if (!btnLogin) {
    console.error("❌ ERROR: No se encontró 'btn-login' en el HTML.");
    return; 
  }

  // 1. Iniciar Sesión (Redirige a Cognito)
  btnLogin.addEventListener('click', async () => {
    console.log("👉 Generando PKCE y redirigiendo a Cognito...");
    const verifier = generateCodeVerifier();
    sessionStorage.setItem('code_verifier', verifier); // Guardar clave

    const challenge = await generateCodeChallenge(verifier);

    const loginUrl = `${CONFIG.domain}/login?response_type=code` +
      `&client_id=${CONFIG.clientId}` +
      `&redirect_uri=${encodeURIComponent(CONFIG.redirectUri)}` +
      `&scope=openid+email+profile` +
      `&code_challenge=${challenge}` +
      `&code_challenge_method=S256`;

    window.location.href = loginUrl;
  });

  // 2. Intercambiar Código (Se ejecuta al volver de Cognito)
  async function exchangeCodeForTokens(code) {
    console.log("🔄 4. Intercambiando el código de la URL por un Token...");
    const verifier = sessionStorage.getItem('code_verifier');

    if (!verifier) {
      console.error('❌ Error: No se encontró el code_verifier en sessionStorage. ¿Abriste una pestaña nueva?');
      return;
    }

    const bodyData = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CONFIG.clientId,
      code: code,
      redirect_uri: CONFIG.redirectUri,
      code_verifier: verifier
    });

    try {
      const response = await fetch(`${CONFIG.domain}/oauth2/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: bodyData.toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error HTTP ${response.status}: ${errorText}`);
        return;
      }

      const data = await response.json();
      console.log('✅ 5. Respuesta exitosa de Cognito:', data);

      if (data.id_token) {
        sessionStorage.setItem('id_token', data.id_token);
        sessionStorage.removeItem('code_verifier'); // Limpieza
        window.history.replaceState({}, document.title, window.location.pathname); // Quita el ?code de la URL
        renderUI();
      }
    } catch (error) {
      console.error('❌ Excepción de red / CORS:', error);
    }
  }

  // 3. Consultar la API Protegida
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
        headers: { 'Authorization': `Bearer ${idToken}` }
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

  // 4. Cerrar Sesión
  btnLogout.addEventListener('click', () => {
    sessionStorage.clear();
    const logoutUrl = `${CONFIG.domain}/logout?client_id=${CONFIG.clientId}&logout_uri=${encodeURIComponent(CONFIG.redirectUri)}`;
    window.location.href = logoutUrl;
  });

  // 5. Renderizar Vistas
  function renderUI() {
    const token = sessionStorage.getItem('id_token');
    if (token) {
      console.log("🔓 Estado: Usuario Conectado");
      loggedOutView.style.display = 'none';
      loggedInView.style.display = 'block';
    } else {
      console.log("🔒 Estado: Usuario Desconectado");
      loggedOutView.style.display = 'block';
      loggedInView.style.display = 'none';
    }
  }

  // 6. ¡Punto de arranque real!
  console.log("🔍 3. Revisando si hay un parámetro ?code= en la URL...");
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (code) {
    console.log("🎯 ¡Código detectado en la URL!: ", code);
    exchangeCodeForTokens(code);
  } else {
    renderUI();
  }
});