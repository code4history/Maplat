//
//  MaplatBridge.m
//  mobile_ios
//
//  Created by 大塚 恒平 on 2018/03/16.
//  Copyright © 2018年 TileMapJp. All rights reserved.
//

#import "MaplatBridge.h"
#import "MaplatCache.h"

@interface MaplatBridge () <MaplatCacheDelegate>

@property (nonatomic, strong) MaplatCache *cache;
@property (nonatomic, strong) UIWebView *webView;
@property (nonatomic, strong) NSDictionary *initializeValue;

@end

@implementation MaplatBridge

- (id) initWithWebView:(UIWebView *)webView appID:(NSString *)appID setting:(NSDictionary *)setting {
    if (self = [super init]) {
        self.webView = webView;

        _cache = (MaplatCache *)[NSURLCache sharedURLCache];
        _cache.delegate = self;
        
        self.webView.delegate = _cache;
        [self.webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@"http://localresource/mobile.html"]]];
        
        if (!appID) {
            appID = @"mobile";
        }
        NSMutableDictionary *jsonObj = [NSMutableDictionary new];
        [jsonObj setValue:appID forKey:@"appid"];
        if (setting) {
            [jsonObj setValue:setting forKey:@"setting"];
        }
        _initializeValue = jsonObj;
    }
    return self;
}

#pragma mark - MaplatCacheDelegate

- (void)onCallWeb2AppWithKey:(NSString *)key value:(NSString *)value {
    if (!_delegate) return;
    
    NSLog(@"onCallWeb2AppWithKey:%@ value:%@", key, value);
    if ([key isEqualToString:@"ready"]) {
        if ([value isEqualToString:@"callApp2Web"]) {
            [self callApp2WebWithKey:@"maplatInitialize" value:_initializeValue];
        } else if ([value isEqualToString:@"maplatObject"]) {
            [_delegate onReady];
        }
    } else if ([key isEqualToString:@"clickMarker"]) {
        NSData *jsonData = [value dataUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *jsonObject = [NSJSONSerialization JSONObjectWithData:jsonData
                                                                   options:kNilOptions
                                                                     error:nil];
        long markerId = [(NSNumber *)jsonObject[@"id"] longValue];
        id markerData = jsonObject[@"data"];
        [_delegate onClickMarkerWithMarkerId:markerId markerData:markerData];
    } else if ([key isEqualToString:@"changeViewpoint"]) {
        NSData *jsonData = [value dataUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *jsonObject = [NSJSONSerialization JSONObjectWithData:jsonData
                                                                   options:kNilOptions
                                                                     error:nil];
        double longitude = [(NSNumber *)jsonObject[@"longitude"] doubleValue];
        double latitude = [(NSNumber *)jsonObject[@"latitude"] doubleValue];
        double zoom = [(NSNumber *)jsonObject[@"zoom"] doubleValue];
        double direction = [(NSNumber *)jsonObject[@"direction"] doubleValue];
        double rotation = [(NSNumber *)jsonObject[@"rotation"] doubleValue];
        
        [_delegate onChangeViewpointWithLatitude:latitude longitude:longitude zoom:zoom direction:direction rotation:rotation];
    } else if([key isEqualToString:@"outOfMap"]) {
        [_delegate onOutOfMap];
    } else if ([key isEqualToString:@"clickMap"]) {
        NSData *jsonData = [value dataUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *jsonObject = [NSJSONSerialization JSONObjectWithData:jsonData
                                                                   options:kNilOptions
                                                                     error:nil];
        double longitude = [(NSNumber *)jsonObject[@"longitude"] doubleValue];
        double latitude = [(NSNumber *)jsonObject[@"latitude"] doubleValue];
        [_delegate onClickMapWithLatitude:latitude longitude:longitude];
    }
}

- (void)callApp2WebWithKey:(NSString *)key value:(id)value
{
    NSString* jsonStr;
    if (value == nil) {
        jsonStr = nil;
    } else if ([value isKindOfClass:[NSString class]]) {
        jsonStr = value;
    } else if ([value isKindOfClass:[NSNumber class]]) {
        jsonStr = [value stringValue];
    } else {
        NSData *jsonData = [NSJSONSerialization dataWithJSONObject:value options:0 error:nil];
        jsonStr = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    }
    [_webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"javascript:maplatBridge.callApp2Web('%@','%@');", key, jsonStr]];
}

- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId stringData:(NSString *)markerData
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId stringData:markerData iconUrl:nil];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId stringData:(NSString *)markerData iconUrl:(NSString *) iconUrl
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId markerData:markerData iconUrl:iconUrl];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId longData:(long)markerData
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId longData:markerData iconUrl:nil];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId longData:(long)markerData iconUrl:(NSString *) iconUrl
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId markerData:[NSNumber numberWithLong:markerData] iconUrl:iconUrl];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId doubleData:(double)markerData
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId doubleData:markerData iconUrl:nil];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId doubleData:(double)markerData iconUrl:(NSString *) iconUrl
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId markerData:[NSNumber numberWithDouble:markerData] iconUrl:iconUrl];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId arrayData:(NSArray *)markerData
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId arrayData:markerData iconUrl:nil];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId arrayData:(NSArray *)markerData iconUrl:(NSString *) iconUrl
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId markerData:markerData iconUrl:iconUrl];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId dictData:(NSDictionary *)markerData
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId dictData:markerData iconUrl:nil];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId dictData:(NSDictionary *)markerData iconUrl:(NSString *) iconUrl
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId markerData:markerData iconUrl:iconUrl];
}

- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(long)markerId markerData:(id)markerData iconUrl:(NSString *)iconUrl
{
    NSMutableDictionary *jsonObj = [NSMutableDictionary new];
    NSArray *Lnglat = @[[NSNumber numberWithDouble:longitude], [NSNumber numberWithDouble:latitude]];
    [jsonObj setValue:Lnglat forKey:@"lnglat"];
    [jsonObj setValue:[NSNumber numberWithLong:markerId] forKey:@"id"];
    [jsonObj setValue:markerData forKey:@"data"];
    if ([iconUrl length] > 0) {
        [jsonObj setValue:iconUrl forKey:@"icon"];
    }
    [self callApp2WebWithKey:@"addMarker" value:jsonObj];
}

- (void)clearMarker
{
    [self callApp2WebWithKey:@"clearMarker" value:nil];
}

- (void)setGPSMarkerWithLatitude:(double)latitude longitude:(double)longitude accuracy:(double)accuracy
{
    NSMutableDictionary *jsonObj = [NSMutableDictionary new];
    NSArray *Lnglat = @[[NSNumber numberWithDouble:longitude], [NSNumber numberWithDouble:latitude]];
    [jsonObj setValue:Lnglat forKey:@"lnglat"];
    [jsonObj setValue:[NSNumber numberWithDouble:accuracy] forKey:@"acc"];
    [self callApp2WebWithKey:@"setGPSMarker" value:jsonObj];
}

- (void)changeMap:(NSString *)mapID
{
    [self callApp2WebWithKey:@"changeMap" value:mapID];
}

- (void)setViewpointWithLatitude:(double)latitude longitude:(double)longitude
{
    NSMutableDictionary *jsonObj = [NSMutableDictionary new];
    [jsonObj setValue:[NSNumber numberWithDouble:longitude] forKey:@"longitude"];
    [jsonObj setValue:[NSNumber numberWithDouble:latitude] forKey:@"latitude"];
    [self callApp2WebWithKey:@"moveTo" value:jsonObj];
}

- (void)setDirection:(double)direction
{
    double dirRad = direction * M_PI / 180.0;
    NSMutableDictionary *jsonObj = [NSMutableDictionary new];
    [jsonObj setValue:[NSNumber numberWithDouble:dirRad] forKey:@"direction"];
    [self callApp2WebWithKey:@"moveTo" value:jsonObj];
}

- (void)setRotation:(double)rotate
{
    double rotRad = rotate * M_PI / 180.0;
    NSMutableDictionary *jsonObj = [NSMutableDictionary new];
    [jsonObj setValue:[NSNumber numberWithDouble:rotRad] forKey:@"rotate"];
    [self callApp2WebWithKey:@"moveTo" value:jsonObj];
}

- (void)addLineWithLngLat:(NSArray *)lnglats stroke:(NSDictionary *)stroke
{
    NSMutableDictionary *jsonObj = [NSMutableDictionary new];
    [jsonObj setValue:lnglats forKey:@"lnglats"];
    if (stroke) {
        [jsonObj setValue:stroke forKey:@"stroke"];
    }
    [self callApp2WebWithKey:@"addLine" value:jsonObj];
}

- (void)clearLine
{
    [self callApp2WebWithKey:@"clearLine" value:nil];
}

@end
