//
//  MaplatCache.h
//  mobile_ios
//
//  Created by 大塚 恒平 on 2017/02/22.
//  Copyright © 2017年 TileMapJp. All rights reserved.
//

import Foundation

public protocol MaplatCacheDelegate {
    func onCallWeb2App(_ key: String, value: String)
}

// Default implementation for optional methods to make Swift implementation compatible with Objective-C
extension MaplatCacheDelegate {
    func onCallWeb2App(_ key: String, value: String) {}
}
