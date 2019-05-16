if (!window.maplatBridge) {
    window.maplatBridge = {};
}
var maplatBridge = window.maplatBridge;
var queue = [];
var running = false;
function runQueue(queue) {
    var args = queue.shift();
    window.location = 'maplatBridge://call?key=' + encodeURIComponent(args[0]) + '&value=' + encodeURIComponent(args[1]);
    setTimeout(function() {
        if (queue.length == 0) {
            running = false;
        } else {
            runQueue(queue);
        }
    }, 1);
}
maplatBridge.callWeb2App = maplatBridge.callWeb2App || function(key, data) {
    queue.push([key, data]);
    if (running) return;
    running = true;
    runQueue(queue);
};
var app;
maplatBridge.callApp2Web = function(key, data, callbackKey) {
    try {
        if (data == '(null)' || !data) data = '[]';
        data = JSON.parse(data);
    } catch (e) {}
    switch (key) {
        case 'maplatInitialize':
            data.mobile_if = true;
            Maplat.createObject(data[0]).then(function(app_) {
                app = app_;
                maplatBridge.callWeb2App('ready', 'maplatObject');
                app.addEventListener('clickMarker', function(evt) {
                    maplatBridge.callWeb2App('clickMarker', JSON.stringify(evt.detail));
                });
                app.addEventListener('changeViewpoint', function(evt) {
                    maplatBridge.callWeb2App('changeViewpoint', JSON.stringify(evt.detail));
                });
                app.addEventListener('outOfMap', function(evt) {
                    maplatBridge.callWeb2App('outOfMap', JSON.stringify(evt.detail));
                });
                app.addEventListener('clickMap', function(evt) {
                    maplatBridge.callWeb2App('clickMap', JSON.stringify(evt.detail));
                });
            });
            break;
        default:
            if (app) {
                var func = app[key];
                if (func) {
                    var ret = func.apply(app, data);
                    if (ret instanceof Object) {
                        ret = JSON.stringify(ret);
                    }
                    if (callbackKey) {
                        maplatBridge.callWeb2App('methodCallback', JSON.stringify({
                            key: callbackKey,
                            value: ret
                        }));
                    } else {
                        return ret;
                    }
                }
            }
            break;
    }
};
maplatBridge.callWeb2App('ready', 'callApp2Web');
