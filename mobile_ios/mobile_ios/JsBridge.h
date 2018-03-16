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

- (void)setMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId markerData:(NSString *)markerData;
- (void)setMarkerWithLatitude:(double)latitude longitude:(double)longitude markerId:(int)markerId markerData:(NSString *)markerData iconUrl:(NSString *) iconUrl;
- (void)setGPSMarkerWithLatitude:(double)latitude longitude:(double)longitude accuracy:(double)accuracy;

@end

@protocol JsBridgeDelegate <NSObject>
@optional
- (void)onReady;
- (void)onClickPoi:(NSString *)value;
@end
