// <maplat-ui> の文言。旧 UI は i18next と assets/locales/<lang>/translation.json を HTTP で読んでいた。
// <maplat-ui> は i18next を使わず（依存の規則。spec/element-deps.spec.ts）、旧 UI の言語ファイル
// （de・en・es・fr・id・ja・ko・th・vi・zh・zh-TW の 11 言語）を言語ごとに動的 import して読む。
// 使う言語のファイルだけが読まれ、バンドルも言語ごとのチャンクに分かれる。
//
// キーの合成（旧 UI の i18next の fallbackLng: ["en"] と同じ考え方）。重ねる順は
//   内蔵の辞書 → 旧 UI の言語ファイル → 層 B の上書き（OVERRIDES）
// で、後から重ねたものが正になる。
//   - 旧 UI の言語ファイルにあるキーは、そちらの訳を使う（内蔵の辞書と食い違う場合も言語ファイルが正）。
//   - ただし <maplat-ui> で画面の作りが旧 UI と違うために意味が変わった文言（地図の切り替えは上の中央の
//     地図名のボタンで開くメニュー、枠線の内側のクリックでの切り替えは無い 等）は、層 B の上書き（OVERRIDES）
//     が言語ファイルより後に重なって正になる（旧 UI の言語ファイルは旧 UI が使うので変えない）。
//   - 内蔵の辞書（STRINGS）にあって言語ファイルに無いキー（<maplat-ui> で新しく足した文言）は、
//     ja・en は内蔵のまま、ほかの言語は OVERRIDES の訳（無ければ en の内蔵の辞書）に落とす。
//   - 言語ファイルにしか無いキー（control.zoom・app.acquiring_gps_desc 等、今の画面では使わないもの）も
//     引けるようにする（旧 UI と同じキーの集合）。
//   - 無い言語（読み込みに失敗した場合を含む）は en に落ちる。zh-hk・zh-hant は zh-TW に寄せる。
//
// import は @maplat/core/common の型だけ（<maplat-ui> の依存の規則。spec/element-deps.spec.ts）。
import type { Localized } from "@maplat/core/common";

type Dict = Record<string, string>;

const STRINGS: Record<string, Dict> = {
  ja: {
    "control.zoom_in": "拡大",
    "control.zoom_out": "縮小",
    "control.home": "ホーム位置復帰",
    "control.compass": "回転解除",
    "control.compass_north": "北を上にする",
    "control.gps": "GPS位置取得",
    "control.trans": "地図透明度変更",
    "control.map_menu": "地図の切り替え",
    "menu.base_maps": "背景地図",
    "menu.overlay_maps": "古地図・重ね地図",
    "menu.poi_candidates": "スポットを選ぶ",
    "control.marker_list": "マーカー一覧表示",
    "html.marker_list_title": "マーカー一覧表示",
    "html.close": "閉じる",
    "control.share": "共有",
    "html.share_title": "共有",
    "html.share_app_title": "このアプリを共有",
    "html.share_state_title": "現在の表示場所を共有",
    "html.share_copy": "コピー",
    "html.share_qr": "QR コード",
    "app.copy_toast": "クリップボードにコピーされました",
    // 範囲外・GPS のエラー（旧 assets/locales/ja/translation.json の app.* と同じ文言）
    "app.out_of_map": "地図範囲外",
    "app.out_of_map_area": "表示位置が地図範囲外です。地図標準位置に戻します。",
    "app.gps_error": "位置情報を使用できません",
    "app.user_gps_deny":
      "現在位置を表示するには、webブラウザの「位置情報の使用」を許可にして、QRコードかURLをもう一度読み込んでください。",
    "app.gps_miss":
      "システムは位置取得に失敗しました。GPS衛星の電波を受けやすい場所などで再度お試しください。",
    "app.gps_timeout":
      "位置取得処理がタイムアウトしました。GPS衛星の電波を受けやすい場所などで再度お試しください。",
    "control.border": "地図境界表示",
    "control.hide_marker": "マーカー非表示",
    "control.info": "地図情報表示",
    "html.author": "製作者",
    "html.createdAt": "作成時期",
    "html.era": "対象時期",
    "html.contributor": "所蔵者等",
    "html.mapper": "マッパー",
    "html.license": "地図画像ライセンス",
    "html.dataLicense": "データライセンス",
    "html.attr": "地図画像帰属",
    "html.dataAttr": "データ帰属",
    "html.reference": "典拠",
    "html.description": "説明",
    "html.cache_handle": "地図キャッシュサイズ",
    "html.cache_fetch": "一括ダウンロード",
    "html.cache_delete": "キャッシュ削除",
    "html.cache_cancel": "ダウンロード停止",
    "html.cache_processing": "計算中...",
    // ヘルプ（旧 assets/locales/ja/translation.json の control.help・html.help_* と同じ文言）
    "control.help": "ヘルプ表示",
    "html.app_loading_body": "アプリロード中です...",
    "html.help_title": "Maplat ヘルプ",
    "html.help_using_maplat":
      "このサイトはオープンソース絵地図・古地図ビューア<a href='https://www.maplat.jp/' target='_blank'>Maplat</a>を使って構築されています。",
    "html.help_operation_title": "地図の操作方法",
    "html.help_operation_content":
      "地図の移動はPCの場合はマウスのドラッグ、スマートフォンの場合は指でのスワイプ動作で行います。<br>地図の拡大縮小は、PCでは左上の${plus.png} ${minus.png}ボタン、スマートフォンでは2本指でのピンチインアウトで行います。<br>スマートフォンでは2本指でのひねる操作により、地図の回転も行えます。<br>左上の${home.png}ボタンを使うと、表示中の地図のホームポジションに移動できます。<br>${compass.png}ボタン上に表示されているコンパスは、現在の北の方角を示しており、またこのボタンを押すことによって、地図の回転状態を正位置に戻すことができます。<br>地図の移動中は、地図の全体を表示するためボタンが消えますが、消えたボタンの表示を戻すには、しばらく待つか画面を1回クリックまたはタップしてください。",
    "html.help_selection_title": "地図の変更方法",
    "html.help_selection_content":
      "地図の切り替えは、画面上の地図名のボタンで開くメニューから行います。<br>メニューの一覧から表示したい地図をクリックすると、その地図の表示に切り替えられます。<br>「背景地図」はベースマップ(正確な地図)、「古地図・重ね地図」は絵地図や古地図の一覧です。",
    "html.help_gps_title": "地図上への現在地表示",
    "html.help_gps_content":
      "${gps.png}ボタンを押すと、GPS機能が有効になり、ユーザの現在地が${bluedot.png}で地図上に表示されます。<br>もう一度ボタンを押すとGPS機能はオフになります。<br>もし、ユーザの現在地が表示中の地図上になかった場合、メッセージが表示され、GPS機能は自動的にオフになります。",
    "html.help_poi_title": "スポット情報の表示",
    "html.help_poi_content":
      "地図上に${defaultpin.png}のようなマーカーが表示される場合がありますが、これはスポット情報が提供されている場所になります。<br>マーカーをクリックまたはタップすると、スポットの情報が表示されます。",
    "html.help_etc_title": "その他",
    "html.help_etc_attr":
      "${attr.png}ボタン: 現在表示中の地図の作成者、所有者、ライセンス等各種情報が表示されます。",
    "html.help_etc_help": "${help.png}ボタン: このヘルプが表示されます。",
    "html.help_share_help":
      "${share.png}ボタン: SNS等へのアプリシェア画面が表示されます。",
    "html.help_etc_border":
      "${border.png}ボタン: 地図の境界を表示します。<br>パソコンではマウスオーバーで地図を選びクリックで地図を切り替え、スマホではワンクリックで地図を選びもう一度クリックで地図を切り替えます。",
    "html.help_etc_hide_marker":
      "${hide_marker.png}ボタン: マーカーの表示/非表示を切り替えます。",
    "html.help_etc_marker_list":
      "${marker_list.png}ボタン: マーカーのレイヤー毎に表示/非表示を切り替える画面が表示されます。",
    "html.help_etc_slider":
      "${slider.png}スライダ: 表示中の地図の透明度を切り替えて、背景の地図が透けて見えるようにします。<br>絵地図、古地図の表示中にのみ動作し、ベースマップ表示時は動作しません。"
  },
  en: {
    "control.zoom_in": "Zoom in",
    "control.zoom_out": "Zoom out",
    "control.home": "Go Home Position",
    "control.compass": "Reset Rotation",
    "control.compass_north": "Turn North Up",
    "control.gps": "Acquire GPS Position",
    "control.trans": "Change Map Transparency",
    "control.map_menu": "Switch maps",
    "menu.base_maps": "Base maps",
    "menu.overlay_maps": "Old maps / overlays",
    "menu.poi_candidates": "Choose a spot",
    "control.marker_list": "Marker list",
    "html.marker_list_title": "Marker list",
    "html.close": "Close",
    "control.share": "Share",
    "html.share_title": "Share",
    "html.share_app_title": "Share this application",
    "html.share_state_title": "Share current viewpoint",
    "html.share_copy": "Copy",
    "html.share_qr": "QR code",
    "app.copy_toast": "Copied to clipboard",
    // Out of map / GPS errors (same wording as the legacy assets/locales/en/translation.json app.*)
    "app.out_of_map": "Out of map",
    "app.out_of_map_area":
      "Showing area is out of map. The area moves to default position.",
    "app.gps_error": "Location information is not available",
    "app.user_gps_deny":
      'To display the current location, please enable "Use Location" in your web browser and read the QR code or URL again.',
    "app.gps_miss":
      "System failed to acquire location. Please try again at a place where you can receive GPS satellite signals easily.",
    "app.gps_timeout":
      "Position acquisition process timed out. Please try again at a place where you can receive GPS satellite signals easily.",
    "control.border": "Show Map Border",
    "control.hide_marker": "Hide Markers",
    "control.info": "Show Map Information",
    "html.author": "Author",
    "html.createdAt": "Created at",
    "html.era": "Era",
    "html.contributor": "Contributor",
    "html.mapper": "Mapper",
    "html.license": "Map image license",
    "html.dataLicense": "Data license",
    "html.attr": "Map image attribution",
    "html.dataAttr": "Data attribution",
    "html.reference": "Reference",
    "html.description": "Description",
    "html.cache_handle": "Size of map cache",
    "html.cache_fetch": "Bulk download",
    "html.cache_delete": "Clear cache",
    "html.cache_cancel": "Cancel download",
    "html.cache_processing": "Processing...",
    // Help（same wording as the legacy assets/locales/en/translation.json control.help / html.help_*）
    "control.help": "Show Help",
    "html.app_loading_body": "Now loading application...",
    "html.help_title": "Maplat Help",
    "html.help_using_maplat":
      "This site is built with open-source pictorial and historical map viewer <a href='https://www.maplat.jp/' target='_blank'>Maplat</a>.",
    "html.help_operation_title": "How to operate the map",
    "html.help_operation_content":
      "Move the map by dragging the mouse in case of PC, swiping action with finger in case of smartphone.<br>Scaling the map can be done with the upper left ${plus.png} ${minus.png} buttons in case of PC, with pinch in/out actions with two fingers in case of smartphone.<br>On smartphone, you can rotate the map by twisting with two fingers.<br>By Using the ${home.png} button at the upper left, you can move to the home position of the map being displayed.<br>The compass displayed on ${compass.png} button indicates the current north direction, and by pressing this button, the rotation state of the map can be returned to the normal position.<br>While moving the map, buttons disappear to display the entire map, but to bring back the hidden buttons, please wait a moment or click/tap the screen once.",
    "html.help_selection_title": "How to change the map",
    "html.help_selection_content":
      'To switch the map, use the menu opened by the map name button at the top of the screen.<br>Click the map you want in the list and the map changes to it.<br>"Base maps" lists accurate maps, and "Old maps / overlays" lists pictorial and historical maps.',
    "html.help_gps_title": "Showing current position on the map",
    "html.help_gps_content":
      "When you press the ${gps.png} button, the GPS function turns on and the user's current location is displayed on the map as ${bluedot.png}. <br>If you press the button again, the GPS function turns off. <br>If the user's current location is not on the map being displayed, a message will be displayed and the GPS function will be turned off automatically.",
    "html.help_poi_title": "Showing spot information",
    "html.help_poi_content":
      "Markers such as ${defaultpin.png} may be displayed on the map, these are where the spot information is provided. <br>Click or tap the marker to display spot information.",
    "html.help_etc_title": "Others",
    "html.help_etc_attr":
      "${attr.png} Button: Various information (such as creator, contributor or license, etc.) of the currently displayed map are displayed.",
    "html.help_etc_help": "${help.png} Button: Showing this help.",
    "html.help_share_help":
      "${share.png} Button: You can share this application to SNS etc.",
    "html.help_etc_border":
      "${border.png} Button: Showing map border lines.<br> On a PC, select a map with a mouse over and switch the map with a click, on a smartphone, select a map with a click and switch the map with one more click.",
    "html.help_etc_hide_marker":
      "${hide_marker.png} Button: Toggles the display / hide of markers.",
    "html.help_etc_marker_list":
      "${marker_list.png} Button: A screen to display / hide for each marker layer is displayed.",
    "html.help_etc_slider":
      "${slider.png} Slider: Switch the transparency of the displayed map so that the background map can be seen through. <br>It operates only while displaying the historical/illustrated maps, it does not work when displaying the base maps."
  }
};

/**
 * 層 B（<maplat-ui>）の上書き。画面の作りが旧 UI と違うために意味が変わった文言だけを、旧 UI の言語ファイル
 * より後に重ねる（旧 UI のファイルは旧 UI が使うので変えない）。
 *   - html.help_selection_content: 旧 UI は画面の左下・右下のサムネイル付きスライダーで地図を選ぶが、
 *     層 B は上の中央の地図名のボタンで開くメニューで選ぶ（11 言語ともその説明にする）。
 *   - html.help_etc_border: 旧 UI の言語ファイルには「境界の内側をクリックして地図を切り替える」とあるが、
 *     旧 UI にも層 B にもその操作は無い（その一文だけを除き、ほかは言語ファイルの訳のまま）。
 *   - STRINGS にしか無いキー（control.zoom_in・menu.base_maps 等）の ja・en 以外の訳。
 * 引く順は 言語 → 基底の言語 → en（overrides を参照）。
 */
const OVERRIDES: Record<string, Dict> = {
  ja: {
    "html.help_selection_content":
      "地図の切り替えは、画面上の地図名のボタンで開くメニューから行います。<br>メニューの一覧から表示したい地図をクリックすると、その地図の表示に切り替えられます。<br>「背景地図」はベースマップ(正確な地図)、「古地図・重ね地図」は絵地図や古地図の一覧です。",
    "html.help_etc_border":
      "<img src='${border.png}'>ボタン: 地図の境界を表示します。<br>パソコンではマウスオーバーで地図を選びクリックで地図を切り替え、スマホではワンクリックで地図を選びもう一度クリックで地図を切り替えます。"
  },
  en: {
    "html.help_selection_content":
      'To switch the map, use the menu opened by the map name button at the top of the screen.<br>Click the map you want in the list and the map changes to it.<br>"Base maps" lists accurate maps, and "Old maps / overlays" lists pictorial and historical maps.',
    "html.help_etc_border":
      "<img src='${border.png}'> Button: Showing map border lines.<br> On a PC, select a map with a mouse over and switch the map with a click, on a smartphone, select a map with a click and switch the map with one more click."
  },
  de: {
    "control.zoom_in": "Vergrößern",
    "control.zoom_out": "Verkleinern",
    "control.compass_north": "Norden nach oben drehen",
    "control.map_menu": "Karten wechseln",
    "menu.base_maps": "Basiskarten",
    "menu.overlay_maps": "Historische Karten / Überlagerungen",
    "menu.poi_candidates": "Standort wählen",
    "html.share_qr": "QR-Code",
    "html.help_selection_content":
      "Der Kartenwechsel erfolgt über das Menü, das sich mit der Schaltfläche mit dem Kartennamen oben auf dem Bildschirm öffnet.<br>Klicken Sie in der Liste auf die gewünschte Karte, und diese Karte wird angezeigt.<br>„Basiskarten“ sind genaue Karten, „Historische Karten / Überlagerungen“ sind illustrierte und historische Karten.",
    "html.help_etc_border":
      "<img src='${border.png}'>-Taste: Zeigt die Kartenrandlinien an.<br>Auf einem PC wählen Sie eine Karte mit der Maus aus und wechseln sie durch einen Klick, auf einem Smartphone wählen Sie eine Karte durch einen Klick aus und wechseln sie durch einen weiteren Klick."
  },
  es: {
    "control.zoom_in": "Acercar",
    "control.zoom_out": "Alejar",
    "control.compass_north": "Orientar al norte",
    "control.map_menu": "Cambiar de mapa",
    "menu.base_maps": "Mapas base",
    "menu.overlay_maps": "Mapas históricos / superposiciones",
    "menu.poi_candidates": "Elegir un lugar",
    "html.share_qr": "Código QR",
    "html.help_selection_content":
      "Para cambiar de mapa, utilice el menú que se abre con el botón del nombre del mapa en la parte superior de la pantalla.<br>Haga clic en el mapa que desee de la lista y se mostrará ese mapa.<br>«Mapas base» son mapas precisos y «Mapas históricos / superposiciones» son mapas ilustrados e históricos.",
    "html.help_etc_border":
      "Botón <img src='${border.png}'>: muestra los límites de los mapas.<br>En un PC, seleccione un mapa pasando el ratón por encima y cambie de mapa con un clic; en un teléfono, seleccione un mapa con un clic y cambie de mapa con otro clic."
  },
  fr: {
    "control.zoom_in": "Zoom avant",
    "control.zoom_out": "Zoom arrière",
    "control.compass_north": "Orienter vers le nord",
    "control.map_menu": "Changer de carte",
    "menu.base_maps": "Fonds de carte",
    "menu.overlay_maps": "Cartes historiques / superpositions",
    "menu.poi_candidates": "Choisir un lieu",
    "html.share_qr": "Code QR",
    "html.help_selection_content":
      "Pour changer de carte, utilisez le menu qui s'ouvre avec le bouton du nom de la carte en haut de l'écran.<br>Cliquez sur la carte souhaitée dans la liste : cette carte s'affiche.<br>« Fonds de carte » regroupe les cartes précises, « Cartes historiques / superpositions » les cartes illustrées et historiques.",
    "html.help_etc_border":
      "Bouton <img src='${border.png}'> : affiche les limites des cartes.<br>Sur PC, sélectionnez une carte en la survolant avec la souris puis changez de carte d'un clic ; sur smartphone, sélectionnez une carte d'un premier clic et changez de carte d'un second clic."
  },
  id: {
    "control.zoom_in": "Perbesar",
    "control.zoom_out": "Perkecil",
    "control.compass_north": "Arahkan ke utara",
    "control.map_menu": "Ganti peta",
    "menu.base_maps": "Peta dasar",
    "menu.overlay_maps": "Peta lama / lapisan",
    "menu.poi_candidates": "Pilih tempat",
    "html.share_qr": "Kode QR",
    "html.help_selection_content":
      "Untuk mengganti peta, gunakan menu yang dibuka dengan tombol nama peta di bagian atas layar.<br>Klik peta yang diinginkan pada daftar, lalu peta tersebut akan ditampilkan.<br>“Peta dasar” adalah peta yang akurat, “Peta lama / lapisan” adalah peta bergambar dan peta bersejarah.",
    "html.help_etc_border":
      "Tombol <img src='${border.png}'>: menampilkan garis batas peta.<br>Di PC, pilih peta dengan mengarahkan mouse lalu klik untuk mengganti peta; di ponsel, pilih peta dengan satu ketukan dan ganti peta dengan ketukan berikutnya."
  },
  ko: {
    "control.zoom_in": "확대",
    "control.zoom_out": "축소",
    "control.compass_north": "북쪽을 위로",
    "control.map_menu": "지도 전환",
    "menu.base_maps": "베이스 맵",
    "menu.overlay_maps": "고지도 / 중첩 지도",
    "menu.poi_candidates": "스팟 선택",
    "html.share_qr": "QR 코드",
    "html.help_selection_content":
      "지도 전환은 화면 위쪽의 지도 이름 버튼으로 여는 메뉴에서 합니다.<br>메뉴 목록에서 표시할 지도를 클릭하면 그 지도로 전환됩니다.<br>“베이스 맵”은 정확한 지도, “고지도 / 중첩 지도”는 그림 지도나 고지도의 목록입니다.",
    "html.help_etc_border":
      "<img src='${border.png}'>버튼: 지도의 경계를 표시합니다. <br>PC의 경우는마우스 오버로 지도를 선택합니다. 스마트폰의 경우는 원클릭으로 지도를 선택해, 다시 한번 클릭하면 지도를 변경합니다."
  },
  th: {
    "control.zoom_in": "ซูมเข้า",
    "control.zoom_out": "ซูมออก",
    "control.compass_north": "หันทิศเหนือขึ้นด้านบน",
    "control.map_menu": "สลับแผนที่",
    "menu.base_maps": "แผนที่พื้นฐาน",
    "menu.overlay_maps": "แผนที่เก่า / แผนที่ซ้อนทับ",
    "menu.poi_candidates": "เลือกสถานที่",
    "html.share_qr": "คิวอาร์โค้ด",
    "html.help_selection_content":
      "การสลับแผนที่ทำได้จากเมนูที่เปิดด้วยปุ่มชื่อแผนที่ด้านบนของหน้าจอ<br>คลิกแผนที่ที่ต้องการในรายการ แล้วหน้าจอจะเปลี่ยนไปยังแผนที่นั้น<br>“แผนที่พื้นฐาน” คือแผนที่ที่ถูกต้องตามปัจจุบัน ส่วน “แผนที่เก่า / แผนที่ซ้อนทับ” คือรายการแผนที่ภาพวาดและแผนที่ประวัติศาสตร์",
    "html.help_etc_border":
      "ปุ่ม <img src='${border.png}'>: แสดงเส้นขอบเขตของแผนที่<br>บนคอมพิวเตอร์ ให้เลื่อนเมาส์ไปเลือกแผนที่แล้วคลิกเพื่อสลับ ส่วนบนสมาร์ตโฟน ให้แตะหนึ่งครั้งเพื่อเลือกแผนที่ แล้วแตะอีกครั้งเพื่อสลับ"
  },
  vi: {
    "control.zoom_in": "Phóng to",
    "control.zoom_out": "Thu nhỏ",
    "control.compass_north": "Hướng bắc lên trên",
    "control.map_menu": "Chuyển bản đồ",
    "menu.base_maps": "Bản đồ cơ bản",
    "menu.overlay_maps": "Bản đồ cũ / lớp phủ",
    "menu.poi_candidates": "Chọn điểm đánh dấu",
    "html.share_qr": "Mã QR",
    "html.help_selection_content":
      "Để chuyển bản đồ, hãy dùng menu mở ra bằng nút tên bản đồ ở phía trên màn hình.<br>Nhấp vào bản đồ bạn muốn trong danh sách, bản đồ đó sẽ được hiển thị.<br>“Bản đồ cơ bản” là bản đồ chính xác, “Bản đồ cũ / lớp phủ” là danh sách bản đồ minh họa và bản đồ lịch sử.",
    "html.help_etc_border":
      "Nút <img src='${border.png}'>: Hiển thị đường viền bản đồ.<br>Trên máy tính, chọn bản đồ bằng cách di chuột và nhấp để chuyển bản đồ, trên điện thoại, nhấp một lần để chọn và nhấp lần nữa để chuyển."
  },
  zh: {
    "control.zoom_in": "放大",
    "control.zoom_out": "缩小",
    "control.compass_north": "正北朝上",
    "control.map_menu": "切换地图",
    "menu.base_maps": "基础地图",
    "menu.overlay_maps": "历史地图 / 叠加地图",
    "menu.poi_candidates": "选择场所",
    "html.share_qr": "二维码",
    "html.help_selection_content":
      "地图的切换请在画面上的地图名按钮打开的菜单中进行。<br>在菜单的列表里点击想查看的地图，即可切换成该地图。<br>“基础地图”是精确的地图，“历史地图 / 叠加地图”是手绘地图或历史地图的列表。",
    "html.help_etc_border":
      "<img src='${border.png}'>按钮: 地图的边界显示。<br>在电脑上操作可以用鼠标在地图上上移动选择后点击进行地图切换显示，手机上在选中地图后，再一次点击后进行地图切换显示。"
  },
  "zh-TW": {
    "control.zoom_in": "放大",
    "control.zoom_out": "縮小",
    "control.compass_north": "北方朝上",
    "control.map_menu": "切換地圖",
    "menu.base_maps": "底圖",
    "menu.overlay_maps": "古地圖 / 疊圖",
    "menu.poi_candidates": "選擇景點",
    "html.share_qr": "QR 碼",
    "html.help_selection_content":
      "切換地圖請從畫面上的地圖名稱按鈕開啟的選單中進行。<br>從選單清單中點一下想顯示的地圖，即可切換成該地圖。<br>「底圖」是準確的地圖，「古地圖 / 疊圖」是繪圖或古地圖的清單。",
    "html.help_etc_border":
      "<img src='${border.png}'>按鈕：顯示地圖邊界線。<br>在電腦上以滑鼠移到想看的地圖上並點擊切換；在手機上先點一下選擇地圖，再點一下即可切換。"
  }
};

/**
 * 旧 UI の言語ファイル（リポジトリの assets/locales/<lng>/translation.json）の読み込み。
 * 静的な文字列の import() なので、Vite は言語ごとに別のチャンクに分ける（使う言語の分だけ読まれる）。
 * パスはこのファイルからの相対（外部のパッケージは足さない）。
 */
const LOCALE_LOADERS: Record<string, () => Promise<unknown>> = {
  de: () => import("../../assets/locales/de/translation.json"),
  en: () => import("../../assets/locales/en/translation.json"),
  es: () => import("../../assets/locales/es/translation.json"),
  fr: () => import("../../assets/locales/fr/translation.json"),
  id: () => import("../../assets/locales/id/translation.json"),
  ja: () => import("../../assets/locales/ja/translation.json"),
  ko: () => import("../../assets/locales/ko/translation.json"),
  th: () => import("../../assets/locales/th/translation.json"),
  vi: () => import("../../assets/locales/vi/translation.json"),
  zh: () => import("../../assets/locales/zh/translation.json"),
  "zh-TW": () => import("../../assets/locales/zh-TW/translation.json")
};

/** 言語ファイルの入れ子（control.zoom_in 等）を、内蔵の辞書と同じ平らなキーに直す。 */
function flattenLocale(value: unknown, prefix: string, out: Dict): void {
  if (value == null || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child != null && typeof child === "object")
      flattenLocale(child, path, out);
    else if (typeof child === "string") out[path] = child;
  }
}

/** 内蔵の辞書（ja・en）を、その言語のぶんだけ重ねる（無い言語は en）。 */
function builtinStrings(lang: string): Dict {
  const base = lang.split("-")[0];
  return { ...STRINGS.en, ...(STRINGS[lang] ?? STRINGS[base] ?? {}) };
}

/** 層 B の上書きを、言語 → 基底の言語 → en の順で重ねた辞書（後のほうがあとから重なる）。 */
function overrides(lang: string): Dict {
  const base = lang.split("-")[0];
  return {
    ...(OVERRIDES.en ?? {}),
    ...(OVERRIDES[base] ?? {}),
    ...(OVERRIDES[lang] ?? {})
  };
}

/** 内蔵の辞書を土台に、言語ファイルの訳 → 層 B の上書きの順で重ねる（あとから重ねたものが正）。 */
function mergeStrings(lang: string, legacy: Dict): Dict {
  return { ...builtinStrings(lang), ...legacy, ...overrides(lang) };
}

/** 言語ファイルのキーを大文字小文字を無視して引く（"zh-tw" と "zh-TW" を同じに扱う）。 */
function loaderKey(lang: string): string | undefined {
  const lower = lang.toLowerCase();
  return Object.keys(LOCALE_LOADERS).find(k => k.toLowerCase() === lower);
}

/** 使う言語ファイルの言語。無い言語は基底（en-US → en）→ en。 */
export function resolveLanguage(lang: string): string {
  const normalized = normalizeLang(lang || "en");
  const exact = loaderKey(normalized);
  if (exact) return exact;
  const base = normalized.split("-")[0];
  return loaderKey(base) ?? "en";
}

/** 言語ファイルを 1 つ読む（失敗したら null。警告は英語）。 */
async function readLocaleFile(lang: string): Promise<Dict | null> {
  const loader = LOCALE_LOADERS[lang];
  if (!loader) return null;
  try {
    const mod = (await loader()) as { default?: unknown } | undefined;
    const raw = mod?.default ?? mod;
    const out: Dict = {};
    flattenLocale(raw, "", out);
    return out;
  } catch (err) {
    console.warn(
      `<maplat-ui>: failed to load translations for "${lang}".`,
      err
    );
    return null;
  }
}

// 読み込みは言語ごとに 1 回だけ（言語ファイルは変わらない）。失敗も覚えて、読み直さない。
const LOCALE_CACHE = new Map<string, Promise<Dict>>();

/**
 * 言語の辞書を読む（内蔵の辞書 + 言語ファイル。言語ファイルが正）。読み込みに失敗したら en に落ちる。
 * 戻り値はその言語だけで使う平らな辞書（translateKey に渡す）。
 */
export function loadLanguage(lang: string): Promise<Dict> {
  const resolved = resolveLanguage(lang);
  const cached = LOCALE_CACHE.get(resolved);
  if (cached) return cached;
  const task = (async (): Promise<Dict> => {
    const legacy = await readLocaleFile(resolved);
    if (legacy) return mergeStrings(resolved, legacy);
    if (resolved !== "en") {
      console.warn(
        `<maplat-ui>: falling back to English translations for "${resolved}".`
      );
      const en = await readLocaleFile("en");
      if (en) return mergeStrings("en", en);
    }
    console.warn(
      "<maplat-ui>: failed to load the English translations; using the built-in English strings."
    );
    return mergeStrings("en", {});
  })();
  LOCALE_CACHE.set(resolved, task);
  return task;
}

/** 旧 UI と同じ正規化（ui_init.ts の i18nLoader: zh-hk・zh-hant は zh-TW）。 */
export function normalizeLang(lang: string): string {
  const lower = lang.toLowerCase();
  if (lower === "zh-hk" || lower === "zh-hant") return "zh-TW";
  return lang;
}

/** i18next の入れ子（$t(key)）を辞書の値で解く（旧 UI の言語ファイルでは未使用。念のため）。 */
function expandNesting(text: string, dict: Dict, depth = 0): string {
  if (depth > 10 || !text.includes("$t(")) return text;
  return text.replace(/\$t\(\s*([\w.-]+)\s*\)/g, (match, key: string) => {
    const value = dict[key];
    return typeof value === "string"
      ? expandNesting(value, dict, depth + 1)
      : match;
  });
}

/** i18next の差し込み（{{name}}）を option で埋める（名前は a.b の形も許す）。 */
function interpolate(text: string, option: Record<string, unknown>): string {
  return text.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (match, name: string) => {
    const value = name
      .split(".")
      .reduce<unknown>(
        (obj, key) =>
          obj == null ? undefined : (obj as Record<string, unknown>)[key],
        option
      );
    return value === undefined ? match : String(value);
  });
}

/**
 * 文言のキー → 文字列。strings（loadLanguage の戻り値）があればそれを、無ければ内蔵の辞書（層 B の上書きを
 * 重ねたもの）を使う。キーが無ければ en → キー。i18next の入れ子（$t）と差し込み（{{name}}）を解く。
 */
export function translateKey(
  lang: string,
  key: string,
  option?: Record<string, unknown>,
  strings?: Dict
): string {
  const dict = strings ?? { ...builtinStrings(lang), ...overrides(lang) };
  const raw = dict[key] ?? STRINGS.en[key] ?? key;
  const nested = expandNesting(raw, dict);
  return option ? interpolate(nested, option) : nested;
}

/**
 * 多言語の文字列（{ja: "…", en: "…"}）から lang の値を選ぶ（旧 MaplatUi.translate の選び方:
 * 現在の言語 → en → 最初の空でない言語。空文字の言語は候補にしない。全部空なら ""）。
 */
export function pickLocalized(
  fragment: Localized | undefined | null,
  lang: string
): string | undefined {
  if (fragment == null) return undefined;
  if (typeof fragment === "string") return fragment;
  if (typeof fragment !== "object") return String(fragment);
  let first: string | undefined;
  let en: string | undefined;
  for (const [key, value] of Object.entries(fragment)) {
    if (!value) continue;
    if (key === lang) return value;
    if (key === "en" && en === undefined) en = value;
    if (first === undefined) first = value;
  }
  return en ?? first ?? "";
}
