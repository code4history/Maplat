//
//  MaplatView.m
//  MaplatView
//
//  Created by Takashi Irie on 2018/07/03.
//  Copyright © 2018 TileMapJp. All rights reserved.
//

#import "MaplatView.h"
#import "MaplatCache.h"

@interface MaplatView () <MaplatCacheDelegate>

@property (nonatomic, strong) MaplatCache *cache;
@property (nonatomic, strong) NSDictionary *initializeValue;

@end

@implementation MaplatView

+ (void)configure {
    NSArray *paths = NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES);
    NSString *path = [[paths objectAtIndex:0] stringByAppendingString:@"/webCache"];
    
    NSURLCache *defaultCache = [NSURLCache sharedURLCache];
    NSURLCache *maplatCache = [[MaplatCache alloc] initWithMemoryCapacity:defaultCache.memoryCapacity
                                                             diskCapacity:defaultCache.diskCapacity
                                                                 diskPath:path];
    [NSURLCache setSharedURLCache:maplatCache];
}

- (instancetype)initWithFrame:(CGRect)frame appID:(NSString *)appID setting:(NSDictionary *)setting {
    self = [super initWithFrame:frame];
    if (!self) return nil;
    
    _cache = (MaplatCache *)[NSURLCache sharedURLCache];
    _cache.delegate = self;
    
    _webView = [[UIWebView alloc] initWithFrame:self.bounds];
    _webView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    _webView.delegate = _cache;
    [self addSubview:_webView];
    
    [_webView loadRequest:[NSURLRequest requestWithURL:[NSURL URLWithString:@"http://localresource/mobile.html"]]];
    
    if (!appID) {
        appID = @"mobile";
    }
    NSMutableDictionary *jsonObj = [NSMutableDictionary new];
    [jsonObj setValue:appID forKey:@"appid"];
    if (setting) {
        [jsonObj setValue:setting forKey:@"setting"];
    }
    _initializeValue = jsonObj;
    
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
        double x = [(NSNumber *)jsonObject[@"x"] doubleValue];
        double y = [(NSNumber *)jsonObject[@"y"] doubleValue];
        double longitude = [(NSNumber *)jsonObject[@"longitude"] doubleValue];
        double latitude = [(NSNumber *)jsonObject[@"latitude"] doubleValue];
        double mercator_x = [(NSNumber *)jsonObject[@"mercator_x"] doubleValue];
        double mercator_y = [(NSNumber *)jsonObject[@"mercator_y"] doubleValue];
        double zoom = [(NSNumber *)jsonObject[@"zoom"] doubleValue];
        double merc_zoom = [(NSNumber *)jsonObject[@"merc_zoom"] doubleValue];
        double direction = [(NSNumber *)jsonObject[@"direction"] doubleValue];
        double rotation = [(NSNumber *)jsonObject[@"rotation"] doubleValue];
        
        [_delegate onChangeViewpointWithX:x y:y latitude:latitude longitude:longitude mercatorX:mercator_x mercatorY:mercator_y zoom:zoom mercZoom:merc_zoom direction:direction rotation:rotation];
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
    [self callApp2WebWithKey:key value:value callback:nil];
}

- (void)callApp2WebWithKey:(NSString *)key value:(id)value callback:(void (^)(NSString *))callback
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
    NSString *retVal = [_webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"maplatBridge.callApp2Web('%@','%@');", key, jsonStr]];
    if (callback != nil) {
        callback(retVal);
    }
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
    [self callApp2WebWithKey:@"setViewpoint" value:jsonObj];
}

- (void)setDirection:(double)direction
{
    NSMutableDictionary *jsonObj = [NSMutableDictionary new];
    [jsonObj setValue:[NSNumber numberWithDouble:direction] forKey:@"direction"];
    [self callApp2WebWithKey:@"setViewpoint" value:jsonObj];
}

- (void)setRotation:(double)rotation
{
    NSMutableDictionary *jsonObj = [NSMutableDictionary new];
    [jsonObj setValue:[NSNumber numberWithDouble:rotation] forKey:@"rotation"];
    [self callApp2WebWithKey:@"setViewpoint" value:jsonObj];
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

- (void)currentMapID:(void (^)(NSString *))callback
{
    [self callApp2WebWithKey:@"currentMapID" value:nil callback:callback];
}

- (void)currentMapInfo:(void (^)(NSDictionary *))callback
{
    [self callApp2WebWithKey:@"currentMapInfo" value:nil callback:^(NSString *value){
        if ([value isEqualToString:@""]) {
            callback(nil);
            return;
        }
        NSData *jsonData = [value dataUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *jsonObject = [NSJSONSerialization JSONObjectWithData:jsonData
                                                                   options:kNilOptions
                                                                     error:nil];
        callback(jsonObject);
    }];
}

- (void)mapInfo:(NSString *)sourceID callback:(void (^)(NSDictionary *))callback
{
    [self callApp2WebWithKey:@"mapInfo" value:sourceID callback:^(NSString *value){
        if ([value isEqualToString:@""]) {
            callback(nil);
            return;
        }
        NSData *jsonData = [value dataUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *jsonObject = [NSJSONSerialization JSONObjectWithData:jsonData
                                                                   options:kNilOptions
                                                                     error:nil];
        callback(jsonObject);
    }];
}

@end

