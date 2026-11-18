# Maplat UI 用語集（生成物）

<!-- 生成物: 手で編集しない。`node scripts/maplat-glossary-check.mjs --write` で作り直す。正本は docs/i18n/maplat-glossary.json -->

正本は `maplat-glossary.json`（概念・言語別の代表語・許容形・統一前の形・禁止形）と `maplat-glossary.exceptions.json`（例外）。
検査は `node scripts/maplat-glossary-check.mjs`（`pnpm smoke:maplat-glossary`）。文言を設計する前に、ここで概念を探す。
正本と locale は同じ PR で変えられない（初版を除く）。新しい語・例外は、先に正本だけの PR を合流させてから locale の PR を出す。
まだ無いキーへの例外は、正本だけの PR の時点では警告（pending-key）になり、後の locale の PR でキーを足すと働く。手順は AGENTS.md の「UI Wording & Glossary」。

概念 8・結び付いたキー 32・例外 0（）

| 概念 | 説明 | 根拠キー | 結び付け |
|---|---|---|---:|
| [map](#map) | 表示・操作する地図。ベースマップは別概念 | `control.info` | 22 |
| [basemap](#basemap) | 古地図の下に敷く地図（ベースマップ） | `html.help_selection_content` | 2 |
| [attribution](#attribution) | 地図画像・データの帰属（著作権表示） | `html.attr` | 3 |
| [citation](#citation) | 地図・ベースマップの出所（書誌的な典拠） | `html.reference` | 1 |
| [app](#app) | 地図と POI をまとめて公開するアプリ | `html.share_app_title` | 3 |
| [layer](#layer) | 地図のレイヤー・POI のレイヤー | `html.help_etc_marker_list` | 1 |
| [viewer](#viewer) | Maplat の地図を表示する部分（Maplat UI そのもの） | `html.help_using_maplat` | 1 |
| [marker](#marker) | 地図上の地点を示す UI マーカー。POI データそのものではない | `control.marker_list` | 6 |

## map

表示・操作する地図。ベースマップは別概念

根拠キー `control.info`。必須形を求める言語: de, en, es, fr, id, ja, ko, th, vi, zh, zh-TW

| 言語 | 代表語 | 許容形 | 統一前の形 | 禁止形 | 除外語 |
|---|---|---|---|---|---|
| de | karte | karte | — | — | Google Maps、Google マップ、import map、basiskarte、Hintergrundkarte |
| en | map | map、maps | — | — | Google Maps、Google マップ、import map、base map、base maps、background map、background maps、basemap、basemaps、Google Maps |
| es | mapa | mapa、mapas | — | — | Google Maps、Google マップ、import map、mapa base、mapas base、mapa de fondo |
| fr | carte | carte、cartes、cartographique、cartographiques | — | — | Google Maps、Google マップ、import map、fond de carte、fonds de carte、carte de fond、carte de base |
| id | peta | peta | — | — | Google Maps、Google マップ、import map、peta dasar、peta latar |
| ja | 地図 | 地図 | — | — | Google Maps、Google マップ、import map、背景地図、Google マップ |
| ko | 지도 | 지도 | — | — | Google Maps、Google マップ、import map、배경 지도 |
| th | แผนที่ | แผนที่ | — | — | Google Maps、Google マップ、import map、แผนที่พื้นฐาน、แผนที่พื้นหลัง、แผนที่ฐาน |
| vi | bản đồ | bản đồ | — | — | Google Maps、Google マップ、import map、bản đồ nền |
| zh | 地图 | 地图 | — | — | Google Maps、Google マップ、import map、底图、背景地图 |
| zh-TW | 地圖 | 地圖 | — | — | Google Maps、Google マップ、import map、底圖、背景地圖 |

## basemap

古地図の下に敷く地図（ベースマップ）

根拠キー `html.help_selection_content`。必須形を求める言語: de, en, es, fr, id, ja, ko, th, vi, zh, zh-TW

| 言語 | 代表語 | 許容形 | 統一前の形 | 禁止形 | 除外語 |
|---|---|---|---|---|---|
| de | basiskarte | basiskarte | hintergrundkarte | — | — |
| en | base map | base map、base maps、basemap、basemaps | background map、background maps | — | — |
| es | mapa base | mapa base、mapas base | mapa de fondo、mapas de fondo | — | — |
| fr | fond de carte | fond de carte、fonds de carte | carte de fond、carte de base、cartes de fond | — | — |
| id | peta dasar | peta dasar | peta latar | — | — |
| ja | ベースマップ | ベースマップ | 背景地図 | — | — |
| ko | 베이스맵 | 베이스맵 | 배경 지도 | — | — |
| th | แผนที่พื้นฐาน | แผนที่พื้นฐาน | แผนที่พื้นหลัง、แผนที่ฐาน | — | — |
| vi | bản đồ nền | bản đồ nền | — | — | — |
| zh | 底图 | 底图 | 背景地图 | — | — |
| zh-TW | 底圖 | 底圖 | 背景地圖 | — | — |

## attribution

地図画像・データの帰属（著作権表示）

根拠キー `html.attr`。必須形を求める言語: de, en, es, fr, id, ja, ko, th, vi, zh, zh-TW

| 言語 | 代表語 | 許容形 | 統一前の形 | 禁止形 | 除外語 |
|---|---|---|---|---|---|
| de | quellenangabe | quellenangabe | attribution、datenattribution | — | — |
| en | attribution | attribution、attributions | — | — | Creative Commons Attribution、クリエイティブ・コモンズ 表示 |
| es | atribución | atribución、atribuciones | — | — | — |
| fr | attribution | attribution、attributions | — | — | — |
| id | atribusi | atribusi | — | — | — |
| ja | 帰属表記 | 帰属表記、地図画像帰属、データ帰属 | 帰属表示 | — | Creative Commons Attribution、クリエイティブ・コモンズ 表示 |
| ko | 저작자 표시 | 저작자 표시、출처 표시 | — | — | — |
| th | การระบุที่มา | การระบุที่มา、ระบุที่มา | การระบุแหล่งที่มา | — | Creative Commons Attribution、クリエイティブ・コモンズ 表示 |
| vi | ghi công | ghi công、ghi nguồn | — | — | — |
| zh | 署名 | 署名、归属 | 版权信息 | — | — |
| zh-TW | 署名 | 署名、歸屬 | 版權標示 | — | — |

## citation

地図・ベースマップの出所（書誌的な典拠）

根拠キー `html.reference`。必須形を求める言語: de, en, es, fr, id, ja, ko, th, vi, zh, zh-TW

| 言語 | 代表語 | 許容形 | 統一前の形 | 禁止形 | 除外語 |
|---|---|---|---|---|---|
| de | quelle | quelle | — | — | — |
| en | source | source | — | — | — |
| es | fuente | fuente | — | — | — |
| fr | source | source | — | — | — |
| id | sumber | sumber | — | — | — |
| ja | 典拠 | 典拠 | 出典 | — | — |
| ko | 출처 | 출처 | — | — | — |
| th | แหล่งอ้างอิง | แหล่งอ้างอิง | แหล่งที่มา | — | — |
| vi | nguồn | nguồn | — | — | — |
| zh | 来源 | 来源、出处 | — | — | — |
| zh-TW | 來源 | 來源、出處 | — | — | — |

## app

地図と POI をまとめて公開するアプリ

根拠キー `html.share_app_title`。必須形を求める言語: de, en, es, fr, id, ja, ko, th, vi, zh, zh-TW

| 言語 | 代表語 | 許容形 | 統一前の形 | 禁止形 | 除外語 |
|---|---|---|---|---|---|
| de | app | app | — | — | Web App Manifest |
| en | app | app、apps | — | — | Web App Manifest |
| es | aplicación | aplicación、aplicaciones、app、apps | — | — | Web App Manifest |
| fr | application | application、applications、app、apps | — | — | Web App Manifest |
| id | aplikasi | aplikasi、app | — | — | Web App Manifest |
| ja | アプリ | アプリ | — | — | Web App Manifest |
| ko | 앱 | 앱 | — | — | Web App Manifest |
| th | แอปพลิเคชัน | แอปพลิเคชัน | แอป | — | Web App Manifest |
| vi | ứng dụng | ứng dụng | — | — | Web App Manifest |
| zh | 应用 | 应用 | — | — | Web App Manifest |
| zh-TW | 應用程式 | 應用程式 | 應用 | — | Web App Manifest |

## layer

地図のレイヤー・POI のレイヤー

根拠キー `html.help_etc_marker_list`。必須形を求める言語: de, en, es, fr, id, ja, ko, th, vi, zh, zh-TW

| 言語 | 代表語 | 許容形 | 統一前の形 | 禁止形 | 除外語 |
|---|---|---|---|---|---|
| de | ebene | ebene | layer | — | angegeben |
| en | layer | layer、layers、sublayer | — | — | line-layer-opacity |
| es | capa | capa、capas、subcapa | — | — | — |
| fr | calque | calque、calques、couche、couches | — | — | — |
| id | lapisan | lapisan、sublapisan | layer | — | — |
| ja | レイヤ | レイヤ | — | — | line-layer-opacity |
| ko | 레이어 | 레이어 | — | — | — |
| th | เลเยอร์ | เลเยอร์ | ชั้น | — | — |
| vi | lớp | lớp | — | — | — |
| zh | 图层 | 图层 | — | — | — |
| zh-TW | 圖層 | 圖層 | — | — | — |

## viewer

Maplat の地図を表示する部分（Maplat UI そのもの）

根拠キー `html.help_using_maplat`。必須形を求める言語: de, en, es, fr, id, ja, ko, th, vi, zh, zh-TW

| 言語 | 代表語 | 許容形 | 統一前の形 | 禁止形 | 除外語 |
|---|---|---|---|---|---|
| de | viewer | viewer | — | — | — |
| en | viewer | viewer | — | — | — |
| es | visor | visor | — | — | — |
| fr | visionneuse | visionneuse | visualiseur | — | — |
| id | penampil | penampil | viewer | — | — |
| ja | ビューア | ビューア | — | — | — |
| ko | 뷰어 | 뷰어 | — | — | — |
| th | โปรแกรมดู | โปรแกรมดู | ตัวแสดงผล、วิวเวอร์ | — | — |
| vi | trình xem | trình xem | — | — | — |
| zh | 查看器 | 查看器 | — | — | — |
| zh-TW | 檢視器 | 檢視器 | — | — | — |

## marker

地図上の地点を示す UI マーカー。POI データそのものではない

根拠キー `control.marker_list`。必須形を求める言語: de, en, es, fr, id, ja, ko, th, vi, zh, zh-TW

| 言語 | 代表語 | 許容形 | 統一前の形 | 禁止形 | 除外語 |
|---|---|---|---|---|---|
| de | Marker | Marker | — | — | — |
| en | marker | marker、markers | — | — | — |
| es | marcador | marcador、marcadores | — | — | — |
| fr | marqueur | marqueur、marqueurs | — | — | — |
| id | penanda | penanda | — | — | — |
| ja | マーカー | マーカー | — | — | — |
| ko | 마커 | 마커 | — | — | — |
| th | หมุด | หมุด | — | — | — |
| vi | điểm đánh dấu | điểm đánh dấu、đánh dấu | — | — | — |
| zh | 标记 | 标记 | — | — | — |
| zh-TW | 標記 | 標記 | — | — | — |

