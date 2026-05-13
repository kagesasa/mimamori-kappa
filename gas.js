function doPost(e) {
  try {
    // 送信されたデータが空の場合はエラーを返す
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ error: "No data" })).setMimeType(ContentService.MimeType.JSON);
    }

    // JSONデータを解析する
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const timestamp = data.timestamp;
    const senderEmail = data.senderEmail || "未設定";
    const notificationEmail = data.notificationEmail;

    // 1. スプレッドシートに記録する
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    // ヘッダーがない場合は追加（1行目が空の場合）
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["日時", "アクション", "送信者", "通知先"]);
    }
    // データを追記
    const formattedDate = new Date(timestamp);
    sheet.appendRow([formattedDate, action, senderEmail, notificationEmail]);

    // 2. 通知メールを送信する (通知先メールアドレスが設定されている場合のみ)
    if (notificationEmail) {
      let subject = "";
      let body = "";

      if (action === 'checkin') {
        subject = "【見守りカッパ】元気だよ！の連絡が届きました";
        body = `${senderEmail} さんから「元気だよ！」の連絡がありました。\n\n送信日時: ${formattedDate.toLocaleString('ja-JP')}\n\n※このメールは見守りカッパアプリからの自動送信です。`;
      } else if (action === 'emergency') {
        subject = "【緊急!! 見守りカッパ】緊急ボタンが押されました！";
        body = `${senderEmail} さんが「緊急」ボタンを押しました！\nすぐに確認・連絡してください。\n\n送信日時: ${formattedDate.toLocaleString('ja-JP')}\n\n※このメールは見守りカッパアプリからの自動送信です。`;
      }

      // メール送信実行
      if (subject !== "") {
        MailApp.sendEmail({
          to: notificationEmail,
          subject: subject,
          body: body
        });
      }
    }

    // 成功レスポンスを返す（フロントエンドは no-cors なので受け取れませんが、作法として）
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // エラー時のレスポンス
    return ContentService.createTextOutput(JSON.stringify({ error: error.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
