//
//  MaplatCache.h
//  mobile_ios
//
//  Created by 大塚 恒平 on 2017/02/22.
//  Copyright © 2017年 TileMapJp. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

@protocol MaplatCacheDelegate;

@interface MaplatCache : NSURLCache <UIWebViewDelegate>

@property (nonatomic, assign) id <MaplatCacheDelegate> delegate;

- (void)webView:(UIWebView *)webView callApp2WebWithKey:(NSString *)key value:(NSString *)value;

@end

@protocol MaplatCacheDelegate <NSObject>
@optional
- (void)maplatCache:(MaplatCache *)maplatCache didReceiveKey:(NSString *)key value:(NSString *)value;
@end

@interface UIView (FindUIViewController)
- (UIViewController *) firstAvailableUIViewController;
- (id) traverseResponderChainForUIViewController;
@end
