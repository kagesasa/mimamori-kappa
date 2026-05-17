document.addEventListener('DOMContentLoaded', () => {
  const genkiBtn = document.getElementById('genki-btn');
  const emergencyBtn = document.getElementById('emergency-btn');
  const settingsBtn = document.getElementById('settings-btn');
  const settingsModal = document.getElementById('settings-modal');
  const closeSettingsBtn = document.getElementById('close-settings-btn');
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  
  // 本番用GASエンドポイントをハードコード
  const GAS_URL = 'https://script.google.com/macros/s/AKfycbxm4NYhQLaIswCCEsAuZqVDoRigkNSMp5mZUBgdCqwsL1oCK5kRfrq93bFo0NM1Af6t5Q/exec';

  const senderEmailInput = document.getElementById('sender-email');
  const notificationEmailInput = document.getElementById('notification-email');
  const emergencyTelInput = document.getElementById('emergency-tel');
  const statusMessage = document.getElementById('status-message');
  const kappaImg = document.getElementById('kappa-img');

  const tosModal = document.getElementById('tos-modal');
  const tosAgreeCheckbox = document.getElementById('tos-agree-checkbox');
  const tosStartBtn = document.getElementById('tos-start-btn');

  // Check TOS Agreement
  const tosAgreed = localStorage.getItem('mk_tos_agreed');
  if (!tosAgreed) {
    tosModal.classList.remove('hidden');
  }

  tosAgreeCheckbox.addEventListener('change', (e) => {
    tosStartBtn.disabled = !e.target.checked;
  });

  tosStartBtn.addEventListener('click', () => {
    localStorage.setItem('mk_tos_agreed', 'true');
    tosModal.classList.add('hidden');
  });

  // Load settings
  let senderEmail = localStorage.getItem('mk_sender_email') || '';
  let notificationEmail = localStorage.getItem('mk_notification_email') || '';
  let emergencyTel = localStorage.getItem('mk_emergency_tel') || '';
  
  senderEmailInput.value = senderEmail;
  notificationEmailInput.value = notificationEmail;
  emergencyTelInput.value = emergencyTel;

  // --- Functions ---
  function getFormattedDateTime() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${month}月${date}日${hours}時${minutes}分`;
  }

  // --- Functions ---

  function disableGenkiBtn(message) {
    genkiBtn.disabled = true;
    genkiBtn.textContent = '完了';
    statusMessage.textContent = message;
    // 古い関数（今回はテスト用に直接クリックイベントで処理するため、不要になれば削除可能）
  }

  // --- Event Listeners ---

  // Genki Button
  genkiBtn.addEventListener('click', async () => {
    // Optimistically disable
    genkiBtn.disabled = true;
    genkiBtn.textContent = '送信中...';
    statusMessage.textContent = "連絡を送信中...";
    kappaImg.classList.add('happy');
    
    try {
      if (GAS_URL) {
        console.log(`Sending POST request to ${GAS_URL}`);
        await fetch(GAS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            action: 'checkin', 
            timestamp: new Date().toISOString(),
            senderEmail: senderEmail,
            notificationEmail: notificationEmail
          })
        });
      } else {
        console.warn("GAS URL is not set in settings.");
      }

      // Success
      const timeStr = getFormattedDateTime();
      localStorage.setItem('mk_last_pressed_date', new Date().toLocaleDateString('ja-JP'));
      localStorage.setItem('mk_last_pressed_time_str', timeStr);
      statusMessage.textContent = `${timeStr}に送信しました。`;
      genkiBtn.textContent = '完了';
      
      // テスト用に3秒後にボタンを復活させる
      setTimeout(() => {
        kappaImg.classList.remove('happy');
        genkiBtn.disabled = false;
        genkiBtn.textContent = '元気だよ！';
        statusMessage.textContent = "今日も1日よろしくね！";
      }, 3000);

    } catch (error) {
      console.error("Error sending checkin:", error);
      statusMessage.textContent = "送信に失敗しました。後でもう一度押してください。";
      kappaImg.classList.remove('happy');
      genkiBtn.disabled = false;
      genkiBtn.textContent = '元気だよ！';
    }
  });

  // Emergency Button
  emergencyBtn.addEventListener('click', async () => {
    // 1. Send Emergency Signal to GAS
    if (GAS_URL) {
      console.log(`Sending EMERGENCY POST request to ${GAS_URL}`);
      try {
        await fetch(GAS_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            action: 'emergency', 
            timestamp: new Date().toISOString(),
            senderEmail: senderEmail,
            notificationEmail: notificationEmail
          })
        });
      } catch (error) {
        console.error("Error sending emergency signal:", error);
      }
    }

    // 2. Open Phone Dialer
    if (emergencyTel) {
      window.location.href = `tel:${emergencyTel}`;
    } else {
      alert("緊急連絡先が設定されていません。設定画面から電話番号を登録してください。");
    }
  });

  // Settings Modal
  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });

  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
  });

  saveSettingsBtn.addEventListener('click', () => {
    senderEmail = senderEmailInput.value.trim();
    notificationEmail = notificationEmailInput.value.trim();
    emergencyTel = emergencyTelInput.value.trim();
    
    localStorage.setItem('mk_sender_email', senderEmail);
    localStorage.setItem('mk_notification_email', notificationEmail);
    localStorage.setItem('mk_emergency_tel', emergencyTel);
    
    alert("設定を保存しました。");
    settingsModal.classList.add('hidden');
  });

  // Register Service Worker for PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(registration => {
          console.log('SW registered: ', registration);
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError);
        });
    });
  }
});
