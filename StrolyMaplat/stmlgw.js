'use strict';
const request = require('request');
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;
const Buffer = require('buffer/').Buffer;
const AWS = require('aws-sdk');
const select = xpath.useNamespaces({
  "kml": "http://earth.google.com/kml/2.1",
  "dcterms" : "http://purl.org/dc/terms/",
  "illustmap" : "http://illustmap.org/ns/2.0",
  "xml": "http://www.w3.org/XML/1998/namespace"
});
let dynamodb = null;

const setDynamoClient = (event) => {
  if ("isOffline" in event && event.isOffline) {
    dynamodb = new AWS.DynamoDB.DocumentClient({
      region: "localhost",
      endpoint: "http://localhost:8000"
    });
  } else { 
    dynamodb = new AWS.DynamoDB.DocumentClient();
  }
};

const parseCoord = (pathString, target) => {
  return select(".//" + pathString + "/text()", target).toString()
          .split(",").map(function(val) { return parseFloat(val) });
};

const getKmlItem = (mapid, callback) => {
  const params = {
    TableName: 'strolykmls',
    Key: {
      mapid: mapid
    }
  };
  dynamodb.get(params, (err, dbres) => {
    if (err) callback('Err');
    if (!("Item" in dbres)) {
      let errNum = 0;
      const promises = ['cs','od'].map((sv) => {
        const url = 'https://' + sv +'s3.illustmap.org/' + mapid + '.kml';
        return new Promise((res, rej) => {
          const reqOpt = {
            url: url,
            method: 'GET'
          };
          request(reqOpt, (err, resp, body) => {
            if (err || body.match(/<Message>Access Denied/)) {
              errNum++;
              if (errNum == 2) res("Err");
              return;
            }
            const epoch = new Date(resp.headers['last-modified']).getTime() / 1000;
            const putParams = {
              TableName: 'strolykmls',
              Item: {
                mapid: mapid,
                epoch: epoch,
                body: body
              }
            };
            dynamodb.put(putParams, (err) => {
              console.log(err);
            });
            res(body);
          });
        });
      });

      Promise.race(promises).then((content) => {
        callback(content);
      });
    } else {
      callback(dbres.Item.body);
    }
  });
};

module.exports.xmlgateway = (event, context, callback) => {
  setDynamoClient(event);
  const mapid = event.path.mapid;
  getKmlItem(mapid, function(content){
    const err = content =='Err';
    const stat = err ? new Error('[404] Not found') : null;
    const body = err ? 'Kml not found' : (function() {
      const coords = [];
      const doc = new dom().parseFromString(content);
      const nodes = select("//kml:Folder[@type='illustmap']", doc);
      const points = select("./kml:Placemark", nodes[0]);
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const illsCoord = parseCoord('illustmap:xy', point);
        const mercCoord = parseCoord('illustmap:mercator_xy', point);
        coords.push([illsCoord, mercCoord]);
      }
      return coords;
    })();
    callback(stat, {
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });

  });
};

module.exports.appgateway = (event, context, callback) => {
  setDynamoClient(event);
  const mapid = event.path.mapid;
  getKmlItem(mapid, function(content){
    const err = content =='Err';
    const stat = err ? new Error('[404] Not found') : null;
    const body = err ? 'Kml not found' : (function() {
      const body = {
        "fake_gps" : false,
        "default_zoom" : 17,
        "now_year" : 2017,
        "now_era" : "現在",
        "sources" : [
          {
            "attr" : "国土地理院",
            "label" : "地理院",
            "mapID" : "gsi",
            "maptype" : "base",
            "url" : "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png"
          },
          {
            //"era"       : "正保城絵図 南部領盛岡平城絵図 (正保元年)",
            "mapID"     : mapid,
            "maptype"   : "stroly-maplat",
            "algorythm" : "tin",
            //"year"      : 1644,
            "label"     : "古地図"
          }
        ], 
        "pois" :[]
      };
      const mapSetting = body.sources[1];
      const doc = new dom().parseFromString(content);
      const wh = parseCoord('illustmap:wh', doc);
      mapSetting.width = wh[0];
      mapSetting.height = wh[1];
      const title = select("//illustmap:title[@xml:lang='ja']/text()", doc).toString();
      body.app_name = title;
      const museum = select("//dcterms:contributor[@xml:lang='ja']/text()", doc).toString();
      mapSetting.attr = title + " - " + museum;
      const sw = parseCoord('illustmap:sw', doc);
      const ne = parseCoord('illustmap:ne', doc);
      body.home_position = [ (sw[0] + ne[0]) / 2, (sw[1] + ne[1]) / 2 ];
      return body;
    })();
    callback(stat, {
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(body)
    });

  });
};

module.exports.imggateway = (event, context, callback) => {
  const mapid = event.path.mapid;
  const zoom = event.path.zoom;
  const x = event.path.x;
  const y = event.path.y;
  let errNum = 0;

  const promises = ['od','cs'].reduce((prev, curr) =>{
    ['jpg','png'].map((ext) => { prev.push([curr,ext]); });
    return prev;
  }, []).map((matrix) => {
    const url = "https://" + matrix[0] + "s3.illustmap.org/tiles/" + mapid + "/" + mapid + "-" + zoom +
      "_" + x + "_" + y + "." + matrix[1];
    return new Promise((res, rej) => {
      const reqOpt = {
        url: url,
        method: 'GET',
        encoding: null
      };
      request(reqOpt, (err, resp, body) => {
        const base64 = body.toString('base64');
        if (err || base64.match(/^PD94bWwgdmVyc2lvb/)) {
          errNum++;
          if (errNum == 4) res("Err");
          return;
        }
        const ctype = resp.headers['content-type'];
        res({
          headers: {'Content-Type': ctype},
          body: base64
        });
      });
    });
  });

  Promise.race(promises).then((content) => {
    const err = content =='Err';
    const stat = err ? new Error('[404] Not found') : null;
    const ret = err ? { body: 'Kml not found' } : content;
    callback(stat, content);
  });
};


