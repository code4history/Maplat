//
//  JsBridge.m
//  mobile_ios
//
//  Created by 大塚 恒平 on 2018/03/16.
//  Copyright © 2018年 TileMapJp. All rights reserved.
//

#import "JsBridge.h"
#import "MaplatCache.h"

@interface JsBridge () <MaplatCacheDelegate>

@property (nonatomic, strong) MaplatCache *cache;

@property (nonatomic, strong) UIWebView *webView;

@end

@implementation JsBridge

- (id) initWithWebView:(UIWebView *)webView {
    if (self = [super init]) {
        self.webView = webView;

        _cache = (MaplatCache *)[NSURLCache sharedURLCache];
        _cache.delegate = self;
        
        self.webView.delegate = _cache;
    }
    return self;
}

#pragma mark - MaplatCacheDelegate

- (void)onCallWeb2AppWithKey:(NSString *)key value:(NSString *)value {
    if (!_delegate) return;
    
    NSLog(@"onCallWeb2AppWithKey:%@ value:%@", key, value);
    if ([key isEqualToString:@"callApp2Web"] && [value isEqualToString:@"ready"]) {
        [_delegate onReady];
    } else if ([key isEqualToString:@"clickPoi"]) {
        [_delegate onClickPoi:value];
    }
}

- (void)callApp2WebWithKey:(NSString *)key value:(NSString *)value
{
    [_webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"javascript:jsBridge.callApp2Web('%@','%@');", key, value]];
}

- (void)setMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId markerData:(NSString *)markerData
{
    [self setMarkerWithLatitude:latitude longitude:longitude markerId:markerId markerData:markerData iconUrl:nil];
}

- (void)setMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId markerData:(NSString *)markerData iconUrl:(NSString *)iconUrl
{
    NSString *iconStr;
    if ([iconUrl length] == 0) {
        iconStr = @"";
    } else {
        iconStr = [NSString stringWithFormat:@",\"icon\":\"%@\"", iconUrl];
    }
    NSString *value = [NSString stringWithFormat:@"{\"latitude\":%f,\"longitude\":%f,\"data\": {\"id\":%d,\"data\":\"%@\"%@}}", latitude, longitude, markerId, markerData, iconStr];
    [self callApp2WebWithKey:@"setMarker" value:value];
}

- (void)resetMarker
{
    [self callApp2WebWithKey:@"resetMarker" value:nil];
}

- (void)setGPSMarkerWithLatitude:(double)latitude longitude:(double)longitude accuracy:(double)accuracy
{
    NSString *value = [NSString stringWithFormat:@"{\"latitude\":%f,\"longitude\":%f,\"accuracy\":%f}", latitude, longitude, accuracy];
    [self callApp2WebWithKey:@"setGPSMarker" value:value];
}

@end
