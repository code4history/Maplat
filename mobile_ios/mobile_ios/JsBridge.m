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
        NSData *jsonData = [value dataUsingEncoding:NSUTF8StringEncoding];
        NSDictionary *jsonObject = [NSJSONSerialization JSONObjectWithData:jsonData
                                                        options:kNilOptions
                                                          error:nil];
        int markerId = [(NSNumber *)jsonObject[@"id"] intValue];
        id markerData = jsonObject[@"data"];
        [_delegate onClickPoiWithMarkerId:markerId markerData:markerData];
    }
}

- (void)callApp2WebWithKey:(NSString *)key value:(NSString *)value
{
    [_webView stringByEvaluatingJavaScriptFromString:[NSString stringWithFormat:@"javascript:jsBridge.callApp2Web('%@','%@');", key, value]];
}

- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId stringData:(NSString *)markerData
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId stringData:markerData iconUrl:nil];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId stringData:(NSString *)markerData iconUrl:(NSString *) iconUrl
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId markerData:markerData iconUrl:iconUrl];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId intData:(int)markerData
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId intData:markerData iconUrl:nil];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId intData:(int)markerData iconUrl:(NSString *) iconUrl
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId markerData:[NSNumber numberWithInt:markerData] iconUrl:iconUrl];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId doubleData:(double)markerData
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId doubleData:markerData iconUrl:nil];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId doubleData:(double)markerData iconUrl:(NSString *) iconUrl
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId markerData:[NSNumber numberWithDouble:markerData] iconUrl:iconUrl];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId arrayData:(NSArray *)markerData
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId arrayData:markerData iconUrl:nil];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId arrayData:(NSArray *)markerData iconUrl:(NSString *) iconUrl
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId markerData:markerData iconUrl:iconUrl];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId dictData:(NSDictionary *)markerData
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId dictData:markerData iconUrl:nil];
}
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId dictData:(NSDictionary *)markerData iconUrl:(NSString *) iconUrl
{
    [self addMarkerWithLatitude:latitude longitude:longitude markerId:markerId markerData:markerData iconUrl:iconUrl];
}

- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId markerData:(id)markerData iconUrl:(NSString *)iconUrl
{
    NSMutableDictionary *jsonObj = [NSMutableDictionary new];
    [jsonObj setValue:[NSNumber numberWithDouble:longitude] forKey:@"longitude"];
    [jsonObj setValue:[NSNumber numberWithDouble:latitude] forKey:@"latitude"];
    [jsonObj setValue:[NSNumber numberWithInt:markerId] forKey:@"id"];
    [jsonObj setValue:markerData forKey:@"data"];
    if ([iconUrl length] > 0) {
        [jsonObj setValue:iconUrl forKey:@"icon"];
    }
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:jsonObj options:0 error:nil];
    NSString *value = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];

    [self callApp2WebWithKey:@"addMarker" value:value];
}

- (void)clearMarker
{
    [self callApp2WebWithKey:@"clearMarker" value:nil];
}

- (void)setGPSMarkerWithLatitude:(double)latitude longitude:(double)longitude accuracy:(double)accuracy
{
    NSMutableDictionary *jsonObj = [NSMutableDictionary new];
    [jsonObj setValue:[NSNumber numberWithDouble:longitude] forKey:@"longitude"];
    [jsonObj setValue:[NSNumber numberWithDouble:latitude] forKey:@"latitude"];
    [jsonObj setValue:[NSNumber numberWithDouble:accuracy] forKey:@"accuracy"];
    NSData *jsonData = [NSJSONSerialization dataWithJSONObject:jsonObj options:0 error:nil];
    NSString *value = [[NSString alloc] initWithData:jsonData encoding:NSUTF8StringEncoding];
    [self callApp2WebWithKey:@"setGPSMarker" value:value];
}

@end
