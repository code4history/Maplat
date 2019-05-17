//
//  ViewController.m
//  mobile_ios_sample_swift
//
//  Created by 大塚 恒平 on 2017/02/22.
//  Copyright © 2017年 TileMapJp. All rights reserved.
//
import UIKit
import CoreLocation
import MaplatView

var BaseLongitude = 141.1529555
var BaseLatitude = 39.7006006

class ViewController : UIViewController, MaplatViewDelegate, CLLocationManagerDelegate {
    
    var locationManager: CLLocationManager?
    var nowMap: String?
    var nowDirection: CDouble?
    var nowRotation: CDouble?
    var defaultLongitude: CDouble?
    var defaultLatitude: CDouble?
    var maplatView: MaplatView?
    
    override func loadView() {
        super.loadView()
        let setting = ["app_name":"モバイルアプリ", "sources":["gsi","osm",["mapID":"morioka_ndl"]], "pois":[]] as [String : Any]
        self.maplatView = MaplatView(frame: UIScreen.main.bounds, appID: "mobile", setting: setting)
        self.maplatView!.delegate = self
        self.view = self.maplatView
        self.nowMap = "morioka_ndl"
        self.nowDirection = 0
        self.nowRotation = 0
        // テストボタンの生成
        for i in 1...7 {
            let button: UIButton = UIButton()
            button.tag = i
            button.frame = CGRect(x:10, y:CGFloat(i*60), width:120, height:40)
            button.alpha = 0.8
            button.backgroundColor = UIColor.lightGray
            switch i {
            case 1:
                
                button.setTitle("地図切替", for: .normal)
                break
            case 2:
                
                button.setTitle("ﾏｰｶｰ追加", for: .normal)
                break
            case 3:
                
                button.setTitle("ﾏｰｶｰ消去", for: .normal)
                break
            case 4:
                
                button.setTitle("地図移動", for: .normal)
                break
            case 5:
                
                button.setTitle("東を上", for: .normal)
                break
            case 6:
                
                button.setTitle("右を上", for: .normal)
                break
            case 7:
                
                button.setTitle("表示地図情報", for: .normal)
                break
            default:
                
                button.setTitle("button \(i)", for: .normal)
                break
            }
            button.addTarget(self, action:#selector(testButton(_:)) , for: .touchUpInside)
            self.view.addSubview(button)
        }
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view, typically from a nib.
        //[NSThread sleepForTimeInterval:10]; //Safariのデバッガを繋ぐための時間。本番では不要。
        self.defaultLongitude = 0
        self.defaultLatitude = 0
        self.locationManager = CLLocationManager()
        self.locationManager!.delegate = self
        self.locationManager!.desiredAccuracy = kCLLocationAccuracyBestForNavigation
        self.locationManager!.distanceFilter = kCLDistanceFilterNone
        if self.locationManager!.responds(to: #selector(CLLocationManager.requestWhenInUseAuthorization)) {
            self.locationManager!.requestWhenInUseAuthorization()
        }
    }
    
    override func didReceiveMemoryWarning() {
        super.didReceiveMemoryWarning()
        // Dispose of any resources that can be recreated.
    }
    
    // MARK: - MaplatBridgeDelegate
    func onReady() {
        self.addMarkers()
        self.locationManager!.startUpdatingLocation()
    }
    
    func onClickMarker(markerId: String, markerData: Any?) {
        let message = "clickMarker ID:\(markerId) DATA:\(markerData ?? "")"
        self.toast(message)
    }
    
    func onChangeViewpoint(x: Double, y: Double, latitude: Double, longitude: Double, mercatorX mercator_x: Double, mercatorY mercator_y: Double, zoom: Double, mercZoom merc_zoom: Double, direction: Double, rotation: Double) {
        print("XY: (\(x), \(y)) LatLong: (\(latitude), \(longitude)) Mercator (\(mercator_x), \(mercator_y)) zoom: \(zoom) mercZoom: \(merc_zoom) direction: \(direction) rotation \(rotation)")
    }
    
    func onOutOfMap() {
        self.toast("地図範囲外です")
    }
    
    func onClickMap(latitude: Double, longitude: Double) {
        let message: String = "clickMap latitude:\(latitude) longitude:\(longitude)"
        self.toast(message)
    }
    
    func addMarkers() {
        self.maplatView!.addLineWithLngLat([[141.1501111,39.69994722],[141.1529555,39.7006006]], stroke: nil)
        self.maplatView!.addLineWithLngLat([[141.151995,39.701599],[141.151137,39.703736],[141.1521671,39.7090232]], stroke: ["color":"#ffcc33", "width":2])
        self.maplatView!.addMarkerWithLatitude(39.69994722, longitude: 141.1501111, markerId: 1, stringData: "001")
        self.maplatView!.addMarkerWithLatitude(39.7006006, longitude: 141.1529555, markerId: 5, stringData: "005")
        self.maplatView!.addMarkerWithLatitude(39.701599, longitude: 141.151995, markerId: 6, stringData: "006")
        self.maplatView!.addMarkerWithLatitude(39.703736, longitude: 141.151137, markerId: 7, stringData: "007")
        self.maplatView!.addMarkerWithLatitude(39.7090232, longitude: 141.1521671, markerId: 9, stringData: "009")
    }
    
    // MARK: - Location Manager
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        let newLocation = locations[0]
        if newLocation.horizontalAccuracy < 0 {
            return
        }
        let locationAge: TimeInterval = -newLocation.timestamp.timeIntervalSinceNow
        if locationAge > 5.0 {
            return
        }
        print("location updated. newLocation:\(newLocation)")
        var latitude: CDouble
        var longitude: CDouble
        if self.defaultLatitude == 0 || self.defaultLongitude == 0 {
            self.defaultLatitude = newLocation.coordinate.latitude
            self.defaultLongitude = newLocation.coordinate.longitude
            latitude = BaseLatitude
            longitude = BaseLongitude
        } else {
            latitude = BaseLatitude-self.defaultLatitude!+newLocation.coordinate.latitude
            longitude = BaseLongitude-self.defaultLongitude!+newLocation.coordinate.longitude
            
        }
        self.maplatView!.setGPSMarkerWithLatitude(latitude, longitude: longitude, accuracy: newLocation.horizontalAccuracy)
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        if ((error as NSError).code != CLError.locationUnknown.rawValue) {
            self.locationManager!.stopUpdatingLocation()
            self.locationManager!.delegate = nil
        }
    }
    
    // MARK: - test
    // テストボタン　アクション
    @objc
    func testButton(_ button: UIButton) {
        var nextMap: String
        var nextDirection: CDouble
        var nextRotation: CDouble
        switch Int32(button.tag) {
        case 1:
            
            nextMap = self.nowMap == "morioka_ndl" ? "gsi" : "morioka_ndl"
            self.maplatView!.changeMap(nextMap)
            self.nowMap = nextMap
            break
        case 2:
            
            self.addMarkers()
            break
        case 3:
            
            self.maplatView!.clearLine()
            self.maplatView!.clearMarker()
            break
        case 4:
            
            self.maplatView!.setViewpointWithLatitude(39.69994722, longitude: 141.1501111)
            break
        case 5:
            
            if self.nowDirection == 0 {
                nextDirection = -90
                button.setTitle("南を上", for: .normal)
            } else if self.nowDirection == -90 {
                nextDirection = 180
                button.setTitle("西を上", for: .normal)
            } else if self.nowDirection == 180 {
                nextDirection = 90
                button.setTitle("北を上", for: .normal)
            } else {
                nextDirection = 0
                button.setTitle("東を上", for: .normal)
                
            }
            self.maplatView!.setDirection(nextDirection)
            self.nowDirection = nextDirection
            break
        case 6:
            
            if self.nowRotation == 0 {
                nextRotation = -90
                button.setTitle("下を上", for: .normal)
            } else if self.nowRotation == -90 {
                nextRotation = 180
                button.setTitle("左を上", for: .normal)
            } else if self.nowRotation == 180 {
                nextRotation = 90
                button.setTitle("上を上", for: .normal)
            } else {
                nextRotation = 0
                button.setTitle("右を上", for: .normal)
                
            }
            self.maplatView!.setRotation(nextRotation)
            self.nowRotation = nextRotation
            break
        case 7:
            
            self.maplatView!.currentMapInfo({ (value: [String: Any]?) -> ()  in
                if let value = value, let jsonData = try? JSONSerialization.data(withJSONObject: value, options: []) {
                    let text = String(data: jsonData, encoding: .utf8)!
                    self.toast(text)
                }
            })
            break
        default:
            break;
        }
    }
    
    // トースト
    func toast(_ message: String) {
        var alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        var duration = 1
        // duration in seconds
        self.present(alert, animated: true, completion: {
            let deadlineTime = DispatchTime.now() + DispatchTimeInterval.seconds(duration)
            DispatchQueue.main.asyncAfter(deadline: deadlineTime) {
                alert.dismiss(animated: true, completion: nil)
            }
        })
    }
    
}

extension UIView {
    
    func firstAvailableUIViewController() -> UIViewController? {
        // convenience function for casting and to "mask" the recursive function
        return (self.traverseResponderChainForUIViewController() as? UIViewController)
    }
    
    func traverseResponderChainForUIViewController() -> Any? {
        if let nextResponder = self.next {
            if (nextResponder.isKind(of: UIViewController.self)) {
                return nextResponder
            } else if (nextResponder.isKind(of: UIView.self)) {
                return (nextResponder as! UIView).traverseResponderChainForUIViewController()
            }
        }
        return nil
    }
    
}
