'use strict';

var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var Menu = electron.Menu;

var mainWindow = null;

const appWidth = 1200;
const appHeight = 800;

app.on('window-all-closed', function() {
    if (process.platform != 'darwin')
        app.quit();
});

app.on('ready', function() {
    Menu.setApplicationMenu(menu);

    // ブラウザ(Chromium)の起動, 初期画面のロード
    mainWindow = new BrowserWindow({width: appWidth, height: appHeight});
    mainWindow.loadURL('file://' + __dirname + '/index.html');
    mainWindow.setMinimumSize(appWidth, appHeight);

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});

// メニュー情報の作成
var template = [
    {
        label: 'ReadUs',
        submenu: [
            {label: 'Quit', accelerator: 'Command+Q', click: function () {app.quit();}}
        ]
    }, {
        label: 'File',
        submenu: [
            {label: 'Open', accelerator: 'Command+O', click: function() {
                // 「ファイルを開く」ダイアログの呼び出し
                const {dialog} = require('electron');
                dialog.showOpenDialog({ properties: ['openDirectory']}, function (baseDir){
                    if(baseDir && baseDir[0]) {
                        openWindow(baseDir[0]);
                    }
                });
            }}
        ]
    }, {
        label: 'View',
        submenu: [
            {label: 'Reload', accelerator: 'Command+R', click: function() {
                BrowserWindow.getFocusedWindow().reload();
            }},
            {label: 'Toggle DevTools', accelerator: 'Alt+Command+I', click: function() {
                BrowserWindow.getFocusedWindow().toggleDevTools();
            }}
        ]
    }
];

var menu = Menu.buildFromTemplate(template);