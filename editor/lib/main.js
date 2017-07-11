'use strict';

var electron = require('electron');
var path = require('path');
var settings = require('./settings');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
var Menu = electron.Menu;

var mainWindow = null;

var appWidth = 1200;
var appHeight = 800;

app.on('window-all-closed', function() {
    if (process.platform != 'darwin')
        app.quit();
});

app.on('ready', function() {
    Menu.setApplicationMenu(menu);

    // ブラウザ(Chromium)の起動, 初期画面のロード
    mainWindow = new BrowserWindow({width: appWidth, height: appHeight});
    var indexurl = 'file://' + __dirname.replace(/\\/g, '/') + '/../maplist.html';
    mainWindow.loadURL(indexurl);
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
            {label: 'Quit', accelerator: 'Command+Q', click: function () {app.quit();}},
            {
                label: 'Settings',
                accelerator: 'Command+S',
                click: function() {
                    var parent = BrowserWindow.getFocusedWindow();
                    var child = new BrowserWindow({parent: parent, modal: false, show: false, width: 650, height: 280, resizable: false });
                    child.loadURL('file://' + __dirname.replace(/\\/g, '/') + '/../settings.html');
                    var focusRejector = function() {
                        child.focus();
                    };
                    child.once('ready-to-show', function() {
                        child.show();
                    });
                    parent.on('focus', focusRejector);
                    child.once('close', function() {
                        parent.removeListener('focus', focusRejector);
                    });
                }
            }
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