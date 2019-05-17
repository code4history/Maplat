//
//  MaplatView.h
//  MaplatView
//
//  Created by Takashi Irie on 2018/07/03.
//  Copyright © 2018 TileMapJp. All rights reserved.
//

import Foundation

@objc
public protocol MaplatViewDelegate {
    func onReady()
    func onClickMarker(markerId: String, markerData: Any?)
    func onChangeViewpoint(x: Double, y: Double, latitude: Double, longitude: Double, mercatorX mercator_x: Double, mercatorY mercator_y: Double, zoom: Double, mercZoom merc_zoom: Double, direction: Double, rotation: Double)
    func onOutOfMap()
    func onClickMap(latitude: Double, longitude: Double)
}
