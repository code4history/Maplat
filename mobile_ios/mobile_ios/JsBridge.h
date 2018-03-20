//
//  JsBridge.h
//  mobile_ios
//
//  Created by 大塚 恒平 on 2018/03/16.
//  Copyright © 2018年 TileMapJp. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@protocol JsBridgeDelegate;

@interface JsBridge : NSObject

@property (nonatomic, assign) id <JsBridgeDelegate> delegate;

- (id) initWithWebView:(UIWebView *)webView;

- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId stringData:(NSString *)markerData;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId stringData:(NSString *)markerData iconUrl:(NSString *) iconUrl;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId intData:(int)markerData;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId intData:(int)markerData iconUrl:(NSString *) iconUrl;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId doubleData:(double)markerData;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId doubleData:(double)markerData iconUrl:(NSString *) iconUrl;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId arrayData:(NSArray *)markerData;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId arrayData:(NSArray *)markerData iconUrl:(NSString *) iconUrl;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId dictData:(NSDictionary *)markerData;
- (void)addMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId dictData:(NSDictionary *)markerData iconUrl:(NSString *) iconUrl;

- (void)clearMarker;
- (void)setGPSMarkerWithLatitude:(double)latitude longitude:(double)longitude accuracy:(double)accuracy;

@end

@protocol JsBridgeDelegate <NSObject>
@optional
- (void)onReady;
- (void)onClickPoiWithMarkerId:(int)markerId markerData:(id)markerData;
@end
