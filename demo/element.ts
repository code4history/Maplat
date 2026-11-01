// demo/element.html の登録の入口: 層 A に Core の <maplat-app> を、層 B に <maplat-ui> を登録する。
// 層 A を別の実装に替えるときは、層 A の import（と下の一時の回避）だけを替える。
import "@maplat/core/element"; // 層 A（Core）。副作用で <maplat-app> を登録する
import "../src/element/index.ts"; // 層 B（<maplat-ui>）。副作用で <maplat-ui> を登録する
