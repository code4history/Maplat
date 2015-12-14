define(["ol-custom", "tps"], function(ol, tps) {
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