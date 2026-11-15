# Maplat UI 用語集の初版で直した訳の一覧

> **注意: この一覧の訳は、まだ人間が確認していません（未レビュー）。** 用語集の初版を入れた後、既存の揺れと明確な言語の誤りを機械の照合と目視で見つけて直した訳です。各言語の担当のレビューで直してよく、ここに載っていることは訳文の承認を意味しません。

直した件数は 66 件（言語×キー）です。「要確認」は 5 件です。同じ文言を持つ `src/element/i18n.ts` の内蔵の辞書（ja・en）も同じ内容に揃えましたが、件数には数えていません。

| 言語 | 直した件数 | うち要確認 |
|---|---:|---:|
| de（ドイツ語） | 6 | 0 |
| en（英語） | 19 | 0 |
| es（スペイン語） | 2 | 0 |
| fr（フランス語） | 3 | 0 |
| id（インドネシア語） | 2 | 0 |
| ja（日本語） | 2 | 0 |
| ko（韓国語） | 10 | 0 |
| th（タイ語） | 3 | 0 |
| vi（ベトナム語） | 5 | 2 |
| zh（中国語（簡体字）） | 10 | 0 |
| zh-TW（中国語（繁体字）） | 4 | 3 |
| 計 | 66 | 5 |

概念と統一先の語は `docs/i18n/maplat-glossary.md`（生成物）を見てください。「概念」の列が概念 ID の行は、MaplatEditor と同じ形に締めた用語集（`feat/glossary-tighten`）で違反になる行です。「言語の誤り」は用語集とは別に直した直訳・不自然な訳・誤訳で、意味は変えていません。

## de（ドイツ語）: 6 件

| キー | 概念 | 変更前 | 変更後 |
|---|---|---|---|
| `html.app_loading_body` | app | Anwendung wird geladen... | App wird geladen... |
| `html.dataAttr` | attribution | Datenattribution | Quellenangabe der Daten |
| `html.help_using_maplat` | viewer | Diese Website wurde mit dem Open-Source-Karten- und historischen Kartenbetrachter <a href='https://www.maplat.jp/' target='_blank'>Maplat</a> erstellt. | Diese Website wurde mit dem Open-Source-Viewer für illustrierte und historische Karten, <a href='https://www.maplat.jp/' target='_blank'>Maplat</a>, erstellt. |
| `html.help_share_help` | app | <img src='${share.png}'>-Taste: Sie können diese Anwendung auf sozialen Netzwerken usw. teilen. | <img src='${share.png}'>-Taste: Sie können diese App in sozialen Netzwerken usw. teilen. |
| `html.help_etc_slider` | basemap | <img src='${slider.png}'>-Schieberegler: Ändert die Transparenz der angezeigten Karte, sodass die Hintergrundkarte sichtbar wird.<br>Dies funktioniert nur bei der Anzeige von historischen oder illustrierten Karten, bei der Anzeige von Basiskarten funktioniert es nicht. | <img src='${slider.png}'>-Schieberegler: Ändert die Transparenz der angezeigten Karte, sodass die Basiskarte sichtbar wird.<br>Dies funktioniert nur bei der Anzeige von historischen oder illustrierten Karten, bei der Anzeige von Basiskarten funktioniert es nicht. |
| `html.share_app_title` | app | Diese Anwendung teilen | Diese App teilen |

## en（英語）: 19 件

| キー | 概念 | 変更前 | 変更後 |
|---|---|---|---|
| `control.home` | 言語の誤り | Go Home Position | Return to Home Position |
| `html.app_loading_body` | app | Now loading application... | Loading app... |
| `html.reference` | citation | Reference | Source |
| `html.help_operation_content` | 言語の誤り | Move the map by dragging the mouse in case of PC, swiping action with finger in case of smartphone.<br>Scaling the map can be done with the upper left <img src='${plus.png}'> <img src='${minus.png}'> buttons in case of PC, with pinch in/out actions with two fingers in case of smartphone.<br>On smartphone, you can rotate the map by twisting with two fingers.<br>By Using the <img src='${home.png}'> button at the upper left, you can move to the home position of the map being displayed.<br>The compass displayed on <img src='${compass.png}'> button indicates the current north direction, and by pressing this button, the rotation state of the map can be returned to the normal position.<br>While moving the map, buttons disappear to display the entire map, but to bring back the hidden buttons, please wait a moment or click/tap the screen once. | Move the map by dragging with a mouse on a PC or swiping with a finger on a smartphone.<br>Zoom the map with the upper-left <img src='${plus.png}'> <img src='${minus.png}'> buttons on a PC, or by pinching in and out with two fingers on a smartphone.<br>On a smartphone, rotate the map by twisting two fingers.<br>Use the upper-left <img src='${home.png}'> button to return to the home position of the displayed map.<br>The compass on the <img src='${compass.png}'> button points north; press it to reset the map rotation.<br>While the map is moving, the buttons disappear to show the entire map. To bring them back, wait a moment or click or tap the screen once. |
| `html.help_selection_content` | 言語の誤り | The two sliders with thumbnail like <Img src='${overlay.png}'> are displayed in the lower left and the lower right of the screen, you can select the map to display with them.<br> Slide the slider to select the map you want, and click the thumbnail, then the map changed.<br>The lower left map slider is to choose base maps (accurate maps), the lower right map slider is to choose historical/illustrated maps. | Two sliders with thumbnails like <Img src='${overlay.png}'> appear at the lower left and lower right of the screen. Use them to select a map to display.<br>Slide to choose a map, then click its thumbnail to switch to it.<br>The lower-left slider selects base maps (accurate maps); the lower-right slider selects historical or illustrated maps. |
| `html.help_poi_content` | 言語の誤り | Markers such as <img src='${defaultpin.png}'> may be displayed on the map, these are where the spot information is provided. <br>Click or tap the marker to display spot information. | Markers such as <img src='${defaultpin.png}'> may appear on the map where spot information is available.<br>Click or tap a marker to display the spot information. |
| `html.help_etc_attr` | 言語の誤り | <img src='${attr.png}'> Button: Various information (such as creator, contributor or license, etc.) of the currently displayed map are displayed. | <img src='${attr.png}'> Button: Shows information about the currently displayed map, such as its creator, contributor, and license. |
| `html.help_etc_help` | 言語の誤り | <img src='${help.png}'> Button: Showing this help. | <img src='${help.png}'> Button: Shows this help. |
| `html.help_share_help` | app | <img src='${share.png}'> Button: You can share this application to SNS etc. | <img src='${share.png}'> Button: Opens a screen for sharing this app on social networks and elsewhere. |
| `html.help_etc_border` | 言語の誤り | <img src='${border.png}'> Button: Showing map border lines.<br>You can also switch the map by clicking inside the boundary. <br> On a PC, select a map with a mouse over and switch the map with a click, on a smartphone, select a map with a click and switch the map with one more click. | <img src='${border.png}'> Button: Shows map borders.<br>You can also switch maps by clicking inside a border.<br>On a PC, hover over a map to select it and click to switch; on a smartphone, tap once to select a map and tap again to switch. |
| `html.help_etc_hide_marker` | 言語の誤り | <img src='${hide_marker.png}'> Button: Toggles the display / hide of markers. | <img src='${hide_marker.png}'> Button: Toggles marker visibility. |
| `html.help_etc_marker_list` | 言語の誤り | <img src='${marker_list.png}'> Button: A screen to display / hide for each marker layer is displayed. | <img src='${marker_list.png}'> Button: Opens a screen for showing or hiding each marker layer. |
| `html.help_etc_slider` | basemap | <img src='${slider.png}'> Slider: Switch the transparency of the displayed map so that the background map can be seen through. <br>It operates only while displaying the historical/illustrated maps, it does not work when displaying the base maps. | <img src='${slider.png}'> Slider: Adjusts the transparency of the displayed map so that the base map can be seen through it.<br>This works only while historical or illustrated maps are displayed; it does not work with base maps. |
| `html.share_app_title` | app | Share this application | Share this app |
| `app.acquiring_gps_desc` | 言語の誤り | Now acquiring GPS. | Acquiring GPS data. |
| `app.out_of_map_desc` | 言語の誤り | GPS result is out of map. GPS function turns off. | The GPS position is outside the map. GPS turns off. |
| `app.out_of_map_area` | 言語の誤り | Showing area is out of map. The area moves to default position. | The displayed area is outside the map. Returning to the default position. |
| `app.gps_miss` | 言語の誤り | System failed to acquire location. Please try again at a place where you can receive GPS satellite signals easily. | The system could not acquire your location. Try again where GPS satellite signals are easier to receive. |
| `app.gps_timeout` | 言語の誤り | Position acquisition process timed out. Please try again at a place where you can receive GPS satellite signals easily. | Acquiring the position timed out. Try again where GPS satellite signals are easier to receive. |

## es（スペイン語）: 2 件

| キー | 概念 | 変更前 | 変更後 |
|---|---|---|---|
| `html.reference` | citation | Referencia | Fuente |
| `html.help_etc_slider` | basemap | Control <img src='${slider.png}'>: ajusta la transparencia del mapa mostrado para que se vea el mapa de fondo.<br>Solo funciona al mostrar mapas históricos o ilustrados; no funciona al mostrar mapas base. | Control <img src='${slider.png}'>: ajusta la transparencia del mapa mostrado para que se vea el mapa base.<br>Solo funciona al mostrar mapas históricos o ilustrados; no funciona al mostrar mapas base. |

## fr（フランス語）: 3 件

| キー | 概念 | 変更前 | 変更後 |
|---|---|---|---|
| `html.reference` | citation | Référence | Source |
| `html.help_using_maplat` | viewer | Ce site est construit avec <a href='https://www.maplat.jp/' target='_blank'>Maplat</a>, un visualiseur open source de cartes illustrées et historiques. | Ce site est construit avec <a href='https://www.maplat.jp/' target='_blank'>Maplat</a>, une visionneuse open source de cartes illustrées et historiques. |
| `html.help_etc_slider` | 言語の誤り | Curseur <img src='${slider.png}'> : règle la transparence de la carte affichée afin de laisser apparaître la carte d'arrière-plan.<br>Il ne fonctionne que lors de l'affichage des cartes historiques ou illustrées, pas lors de l'affichage des fonds de carte. | Curseur <img src='${slider.png}'> : règle la transparence de la carte affichée afin de laisser apparaître le fond de carte.<br>Il ne fonctionne que lors de l'affichage des cartes historiques ou illustrées, pas lors de l'affichage des fonds de carte. |

## id（インドネシア語）: 2 件

| キー | 概念 | 変更前 | 変更後 |
|---|---|---|---|
| `html.reference` | citation | Referensi | Sumber |
| `html.help_etc_slider` | basemap | Penggeser <img src='${slider.png}'>: mengatur transparansi peta yang ditampilkan sehingga peta latar belakang dapat terlihat.<br>Hanya berfungsi saat menampilkan peta bersejarah atau bergambar; tidak berfungsi saat menampilkan peta dasar. | Penggeser <img src='${slider.png}'>: mengatur transparansi peta yang ditampilkan sehingga peta dasar dapat terlihat.<br>Hanya berfungsi saat menampilkan peta bersejarah atau bergambar; tidak berfungsi saat menampilkan peta dasar. |

## ja（日本語）: 2 件

| キー | 概念 | 変更前 | 変更後 |
|---|---|---|---|
| `html.app_loading_body` | 言語の誤り | アプリロード中です... | アプリを読み込み中です... |
| `html.help_etc_slider` | 言語の誤り | <img src='${slider.png}'>スライダ: 表示中の地図の透明度を切り替えて、背景の地図が透けて見えるようにします。<br>絵地図、古地図の表示中にのみ動作し、ベースマップ表示時は動作しません。 | <img src='${slider.png}'>スライダ: 表示中の地図の透明度を変更して、ベースマップが透けて見えるようにします。<br>絵地図、古地図の表示中にのみ動作し、ベースマップ表示時は動作しません。 |

## ko（韓国語）: 10 件

| キー | 概念 | 変更前 | 変更後 |
|---|---|---|---|
| `control.zoom` | 言語の誤り | 지도 확대 변경 | 지도 확대/축소 |
| `html.app_loading_body` | app | 애플리케이션을 불러오는 중입니다... | 앱을 불러오는 중입니다... |
| `html.cache_delete` | 言語の誤り | 캐시 해제 | 캐시 삭제 |
| `html.help_operation_content` | 言語の誤り | 지도를 원하는 곳으로 이동시키려면, PC의 경우는 마우스로 드래그하고, 스파트폰의 경우는 스와이프합니다. <br>지도를 확대・축소시키려면, PC의 경우는 왼쪽 위에 있는<img src='${plus.png}'> <img src='${minus.png}'>버튼으로, 스마트폰의 경우는 두 손가락으로 핀치인/아웃합니다. <br>스마트폰의 경우, 두 손가락을 돌라면 지도를 회전시킬 수 있습니다.<br>왼쪽 위에 있는<img src='${home.png}'>버튼을 사용하면, 표시되어 있는 지도의 홈 위치로 이동할 수 있습니다.<br><img src='${compass.png}'>버튼 위에 표시되어 있는 나침반은 북쪽을 가리키고 있고, 이 버튼을 누르면 회전된 상태를 원위치를 되돌릴 수 있습니다.<br>지도를 이동 중에는 전체 지도를 표시하기 위해 버튼이 사라집니다. 사라진 버튼을 다시 표시하려면 잠시 기다리거나 화면을 한 번 클릭 또는 탭하세요. | PC에서는 마우스로 드래그하고, 스마트폰에서는 손가락으로 스와이프하여 지도를 이동합니다.<br>PC에서는 왼쪽 위의 <img src='${plus.png}'> <img src='${minus.png}'> 버튼으로, 스마트폰에서는 두 손가락 핀치 인/아웃으로 지도를 확대하거나 축소합니다.<br>스마트폰에서는 두 손가락을 비틀어 지도를 회전할 수 있습니다.<br>왼쪽 위의 <img src='${home.png}'> 버튼을 눌러 표시 중인 지도의 홈 위치로 이동합니다.<br><img src='${compass.png}'> 버튼의 나침반은 현재 북쪽 방향을 가리키며, 이 버튼을 눌러 지도 회전이 초기화됩니다.<br>지도를 이동하는 동안에는 전체 지도를 보여 주기 위해 버튼이 사라집니다. 버튼을 다시 표시하려면 잠시 기다리거나 화면을 한 번 클릭하거나 탭하세요. |
| `html.help_selection_content` | basemap | 화면의 왼쪽 아래와 오른쪽 아래에<img src='${overlay.png}'>이러한 섬네일이 있는 슬라이더가 표시되어 있는데 이것으로 표시할 지도를 선택할 수 있습니다.<br>좌우로 슬라이드해 표시할 지도를 선택, 클릭하면 그 지도를 표시할 수 있습니다.<br>왼쪽 아래의 지도 슬라이더는 베이스 맵(정확한 지도), 오른쪽 아래의 지도 슬라이더는 그림 지도나 고지도를 선택할 수 있습니다. | 화면 왼쪽 아래와 오른쪽 아래에 <img src='${overlay.png}'>와 같은 썸네일이 있는 슬라이더가 표시됩니다. 이 슬라이더로 표시할 지도를 선택할 수 있습니다.<br>좌우로 슬라이드하여 원하는 지도를 선택하고 클릭하면 해당 지도로 전환됩니다.<br>왼쪽 아래 슬라이더에서는 베이스맵(정확한 지도)을, 오른쪽 아래 슬라이더에서는 그림 지도나 고지도를 선택합니다. |
| `html.help_gps_content` | 言語の誤り | <img src='${gps.png}'>버튼을 누르면 GPS기능을 유효화시킬 수 있습니다. 사용자의 현재 위치가<img src='${bluedot.png}'>로 지도상에 표시됩니다.<br>다시 한번 버튼을 누르면, GPS기능은 OFF가 됩니다.<br>사용자의 현재 위치가 표시되고 있는 지도상에 없을 경우, 메시지가 표시되어 GPS기능이 자동적으로 OFF가 됩니다. | <img src='${gps.png}'> 버튼을 눌러 GPS 기능을 켭니다. 사용자의 현재 위치가 <img src='${bluedot.png}'> 아이콘으로 지도에 표시됩니다.<br>버튼을 다시 눌러 GPS 기능을 끕니다.<br>현재 위치가 표시 중인 지도 안에 없으면 메시지를 표시하고 GPS 기능을 자동으로 끕니다. |
| `html.help_etc_border` | 言語の誤り | <img src='${border.png}'>버튼: 지도의 경계를 표시합니다. <br>경계 안쪽을 클릭해서 지도를 변경할 수도 있습니다.<br>PC의 경우는마우스 오버로 지도를 선택합니다. 스마트폰의 경우는 원클릭으로 지도를 선택해, 다시 한번 클릭하면 지도를 변경합니다. | <img src='${border.png}'>버튼: 지도의 경계를 표시합니다.<br>경계 안쪽을 클릭해서 지도를 변경할 수도 있습니다.<br>PC에서는 마우스를 올려 지도를 선택하고 클릭하여 전환합니다. 스마트폰에서는 한 번 탭하여 지도를 선택하고, 다시 탭하여 전환합니다. |
| `html.help_etc_hide_marker` | 言語の誤り | <img src='${hide_marker.png}'>버튼: 마커의 표시하기/숨기기를 설정합니다. | <img src='${hide_marker.png}'>버튼: 마커 표시/숨기기를 전환합니다. |
| `html.help_etc_marker_list` | 言語の誤り | <img src='${marker_list.png}'>버튼: 마커의 레이어 별로 표시하기/숨기기를 설정하는 화면이 표시됩니다. | <img src='${marker_list.png}'>버튼: 마커 레이어별 표시/숨기기를 전환하는 화면이 표시됩니다. |
| `html.help_etc_slider` | basemap | <img src='${slider.png}'>슬라이더: 표시되어 있는 지도의 투명도를 변경, 배경에 있는 지도를 비쳐 보이게 합니다.<br>그림 지도, 고지도가 표시 중에만 작동하고 베이스 맵이 표시되어 있을 때는 작동하지 않습니다. | <img src='${slider.png}'>슬라이더: 표시 중인 지도의 투명도를 조정하여 베이스맵이 비쳐 보이게 합니다.<br>그림 지도나 고지도를 표시할 때만 작동하며, 베이스맵을 표시할 때는 작동하지 않습니다. |

## th（タイ語）: 3 件

| キー | 概念 | 変更前 | 変更後 |
|---|---|---|---|
| `html.help_using_maplat` | viewer | เว็บไซต์นี้สร้างด้วย <a href='https://www.maplat.jp/' target='_blank'>Maplat</a> โปรแกรมโอเพนซอร์สสำหรับดูแผนที่ภาพวาดและแผนที่ประวัติศาสตร์ | เว็บไซต์นี้สร้างด้วย <a href='https://www.maplat.jp/' target='_blank'>Maplat</a> โปรแกรมดูแผนที่ภาพวาดและแผนที่ประวัติศาสตร์แบบโอเพนซอร์ส |
| `html.help_etc_marker_list` | layer | ปุ่ม <img src='${marker_list.png}'>: แสดงหน้าจอสำหรับเปิด/ปิดการแสดงหมุดแยกตามชั้นข้อมูล | ปุ่ม <img src='${marker_list.png}'>: แสดงหน้าจอสำหรับเปิด/ปิดการแสดงหมุดแยกตามเลเยอร์ |
| `html.help_etc_slider` | basemap | แถบเลื่อน <img src='${slider.png}'>: ปรับความโปร่งใสของแผนที่ที่แสดงอยู่ เพื่อให้มองเห็นแผนที่พื้นหลังทะลุขึ้นมา<br>ใช้งานได้เฉพาะขณะแสดงแผนที่ประวัติศาสตร์หรือแผนที่ภาพวาดเท่านั้น ไม่ทำงานขณะแสดงแผนที่พื้นฐาน | แถบเลื่อน <img src='${slider.png}'>: ปรับความโปร่งใสของแผนที่ที่แสดงอยู่ เพื่อให้มองเห็นแผนที่พื้นฐานทะลุขึ้นมา<br>ใช้งานได้เฉพาะขณะแสดงแผนที่ประวัติศาสตร์หรือแผนที่ภาพวาดเท่านั้น ไม่ทำงานขณะแสดงแผนที่พื้นฐาน |

## vi（ベトナム語）: 5 件（うち要確認 2 件）

| キー | 概念 | 変更前 | 変更後 |
|---|---|---|---|
| `control.compass` | 言語の誤り（要確認） | Đặt lại xoay | Đặt lại góc xoay |
| `control.home` | 言語の誤り（要確認） | Về vị trí chính | Về vị trí ban đầu |
| `html.reference` | citation | Tham khảo | Nguồn |
| `html.help_selection_content` | basemap | Hai thanh trượt với hình thu nhỏ như <Img src='${overlay.png}'> hiển thị ở góc trái dưới và góc phải dưới của màn hình, bạn có thể chọn bản đồ để hiển thị bằng chúng.<br>Trượt thanh trượt để chọn bản đồ bạn muốn, và nhấp vào hình thu nhỏ, sau đó bản đồ sẽ thay đổi.<br>Thanh trượt bản đồ góc trái dưới dùng để chọn bản đồ cơ bản (bản đồ chính xác), thanh trượt bản đồ góc phải dưới dùng để chọn bản đồ lịch sử/bản đồ minh họa. | Hai thanh trượt với hình thu nhỏ như <Img src='${overlay.png}'> hiển thị ở góc trái dưới và góc phải dưới của màn hình, bạn có thể chọn bản đồ để hiển thị bằng chúng.<br>Trượt thanh trượt để chọn bản đồ bạn muốn, và nhấp vào hình thu nhỏ, sau đó bản đồ sẽ thay đổi.<br>Thanh trượt bản đồ góc trái dưới dùng để chọn bản đồ nền (bản đồ chính xác), thanh trượt bản đồ góc phải dưới dùng để chọn bản đồ lịch sử/bản đồ minh họa. |
| `html.help_etc_slider` | 言語の誤り | <img src='${slider.png}'> Thanh trượt: Chuyển đổi độ trong suốt của bản đồ hiển thị để thấy được bản đồ nền.<br>Chỉ hoạt động khi hiển thị bản đồ lịch sử hoặc minh họa, không hoạt động khi hiển thị bản đồ cơ bản. | <img src='${slider.png}'> Thanh trượt: Điều chỉnh độ trong suốt của bản đồ hiển thị để thấy được bản đồ nền.<br>Chỉ hoạt động khi hiển thị bản đồ lịch sử hoặc minh họa, không hoạt động khi hiển thị bản đồ nền. |

## zh（中国語（簡体字））: 10 件

| キー | 概念 | 変更前 | 変更後 |
|---|---|---|---|
| `control.zoom` | 言語の誤り | 地图尺寸调整 | 调整地图缩放 |
| `html.cache_handle` | 言語の誤り | 地图缓存占用 | 地图缓存大小 |
| `html.help_using_maplat` | viewer | 本站点是使用开源绘制地图和历史地图浏览器<a href='https://www.maplat.jp/' target='_blank'>Maplat</a>为基础制作的。 | 本网站使用开源的插画地图与历史地图查看器<a href='https://www.maplat.jp/' target='_blank'>Maplat</a>构建。 |
| `html.help_selection_content` | basemap | 在页面的左下和右下的位置，可以找到像<img src='${overlay.png}'>这样的可滑动的缩略图。可以选择想查看的地图。<br>左右滑动对想看的地图进行选择，点击后即可切换成想看的地图。<br>在左下的地图滑块是基础的地图(当前年代)，右下边可选择的地图滑块是手绘地图或历史地图。 | 在页面的左下和右下的位置，可以找到像<img src='${overlay.png}'>这样的可滑动的缩略图。可以选择想查看的地图。<br>左右滑动对想看的地图进行选择，点击后即可切换成想看的地图。<br>左下的滑块用于选择底图（准确的现代地图），右下的滑块用于选择手绘地图或历史地图。 |
| `html.help_etc_attr` | 言語の誤り | <img src='${attr.png}'>按钮 显示中地图的制作者、所有者、许可等各种信息显示。 | <img src='${attr.png}'>按钮：显示当前地图的制作者、所有者、许可等各种信息。 |
| `html.help_share_help` | 言語の誤り | <img src='${share.png}'>按钮: 显示向SNS等其它应用分享的页面。 | <img src='${share.png}'>按钮: 显示将此应用分享到社交网络等的界面。 |
| `html.help_etc_border` | 言語の誤り | <img src='${border.png}'>按钮: 地图的边界显示。<br>在边界内点击也可以切换地图显示。<br>在电脑上操作可以用鼠标在地图上上移动选择后点击进行地图切换显示，手机上在选中地图后，再一次点击后进行地图切换显示。 | <img src='${border.png}'>按钮：显示地图边界。<br>也可以点击边界内侧来切换地图。<br>在电脑上用鼠标移到想看的地图上并点击切换；在手机上先点击选择地图，再次点击即可切换。 |
| `html.help_etc_marker_list` | layer | <img src='${marker_list.png}'>按鈕: 会在画面上按顺序对每种标记进行显示/隐藏的切换操作。 | <img src='${marker_list.png}'>按钮：显示可按标记图层切换显示/隐藏的界面。 |
| `html.help_etc_slider` | basemap | <img src='${slider.png}'>滑块: 显示中的地图的透明度调整，可以将背景中的地图透明地看到。<br>只支持在手绘地图、历史地图中使用，基本地图显示时不可用。 | <img src='${slider.png}'>滑块：调整显示中地图的透明度，以便透出底图。<br>仅在显示手绘地图或历史地图时可用，显示底图时不可用。 |
| `app.gps_error` | 言語の誤り | 位置信息不详 | 无法使用位置信息 |

## zh-TW（中国語（繁体字））: 4 件（うち要確認 3 件）

| キー | 概念 | 変更前 | 変更後 |
|---|---|---|---|
| `html.help_using_maplat` | 言語の誤り（要確認） | 本網站使用開放原始碼繪圖／古地圖檢視器<a href='https://www.maplat.jp/' target='_blank'>Maplat</a>建置。 | 本網站使用開放原始碼手繪地圖／古地圖檢視器<a href='https://www.maplat.jp/' target='_blank'>Maplat</a>建置。 |
| `html.help_selection_content` | 言語の誤り（要確認） | 畫面左下與右下會顯示像<Img src='${overlay.png}'>這樣附縮圖的滑桿，可用來選擇要顯示的地圖。<br>左右滑動選擇想看的地圖，點一下縮圖即可切換。<br>左下的滑桿用於選擇底圖(準確的現代地圖)，右下的滑桿用於選擇繪圖或古地圖。 | 畫面左下與右下會顯示像<Img src='${overlay.png}'>這樣附縮圖的滑桿，可用來選擇要顯示的地圖。<br>左右滑動選擇想看的地圖，點一下縮圖即可切換。<br>左下的滑桿用於選擇底圖(準確的現代地圖)，右下的滑桿用於選擇手繪地圖或古地圖。 |
| `html.help_share_help` | app | <img src='${share.png}'>按鈕：顯示分享到社群網站等的畫面。 | <img src='${share.png}'>按鈕：顯示將此應用程式分享到社群網站等的畫面。 |
| `html.help_etc_slider` | basemap・言語の誤り（要確認） | <img src='${slider.png}'>滑桿：調整顯示中地圖的透明度，讓背景地圖能透出顯示。<br>僅在顯示繪圖或古地圖時有效，顯示底圖時無法使用。 | <img src='${slider.png}'>滑桿：調整顯示中地圖的透明度，讓底圖能透出顯示。<br>僅在顯示手繪地圖或古地圖時有效，顯示底圖時無法使用。 |
