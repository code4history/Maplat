define(['bootstrap', 'wookmark'],
    function(bsn, Wookmark) {
        const {ipcRenderer} = require('electron');

        var wookmark = new Wookmark('#maplist');

        var backend = require('electron').remote.require('../lib/maplist');
        backend.request();

        ipcRenderer.on('mapListAdd', function(event, arg) {
            var calcHeight;
            var thumbnail;
            if (!arg.width || !arg.height || !arg.thumbnail) {
                calcHeight = 190;
                thumbnail = 'img/no_image.png';
            } else {
                calcHeight = Math.floor(190 / arg.width * arg.height);
                thumbnail = arg.thumbnail;
            }

            var html = `    <li>
      <a href="mapedit.html?mapid=${arg.mapID}">
        <img src="${thumbnail}" width="190" height="${calcHeight}">
      </a>
      <p>${arg.title}</p>
    </li>`;
            var div = document.createElement('div');
            div.innerHTML = html;
            var elem = div.querySelector('li');

            document.querySelector('#maplist').appendChild(elem);
            wookmark = new Wookmark('#maplist');
        });
    });
