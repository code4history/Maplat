//
//  MaplatView.m
//  MaplatView
//
//  Created by Takashi Irie on 2018/07/03.
//  Copyright © 2018 TileMapJp. All rights reserved.
//

import Foundation
import UIKit

public class MaplatView: UIView, MaplatCacheDelegate {
    
    var cache: MaplatCache?
    var initializeValue: [String : Any]?
    var webView: UIWebView?
    
    @objc
    public var delegate: MaplatViewDelegate?
    
    @objc
    class public func configure() {
        let paths = NSSearchPathForDirectoriesInDomains(.cachesDirectory, .userDomainMask, true)
        let path = paths[0].appending("/webCache")
        let defaultCache = URLCache.shared
        let maplatCache = MaplatCache(memoryCapacity: defaultCache.memoryCapacity, diskCapacity: defaultCache.diskCapacity, diskPath: path)
        URLCache.shared = maplatCache
    }
    
    @objc
    public init(frame: CGRect, appID: String?, setting: [String : Any]?) {
        super.init(frame: frame)
        self.cache = (URLCache.shared as! MaplatCache)
        self.cache!.delegate = self
        self.webView = UIWebView(frame: self.bounds)
        self.webView!.autoresizingMask = [.flexibleWidth,.flexibleHeight]
        self.webView!.delegate = self.cache
        self.addSubview(self.webView!)
        self.webView!.loadRequest(URLRequest(url: URL(string: "http://localresource/mobile.html")!))
        var jsonObj = [String : Any]()
        jsonObj["appid"] = appID == nil ? "mobile" : appID
        if (setting != nil) {
            jsonObj["setting"] = setting
        }
        self.initializeValue = jsonObj
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func toDictionary(_ value: String) -> [String: Any]? {
        if let data = value.data(using: .utf8) {
            do {
                return try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]
            } catch {
                print(error.localizedDescription)
            }
        }
        return nil
    }
    
    // MARK: - MaplatCacheDelegate
    public func onCallWeb2App(_ key: String, value: String) {
        guard let delegate = self.delegate else {
            return
        }
        
        print("onCallWeb2App:\(key) value:\(value)")
        if (key == "ready") {
            if (value == "callApp2Web") {
                self.callApp2Web("maplatInitialize", value: [self.initializeValue as Any])
            } else if (value == "maplatObject") {
                delegate.onReady()
            }
        } else if (key == "clickMarker") {
            if let jsonObject = toDictionary(value) {
                if let markerId = jsonObject["id"] {
                    let markerData = jsonObject["data"]
                    delegate.onClickMarker(markerId: String(describing: markerId), markerData: markerData)
                }
            }
        } else if (key == "changeViewpoint") {
            if let jsonObject = toDictionary(value),
                let x = (jsonObject["x"] as? NSNumber)?.doubleValue,
                let y = (jsonObject["y"] as? NSNumber)?.doubleValue,
                let longitude = (jsonObject["longitude"] as? NSNumber)?.doubleValue,
                let latitude = (jsonObject["latitude"] as? NSNumber)?.doubleValue,
                let mercator_x = (jsonObject["mercator_x"] as? NSNumber)?.doubleValue,
                let mercator_y = (jsonObject["mercator_y"] as? NSNumber)?.doubleValue,
                let zoom = (jsonObject["zoom"] as? NSNumber)?.doubleValue,
                let merc_zoom = (jsonObject["merc_zoom"] as? NSNumber)?.doubleValue,
                let direction = (jsonObject["direction"] as? NSNumber)?.doubleValue,
                let rotation = (jsonObject["rotation"] as? NSNumber)?.doubleValue {
                delegate.onChangeViewpoint(x: x, y: y, latitude: latitude, longitude: longitude, mercatorX: mercator_x, mercatorY: mercator_y, zoom: zoom, mercZoom: merc_zoom, direction: direction, rotation: rotation)
            }
        } else if (key == "outOfMap") {
            delegate.onOutOfMap()
        } else if (key == "clickMap") {
            if let jsonObject = toDictionary(value) {
                if let longitude = (jsonObject["longitude"] as? NSNumber)?.doubleValue,
                    let latitude = (jsonObject["latitude"] as? NSNumber)?.doubleValue {
                    delegate.onClickMap(latitude: latitude, longitude: longitude)
                }
            }
        }
    }
    
    @objc
    public func callApp2Web(_ key: String, value: [Any]) {
        self.callApp2Web(key, value: value, callback: nil)
    }
    
    @objc
    public func callApp2Web(_ key: String, value: [Any], callback: ((String?) -> ())?) {
        do {
            let jsonData = try JSONSerialization.data(withJSONObject: value, options: [])
            let jsonStr = String(data: jsonData, encoding: .utf8)!
            let retVal = self.webView!.stringByEvaluatingJavaScript(from: "maplatBridge.callApp2Web('\(key)','\(jsonStr)');")
            if let callback = callback {
                callback(retVal)
            }
        } catch {
            print(error.localizedDescription)
        }
        
    }
    
    @objc
    public func addMarkerWithLatitude(_ latitude: CDouble, longitude: CDouble, markerId: CLong, stringData markerData: String) {
        self.addMarkerWithLatitude(latitude, longitude: longitude, markerId: markerId, stringData: markerData, iconUrl: nil)
    }
    
    @objc
    public func addMarkerWithLatitude(_ latitude: CDouble, longitude: CDouble, markerId: CLong, stringData markerData: String, iconUrl: String?) {
        self.addMarkerWithLatitude(latitude, longitude: longitude, markerId: markerId, markerData: markerData, iconUrl: iconUrl)
    }
    
    @objc
    public func addMarkerWithLatitude(_ latitude: CDouble, longitude: CDouble, markerId: CLong, longData markerData: CLong) {
        self.addMarkerWithLatitude(latitude, longitude: longitude, markerId: markerId, longData: markerData, iconUrl: nil)
    }
    
    @objc
    public func addMarkerWithLatitude(_ latitude: CDouble, longitude: CDouble, markerId: CLong, longData markerData: CLong, iconUrl: String?) {
        self.addMarkerWithLatitude(latitude, longitude: longitude, markerId: markerId, markerData: NSNumber(value: markerData), iconUrl: iconUrl)
    }
    
    @objc
    public func addMarkerWithLatitude(_ latitude: CDouble, longitude: CDouble, markerId: CLong, doubleData markerData: CDouble) {
        self.addMarkerWithLatitude(latitude, longitude: longitude, markerId: markerId, doubleData: markerData, iconUrl: nil)
    }
    
    @objc
    public func addMarkerWithLatitude(_ latitude: CDouble, longitude: CDouble, markerId: CLong, doubleData markerData: CDouble, iconUrl: String?) {
        self.addMarkerWithLatitude(latitude, longitude: longitude, markerId: markerId, markerData: NSNumber(value: markerData), iconUrl: iconUrl)
    }
    
    @objc
    public func addMarkerWithLatitude(_ latitude: CDouble, longitude: CDouble, markerId: CLong, arrayData markerData: [Any]) {
        self.addMarkerWithLatitude(latitude, longitude: longitude, markerId: markerId, arrayData: markerData, iconUrl: nil)
    }
    
    @objc
    public func addMarkerWithLatitude(_ latitude: CDouble, longitude: CDouble, markerId: CLong, arrayData markerData: [Any], iconUrl: String?) {
        self.addMarkerWithLatitude(latitude, longitude: longitude, markerId: markerId, markerData: markerData, iconUrl: iconUrl)
    }
    
    @objc
    public func addMarkerWithLatitude(_ latitude: CDouble, longitude: CDouble, markerId: CLong, dictData markerData: [NSObject : Any]) {
        self.addMarkerWithLatitude(latitude, longitude: longitude, markerId: markerId, dictData: markerData, iconUrl: nil)
    }
    
    @objc
    public func addMarkerWithLatitude(_ latitude: CDouble, longitude: CDouble, markerId: CLong, dictData markerData: [NSObject : Any], iconUrl: String?) {
        self.addMarkerWithLatitude(latitude, longitude: longitude, markerId: markerId, markerData: markerData, iconUrl: iconUrl)
    }
    
    @objc
    public func addMarkerWithLatitude(_ latitude: CDouble, longitude: CDouble, markerId: CLong, markerData: Any, iconUrl: String?) {
        var jsonObj: [String: Any] = [
            "lnglat": [NSNumber(value: longitude),NSNumber(value: latitude)],
            "id": NSNumber(value: markerId),
            "data": markerData
        ]
        if let iconUrl = iconUrl, iconUrl.count > 0 {
            jsonObj["icon"] = iconUrl
        }
        self.callApp2Web("addMarker", value: [jsonObj])
    }
    
    @objc
    public func clearMarker() {
        self.callApp2Web("clearMarker", value: [])
    }
    
    @objc
    public func setGPSMarkerWithLatitude(_ latitude: CDouble, longitude: CDouble, accuracy: CDouble) {
        let jsonObj: [String: Any] = [
            "lnglat": [NSNumber(value: longitude),NSNumber(value: latitude)],
            "acc": NSNumber(value: accuracy)
        ]
        self.callApp2Web("setGPSMarker", value: [jsonObj])
    }
    
    @objc
    public func changeMap(_ mapID: String) {
        self.callApp2Web("changeMap", value: [mapID])
    }
    
    @objc
    public func setViewpointWithLatitude(_ latitude: CDouble, longitude: CDouble) {
        let jsonObj = [
            "longitude": NSNumber(value: longitude),
            "latitude": NSNumber(value: latitude)
        ]
        self.callApp2Web("setViewpoint", value: [jsonObj])
    }
    
    @objc
    public func setDirection(_ direction: CDouble) {
        let jsonObj = ["direction": NSNumber(value: direction)]
        self.callApp2Web("setViewpoint", value: [jsonObj])
    }
    
    @objc
    public func setRotation(_ rotation: CDouble) {
        let jsonObj = ["rotation": NSNumber(value: rotation)]
        self.callApp2Web("setViewpoint", value: [jsonObj])
    }
    
    @objc
    public func addLineWithLngLat(_ lnglats: [Any], stroke: [String : Any]?) {
        var jsonObj: [String: Any] = [
            "lnglats": lnglats
        ]
        if let stroke = stroke {
            jsonObj["stroke"] = stroke
        }
        self.callApp2Web("addLine", value: [jsonObj])
    }
    
    @objc
    public func clearLine() {
        self.callApp2Web("clearLine", value: [])
    }
    
    @objc
    public func currentMapID(_ callback: @escaping (String?) -> ()) {
        self.callApp2Web("currentMapID", value: [], callback: callback)
    }
    
    @objc
    public func currentMapInfo(_ callback: @escaping ([String : Any]?) -> ()) {
        self.callApp2Web("currentMapInfo", value: [], callback: { (value: String?) -> () in
            if let value = value, value != "" {
                callback(self.toDictionary(value))
            } else {
                callback(nil)
            }
        })
    }
    
    @objc
    public func mapInfo(_ sourceID: String, callback: @escaping ([String: Any]?) -> ()) {
        self.callApp2Web("mapInfo", value: [sourceID], callback: { (value: String?) -> () in
            if let value = value, value != "" {
                callback(self.toDictionary(value))
            } else {
                callback(nil)
            }
        })
    }
    
}

