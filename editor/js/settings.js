define(['bootstrap', 'model/settings'],
    function(bsn, Settings) {
        var backend = require('electron').remote.require('../lib/settings');
        var settings = new Settings(backend.getSettings());

        var saveFolder = document.querySelector('#saveFolder');
        saveFolder.value = settings.get('saveFolder');
        saveFolder.addEventListener('change', function(ev) {
            settings.set('saveFolder', ev.target.value);
        });
        saveFolder.addEventListener('focus', function(ev) {
            saveFolder.blur();
            backend.showSaveFolderDialog(saveFolder.value);
        });

        settings.on('change', function(ev){
            if (settings.dirty()) {
                document.querySelector('#reset').removeAttribute('disabled');
                document.querySelector('#submit').removeAttribute('disabled');
            } else {
                document.querySelector('#reset').setAttribute('disabled', true);
                document.querySelector('#submit').setAttribute('disabled', true);
            }
        });

        const {ipcRenderer} = require('electron');
        ipcRenderer.on('saveFolderSelected', function(event, arg) {
            saveFolder.value = arg;
            settings.set('saveFolder', arg);
        });

        document.querySelector('#reset').addEventListener('click', function(){
            settings.reset();
            saveFolder.value = settings.get('saveFolder');
        });

        document.querySelector('#submit').addEventListener('click', function(){
            var keys = settings.dirtyKeyList();
            for (var i=0; i<keys.length; i++) {
                var key = keys[i];
                backend.setSetting(key, document.querySelector('#'+key).value);
            }
            settings.setCurrentAsDefault();
            document.querySelector('#reset').setAttribute('disabled', true);
            document.querySelector('#submit').setAttribute('disabled', true);
        });

        document.querySelector('#close').addEventListener('click', function(){
            window.close();
        });

        window.addEventListener('beforeunload', function(e) {
            if (!settings.dirty()) return;
            if (!confirm('設定に変更が加えられていますが保存されていません。\n保存せずに閉じてよいですか?')) {
                e.returnValue = "false";
            }
        });
    });
