//
//  MaplatCache.h
//  mobile_ios
//
//  Created by 大塚 恒平 on 2017/02/22.
//  Copyright © 2017年 TileMapJp. All rights reserved.
//

import Foundation
import UIKit

class MaplatCache: URLCache, UIWebViewDelegate {
    
    var delegate: MaplatCacheDelegate?
    
    override func cachedResponse(for request: URLRequest) -> CachedURLResponse? {
        let url = request.url!
        let ext = url.pathExtension
        let path = url.path
        let host = url.host
        let mainBundle = Bundle.main
        let mainAssetDirectory = mainBundle.bundlePath
        let maplatBundle = Bundle(for: type(of: self))
        let maplatResDirectory = maplatBundle.path(forResource: "Maplat", ofType: "bundle")!
        
        if (host == "localresource") {
            let file = mainAssetDirectory + (path)
            let resFile = maplatResDirectory + (path)

            let mime = (ext == "html") ? "text/html" :
                (ext == "js") ? "application/javascript" :
                (ext == "json") ? "application/json" :
                (ext == "jpg") ? "image/jpeg" :
                (ext == "png") ? "image/png" :
                (ext == "css") ? "text/css" :
                (ext == "gif") ? "image/gif" :
                (ext == "woff") ? "application/font-woff" :
                (ext == "woff2") ? "application/font-woff2" :
                (ext == "ttf") ? "application/font-ttf" :
                (ext == "eot") ? "application/vnd.ms-fontobject" :
                (ext == "otf") ? "application/font-otf" :
                (ext == "svg") ? "image/svg+xml" : "text/plain"
            
            var data: Data? = nil
            let fm = FileManager.default
            if fm.fileExists(atPath: resFile) {
                data = try? Data(contentsOf: URL(fileURLWithPath: resFile))
            } else if fm.fileExists(atPath: file) {
                data = try? Data(contentsOf: URL(fileURLWithPath: file))
            }
            if data != nil {
                let res = URLResponse(url: url, mimeType: mime, expectedContentLength: data?.count ?? 0, textEncodingName: "UTF-8")
                
                var cached: CachedURLResponse? = nil
                if let data = data {
                    cached = CachedURLResponse(response: res, data: data)
                }
                return cached
            }
        }

        return super.cachedResponse(for: request)
    }
    
    private func mimeType(by extesion: String) {
        
    }
    
    func webView(_ webView: UIWebView, shouldStartLoadWith request: URLRequest, navigationType: UIWebView.NavigationType) -> Bool {
    
        let URL = request.url!
        if (URL.scheme == "maplatbridge") {
            var key = ""
            var value = ""
            for param in URL.query?.components(separatedBy: "&") ?? [] {
                var elts = param.components(separatedBy: "=")
                if elts.count < 2 {
                    continue
                }
                let lkey = elts[0]
                let lval = elts[1]
                if (lkey == "key") {
                    key = lval.removingPercentEncoding ?? ""
                }
                if (lkey == "value") {
                    value = lval.removingPercentEncoding ?? ""
                }
            }
            
            if let delegate = self.delegate {
                delegate.onCallWeb2App(key, value: value)
            }
            
            return false
        }
        
        return true
    }
}
