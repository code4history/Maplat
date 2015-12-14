define(["ol3", "tps"], function(ol, tps) {
    // スマホタッチで中間ズームを許す
    ol.interaction.PinchZoom.handleUpEvent_ = function(mapBrowserEvent) {
        if (this.targetPointers.length < 2) {
            var map = mapBrowserEvent.map;
            var view = map.getView();
            view.setHint(ol.ViewHint.INTERACTING, -1);
            //var resolution = view.getResolution();
            // Zoom to final resolution, with an animation, and provide a
            // direction not to zoom out/in if user was pinching in/out.
            // Direction is > 0 if pinching out, and < 0 if pinching in.
            //var direction = this.lastScaleDelta_ - 1;
            //ol.interaction.Interaction.zoom(map, view, resolution,
            //    this.anchor_, this.duration_, direction);
            return false;
        } else {
            return true;
        }
    };

    ol.source.histMap = function(opt_options) {
        var options = opt_options || {};
        options.wrapX = false;
        if (options.mapID) {
            this.mapID = options.mapID
            options.url = 'tiles/' + options.mapID + '-{z}_{x}_{y}.jpg';
        }

        ol.source.OSM.call(this, options) ;
    }
    console.log("histMap");

    ol.inherits(ol.source.histMap, ol.source.OSM);
    ol.source.histMap.prototype.getMapID = function() {
        return this.mapID;
    };

    return ol.source.histMap;
});